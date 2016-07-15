var spawn = require('child_process').spawn;

function JobRunner(JakeCI){
    this.JakeCI = JakeCI;
    this.jobsQueue = []; //List of job names
    this.activeJobs = {}; //Object of job names. Prevents 2 of the same job from running, and can store info about the active job. Like time started, and command info.
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
    //We're at max consecutive jobs or, Nothing in the job queue
    if(Object.keys(this.activeJobs).length>=this.JakeCI.appSettings.activeJobLimit || this.jobsQueue.length == 0){
        return false;
    }

    //Loop over all jobs in queue to find a good job to start
    for(var i in this.jobsQueue){
        //There's NOT already a job with the same name running
        if(!this.activeJobs.hasOwnProperty(this.jobsQueue[i])){
            //Let's start a job!
            var nextJobIndex = this.jobsQueue.indexOf(this.jobsQueue[i]);
            var nextJob = this.jobsQueue.splice(nextJobIndex, 1)[0]; // grab the next item
            this.JakeCI.debug('Removed "'+nextJob+'" from queue');
            this.startJob(nextJob);
            break;
        }
    }
};

JobRunner.prototype.startJob = function(jobName){
    this.JakeCI.debug('Adding "'+jobName+'" to active jobs');
    var startTime = this.JakeCI.functions.getDateTime();
    this.activeJobs[jobName] = {started:startTime,lastFinishTime:null,passed:null,buildNumber:null,log:''};

    var jr = this; //Job Runner Scope
    var ps = {}; //Promise Scope

    var jobFolder = this.JakeCI.path.join(this.JakeCI.config.jobPath,jobName);
    var buildStatsFile = this.JakeCI.path.join(jobFolder,'buildStats.json');
    var configFile = this.JakeCI.path.join(jobFolder,'config.json');
    var workspaceFolder = this.JakeCI.path.join(jobFolder,'workspace');
    var logFile = null;
    var logFileStream = null

    var addToLog = function(entry){
        //Cannot write to log without a stream!
        if(logFileStream == null){
            return;
        }
        entry = jr.JakeCI.functions.getDateTime()+": "+entry;
        jr.JakeCI.debug(entry);
        jr.activeJobs[jobName].log += entry+"\n";
        logFileStream.write(entry+"\n");
        /*
        return jr.JakeCI.fs.writeFileAsync(logFile,entry,{encoding: 'utf8', flag: 'a'})
            .catch(function(e){
                console.error(e);
            });
         */
    };

    var executeCmd = function(command){
        return new Promise(function (resolve, reject) {
            try {
                var cmdArray = jr.JakeCI.functions.commandParser(command);
                var program = cmdArray[0];
                var programArgs = [];
                for (var i = 1; i < cmdArray.length; i++) {
                    programArgs.push(cmdArray[i]);
                }

                addToLog("Executing '" + command + "'");

                var cmd = spawn(program, programArgs, {cwd: workspaceFolder});

                cmd.stdout.on('data', function (data) {
                    var msg = 'stdout: ' + data;
                    //wstream.write(msg);
                    addToLog(msg);
                    jr.activeJobs[jobName].log += data;
                });

                cmd.stderr.on('data', function (data) {
                    var msg = 'stderr: ' + data;
                    //wstream.write(msg);
                    addToLog(msg);
                    jr.activeJobs[jobName].log += data;
                });

                cmd.on('error', function(error) {
                    var msg = "process crashed with error: "+error;
                    //wstream.write(msg);
                    addToLog(msg);
                    //wstream.end();
                    resolve({exitCode: -1});
                });

                cmd.on('exit', function (code) {
                    var msg = 'process exited with code ' + code;
                    //wstream.write(msg);
                    addToLog(msg);
                    //wstream.end();
                    resolve({exitCode: code});
                });
            }catch(e){
                console.log("CAUGHT?");
                reject(e);
            }
        })
    };

    var endBuild = function(jobPassed){
        jr.JakeCI.fs.readFileAsync(ps.jobFile,'utf8').bind(ps)
            .then(function(jobFileContents){
                jr.JakeCI.debug('Job "'+jobName+'" '+(jobPassed?'PASSED':'FAILED'));
                var jobFile = JSON.parse(jobFileContents);
                jobFile.passed = jobPassed;
                jobFile.finished = jr.JakeCI.functions.getDateTime();
                ps.lastFinishTime = new Date(jobFile.finished) - new Date(jobFile.started);
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
                buildStats.lastFinishTime = ps.lastFinishTime;
                return jr.JakeCI.fs.writeFileAsync(buildStatsFile,JSON.stringify(buildStats),'utf8');
            })
            .then(function(){
                if(!jobPassed){
                    addToLog('==== BUILD FAILED ====');
                    addToLog('Sending Failure Email');
                    return jr.JakeCI.sendEmail({
                        from: jr.JakeCI.appSettings.fromAddress,
                        to: jr.JakeCI.appSettings.alertEmail,
                        subject: String.fromCodePoint(10060)+' Build FAILURE: '+jobName,
                        html: '<h1>"'+jobName+'" FAILED:</h1><pre>'+jr.activeJobs[jobName].log+'</pre>'
                    });
                }else{
                    addToLog('==== BUILD PASSED ====');
                    if(ps.buildPassing === null) {
                        addToLog('Sending First Pass Email');
                        return jr.JakeCI.sendEmail({
                            from: jr.JakeCI.appSettings.fromAddress,
                            to: jr.JakeCI.appSettings.alertEmail,
                            subject: ' Build Passed: ' + jobName,
                            html: '<h1>"'+jobName+'" Passed First Build:</h1>' +
                            '<p>This is the first time you\'ve built this job, and it passed the first time! Good Job!</p>' +
                            '<p>I\'ll only send you emails on build failures from now on.</p>'
                        });
                    }else if(ps.buildPassing === false){
                        addToLog('Sending Back to Normal Email');
                        return jr.JakeCI.sendEmail({
                            from: jr.JakeCI.appSettings.fromAddress,
                            to: jr.JakeCI.appSettings.alertEmail,
                            subject: ' Build Back to Normal: '+jobName,
                            html: '<h1>"'+jobName+'" Is Back To Normal</h1>'
                        });
                    }
                }
            })
            .catch(function(e){
                addToLog('Failed to Properly End Build');
                addToLog(e);
            })
            .then(function(){
                jr.JakeCI.debug('Removing "'+jobName+'" from active jobs');
                delete jr.activeJobs[jobName];
            })
            .then(function(){
                jr.JakeCI.debug('Closing Log File');
                logFileStream.close();
                jr.JakeCI.debug('Starting next job in queue (if any)');
                jr.checkToStartANewJob();
            });
    };

    this.JakeCI.fs.readFileAsync(buildStatsFile,'utf8')
        .then(function(buildStats){
            return JSON.parse(buildStats);
        })
        .catch(function(e){
            //create the file if it doesn't exist, then return 1.
            var defaultBuildStats = {buildNumber:1,buildPassing:null,lastFinishTime:null};
            return jr.JakeCI.fs.writeFileAsync(buildStatsFile,JSON.stringify(defaultBuildStats),'utf8').then(function(){return defaultBuildStats});
        })
        .then(function(buildStats){
            ps.buildNumber = parseInt(buildStats.buildNumber);
            jr.activeJobs[jobName].buildNumber = ps.buildNumber;
            jr.activeJobs[jobName].lastFinishTime = buildStats.lastFinishTime;
            ps.jobFile = jr.JakeCI.path.join(jr.JakeCI.config.jobPath,jobName,'builds',ps.buildNumber+'.json');
            logFile = jr.JakeCI.path.join(jr.JakeCI.config.jobPath,jobName,'builds',ps.buildNumber+'.log');
            logFileStream = jr.JakeCI.fs.createWriteStream(logFile, {flags: 'a'});
            addToLog("Starting Build: "+ps.buildNumber+" at "+startTime);
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
            addToLog("Reading '"+configFile+"'");
            return jr.JakeCI.fs.readFileAsync(configFile,'utf8');
        })
        .then(function(jobConfig){
            ps.jobConfig = JSON.parse(jobConfig);
        })
        .then(function(){
            addToLog("Creating '"+workspaceFolder+"' if it doesn't exist");
            return jr.JakeCI.fs.statAsync(workspaceFolder).catch(function(){
                //Folder doesn't exist, so lets try and create it.
                return jr.JakeCI.fs.mkdirAsync(workspaceFolder);
            });

        })
        .then(function(){
            //If job doesn't have a repo type set, or a repo url set, skip this step!
            if(!ps.jobConfig.hasOwnProperty('repoType') || !ps.jobConfig.hasOwnProperty('repoUrl')){
                return;
            }
            if(ps.jobConfig.hasOwnProperty('repoType') && ps.jobConfig['repoType'] == 'git'){
                if(!jr.JakeCI.appSettings.hasOwnProperty('gitBinary')){
                    throw("Missing Git binary path - Set in JakeCI settings");
                }
                addToLog("Deleting '"+workspaceFolder+"'");
                return jr.JakeCI.rmdirAsync(workspaceFolder)
                    .then(function(){
                        addToLog("Git Clone '"+ps.jobConfig.repoUrl+"' to '"+workspaceFolder+"'");
                        return executeCmd(jr.JakeCI.appSettings.gitBinary+" clone "+ps.jobConfig.repoUrl+" "+workspaceFolder);
                    })
            }
            else if(ps.jobConfig.hasOwnProperty('repoType') && ps.jobConfig['repoType'] == 'svn'){

            }
            else {
                throw("Job Has Invalid Repo Type");
            }

        })
        .then(function(){
            if(ps.jobConfig.hasOwnProperty('exec')){
                return executeCmd(ps.jobConfig.exec);
            }
            //Skipping if no exec command
            return {exitCode:0};
        })
        .then(function(runResults){
            jr.JakeCI.debug(runResults);
            return endBuild(runResults.exitCode == 0);
        })
        //if something crashed, stop and fail the build.
        .catch(function(e){
            console.error(e.stack);
            addToLog(e);
            return endBuild(false);
        })
};


module.exports = JobRunner;