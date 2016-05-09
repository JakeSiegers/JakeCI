var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp'); //A better folder creator.
var Promise = require("bluebird");
fs.mkdir = Promise.promisify(fs.mkdir);
fs.writeFile = Promise.promisify(fs.writeFile);

function NewJob(JakeCI){
    this.JakeCI = JakeCI;
}

NewJob.prototype.expressRequest = function(request, response){

    var errors = this.JakeCI.functions.verifyRequiredPostFields(request.body,['name']);
    if(errors !== ''){
        this.JakeCI.sendError(response,errors);
        return;
    }
    var data = request.body;

    var sThis = this;
    var newJobFolder = path.join(this.JakeCI.config.jobPath,data.name);
    var buildsFolder = path.join(this.JakeCI.config.jobPath,data.name,'builds');
    var workspaceFolder = path.join(this.JakeCI.config.jobPath,data.name,'workspace');
    
    fs.stat(newJobFolder, function(err, stats) {
        //Check if error defined and the error code is "not exists"
        if (err && err.code === 'ENOENT') {
            fs.mkdir(newJobFolder)
                .then(fs.mkdir(buildsFolder))
                .then(fs.mkdir(workspaceFolder))
                .then(fs.writeFile(path.join(sThis.JakeCI.config.jobPath,data.name,'config.json'), JSON.stringify(data)))
                .then(function(){
                    sThis.JakeCI.sendResponse(response,{jobName:data.name});
                }).catch(function(e){
                    sThis.JakeCI.sendError(response,e);
                });
        } else {
            sThis.JakeCI.sendError(response,'Failed to create Job Folder (does it already exist?)');
        }
    });
};

module.exports = NewJob;