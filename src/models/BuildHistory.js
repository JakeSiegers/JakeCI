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

    console.log(job);

    params.success();
};

module.exports = BuildHistory;