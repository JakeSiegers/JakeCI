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
    sThis = this;

    this.JakeCI.fs.readdirAsync(this.JakeCI.config.jobPath)
        .map(function(fileName){
            var stats = sThis.JakeCI.fs.statAsync(sThis.JakeCI.config.jobPath+'/'+fileName);
            var configContents = sThis.JakeCI.fs.readFileAsync(sThis.JakeCI.config.jobPath+'/'+fileName+'/config.json','utf8').catch(function(){return null;});
            return sThis.JakeCI.Promise.join(stats,configContents,function(stats,configContents){
                return {
                    stats: stats, //Do we even need stats? you will for isDirectory() to check for sub job folders recursively. Version 2!
                    config: configContents
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
                allJobs.push(JSON.parse(rawJobs[i].config));
            }
            params.success.call(params.scope,allJobs);
        }).catch(function(e){
            console.error(e);
            params.error.call(params.scope,'Failed to load Jobs');
        });
};

module.exports = JobEditor;