var JakeCI = require('./src/JakeCI.js');
var jakeObj = new JakeCI();

process.on('uncaughtException', function(error) {
    jakeObj.error(error);
});

process.on('SIGINT', function() {
    jakeObj.log('info','SIGINT Closing, bye!');
    process.exit(0);
});

(function() {
    var childProcess = require("child_process");
    var oldSpawn = childProcess.spawn;
    function mySpawn() {
        console.log('spawn called');
        console.log(arguments);
        var result = oldSpawn.apply(this, arguments);
        return result;
    }
    childProcess.spawn = mySpawn;
})();