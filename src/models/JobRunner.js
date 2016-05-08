var util  = require('util'),
    spawn = require('child_process').spawn,
    parseArgs = require('minimist').argv;

function JobRunner(JakeCI){
    this.JakeCI = JakeCI;
    this.jobsQueue = [];
}

JobRunner.prototype.startJob = function(response, data){

    var cmdArray = this.JakeCI.functions.commandParser(data.exec);
    var program = cmdArray[0];
    var programArgs = [];
    for(var i=1;i<cmdArray.length;i++){
        programArgs.push(cmdArray[i]);
    }

    //var cmd = spawn('ls', ['-lh', '/usr']);
    var cmd = spawn(program,programArgs);

    cmd.stdout.on('data', function (data) {
        console.log('stdout: ' + data);
    });

    cmd.stderr.on('data', function (data) {
        console.log('stderr: ' + data);
    });

    cmd.on('exit', function (code) {
        console.log('child process exited with code ' + code);
    });

    this.JakeCI.sendResponse(response,'Job Started');
};

module.exports = JobRunner;