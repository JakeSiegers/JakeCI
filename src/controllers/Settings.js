function Settings(JakeCI){
    this.JakeCI = JakeCI;
}

Settings.prototype.getAllSettings = function(request, response){
    this.JakeCI.models['SettingsEditor'].getAllSettings({
        success:this.JakeCI.sendResponse.bind(this.JakeCI,response),
        error:this.JakeCI.sendError.bind(this.JakeCI,response)
    });
};

Settings.prototype.saveSettings = function(request, response){
    this.JakeCI.models['SettingsEditor'].saveSettings({
        data:request.body,
        success:this.JakeCI.sendResponse.bind(this.JakeCI,response),
        error:this.JakeCI.sendError.bind(this.JakeCI,response)
    });
};

module.exports = Settings;