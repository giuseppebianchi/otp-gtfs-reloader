require("dotenv").config();
// TIME
const EVERY_HOUR = 60 * 60 * 1000;
const _EVERY_60S = 60 * 1000;

const settings = {
    logger: {
        steps: true,
        update: true,
    },
    refreshTime: _EVERY_60S,
    workingHours: {
        start: 7,
        end: 18,
    },
    local: {
        fileUrl: process.env.LOCAL_FILE_URL,
        bundleFolder: process.env.BUNDLE_FOLDER,
        dataFolder: process.env.DATA_FOLDER
    },
    remote: {
        fileUrl: process.env.REMOTE_FILE_URL,
    },
    cache: false,
    otp: {
        hostname: process.env.OTP_URL,
        routerName: process.env.OTP_ROUTER
    }
};

module.exports = {
    settings
};