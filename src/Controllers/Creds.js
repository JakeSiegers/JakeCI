function Creds(JakeCI){
    this.JakeCI = JakeCI;
}

Creds.prototype.getAllCreds = function(request,response){
    this.JakeCI.models['CredEditor'].getAllCreds({
        success:this.JakeCI.sendResponse.bind(this.JakeCI,response),
        error:this.JakeCI.sendError.bind(this.JakeCI,response)
    });
};

Creds.prototype.addCred = function(request,response){
    this.JakeCI.models['CredEditor'].addCred({
        data:request.body,
        success:this.JakeCI.sendResponse.bind(this.JakeCI,response),
        error:this.JakeCI.sendError.bind(this.JakeCI,response)
    });
};

module.exports = Creds;