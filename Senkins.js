var Express = require('express');
var BodyParser = require('body-parser');
var Chalk = require('chalk');
var SenkinsModel = require('./SenkinsModel.js');



function Senkins(){
    this.model = new SenkinsModel();
    this.initExpress();
}

Senkins.prototype.initExpress = function () {
    this.app = Express();

    this.app.use( BodyParser.json() );       // to support JSON-encoded bodies
    this.app.use(BodyParser.urlencoded({     // to support URL-encoded bodies
        extended: true
    }));

    this.app.use('/', Express.static(__dirname + '/www'));

    this.app.post('/getAllJobs',this.getAllJobs.bind(this));
    this.app.post('/addNewJob',this.addNewJob.bind(this));

    /*
    this.app.get('/getJobInfo', function(request, response) {
        response.send({id:request.params.id, name: "The Name", description: "description"});
    });
    */
    this.app.listen(3000);
    this.log('info','Listening on port 3000...');
};



Senkins.prototype.getAllJobs = function(request, response){
    var jobs = this.model.getAllJobs();

    console.log(jobs);

    response.send(JSON.stringify({
        success:true,
        jobs:this.convertJobObjectIntoRawArray(jobs)
    }));
};

Senkins.prototype.addNewJob = function(request,response){
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
};

Senkins.prototype.getAllJobs = function(request, response){
    var jobs = this.model.getAllJobs();
    response.send(JSON.stringify({success:true,jobs:jobs}));
};

Senkins.prototype.convertJobObjectIntoRawArray = function(jobs){
    var allJobs = [];
    for(var jobName in jobs) {
        allJobs.push(jobs[jobName]);
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
    this.log('error',error.stack);
    process.exit(1);
};

Senkins.prototype.log = function(type,msg){
    switch(type){
        case 'info':
            console.log(Chalk.cyan(msg));
            break;
        case 'warning':
            console.log(Chalk.yellow(msg));
            break;
        case 'success':
            console.log(Chalk.green(msg));
            break;
        case 'error':
            console.log(Chalk.red(msg));
            break;
    }
};

module.exports = Senkins;