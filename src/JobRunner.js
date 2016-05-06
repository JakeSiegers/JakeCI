function JobRunner(JakeCI){
    this.JakeCI = JakeCI;
}

JobRunner.prototype.runJobManually = function(job, callback){
    this.JakeCI.jobReader.getJob(job,this.startJob.bind(this,callback));
};

JobRunner.prototype.startJob = function(callback, data){
    callback("Job Started");
    exec(data.exec, function(err, stdout, stderr) {
        if (err) {
            console.error(err);
            return;
        }
        console.log(stdout);
    });
};

module.exports = JobRunner;