function JobEditor(JakeCI){
    this.JakeCI = JakeCI;
}

JobEditor.prototype.getAllJobs = function(params){
    /*
        Promises are AWESOME -
        This:
            Gets a list of files in the job directory
            the map() takes that array, and applies a promised action to each. The next step doesn't fire until all these have completed. The map will send an array to the next step of everything returned here.
     */
    var sThis = this;

    this.JakeCI.fs.readdirAsync(this.JakeCI.config.jobPath)
        .map(function(fileName){
            var stats = sThis.JakeCI.fs.statAsync(sThis.JakeCI.config.jobPath+'/'+fileName);
            var configContents = sThis.JakeCI.fs.readFileAsync(sThis.JakeCI.config.jobPath+'/'+fileName+'/config.json','utf8').catch(function(){return null;});
            var buildStats = sThis.JakeCI.fs.readFileAsync(sThis.JakeCI.config.jobPath+'/'+fileName+'/buildStats.json','utf8').catch(function(){return null;});
            return sThis.JakeCI.Promise.join(stats,configContents,buildStats,function(statsResponse,configContentsResponse,buildStatsResponse){
                var buildStats = JSON.parse(buildStatsResponse);
                if(buildStats === null){
                    buildStats = {};
                }
                return {
                    jobName: fileName,
                    stats: statsResponse, //Do we even need stats? you will for isDirectory() to check for sub job folders recursively. Version 2!
                    config: JSON.parse(configContentsResponse),
                    buildStats: buildStats
                }
            });
        })
        .then(function(rawJobs){
            //console.log(rawJobs);
            var allJobs = [];
            for(var i=0;i<rawJobs.length;i++){
                //Config file doesn't exist, or the job is bad for some reason...
                if(rawJobs[i].config == null){
                    continue;
                }
                allJobs.push(rawJobs[i]);
            }
            params.success.call(params.scope,allJobs);
        }).catch(function(e){
            console.error(e.stack);
            params.error.call(params.scope,'Failed to load Jobs');
        });
};

JobEditor.prototype.getJob = function(params) {
    this.JakeCI.functions.verifyRequiredPostFields(params.data,['jobName']);

    var jobName = params.data.jobName;
    var sThis = this;
    this.JakeCI.fs.readFileAsync(sThis.JakeCI.path.join(sThis.JakeCI.config.jobPath, jobName,'config.json'),'utf8')
        .then(function(jobConfig){
            params.success.call(params.scope,JSON.parse(jobConfig));
        }).catch(function(e){
            console.error(e);
            params.error.call(params.scope,'Failed to load Job <hr />'+e);
        });
};

JobEditor.prototype.saveJob = function(params){
    this.JakeCI.functions.verifyRequiredPostFields(params.data,['jobName','jobData']);

    var jobName = params.data.jobName;
    var jobData = JSON.parse(params.data.jobData);

    //Check job data required fields
    this.JakeCI.functions.verifyRequiredPostFields(jobData,['name']);

    if(/[^a-zA-Z0-9 ]/.test(jobData.name) || jobData.name.length > 20){
        throw new Error("Job Name Must Be less than <= 20 characters and only contain alpha-numeric characters, plus spaces and dashes.");
    }

    //var sThis = this;
    //TODO: change this from a loop over valid jobs to just grabbing the job we want with some error checking (Check for config file)
    this.JakeCI.fs.readdirAsync(this.JakeCI.config.jobPath).bind(this)
        .map(function(fileName){
            //Get A list of all the valid jobs
            var stats = this.JakeCI.fs.statAsync(this.JakeCI.config.jobPath+'/'+fileName);
            var configContents = this.JakeCI.fs.readFileAsync(this.JakeCI.config.jobPath+'/'+fileName+'/config.json','utf8').catch(function(){return null;});
            return this.JakeCI.Promise.join(stats,configContents,function(statsResponse,configContentsResponse){
                return {
                    jobName: fileName,
                    stats: statsResponse, //Do we even need stats? you will for isDirectory() to check for sub job folders recursively. Version 2!
                    config: configContentsResponse
                }
            });
        }).then(function(rawJobs) {
            //Determine which job we need to adjust
            var foundJob = [];
            for (var i = 0; i < rawJobs.length; i++) {
                //Config file doesn't exist, or the job is bad for some reason...
                if (rawJobs[i].config == null || rawJobs[i].jobName !== jobName) {
                    continue;
                }
                foundJob.push(JSON.parse(rawJobs[i].config));
            }
            if (foundJob.length !== 1) {
                throw "Job '" + jobName + "' Not Found";
            }
            return foundJob[0];
        }).then(function(foundJob) {
            //Rename the job folder if necessary
            var rename = function (){}; //Do Nothing!
            if (jobData.hasOwnProperty('name') && jobData.name !== foundJob.name) {
                //Okay, we need to rename the job folder
                rename = this.JakeCI.fs.renameAsync(this.JakeCI.path.join(this.JakeCI.config.jobPath, foundJob.name),this.JakeCI.path.join(this.JakeCI.config.jobPath, jobData.name));
                //Update jobName to be accurate
                jobName = jobData.name;
            }
            return this.JakeCI.Promise.join(rename,function(renameResponse){
                //Always return the found job.
                return foundJob;
            });
        }).then(function(foundJob){
            //Save Config file
            //console.log(jobData);
            for(var key in jobData){
                foundJob[key] = jobData[key];
                //Delete The Key if it exists, and it's being saved as a blank value.
                if(foundJob.hasOwnProperty(key) && jobData[key] !== null && jobData[key].trim() == ""){
                    delete foundJob[key];
                }
            }
            return this.JakeCI.fs.writeFileAsync(this.JakeCI.path.join(this.JakeCI.config.jobPath, foundJob.name,'config.json'),JSON.stringify(foundJob));
        }).then(function(){
            //Re-grab config file.
            return this.JakeCI.fs.readFileAsync(this.JakeCI.path.join(this.JakeCI.config.jobPath,jobName,'config.json'),'utf8');
        }).then(function(updatedConfig){
            params.success.call(params.scope,JSON.parse(updatedConfig));
        }).catch(function(e){
            console.error(e);
            params.error.call(params.scope,'Failed to save Job <hr />'+e);
        });
};

module.exports = JobEditor;