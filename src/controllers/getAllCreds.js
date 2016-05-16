function GetAllCreds(JakeCI){
    this.JakeCI = JakeCI;
}

GetAllCreds.prototype.expressRequest = function(request, response){
    this.JakeCI.models['CredEditor'].getAllCreds({
        success:this.JakeCI.sendResponse.bind(this.JakeCI,response),
        error:this.JakeCI.sendError.bind(this.JakeCI,response)
    });
};

module.exports = GetAllCreds;