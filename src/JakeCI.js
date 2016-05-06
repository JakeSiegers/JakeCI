var Express = require('express');
var BodyParser = require('body-parser');
var JobReader = require('./JobReader.js');
var JobRunner = require('./JobRunner');
var fs = require("fs");


function Jake(){
    this.jobReader = new JobReader(this);
    this.jobRunner = new JobRunner(this);
    this.config = require('./config');

    if (!fs.existsSync(this.config.jobPath)){
        fs.mkdirSync(this.config.jobPath);
    }
    this.initExpress();
}

Jake.prototype.initExpress = function () {
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
    this.app.post('/saveJob',this.saveJob.bind(this));
    this.app.post('/runJobManually',this.runJobManually.bind(this));


    var port = 3000;
    this.app.listen(port);
    this.log('info','Listening on port '+port+'...');

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
};

Jake.prototype.getAllJobs = function(request, response){
    var jobs = this.jobReader.getAllJobs();
    
    response.send(JSON.stringify({
        success:true,
        jobs:this.convertJobObjectArrayIntoRawArray(jobs)
    }));
};

Jake.prototype.getJob = function(request, response){
    var errors = this.verifyRequiredPostFields(request.body,['job']);
    if(errors !== ''){
        response.send(JSON.stringify({
            success: false,
            error: errors
        }));
        return;
    }

    var job = request.body.job;

    this.jobReader.getJob(job,this.sendResponse.bind(this,response));
};

Jake.prototype.saveJob = function(request, response){

    var errors = this.verifyRequiredPostFields(request.body,['job','data']);
    if(errors !== ''){
        this.sendError(response,errors);
        return;
    }

    var job = request.body.job;
    var data = "";
    try {
        data = JSON.parse(request.body.data);
    }catch(e){
        this.sendError(response,"Bad Form Data");
        return;
    }

    if(/[^a-zA-Z0-9 ]/.test(data.name) || data.name.length > 20){
        this.sendError(response,"Job Name Must Be less than <= 20 characters and only contain alpha-numeric characters, plus spaces and dashes.");
        return;
    }

    this.jobReader.saveJob(job,data,this.sendResponse.bind(this,response));
};

Jake.prototype.runJobManually = function(request, response){
    var errors = this.verifyRequiredPostFields(request.body,['job']);
    if(errors !== ''){
        this.sendError(response,errors);
        return;
    }
    var job = request.body.job;
    this.jobRunner.runJobManually(job,this.sendResponse.bind(this,response));
};

Jake.prototype.sendError = function(response, error){
    response.send(JSON.stringify({
        success: false,
        error: error
    }));
};

Jake.prototype.sendResponse = function(response, data){
    response.send(JSON.stringify({
        success: true,
        data: data
    }));
};

Jake.prototype.addNewJob = function(request, response){
    /*
    console.log();
    var errors = this.verifyRequiredPostFields(request.body,["name","useCron","useDefaultEmail"]);
    if(errors.length > 0){
        response.send(JSON.stringify({success:false,error:errors}));
    }
    this.jobReader.addJob(request.body);
    var jobs = this.jobReader.getAllJobs();
    response.send(JSON.stringify({
        success:true,
        jobs:this.convertJobObjectIntoRawArray(jobs)
    }));
    */
};

Jake.prototype.convertJobObjectArrayIntoRawArray = function(jobs){
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

Jake.prototype.verifyRequiredPostFields = function(post, expected){
    var errors = "";
    var foundPost = Object.keys(post);
    for(var i=0;i<expected.length;i++){
        if(foundPost.indexOf(expected[i]) == -1 || post[expected[i]].length == 0){
            errors += expected[i]+" is required<br />";
        }
    }
    return errors;
};

Jake.prototype.error = function(error){
    if(error.hasOwnProperty('stack')){
        this.log('error',error.stack);
    }else {
        this.log('error', error);
    }
    process.exit(1);
};

Jake.prototype.log = function(type, msg){
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

module.exports = Jake;