function Jake(){

    //These will go away soon. And become controllers.
    var JobEditor = require('./JobEditor.js');
    var Functions = require('./Functions');

    this.jobEditor = new JobEditor(this);
    this.functions = new Functions(this);

    //Standard Libraries are now baked into the core.
    this.fs = require("fs");
    this.path = require('path');
    this.Promise = require("bluebird");
    this.Promise.promisifyAll(this.fs); //Way too much memory
    //this.fs.mkdirAsync = this.Promise.promisify(this.fs.mkdir);
    //this.fs.writeFileAsync = this.Promise.promisify(this.fs.writeFile);


    if (!this.fs.existsSync('./src/config.js')) {
        throw "No config file found.";
    }
    this.config = require('./config');

    //Create Cred File
    if (!this.fs.existsSync(this.config.credFile)){
        this.fs.writeFileSync(this.config.credFile,'{}');
    }

    //Create Job Directory
    if (!this.fs.existsSync(this.config.jobPath)){
        this.fs.mkdirSync(this.config.jobPath);
    }
    this.initExpress();
}

Jake.prototype.initExpress = function () {
    var Express = require('express');
    this.app = Express();

    var BodyParser = require('body-parser');

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
    this.app.post('/getJob',this.getJob.bind(this));
    this.app.post('/saveJob',this.saveJob.bind(this));

    //Loop Over Controller Folder for endpoints ~ ooh magic!
    var controllerFiles = this.fs.readdirSync('./src/controllers');
    this.controllers = {};
    for(var i=0;i<controllerFiles.length;i++){
        var fileName = controllerFiles[i];
        var controllerName = fileName.substring(0,fileName.indexOf("."));
        var cls = require('./controllers/'+controllerName);
        this.controllers[controllerName] = new cls(this);
        this.app.post('/'+controllerName,this.controllers[controllerName].expressRequest.bind(this.controllers[controllerName]));

        /*
        //Maybe add support for calling methods from the router?
        this.app.get('/'+controllerName+'/:method',function(request,response){

        });
        */
    }

    //Loop Over Controller Folder for endpoints ~ ooh magic!
    var modelFiles = this.fs.readdirSync('./src/models');
    this.models = {};
    for(var i=0;i<modelFiles.length;i++){
        var modelFileName = modelFiles[i];
        var modelName = modelFileName.substring(0,modelFileName.indexOf("."));
        var modelCls = require('./models/'+modelName);
        this.models[modelName] = new modelCls(this);
    }

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
    var jobs = this.jobEditor.getAllJobs();
    
    response.send(JSON.stringify({
        success:true,
        jobs:this.convertJobObjectArrayIntoRawArray(jobs)
    }));
};

Jake.prototype.getJob = function(request, response){
    var errors = this.functions.verifyRequiredPostFields(request.body,['job']);
    if(errors !== ''){
        response.send(JSON.stringify({
            success: false,
            error: errors
        }));
        return;
    }

    var job = request.body.job;

    this.jobEditor.getJob(job,this.sendResponse.bind(this,response));
};

Jake.prototype.saveJob = function(request, response){

    var errors = this.functions.verifyRequiredPostFields(request.body,['job','data']);
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

    this.jobEditor.saveJob(job,data,this.sendResponse.bind(this,response));
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