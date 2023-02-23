require("dotenv").config();
// TIME
const EVERY_HOUR = 60 * 60 * 1000;
const _EVERY_60S = 60 * 1000;

const settings = {
  port: process.env.PORT,
  logger: {
    steps: true,
    update: true,
  },
  refreshTime: EVERY_HOUR,
  workingHours: {
    start: 7,
    end: 18,
  },
  local: {
    gtfsFile: process.env.LOCAL_FILE_PATH,
    bundleFolder: process.env.BUNDLE_FOLDER,
    dataFolder: process.env.DATA_FOLDER,
    mapFile: process.env.MAP_FILE,
  },
  remote: {
    fileUrl: process.env.REMOTE_FILE_URL,
  },
  cache: false,
  otp: {
    hostname: process.env.OTP_URL,
    routerName: process.env.OTP_ROUTER,
  },
  notifications: {
    emailAlerts: true,
    nodemailerUser: process.env.NODEMAILER_USER,
    nodemailerPassword: process.env.NODEMAILER_PASS,
  },
};

module.exports = {
  settings,
};
