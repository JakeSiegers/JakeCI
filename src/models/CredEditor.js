function CredEditor(JakeCI){
    this.JakeCI = JakeCI;
}

CredEditor.prototype.addCred = function(params){
    var errors = this.JakeCI.functions.verifyRequiredPostFields(params.data,['cred','username','password']);
    if(errors !== ''){
        params.error(errors);
        return;
    }

    sThis = this;
    this.JakeCI.fs.readFileAsync(this.JakeCI.config.credFile,'utf8')
        .then(function(currentCreds) {
            currentCreds = JSON.parse(currentCreds);
            if(currentCreds.hasOwnProperty(params.data.cred)){
                throw 'Cred Already Exists'
            }
            currentCreds[params.data.cred] = params.data;
            return sThis.JakeCI.fs.writeFileAsync(sThis.JakeCI.config.credFile,JSON.stringify(currentCreds),'utf8');
        }).then(function(){
            params.success('Added Cred');
        }).catch(function(e){
            params.error(e);
        });

};

CredEditor.prototype.getAllCreds = function(){
    sThis = this;
    this.JakeCI.fs.readFileAsync(this.JakeCI.config.credFile,'utf8')
        .then(function(currentCreds) {
            currentCreds = JSON.parse(currentCreds);
            var credKeys = Object.keys(currentCreds);
            for(var i=0;i<credKeys.length;i++){

            }
        }).catch(function(e){
            params.error(e);
        });
};
module.exports = CredEditor;