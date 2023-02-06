const https = require("https");
const fs = require("fs");
const JSZip = require("jszip");
const archiver = require("archiver");
const config = require("./config").settings;

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
        true ||
        hours < config.workingHours.start ||
        hours > config.workingHours.end
      ) {
        return;
      }
    }
    getFiles();
  },
  config.refreshTime,
  config
);

function getFiles() {
  // GET CURRENT LOCAL FILE
  fs.stat(config.local.fileUrl, "utf8", (err, stats) => {
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
          true ||
          localFileLastModified.getTime() !== remoteFileLastModified.getTime()
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

  // You could send an email as notification

  // DOWNLOAD UPDATED FILE
  downloadUpdatedFile(options.res, options.remoteFileLastModified);
}

function downloadUpdatedFile(res, remoteFileLastModified) {
  // DOWNLOAD FILE AND REPLACE IT
  // Set same local file url to replace it with remote file
  const DOWNLOAD_FILE_URL = config.local.fileUrl;

  config.logger && console.log("Download started...");
  const newFile = fs.createWriteStream(DOWNLOAD_FILE_URL);
  let download = res.pipe(newFile);
  download.on("finish", function () {
    // UPDATE STATS Last Modified value
    updateLocalLastModifiedStat(DOWNLOAD_FILE_URL, remoteFileLastModified);
  });
}

function updateLocalLastModifiedStat(fileUrl, date) {
  // UPDATE LOCAL FILE STATS with remote file stats
  fs.utimes(fileUrl, date, date, (err) => {
    if (err) {
      console.log("Error occurred while updating local file stats.");
      return;
    }
    console.log("FILE UPDATED successfully on local folder.");

    // create bundle with downloaded file and map pbf file
    createBundle();

    // send POST requesto to otp
  });
}

function createBundle() {
  try {
    const zipFile = archiver("zip", { zlib: { level: 9 } });

    zipFile.on("warning", (error) => {
      console.log("warning:", error);
    });

    zipFile.on("error", (error) => {
      console.error("error occurred :", error);
    });

    const writeStream = fs.createWriteStream(
      `${config.local.bundleFolder}/bundle_${new Date().getTime()}.zip`
    );
    zipFile.pipe(writeStream);

    // Append test file
    zipFile.append(fs.createReadStream(config.local.fileUrl), {
      name: "gtfs.zip",
    });

    // Append another file...
    zipFile.append(fs.createReadStream(config.local.dataFolder + "/aq.pbf"), {
      name: "aq.pbf",
    });

    zipFile.finalize();
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

//curl -sI https://gssi:GsS120224a4@www.ama.laquila.it/export/GTFS.ZIP | grep -i Last-Modified
