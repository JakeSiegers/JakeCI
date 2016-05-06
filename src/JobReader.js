var fs = require('fs');
var path = require('path');


function JobReader(JakeCI){
    this.JakeCI = JakeCI;
}

JobReader.prototype.checkIfJobValid = function(jobName){
    try {
        fs.accessSync(path.join(this.JakeCI.config.jobPath,jobName,'config.json'), fs.R_OK);
    }catch(e){
        return false;
    }
    return true;
}

JobReader.prototype.getAllJobs = function(){
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


JobReader.prototype.getJob = function(jobName, callback){
    fs.readFile(
        path.join(this.JakeCI.config.jobPath,jobName,'config.json'),
        'utf8',
        this.readFileCallback.bind(
            this,
            this.getJobFileRead.bind(this,callback)
        )
    );
};

JobReader.prototype.getJobFileRead = function(callback, data){
    data = JSON.parse(data);
    callback(data);
};

JobReader.prototype.saveJob = function(jobName, newJobData, callback){
    var newJobName = newJobData.name;
    fs.rename(path.join(this.JakeCI.config.jobPath,jobName),path.join(this.JakeCI.config.jobPath,newJobName),this.renameFileCallback.bind(this,this.saveJobFolderRename.bind(this,newJobName,newJobData,callback)));
};

JobReader.prototype.saveJobFolderRename = function(jobName, newJobData, callback){
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

JobReader.prototype.saveJobFileRead = function(jobName, newJobData, callback, data){
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



JobReader.prototype.readFileCallback = function (callback, error, data){
    if(error){
        throw error;
    }
    callback(data);
};

JobReader.prototype.writeFileCallback = function (callback, error){
    if(error){
        throw error;
    }
    callback();
};

JobReader.prototype.renameFileCallback = function (callback, error){
    if(error){
        throw error;
    }
    callback();
};


module.exports = JobReader;