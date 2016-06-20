function BuildHistory(JakeCI){
    this.JakeCI = JakeCI;
}

BuildHistory.prototype.getBuildHistory = function(params){
    //Page, start and limit for paging grid
    var errors = this.JakeCI.functions.verifyRequiredPostFields(params.data,['job','page','start','limit']);
    if(errors !== '') {
        params.error(errors);
        return;
    }
    var job = params.data.job;
    var page = params.data.page;
    var start = params.data.start;
    var limit = params.data.limit;

    var totalHistory = 0;

    var jobDirectory = this.JakeCI.path.join(this.JakeCI.config.jobPath,job,"builds");

    var bs = this; //Build History Scope
    var ps = {}; //Promise Scope

    this.JakeCI.fs.readdirAsync(jobDirectory).bind(ps)
        .then(function(historyFiles){
            var builds = [];
            for(var i in historyFiles){
                if(historyFiles[i].includes(".json")){
                    var buildNumber = historyFiles[i].substr(0,historyFiles[i].length-5);
                    builds.push(parseInt(buildNumber));
                }
            }
            builds.sort(function(a,b){
                return b-a;
            });
            return builds;
        }).then(function(builds){
            var startCounter = start;
            var buildsToShow = [];
            totalHistory = builds.length;
            for(var i in builds) {
                if(startCounter > 0){
                    startCounter--;
                    continue;
                }
                buildsToShow.push(builds[i]);
                if(buildsToShow.length == limit){
                    break;
                }
            }
            return buildsToShow;
        }).mapSeries(function(buildToShow){
            var buildConfig = bs.JakeCI.fs.readFileAsync(jobDirectory+'/'+buildToShow+'.json','utf-8').catch(function(e){return "{}"});
            var buildLog = bs.JakeCI.fs.readFileAsync(jobDirectory+'/'+buildToShow+'.log','utf-8').catch(function(e){return "Failed to read log! ("+e+")"});
            return bs.JakeCI.Promise.join(buildConfig,buildLog,function(buildConfigResponse,buildLogResponse){
               return {
                   buildNumber:buildToShow,
                   config:JSON.parse(buildConfigResponse),
                   log:buildLogResponse
               };
            });
        }).then(function(buildsToShow){
            var buildsOut = [];
            for(var i in buildsToShow){
                buildsOut.push([
                    buildsToShow[i].buildNumber,
                    buildsToShow[i].config.passed,
                    buildsToShow[i].config.started,
                    buildsToShow[i].config.finished,
                    buildsToShow[i].log,
                ]);
            }
            params.success({data:buildsOut,total:totalHistory});
        }).catch(function(e){
            console.log(e);
        });
};

module.exports = BuildHistory;