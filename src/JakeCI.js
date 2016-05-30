function Jake(){
    //Debug messages, ahoy!
    this.debugMode = true;

    //Load Helper functions. These are all synchronous. But shouldn't take very long :)
    var Functions = require('./Functions');
    this.functions = new Functions(this);

    //Standard Libraries are now baked into the core.
    this.fs = require("fs");
    this.path = require('path');
    this.Promise = require("bluebird");
    this.rmdir = require('rimraf');
    this.nodemailer = require("nodemailer");

    //this.Promise.promisifyAll(this.fs); //Way too much memory
    this.fs.readdirAsync = this.Promise.promisify(this.fs.readdir);
    this.fs.mkdirAsync = this.Promise.promisify(this.fs.mkdir);
    this.fs.writeFileAsync = this.Promise.promisify(this.fs.writeFile);
    this.fs.readFileAsync = this.Promise.promisify(this.fs.readFile);
    this.fs.statAsync = this.Promise.promisify(this.fs.stat);
    this.fs.accessAsync = this.Promise.promisify(this.fs.access);
    this.fs.renameAsync = this.Promise.promisify(this.fs.rename);
    this.rmdirAsync = this.Promise.promisify(this.rmdir);

    this.config = JSON.parse(this.fs.readFileSync('./config.json','utf8'));

    //Create Settings File
    if (!this.fs.existsSync(this.config.settingsFile)){
        this.fs.writeFileSync(this.config.settingsFile,JSON.stringify({
            fromAddress:'JakeCI <JakeCI@jakesiegers.com>'
        }));
    }
    this.appSettings = JSON.parse(this.fs.readFileSync(this.config.settingsFile,'utf8'));

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

    //Loop Over Controller Folder for endpoints ~ ooh magic!
    var controllerFiles = this.fs.readdirSync('./src/controllers');
    this.controllers = {};
    for(var i=0;i<controllerFiles.length;i++){
        var fileName = controllerFiles[i];
        var controllerName = fileName.substring(0,fileName.indexOf("."));
        var cls = require('./controllers/'+controllerName);
        this.controllers[controllerName] = new cls(this);

        var controllerFunctions = Object.keys(cls.prototype);
        for(var c=0;c<controllerFunctions.length;c++){
            var endpoint = '/'+controllerName+'/'+controllerFunctions[c];
            if(controllerFunctions[c] == 'index'){
                endpoint = '/'+controllerName;
            }
            this.app.post(endpoint,this.controllers[controllerName][controllerFunctions[c]].bind(this.controllers[controllerName]));
            this.debug('Loaded Endpoint: '+endpoint);
        }

    }
    this.debug('=======================');
    //Loop Over Controller Folder for endpoints ~ ooh magic!
    var modelFiles = this.fs.readdirSync('./src/models');
    this.models = {};
    for(var i=0;i<modelFiles.length;i++){
        var modelFileName = modelFiles[i];
        var modelName = modelFileName.substring(0,modelFileName.indexOf("."));
        var modelCls = require('./models/'+modelName);
        this.models[modelName] = new modelCls(this);
        this.debug('Loaded Model: '+modelName);
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

Jake.prototype.sendEmail = function(mailOptions){
    var sThis = this;
    return new Promise(function (resolve, reject) {
        var transport = sThis.nodemailer.createTransport({
            service: 'SendGrid',
            auth: {
                user: sThis.appSettings.sendgridUsername,
                pass: sThis.appSettings.sendgridPassword
            }
        });
        /*
         var mailOptions = {
         from: 'Jake CI<JakeCI@jakesiegers.com>', // sender address
         to: 'sirtopeia@yahoo.com', // list of receivers
         subject: 'Hello ✔', // Subject line
         text: 'Hello world 🐴', // plaintext body
         html: '<b>Hello world 🐴</b>' // html body
         };
         */
        sThis.debug('Sending Email');
        transport.sendMail(mailOptions, function (error, info) {
            if (error) {
                return reject(error);
            }
            resolve('Email sent: ' + info.response);
        });
    });
};

Jake.prototype.error = function(error){
    if(error.hasOwnProperty('stack')){
        this.log('error',error.stack);
    }else {
        this.log('error', error);
    }
    process.exit(1);
};

Jake.prototype.debug = function(msg){
    if(this.debugMode){
        console.log(msg);
    }
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