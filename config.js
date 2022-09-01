require("dotenv").config();
// TIME
const EVERY_HOUR = 60 * 60 * 1000;
const EVERY_60S = 60 * 1000;

const settings = {
    logger: {
        steps: true,
        update: true,
    },
    refreshTime: EVERY_60S,
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
};

module.exports = {
    settings
};