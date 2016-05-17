function GetSettings(JakeCI){
    this.JakeCI = JakeCI;
}

GetSettings.prototype.expressRequest = function(request, response){
    this.JakeCI.models['SettingsEditor'].getAllSettings({
        success:this.JakeCI.sendResponse.bind(this.JakeCI,response),
        error:this.JakeCI.sendError.bind(this.JakeCI,response)
    });
};

module.exports = GetSettings;