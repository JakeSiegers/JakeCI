var fs = require('fs');
var path = require('path');
const exec = require('child_process').exec;
const spawn = require('child_process').spawn;

function RunJob(JakeCI){
    this.JakeCI = JakeCI;
}

RunJob.prototype.expressRequest = function(request, response){

    var errors = this.JakeCI.functions.verifyRequiredPostFields(request.body,['job']);
    if(errors !== ''){
        this.JakeCI.sendError(response,errors);
        return;
    }
    var job = request.body.job;

    this.JakeCI.jobEditor.getJob(job,this.startJob.bind(this,response));

};

RunJob.prototype.startJob = function(response, data){
    callback("Job Started");

    var cmd  = spawn(data.exec);
    var counter = 0;
    cmd.stdout.on('data', function(data) {
        counter ++;
        console.log('stdout: ' + data);
    });

    cmd.stderr.on('data', function(data) {
        console.log('stderr: ' + data);
    });

    cmd.on('exit', function(code) {
        console.log('exit code: ' + code);
        console.log(counter);
    });

    /*
     exec(data.exec, function(err, stdout, stderr) {
     if (err) {
     console.error(err);
     return;
     }
     console.log(stdout);
     });
     */
};

module.exports = RunJob;