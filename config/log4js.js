module.exports = {
    appenders: {
        consoleout: { type: "console" }
    },
    categories: {
        default: { appenders: ["consoleout"], level: "info" }
    },
    pm2: true
}