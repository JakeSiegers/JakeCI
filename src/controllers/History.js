function History(JakeCI){
    this.JakeCI = JakeCI;
}

History.prototype.getAllHistoryForJob = function(request,response){
    this.JakeCI.models['BuildHistory'].getBuildHistory({
        data:request.body,
        success:this.JakeCI.sendResponse.bind(this.JakeCI,response),
        error:this.JakeCI.sendError.bind(this.JakeCI,response)
    });
};

module.exports = History;