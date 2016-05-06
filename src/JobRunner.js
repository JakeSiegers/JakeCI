const exec = require('child_process').exec;
const spawn = require('child_process').spawn;

function JobRunner(JakeCI){
    this.JakeCI = JakeCI;
}

JobRunner.prototype.runJobManually = function(job, callback){
    this.JakeCI.jobReader.getJob(job,this.startJob.bind(this,callback));
};

JobRunner.prototype.startJob = function(callback, data){
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

module.exports = JobRunner;