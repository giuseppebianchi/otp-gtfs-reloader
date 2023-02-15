var nodemailer = require("nodemailer");
const config = require("./config").settings;

const mailer = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.notifications.nodemailerUser,
    pass: config.notifications.nodemailerPassword,
  },
});
const mailOptions = {
  from: config.notifications.nodemailerUser,
  to: config.notifications.nodemailerUser,
  subject: "GTFS UPDATE",
  html: "A new GTFS file has been uploaded.",
};

const emailTemplate = (time) => `
<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>GTFS Email Alert</title>
  </head>
  <body>
    ${time}
  </body>
</html>`;

function sendNotification(log) {
  mailer.sendMail(
    {
      ...mailOptions,
      html: emailTemplate(
        log?.remoteFileLastModified.toString() || mailOptions.text
      ),
    },
    function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    }
  );
}

module.exports = { mailer, mailOptions, emailTemplate, sendNotification };
