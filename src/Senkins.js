var Express = require('express');
var BodyParser = require('body-parser');
var SenkinsModel = require('./SenkinsModel.js');
var fs = require("fs");
var config = require('./config');

function Senkins(){
    this.model = new SenkinsModel();
    if (!fs.existsSync(config.jobPath)){
        fs.mkdirSync(config.jobPath);
    }
    this.initExpress();
}

Senkins.prototype.initExpress = function () {
    this.app = Express();

    //to support JSON-encoded bodies
    this.app.use(BodyParser.json());
    //to support URL-encoded bodies
    this.app.use(BodyParser.urlencoded({
        extended: true
    }));

    //Web Accessible Directory
    this.app.use('/',Express.static(__dirname + '/../www'));

    //Post Endpoints
    this.app.post('/getAllJobs',this.getAllJobs.bind(this));
    this.app.post('/addNewJob',this.addNewJob.bind(this));
    this.app.post('/getJob',this.getJob.bind(this));

    /*
    //Error Handling
    var sThis = this;
    this.app.use(function(error, request, response, next) {
        response.status(500).send(
            JSON.stringify({
                success: false,
                error: 'Server Error!'
            })
        );

        sThis.error(error);
    });
    */

    var port = 3000;
    this.app.listen(port);
    this.log('info','Listening on port '+port+'...');
};

Senkins.prototype.getAllJobs = function(request, response){
    var jobs = this.model.getAllJobs();

    response.send(JSON.stringify({
        success:true,
        jobs:this.convertJobObjectArrayIntoRawArray(jobs)
    }));
};

Senkins.prototype.getJob = function(request, response){
    var errors = this.verifyRequiredPostFields(request.body,['job']);
    if(errors !== ''){
        response.send(JSON.stringify({
            success: false,
            data: errors
        }));
        return;
    }

    var job = request.body.job;

    this.model.getJob(job,this.sendResponse.bind(this,response));
};

Senkins.prototype.sendResponse = function(response,data){
    response.send(JSON.stringify({
        success: true,
        data: data
    }));
};

Senkins.prototype.addNewJob = function(request,response){
    /*
    console.log();
    var errors = this.verifyRequiredPostFields(request.body,["name","useCron","useDefaultEmail"]);
    if(errors.length > 0){
        response.send(JSON.stringify({success:false,error:errors}));
    }
    this.model.addJob(request.body);
    var jobs = this.model.getAllJobs();
    response.send(JSON.stringify({
        success:true,
        jobs:this.convertJobObjectIntoRawArray(jobs)
    }));
    */
};

Senkins.prototype.convertJobObjectArrayIntoRawArray = function(jobs){
    var allJobs = [];
    for(var i=0;i<jobs.length;i++){
        var job = [];
        for(var jobKey in jobs[i]) {
            job.push(jobs[i][jobKey]);
        }
        allJobs.push(job);
    }
    return allJobs;
};

Senkins.prototype.verifyRequiredPostFields = function(post,expected){
    var errors = "";
    var foundPost = Object.keys(post);
    for(var i=0;i<expected.length;i++){
        if(foundPost.indexOf(expected[i]) == -1 || post[expected[i]].length == 0){
            errors += expected[i]+" is required<br />";
        }
    }
    return errors;
};

Senkins.prototype.error = function(error){
    if(error.hasOwnProperty('stack')){
        this.log('error',error.stack);
    }else {
        this.log('error', error);
    }
    process.exit(1);
};

Senkins.prototype.log = function(type,msg){
    switch(type){
        case 'info':
            console.log(msg);
            break;
        case 'warning':
            console.warn(msg);
            break;
        case 'error':
            console.error(msg);
            break;
    }
};

module.exports = Senkins;