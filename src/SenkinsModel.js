var fs = require('fs'),
    path = require('path');
    config = require('./config');

function SenkinsModel(){
    //this.jobs = {};
}

SenkinsModel.prototype.checkIfJobValid = function(jobName){
    try {
        fs.accessSync(path.join(config.jobPath,jobName,'config.json'), fs.R_OK);
    }catch(e){
        return false;
    }
    return true;
}

SenkinsModel.prototype.getAllJobs = function(){
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

SenkinsModel.prototype.getJob = function(jobName,sendResponse){


    if(!this.checkIfJobValid(jobName)){
        return false;
    }

    fs.readFile(
        path.join(config.jobPath,jobName,'config.json'),
        'utf8',
        this.readFileCallback.bind(
            this,
            this.loadJobFileRead.bind(
                this,sendResponse
            )
        )
    );
};

SenkinsModel.prototype.loadJobFileRead = function(sendResponse,data){
    data = JSON.parse(data);
    sendResponse(data);
};

SenkinsModel.prototype.readFileCallback = function (callback,error,data){
    if(error){
        throw error;
    }
    callback(data);
};

module.exports = SenkinsModel;