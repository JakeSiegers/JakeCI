var spawn = require('child_process').spawn;
var SVN = require('svn');
var Git = require('nodegit');


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
    var startTime = this.JakeCI.functions.getDateTime();
    this.activeJobs[jobName] = {started:startTime,passed:null,buildNumber:null,log:''};

    var jr = this; //Job Runner Scope
    var ps = {}; //Promise Scope

    var jobFolder = this.JakeCI.path.join(this.JakeCI.config.jobPath,jobName);
    var buildStatsFile = this.JakeCI.path.join(jobFolder,'buildStats.json');
    var configFile = this.JakeCI.path.join(jobFolder,'config.json');
    var workspaceFolder = this.JakeCI.path.join(jobFolder,'workspace');

    var endBuild = function(jobPassed){
        jr.JakeCI.fs.readFileAsync(ps.jobFile,'utf8').bind(ps)
            .then(function(jobFileContents){
                jr.JakeCI.debug('Job "'+jobName+'" '+(jobPassed?'PASSED':'FAILED'));
                var jobFile = JSON.parse(jobFileContents);
                jobFile.passed = jobPassed;
                jobFile.finished = jr.JakeCI.functions.getDateTime();
                return jr.JakeCI.fs.writeFileAsync(ps.jobFile,JSON.stringify(jobFile),'utf8');
            })
            //Read and update build stats
            .then(function(){
                return jr.JakeCI.fs.readFileAsync(buildStatsFile,'utf8');
            })
            .then(function(jsonBuildStats){
                var buildStats = JSON.parse(jsonBuildStats);
                ps.buildPassing = buildStats.buildPassing;
                buildStats.buildPassing = jobPassed;
                return jr.JakeCI.fs.writeFileAsync(buildStatsFile,JSON.stringify(buildStats),'utf8');
            })
            .then(function(){
                if(!jobPassed){
                    jr.JakeCI.debug('Sending Failure Email');
                    return jr.JakeCI.sendEmail({
                        from: jr.JakeCI.appSettings.fromAddress,
                        to: jr.JakeCI.appSettings.alertEmail,
                        subject: '❌Build FAILURE: '+jobName,
                        html: '<h1>"'+jobName+'" FAILED:</h1><pre>'+jr.activeJobs[jobName].log+'</pre>'
                    });
                }else{
                    if(ps.buildPassing == null) {
                        jr.JakeCI.debug('Sending First Pass Email');
                        return jr.JakeCI.sendEmail({
                            from: jr.JakeCI.appSettings.fromAddress,
                            to: jr.JakeCI.appSettings.alertEmail,
                            subject: '🎉 Build Passed: ' + jobName,
                            html: '<h1>"'+jobName+'" Passed First Build:</h1>' +
                            '<p>This is the first time you\'ve built this job, and it passed the first time! Good Job!</p>' +
                            '<p>I\'ll only send you emails on build failures from now on.</p>'
                        });
                    }else if(ps.buildPassing == false){
                        jr.JakeCI.debug('Sending Back to Normal Email');
                        return jr.JakeCI.sendEmail({
                            from: jr.JakeCI.appSettings.fromAddress,
                            to: jr.JakeCI.appSettings.alertEmail,
                            subject: '👍 Build Back to Normal: '+jobName,
                            html: '<h1>"'+jobName+'" Is Back To Normal</h1>'
                        });
                    }
                }
            })
            .then(function(){
                jr.JakeCI.debug('Removing "'+jobName+'" from active jobs');
                delete jr.activeJobs[jobName];
            })
            .then(function(){
                jr.JakeCI.debug('Starting next job in queue (if any)');
                jr.checkToStartANewJob();
            })
            .catch(function(e){
                jr.JakeCI.debug('Failed to end a build, Crashing!');
                jr.JakeCI.error(e);
            });
    };

    this.JakeCI.fs.readFileAsync(buildStatsFile,'utf8').bind(ps)
        .then(function(buildStats){
            return JSON.parse(buildStats).buildNumber;
        })
        .catch(function(e){
            //create the file if it doesn't exist, then return 1.
            return jr.JakeCI.fs.writeFileAsync(buildStatsFile,JSON.stringify({buildNumber:1,buildPassing:null}),'utf8').then(function(){return 1});
        })
        .then(function(buildNumber){
            ps.buildNumber = parseInt(buildNumber);
            jr.activeJobs[jobName].buildNumber = ps.buildNumber;
            ps.logFile = jr.JakeCI.path.join(jr.JakeCI.config.jobPath,jobName,'builds',ps.buildNumber+'.log');
            ps.jobFile = jr.JakeCI.path.join(jr.JakeCI.config.jobPath,jobName,'builds',ps.buildNumber+'.json');
            ps.addToLog = function(entry){
                jr.JakeCI.debug(entry);
                jr.activeJobs[jobName].log += entry+"\n";
                return jr.JakeCI.fs.writeFileAsync(ps.logFile,entry+"\n",{encoding: 'utf8', flag: 'a'})
                    .catch(function(e){
                        console.error(e);
                    });
            };
            return ps.addToLog("Starting Build: "+ps.buildNumber+" at "+startTime);
        })
        .then(function(){
            return jr.JakeCI.fs.writeFileAsync(ps.jobFile,JSON.stringify({
                started:startTime,
                finished:null,
                passed:null
            }),'utf8');
        })
        .then(function(){
            return jr.JakeCI.fs.readFileAsync(buildStatsFile,'utf8');
        })
        .then(function(buildStats){
            var buildStats = JSON.parse(buildStats);
            buildStats.buildNumber++;
            return jr.JakeCI.fs.writeFileAsync(buildStatsFile,JSON.stringify(buildStats),'utf8');
        })
        .then(function(){
            return ps.addToLog("Reading '"+configFile+"'");
        })
        .then(function(){
            return jr.JakeCI.fs.readFileAsync(configFile,'utf8');
        })
        .then(function(jobConfig){
            ps.jobConfig = JSON.parse(jobConfig);
            return ps.addToLog("Deleting '"+workspaceFolder+"'");
        })
        .then(function(){
            return jr.JakeCI.rmdirAsync(workspaceFolder);
        })
        .then(function(){
            return ps.addToLog("Cloning '"+ps.jobConfig.repoUrl+"' to '"+workspaceFolder+"'");
        })
        .then(function(){
            return Git.Clone(ps.jobConfig.repoUrl,workspaceFolder);
        })
        .then(function(){
            return this.addToLog("Executing '"+ps.jobConfig.exec+"'");
        })
        .then(function(){
            return new Promise(function (resolve, reject) {
                var cmdArray = jr.JakeCI.functions.commandParser(ps.jobConfig.exec);
                var program = cmdArray[0];
                var programArgs = [];
                for(var i=1;i<cmdArray.length;i++){
                    programArgs.push(cmdArray[i]);
                }

                var cmd = spawn(program,programArgs,{cwd:workspaceFolder});
                var wstream = jr.JakeCI.fs.createWriteStream(ps.logFile,{flags:'a'});

                cmd.stdout.on('data', function (data) {
                    jr.JakeCI.debug('stdout: ' + data);
                    wstream.write(data);
                    jr.activeJobs[jobName].log += data;
                });

                cmd.stderr.on('data', function (data) {
                    jr.JakeCI.debug('stderr: ' + data);
                    wstream.write(data);
                    jr.activeJobs[jobName].log += data;
                });

                cmd.on('exit', function (code) {
                    wstream.write('process exited with code ' + code);
                    console.log('child process exited with code ' + code);
                    wstream.end();
                    resolve({exitCode:code});
                });
            });
        })
        .then(function(runResults){
            jr.JakeCI.debug(runResults);
            return endBuild(runResults.exitCode == 0);
        })
        //if something crashed, stop and fail the build.
        .catch(function(e){
            console.error(e);
            return ps.addToLog(e).then(function(){endBuild(false);});
        })
};


module.exports = JobRunner;