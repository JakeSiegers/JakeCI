var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp'); //A better folder creator.


function NewJob(JakeCI){
    this.JakeCI = JakeCI;
}

NewJob.prototype.test = function(){
    console.log("welcome to fun zone");
}

NewJob.prototype.expressRequest = function(request, response){

    //console.log(request.body);

    var errors = this.JakeCI.functions.verifyRequiredPostFields(request.body,['name']);
    if(errors !== ''){
        this.JakeCI.sendError(response,errors);
        return;
    }
    var data = request.body;

    var sThis = this;
    var newJobFolder = path.join(this.JakeCI.config.jobPath,data.name);
    console.log(newJobFolder);
    fs.stat(newJobFolder, function(err, stats) {
        //Check if error defined and the error code is "not exists"
        if (err && err.errno === 34) {
            mkdirp(newJobFolder,sThis.folderMade.bind(sThis,data,response));
        } else {
            sThis.JakeCI.sendError(response,'Failed to create Job Folder (does it already exist?');
        }
    });


};

NewJob.prototype.folderMade = function(data,response,error){
    if(error){
        this.JakeCI.sendError(response,'Failed to create Job Folder');
        return false;
    }

    console.log('writing config.json file');

    fs.writeFile(
        path.join(this.JakeCI.config.jobPath,data.name,'config.json'),
        JSON.stringify(data),
        this.configFileWritten.bind(this,data,response)
    );
};

NewJob.prototype.configFileWritten = function(data,response,error){
    if(error){
        this.JakeCI.sendError(response,'Failed to create and write to config.json');
        return false;
    }

    this.JakeCI.sendResponse(response,{jobName:data.name});
};

module.exports = NewJob;