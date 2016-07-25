function Creds(JakeCI){
    this.JakeCI = JakeCI;
}

Creds.prototype.getCredEditorInitData = function(request,response){
    this.JakeCI.models['CredEditor'].getAllCreds({
        data:request.body,
        success:function(creds){
            var out = [];
            for(var i in creds){
                out.push([
                    creds[i].cred,
                    creds[i].username,
                    creds[i].password
                ]);
            }
            console.log(out);
            this.JakeCI.sendResponse(response,{data:out});
        },
        scope:this
    });
};

Creds.prototype.getAllCreds = function(request,response){
    this.JakeCI.models['CredEditor'].getAllCreds({
        data:request.body,
        success:function(creds){
            this.JakeCI.sendResponse(response,{data:creds});
        },
        scope:this
    });
};

Creds.prototype.addCred = function(request,response){
    this.JakeCI.models['CredEditor'].addCred({
        data:request.body,
        success:function(reply) {
            this.JakeCI.sendResponse(response,reply);
        },
        scope:this
    });
};

module.exports = Creds;