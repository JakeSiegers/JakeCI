var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp'); //A better folder creator.
var Promise = require("bluebird");
fs.mkdirPromise = Promise.promisify(fs.mkdir);
fs.writeFilePromise = Promise.promisify(fs.writeFile);

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
            fs.mkdirPromise(newJobFolder)
                .then(fs.mkdirPromise(buildsFolder))
                .then(fs.mkdirPromise(workspaceFolder))
                .then(fs.writeFilePromise(path.join(sThis.JakeCI.config.jobPath,data.name,'config.json'), JSON.stringify(data)))
                .then(function(){
                    sThis.JakeCI.sendResponse(response,{jobName:data.name});
                }).catch(function(e){
                    console.log(e);
                    sThis.JakeCI.sendError(response,"Failed to create Job (does it already exist?)");
                });
        } else {
            sThis.JakeCI.sendError(response,'Failed to create Job (does it already exist?)');
        }
    });
};

module.exports = NewJob;