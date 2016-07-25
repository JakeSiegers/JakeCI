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
                    creds[i].name,
                    creds[i].username,
                    creds[i].password
                ]);
            }
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
        success:function(newCredName) {
            this.JakeCI.sendResponse(response,{newCredName:newCredName});
        },
        scope:this
    });
};

Creds.prototype.getCred = function(request,response){
    this.JakeCI.models['CredEditor'].getCred({
        data:request.body,
        success:function(cred) {
            this.JakeCI.sendResponse(response,{data:cred});
        },
        scope:this
    });
};

Creds.prototype.updateCred = function(request,response){
    this.JakeCI.models['CredEditor'].updateCred({
        data:request.body,
        success:function(updatedCredName){
            this.JakeCI.sendResponse(response,{updatedCredName:updatedCredName});
        },
        scope:this
    });
};

module.exports = Creds;