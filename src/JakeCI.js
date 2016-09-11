function Jake(){
    //Debug messages, ahoy!
    this.debugMode = true;

    this.Express = require('express');

    //Load Helper functions. These are all synchronous. But shouldn't take very long :)
    var Functions = require('./Functions');
    this.functions = new Functions(this);

    //Standard Libraries are now baked into the core.
    this.fs = require("fs");
    this.path = require('path');
    this.Promise = require("bluebird");
    this.rmdir = require('rimraf');
    this.nodemailer = require("nodemailer");
    this.uuid = require("node-uuid");

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
            fromAddress:'JakeCI <JakeCI@jakesiegers.com>',
            activeJobLimit:2
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

Jake.prototype.checkLogin = function(request, response, next){
    this.debug(request.url);
    if(request.url == '/LoginRequest' || (request.session && request.session.authenticated)){
        next();
        return;
    }
    response.redirect('/login?url='+encodeURIComponent(request.url));
};

Jake.prototype.initExpress = function () {

    this.app = this.Express();

    var BodyParser = require('body-parser');
    var Session = require('express-session');

    //Cookies reset on each server restart
    //TODO: perhaps make this use a secret cookie file, or pull something from the config so we don't have to kill sessions every restart.
    this.app.use(Session({
        secret: this.uuid.v4(),
        resave: true,
        saveUninitialized: false,
        rolling: true, //Reset session on each request (Basically idle check)
        name:'JakeCI Login',
        cookie:{
            maxAge: 1000*60*60*3, //3 Hours
        }
    }));

    //to support JSON-encoded bodies
    this.app.use(BodyParser.json());
    //to support URL-encoded bodies
    this.app.use(BodyParser.urlencoded({
        extended: true
    }));

    //All users can use this route
    this.app.use('/login',this.Express.static(__dirname + '/../www/Login'));
    //Only /LoginRequest controller and authenticated users get past this check
    this.app.use(this.checkLogin.bind(this));
    this.app.use('/',this.Express.static(__dirname + '/../www/JakeCI'));

    //Loop Over Controller Folder for endpoints ~ ooh magic!
    this.debug('=======================');
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
    this.debug('=======================');

    //Error Handling (Last route)
    var sThis = this;
    this.app.use(function(error, request, response, next) {
        sThis.sendError(response,error);
    });

    var port = 3000;
    this.app.listen(port);
    this.log('info','Listening on port '+port+'...');
};

Jake.prototype.sendError = function(response, error){
    console.error(error);
    response.send(JSON.stringify({
        success: false,
        error: error.toString()
    }));
};

Jake.prototype.sendResponse = function(response, data){
    data.success = true;
    response.send(JSON.stringify(data));
};

Jake.prototype.sendEmail = function(mailOptions){
    var sThis = this;
    return new Promise(function (resolve, reject) {
        if(!sThis.appSettings.hasOwnProperty('sendEmail')){
            resolve("[Email Is Disabled]");
            return;
        }

        var transport = sThis.nodemailer.createTransport({
            host: sThis.appSettings.smtpHost,
            port: sThis.appSettings.smtpPort,
            secure: (sThis.appSettings.smtpUseSSL == 1), // use SSL
            auth: {
                user: sThis.appSettings.smtpUsername,
                pass: sThis.appSettings.smtpPassword
            }
        });
        sThis.debug('Sending Email');
        transport.sendMail(mailOptions, function (error, info) {
            if (error) {
                reject(error);
                return;
            }
            var emailOutput = 'Email sent: ' + info.response;
            sThis.debug(emailOutput);
            resolve(emailOutput);
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