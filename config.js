require("dotenv").config();
// TIME
const EVERY_HOUR = 60 * 60 * 1000;
const _EVERY_60S = 60 * 1000;

const settings = {
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
        fileUrl: process.env.LOCAL_FILE_URL,
    },
    remote: {
        fileUrl: process.env.REMOTE_FILE_URL,
    },
    cache: false
};

module.exports = {
    settings
};