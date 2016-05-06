var JakeCI = require('./src/JakeCI.js');
var jakeObj = new JakeCI();

process.on('uncaughtException', function(error) {
    jakeObj.error(error);
});

process.on('SIGINT', function() {
    jakeObj.log('info','SIGINT Closing, bye!');
    process.exit(0);
});
