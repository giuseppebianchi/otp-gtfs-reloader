const https = require("https");
const http = require("http");
const fs = require("fs");
const axios = require("axios");
const archiver = require("archiver");
const config = require("./config").settings;
const { sendNotification } = require("./mailer");

// This app allows you to check properties between a local and a remote file

const requestOptions = {
  headers: !config.cache
    ? {
        "Cache-Control": "no-cache",
      }
    : {},
};

// check local gtfs file
// check local map file

getFiles();

setInterval(
  function () {
    if (config.workingHours) {
      const checkTime = new Date();
      const hours = checkTime.getHours();
      if (
        hours >= config.workingHours.start &&
        hours <= config.workingHours.end
      ) {
        getFiles();
      }
    }
  },
  config.refreshTime,
  config
);

function getFiles() {
  // GET CURRENT LOCAL FILE
  fs.stat(config.local.gtfsFile, "utf8", (err, stats) => {
    if (err) {
      console.log("Local file doesn't exist.");
      console.error(err);
      return;
    }

    // READ LOCAL FILE Last Modified Date
    // stat.mtime -> Sat Sep 12 2020 00:48:17 GMT+0200 (Central European Summer Time)
    const localFileLastModified = stats.mtime;
    config.logger.steps &&
      console.log("Local: ", localFileLastModified.toString());

    // READ REMOTE FILE
    const req = https
      .get(config.remote.fileUrl, requestOptions, (res) => {
        // READ REMOTE FILE Last Modified Date
        // res.headers["last-modified"] -> Thu, 01 Sep 2022 11:15:59 GMT
        const remoteFileLastModified = new Date(res.headers["last-modified"]);
        config.logger.steps &&
          console.log("Remote: ", remoteFileLastModified.toString());

        if (
          config.forceOverwrite || localFileLastModified.getTime() !== remoteFileLastModified.getTime()
        ) {
          config.logger.steps && console.log("Remote file was updated.");
          // CALLBACK
          callback({ res, localFileLastModified, remoteFileLastModified });
        }
      })
      .on("error", (e) => {
        console.log("An error occured while retrieving remote file.");
        console.error(e);
      });

    req.end();
  });
}

function callback(options) {
  // LOG
  config.logger.update &&
    logUpdatedRemoteFile(
      options.localFileLastModified,
      options.remoteFileLastModified
    );

  // NOTIFICATIONS
  config.notifications?.emailAlerts && sendNotification(options);

  // DOWNLOAD UPDATED FILE
  downloadUpdatedFile(options.res, options.remoteFileLastModified);
}

function downloadUpdatedFile(res, remoteFileLastModified) {
  // DOWNLOAD FILE AND REPLACE IT
  // Set same local file url to replace it with remote file
  const DOWNLOAD_FILE_URL = config.local.gtfsFile;

  config.logger && console.log("Download started...");
  const newFile = fs.createWriteStream(DOWNLOAD_FILE_URL);
  let download = res.pipe(newFile);
  download.on("finish", function () {
    // UPDATE STATS Last Modified value
    updateLocalLastModifiedStat(DOWNLOAD_FILE_URL, remoteFileLastModified);
  });
}

function updateLocalLastModifiedStat(gtfsFile, date) {
  // UPDATE LOCAL FILE STATS with remote file stats
  fs.utimes(gtfsFile, date, date, (err) => {
    if (err) {
      console.log("Error occurred while updating local file stats.");
      return;
    }
    console.log("FILE UPDATED successfully on local folder.");

    // create bundle with downloaded file and map pbf file
    createBundle();
  });
}

function createBundle() {
  config.logger.steps && console.log("Creating bundle...")
  try {
    const zipFile = archiver("zip", { zlib: { level: 9 } });
    const bundleName = `bundle_${new Date().getTime()}.zip`;
    const bundlePath = `${config.local.bundleFolder}/${bundleName}`;

    zipFile.on("warning", (error) => {
      console.log("warning:", error);
    });

    zipFile.on("error", (error) => {
      console.error("error occurred :", error);
    });

    zipFile.on("finish", (data) => {
      //console.log("Bundle was created1: ", bundleName);
      //setTimeout(() => reloadOtpGraph(bundlePath), 1000);
    });

    const writeStream = fs.createWriteStream(bundlePath);
    zipFile.pipe(writeStream);

    zipFile.append(fs.createReadStream(config.local.gtfsFile), {
      name: "gtfs.zip",
    });
    zipFile.append(
      fs.createReadStream(`${config.local.dataFolder}/${config.local.mapFile}`),
      {
        name: config.local.mapFile,
      }
    );

    zipFile.finalize().then(() => {
      console.log("Bundle ready - ", bundlePath);
      setTimeout(() => reloadOtpGraph(bundlePath), 500);
    });
  } catch (e) {
    console.log("An error occured while zipping bundle folder: ", e);
  }
}

function logUpdatedRemoteFile(loc, rem) {
  console.log("------");
  console.log("CHECK TIME: ", new Date().toString());
  console.log(`LOCAL FILE -- Last Modified: ${loc}`);
  console.log(`REMOTE FILE -- Last Modified: ${rem}`);
  console.log("Remote file was updated.");
  console.log("------");
}

function formatDate(s) {
  return s.replace("GMT", "");
}

async function reloadOtpGraph(bundlePath) {
  config.logger.steps && console.log('Sending bundle to OTP...')
  const url = `${config.otp.hostname}/otp/routers/${config.otp.routerName}`;
  console.log(url)
  const otpConfig = {
    method: "post",
    url,
    headers: {
      "Content-Type": "application/zip",
    },
    data: fs.createReadStream(bundlePath),
  };

  axios(config)
    .then(function (response) {
      console.log('Bundle sent to OTP successfully.')
      //console.log(JSON.stringify(response.data));
    })
    .catch(function (error) {
      console.log(error);
    });
}

const server = http.createServer(function (req, res) {
  if (req.url === "/download-gtfs") {
    config.logger.steps && console.log('GTFS required to download...')
    const gtfs = config.local.gtfsFile;

    // Check if the file exists
    if (fs.existsSync(gtfs)) {
      // Set the headers for the response
      res.setHeader("Content-disposition", "attachment; filename=gtfs.zip");
      res.setHeader("Content-type", "application/zip");

      // Create a read stream from the file
      const filestream = fs.createReadStream(gtfs);
      // Pipe the stream to the response object
      filestream.pipe(res);
    } else {
      // Return a 404 error if the file doesn't exist
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.write("File not found");
      res.end();
    }
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.write("Not Found");
    res.end();
  }
});

server.listen(config.port);

console.log(`Node.js web server at port ${config.port} is running..`);
