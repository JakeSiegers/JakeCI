var fs = require('fs');
var path = require('path');
var config = require('./config');
var sqlite3 = require('sqlite3').verbose();
const exec = require('child_process').exec;


function JakeModel(){
    //this.jobs = {};
}

JakeModel.prototype.checkIfJobValid = function(jobName){
    try {
        fs.accessSync(path.join(config.jobPath,jobName,'config.json'), fs.R_OK);
    }catch(e){
        return false;
    }
    return true;
}

JakeModel.prototype.getAllJobs = function(){
    var goodJobs = fs.readdirSync(config.jobPath).filter(function(file) {
        return fs.statSync(path.join(config.jobPath, file)).isDirectory();
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

JakeModel.prototype.runJobManually = function(job, callback){
    this.getJob(job,this.startJob.bind(this,callback));
};

JakeModel.prototype.startJob = function(callback, data){
    callback("Job Started");
    exec(data.exec, function(err, stdout, stderr) {
        if (err) {
            console.error(err);
            return;
        }
        console.log(stdout);
    });
};

JakeModel.prototype.getJob = function(jobName, callback){
    fs.readFile(
        path.join(config.jobPath,jobName,'config.json'),
        'utf8',
        this.readFileCallback.bind(
            this,
            this.getJobFileRead.bind(this,callback)
        )
    );
};

JakeModel.prototype.getJobFileRead = function(callback, data){
    data = JSON.parse(data);
    callback(data);
};

JakeModel.prototype.saveJob = function(jobName, newJobData, callback){
    var newJobName = newJobData.name;
    fs.rename(path.join(config.jobPath,jobName),path.join(config.jobPath,newJobName),this.renameFileCallback.bind(this,this.saveJobFolderRename.bind(this,newJobName,newJobData,callback)));
};

JakeModel.prototype.saveJobFolderRename = function(jobName, newJobData, callback){
    fs.readFile(
        path.join(config.jobPath,jobName,'config.json'),
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

JakeModel.prototype.saveJobFileRead = function(jobName, newJobData, callback, data){
    data = JSON.parse(data);
    for(var key in newJobData){
        data[key] = newJobData[key];
    }
    fs.writeFile(
        path.join(config.jobPath,jobName,'config.json'),
        JSON.stringify(data),
        this.writeFileCallback.bind(
            this,
            this.getJob.bind(this,jobName,callback)
        )
    );
};



JakeModel.prototype.readFileCallback = function (callback, error, data){
    if(error){
        throw error;
    }
    callback(data);
};

JakeModel.prototype.writeFileCallback = function (callback, error){
    if(error){
        throw error;
    }
    callback();
};

JakeModel.prototype.renameFileCallback = function (callback, error){
    if(error){
        throw error;
    }
    callback();
};


module.exports = JakeModel;