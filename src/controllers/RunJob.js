function RunJob(JakeCI){
    this.JakeCI = JakeCI;
}

RunJob.prototype.expressRequest = function(request, response){

    var errors = this.JakeCI.functions.verifyRequiredPostFields(request.body,['job']);
    if(errors !== ''){
        this.JakeCI.sendError(response,errors);
        return;
    }
    var job = request.body.job;

    this.JakeCI.jobEditor.getJob(
        job,
        this.JakeCI.models['JobRunner'].addJobToQueue.bind(this.JakeCI.models['JobRunner'],response)
    );
};


module.exports = RunJob;