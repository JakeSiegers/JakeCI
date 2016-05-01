var Senkins = require('./src/Senkins.js');
var senkinsObj = new Senkins();

process.on('uncaughtException', function(error) {
    senkinsObj.error(error);
});

process.on('SIGINT', function() {
    senkinsObj.log('info','SIGINT Closing, bye!');
    process.exit(0);
});
