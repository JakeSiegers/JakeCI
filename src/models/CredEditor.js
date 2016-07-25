function CredEditor(JakeCI){
    this.JakeCI = JakeCI;
}

CredEditor.prototype.addCred = function(params){
    var fieldsToAdd = ['name','username','password'];

    this.JakeCI.functions.verifyRequiredPostFields(params.data,fieldsToAdd);

    var sThis = this;
    this.JakeCI.fs.readFileAsync(this.JakeCI.config.credFile,'utf8')
        .then(function(currentCreds) {
            currentCreds = JSON.parse(currentCreds);
            if(currentCreds.hasOwnProperty(params.data.name)){
                throw 'Name Already Exists'
            }
            var newCred = {};
            for(var i in fieldsToAdd){
                newCred[fieldsToAdd[i]] = params.data[fieldsToAdd[i]];
            }
            currentCreds[params.data.name] = newCred;
            return sThis.JakeCI.fs.writeFileAsync(sThis.JakeCI.config.credFile,JSON.stringify(currentCreds),'utf8');
        }).then(function(){
            params.success.call(params.scope,params.data.name);
        }).catch(function(e){
            throw new Error(e);
        });

};

CredEditor.prototype.updateCred = function(params){
    //originalName used to make sure we don't overwrite sone other cred!
    var fieldsToCheck = ['originalName','name','username','password'];
    var fieldsToUpdate = ['name','username','password'];

    this.JakeCI.functions.verifyRequiredPostFields(params.data,fieldsToCheck);

    var sThis = this;
    this.JakeCI.fs.readFileAsync(this.JakeCI.config.credFile,'utf8')
        .then(function(currentCreds) {
            currentCreds = JSON.parse(currentCreds);
            if(currentCreds.hasOwnProperty(params.data.name) && params.data.name !== params.data.originalName){
                throw 'Changed Name Already In Use';
            }

            if(params.data.name !== params.data.originalName){
                delete currentCreds[params.data.originalName];
            }

            var updatedCred = {};
            for(var i in fieldsToUpdate){
                updatedCred[fieldsToUpdate[i]] = params.data[fieldsToUpdate[i]];
            }
            currentCreds[params.data.name] = updatedCred;
            return sThis.JakeCI.fs.writeFileAsync(sThis.JakeCI.config.credFile,JSON.stringify(currentCreds),'utf8');
        }).then(function(){
        params.success.call(params.scope,params.data.name);
    }).catch(function(e){
        throw new Error(e);
    });

};

CredEditor.prototype.getAllCreds = function(params){
    this.JakeCI.fs.readFileAsync(this.JakeCI.config.credFile,'utf8')
        .then(function(currentCreds) {
            currentCreds = JSON.parse(currentCreds);
            var credKeys = Object.keys(currentCreds);
            var creds = [];
            for(var i=0;i<credKeys.length;i++){
                creds.push(currentCreds[credKeys[i]]);
            }
            params.success.call(params.scope,creds);
        }).catch(function(e){
            throw new Error(e);
        });
};


CredEditor.prototype.getCred = function(params){

    this.JakeCI.functions.verifyRequiredPostFields(params.data,['name']);

    this.JakeCI.fs.readFileAsync(this.JakeCI.config.credFile,'utf8')
        .then(function(currentCreds){
            currentCreds = JSON.parse(currentCreds);

            if(!currentCreds.hasOwnProperty(params.data.name)){
                throw new Error('Cred Not Found');
            }

            params.success.call(params.scope,currentCreds[params.data.name]);
        }).catch(function(e){
            throw new Error(e);
        });
};

module.exports = CredEditor;