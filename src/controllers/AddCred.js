function AddCred(JakeCI){
    this.JakeCI = JakeCI;
}

AddCred.prototype.expressRequest = function(request, response){
    this.JakeCI.models['CredEditor'].addCred({
        data:request.body,
        success:this.JakeCI.sendResponse.bind(this.JakeCI,response),
        error:this.JakeCI.sendError.bind(this.JakeCI,response)
    });
};

module.exports = AddCred;