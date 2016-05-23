var spawn = require('child_process').spawn;
var SVN = require('svn');

function JobRunner(JakeCI){
    this.JakeCI = JakeCI;
    this.jobsQueue = []; //List of job names
    this.activeJobs = {}; //Object of job names. Prevents 2 of the same job from running, and can store info about the active job. Like time started, and command info.
    this.activeJobLimit = 1;
}

JobRunner.prototype.getJobQueue = function(params){
    params.success.call(params.scope,{active:this.activeJobs,queued:this.jobsQueue});
};

JobRunner.prototype.addJobToQueue = function(params){
    var errors = this.JakeCI.functions.verifyRequiredPostFields(params.data,['jobName']);
    if(errors !== ''){
        params.error.call(params.scope,errors);
        return;
    }
    var jobName = params.data.jobName;

    this.jobsQueue.push(jobName);
    console.log('Added "'+jobName+'" to queue');
    this.checkToStartANewJob();
    params.success.call(params.scope,'Job Queued');
};

JobRunner.prototype.checkToStartANewJob = function(){
    if(Object.keys(this.activeJobs).length>=this.activeJobLimit     //We're at max consecutive jobs
        || this.jobsQueue.length == 0                               //Nothing in the job queue
        || this.activeJobs.hasOwnProperty(this.jobsQueue[0])){      //There's already a job with the same name running
        return false;
    }

    //Let's start a job!
    var nextJob = this.jobsQueue.pop();
    console.log('Removed "'+nextJob+'" from queue');
    this.startJob(nextJob);
};

JobRunner.prototype.startJob = function(jobName){
    console.log('Adding "'+jobName+'" to active jobs');
    this.activeJobs[jobName] = {started:'time, etc'};


    var buildNumber = '1';

    /*this.JakeCI.fs.statAsync(buildNumberFile)
        .then(function(one,two){
            console.log(one,two);
        });
        */
/*
    this.JakeCI.fs.readFileAsync(this.JakeCI.path.join(this.JakeCI.config.jobPath,data.name,'buildNumber.txt'),'utf8')
        .then(function(jobConfig){
            console.log(JSON.parse(jobConfig));
        }).catch(function(e){
            console.error(e);
        });
*/
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

    /*
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
    */
};

module.exports = JobRunner;