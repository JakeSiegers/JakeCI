var spawn = require('child_process').spawn;
var SVN = require('svn');
var Git = require("nodegit");


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
    this.JakeCI.debug('Added "'+jobName+'" to queue');
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
    var nextJob = this.jobsQueue.shift(); // grab the next item
    this.JakeCI.debug('Removed "'+nextJob+'" from queue');
    this.startJob(nextJob);
};

JobRunner.prototype.startJob = function(jobName){
    this.JakeCI.debug('Adding "'+jobName+'" to active jobs');
    this.activeJobs[jobName] = {started:this.JakeCI.functions.getDateTime()};


    var buildNumber = '1';

    /*this.JakeCI.fs.statAsync(buildNumberFile)
        .then(function(one,two){
            console.log(one,two);
        });
        */

    var sThis = this;

    var jobFolder = this.JakeCI.path.join(this.JakeCI.config.jobPath,jobName);
    var buildNumberFile = this.JakeCI.path.join(jobFolder,'buildNumber.txt');
    var configFile = this.JakeCI.path.join(jobFolder,'config.json');
    var workspaceFolder = this.JakeCI.path.join(jobFolder,'workspace');

    this.JakeCI.fs.readFileAsync(buildNumberFile,'utf8').bind({})
        .then(function(buildNumber){
            return buildNumber;
        })
        .catch(function(e){
            //create the file if it doesn't exist, then return 0.
            return sThis.JakeCI.fs.writeFileAsync(buildNumberFile,0,'utf8').then(function(){return 0});
        })
        .then(function(buildNumber){
            this.buildNumber = parseInt(buildNumber);
            this.logFile = sThis.JakeCI.path.join(sThis.JakeCI.config.jobPath,jobName,'builds',this.buildNumber+'.log');
            this.addToLog = function(entry){
                sThis.JakeCI.debug(entry);
                return sThis.JakeCI.fs.writeFileAsync(this.logFile,entry+"\n",{encoding: 'utf8', flag: 'a'})
                    .catch(function(e){
                        console.error(e);
                    });
            };
            return this.addToLog("Starting Build: "+this.buildNumber);
        })
        .then(function(){
            return sThis.JakeCI.fs.writeFileAsync(buildNumberFile,this.buildNumber+1,'utf8');
        })
        .then(function(){
            return this.addToLog("Reading '"+configFile+"'");
        })
        .then(function(){
            return sThis.JakeCI.fs.readFileAsync(configFile,'utf8');
        })
        .then(function(jobConfig){
            this.jobConfig = JSON.parse(jobConfig);
            return this.addToLog("Deleting '"+workspaceFolder+"'");
        })
        .then(function(){
            return sThis.JakeCI.rmdirAsync(workspaceFolder);
        })
        .then(function(){
            return this.addToLog("Cloning '"+this.jobConfig.repoUrl+"' to '"+workspaceFolder+"'");
        })
        .then(function(){
            return Git.Clone(this.jobConfig.repoUrl,workspaceFolder);
        })
        .then(function(){
            return this.addToLog("Executing '"+this.jobConfig.exec+"'");
        })
        .then(function(){
            var cmdArray = sThis.JakeCI.functions.commandParser(this.jobConfig.exec);
            var program = cmdArray[0];
            var programArgs = [];
            for(var i=1;i<cmdArray.length;i++){
                programArgs.push(cmdArray[i]);
            }

            var cmd = spawn(program,programArgs,{cwd:workspaceFolder});

            var wstream = sThis.JakeCI.fs.createWriteStream(this.logFile,{flags:'a'});

            cmd.stdout.on('data', function (data) {
                sThis.JakeCI.debug('stdout: ' + data);
                wstream.write(data);
            });

            cmd.stderr.on('data', function (data) {
                sThis.JakeCI.debug('stderr: ' + data);
                wstream.write(data);
            });

            cmd.on('exit', function (code) {
                wstream.write('process exited with code ' + code);
                console.log('child process exited with code ' + code);
                console.log('Removing "'+jobName+'" from active jobs');
                delete sThis.activeJobs[jobName];
                sThis.checkToStartANewJob();
                wstream.end();
            });
        })
        .catch(function(e){
            console.error(e);
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

};
/*
JobRunner.prototype.addToJobLog = function(job,file,entry){
    this.JakeCI.debug(entry);
    this.JakeCI.fs.writeFileAsync(file,entry,'utf8')
        .catch(function(e){
            console.error(e);
        });
};
*/

module.exports = JobRunner;