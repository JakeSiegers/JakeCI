function Job(JakeCI){
    this.JakeCI = JakeCI;
}

Job.prototype.getJobQueue = function(request,response){
    this.JakeCI.models['JobRunner'].getJobQueue({
        success:function(reply){

            console.log(reply);

            var queue = [];
            //Is an object
            for(var jobName in reply.active){
                var progress = 100;
                
                if(reply.active[jobName].lastFinishTime !== null){
                    progress = ((Date.now() - new Date(reply.active[jobName].started)) / reply.active[jobName].lastFinishTime) * 100;
                }

                queue.push([
                    jobName+'<div class="progress" style="left:'+(progress - 100)+'%;"></div>', //job name
                    true, //is active
                    progress+"%"
                ]);
            }
            //Is an array
            for(var i=0;i<reply.queued.length;i++){
                queue.push([
                    reply.queued[i], //job name
                    false, //is active
                    0+"%"
                ]);
            }
            this.JakeCI.sendResponse(response,{data:queue});
        },
        error:function(error){
            this.JakeCI.sendError(response,error);
        },
        scope:this
    });
};

Job.prototype.getAllJobs = function(request, response){
    this.JakeCI.models['JobEditor'].getAllJobs({
        success:function(jobs){
            var formattedJobs = [];
            for(var i=0;i<jobs.length;i++){
                formattedJobs.push([
                    jobs[i].config.name,
                    jobs[i].config.description,
                    jobs[i].buildStats.buildPassing,
                    jobs[i].buildStats.lastFinishTime,
                ]);
            }
            this.JakeCI.sendResponse(response,{data:formattedJobs});
        },
        error:function(error){
            this.JakeCI.sendError(response,error);
        },
        scope:this
    });
};

Job.prototype.getJob = function(request, response){
    this.JakeCI.models['JobEditor'].getJob({
        data:request.body,
        success:function(reply){
            this.JakeCI.sendResponse(response,{data:reply});
        },
        error:function(error){
            this.JakeCI.sendError(response,error);
        },
        scope:this
    });
};

Job.prototype.saveJob = function(request, response){
    this.JakeCI.models['JobEditor'].saveJob({
        data:request.body,
        success:function(reply){
            this.JakeCI.sendResponse(response,{data:reply});
        },
        error:function(error){
            this.JakeCI.sendError(response,error);
        },
        scope:this
    });
};

//TODO: this needs to be moved to a model....
Job.prototype.newJob = function(request, response){

    var errors = this.JakeCI.functions.verifyRequiredPostFields(request.body,['name']);
    if(errors !== ''){
        this.JakeCI.sendError(response,errors);
        return;
    }
    var data = request.body;

    var sThis = this;
    var newJobFolder = this.JakeCI.path.join(this.JakeCI.config.jobPath,data.name);
    var buildsFolder = this.JakeCI.path.join(this.JakeCI.config.jobPath,data.name,'builds');
    var workspaceFolder = this.JakeCI.path.join(this.JakeCI.config.jobPath,data.name,'workspace');


    this.JakeCI.fs.stat(newJobFolder, function(err, stats) {
        //Check if error defined and the error code is "not exists"
        if (err && err.code === 'ENOENT') {
            sThis.JakeCI.fs.mkdirAsync(newJobFolder)

                .then(sThis.JakeCI.fs.mkdirAsync(workspaceFolder))
                .then(sThis.JakeCI.fs.mkdirAsync(buildsFolder))
                .then(sThis.JakeCI.fs.writeFileAsync(sThis.JakeCI.path.join(sThis.JakeCI.config.jobPath,data.name,'config.json'), JSON.stringify(data)))
                .then(function(){
                    sThis.JakeCI.sendResponse(response,{data:{jobName:data.name}});
                }).catch(function(e){
                    console.log(e);
                    sThis.JakeCI.sendError(response,"Failed to create Job (does it already exist?)");
                });
        } else {
            sThis.JakeCI.sendError(response,'Failed to create Job (does it already exist?)');
        }
    });
};

Job.prototype.runJob = function(request, response){

    this.JakeCI.models['JobRunner'].addJobToQueue({
        data:request.body,
        success:function(reply){
            this.JakeCI.sendResponse(response,{data:reply});
        },
        error:function(error){
            this.JakeCI.sendError(response,error);
        },
        scope:this
    });

};

module.exports = Job;