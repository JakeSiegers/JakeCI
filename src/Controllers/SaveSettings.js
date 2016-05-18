function SaveSettings(JakeCI){
    this.JakeCI = JakeCI;
}

SaveSettings.prototype.expressRequest = function(request, response){
    this.JakeCI.models['SettingsEditor'].saveSettings({
        data:request.body,
        success:this.JakeCI.sendResponse.bind(this.JakeCI,response),
        error:this.JakeCI.sendError.bind(this.JakeCI,response)
    });
};

module.exports = SaveSettings;