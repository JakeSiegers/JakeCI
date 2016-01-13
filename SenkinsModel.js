function SenkinsModel(){
    this.jobs = {};
}


SenkinsModel.prototype.getAllJobs = function(){
    return this.jobs;
};

SenkinsModel.prototype.addJob = function(data){
    this.jobs[data.name] = data;
};

module.exports = SenkinsModel;