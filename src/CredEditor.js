function CredEditor(JakeCI){
    this.JakeCI = JakeCI;
}

CredEditor.prototype.addCred = function(request, response){
    this.JakeCI.sendResponse(response,"Added Cred");
};

module.exports = CredEditor;