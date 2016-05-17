function SettingsEditor(JakeCI){
    this.JakeCI = JakeCI;
}

SettingsEditor.prototype.getAllSettings = function(params){
    this.JakeCI.fs.readFileAsync(this.JakeCI.config.settingsFile,'utf8')
        .then(function(currentSettings) {
            currentSettings = JSON.parse(currentSettings);
            params.success(currentSettings);
        }).catch(function(e){
        params.error(e);
    });
};

module.exports = SettingsEditor;