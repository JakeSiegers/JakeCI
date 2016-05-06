var JakeCI = require('./src/Jake.js');
var jakeObj = new JakeCI();


process.on('uncaughtException', function(error) {
    jakeObj.error(error);
});


process.on('SIGINT', function() {
    jakeObj.log('info','SIGINT Closing, bye!');
    process.exit(0);
});
