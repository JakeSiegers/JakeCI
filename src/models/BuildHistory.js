function BuildHistory(JakeCI){
    this.JakeCI = JakeCI;
}

BuildHistory.prototype.getBuildHistory = function(params){
    var errors = this.JakeCI.functions.verifyRequiredPostFields(params.data,['job']);
    if(errors !== '') {
        params.error(errors);
        return;
    }
    var job = params.data.job;

    var jobDirectory = this.JakeCI.path.join(this.JakeCI.config.jobPath,job,"builds")
        .then(function(historyFiles){
            console.log(historyFiles);
        }).catch(function(e){
            console.log(e);
        });

    this.JakeCI.fs.readdirAsync()

    params.success();
};

module.exports = BuildHistory;