var fs = require('fs');
var path = require('path');


function JobEditor(JakeCI){
    this.JakeCI = JakeCI;
}

JobEditor.prototype.checkIfJobValid = function(jobName){
    try {
        fs.accessSync(path.join(this.JakeCI.config.jobPath,jobName,'config.json'), fs.R_OK);
    }catch(e){
        return false;
    }
    return true;
}

JobEditor.prototype.getAllJobs = function(){
    var sThis = this;
    var goodJobs = fs.readdirSync(this.JakeCI.config.jobPath).filter(function(file) {
        return fs.statSync(path.join(sThis.JakeCI.config.jobPath, file)).isDirectory();
    });

    var allJobs = [];
    for(var i=0;i<goodJobs.length;i++){

        if(!this.checkIfJobValid(goodJobs[i])){
            continue;
        }

        //load config file - extract job info
        allJobs.push({
            name:goodJobs[i],
            description:'description',
            exec:'exec',
            lastRun:'lastRun',
            lastLastError:'lastLastError'
        });
    }
    return allJobs;
};


JobEditor.prototype.getJob = function(jobName, callback){
    fs.readFile(
        path.join(this.JakeCI.config.jobPath,jobName,'config.json'),
        'utf8',
        this.readFileCallback.bind(
            this,
            this.getJobFileRead.bind(this,callback)
        )
    );
};

JobEditor.prototype.getJobFileRead = function(callback, data){
    data = JSON.parse(data);
    callback(data);
};

JobEditor.prototype.saveJob = function(jobName, newJobData, callback){
    var newJobName = newJobData.name;
    fs.rename(path.join(this.JakeCI.config.jobPath,jobName),path.join(this.JakeCI.config.jobPath,newJobName),this.renameFileCallback.bind(this,this.saveJobFolderRename.bind(this,newJobName,newJobData,callback)));
};

JobEditor.prototype.saveJobFolderRename = function(jobName, newJobData, callback){
    fs.readFile(
        path.join(this.JakeCI.config.jobPath,jobName,'config.json'),
        'utf8',
        this.readFileCallback.bind(
            this,
            this.saveJobFileRead.bind(
                this,
                jobName,
                newJobData,
                callback
            )
        )
    );
};

JobEditor.prototype.saveJobFileRead = function(jobName, newJobData, callback, data){
    data = JSON.parse(data);
    for(var key in newJobData){
        data[key] = newJobData[key];
    }
    fs.writeFile(
        path.join(this.JakeCI.config.jobPath,jobName,'config.json'),
        JSON.stringify(data),
        this.writeFileCallback.bind(
            this,
            this.getJob.bind(this,jobName,callback)
        )
    );
};



JobEditor.prototype.readFileCallback = function (callback, error, data){
    if(error){
        throw error;
    }
    callback(data);
};

JobEditor.prototype.writeFileCallback = function (callback, error){
    if(error){
        throw error;
    }
    callback();
};

JobEditor.prototype.renameFileCallback = function (callback, error){
    if(error){
        throw error;
    }
    callback();
};


module.exports = JobEditor;