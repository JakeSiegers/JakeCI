var spawn = require('child_process').spawn;
var SVN = require('svn');



function JobRunner(JakeCI){
    this.JakeCI = JakeCI;
    this.jobsQueue = [];
    this.activeJobs = {};
    this.activeJobLimit = 1;
}

JobRunner.prototype.addJobToQueue = function(response, data){
    this.jobsQueue.push(data);
    console.log('Added "'+data.name+'" to queue');
    this.checkToStartANewJob();

    this.JakeCI.sendResponse(response,'Job Queued');
};


JobRunner.prototype.checkToStartANewJob = function(){
    if(Object.keys(this.activeJobs).length>=this.activeJobLimit     //We're at max consecutive jobs
        || this.jobsQueue.length == 0                               //Nothing in the job queue
        || this.activeJobs.hasOwnProperty(this.jobsQueue[0].name)){ //There's already a job with the same name running
        return false;
    }

    //Let's start a job!
    var nextJob = this.jobsQueue.pop();
    console.log('Removed "'+nextJob.name+'" from queue');
    this.startJob(nextJob);
};

JobRunner.prototype.startJob = function(data){
    console.log('Adding "'+data.name+'" to active jobs');
    this.activeJobs[data.name] = data;


    var buildNumber = '1';

    var buildNumberFile = this.JakeCI.path.join(this.JakeCI.config.jobPath,data.name,'buildNumber.txt');

    this.JakeCI.fs.statAsync(buildNumberFile)
        .then(function(one,two){
            console.log(one,two);
        });

/*
    fs.stat(buildNumberFile, function(err, stats) {
        if (err && err.code === 'ENOENT') {
            //File Doesn't Exist

        }else{
            fs.readFile(
                path.join(this.JakeCI.config.jobPath,jobName,'config.json'),
                'utf8',
                this.readFileCallback.bind(
                    this,
                    this.saveJobFileRead.bind(
                        this,
                        jobName,
                        newJobData,
                        callback
                    )
                )
            );
        }
    }
    */

    var cmdArray = this.JakeCI.functions.commandParser(data.exec);
    var program = cmdArray[0];
    var programArgs = [];
    for(var i=1;i<cmdArray.length;i++){
        programArgs.push(cmdArray[i]);
    }

    var cmd = spawn(program,programArgs);
    var sThis = this;



    cmd.stdout.on('data', function (data) {
        console.log('stdout: ' + data);
    });

    cmd.stderr.on('data', function (data) {
        console.log('stderr: ' + data);
    });

    cmd.on('exit', function (code) {
        console.log('child process exited with code ' + code);
        console.log('Removing "'+data.name+'" from active jobs');
        delete sThis.activeJobs[data.name];
        sThis.checkToStartANewJob();
    });
};

module.exports = JobRunner;