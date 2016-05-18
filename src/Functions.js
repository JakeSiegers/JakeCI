
function Functions(JakeCI){
    this.JakeCI = JakeCI;
}

Functions.prototype.verifyRequiredPostFields = function(post, expected){
    var errors = "";
    var foundPost = Object.keys(post);
    for(var i=0;i<expected.length;i++){
        if(foundPost.indexOf(expected[i]) == -1 || post[expected[i]].length == 0){
            errors += expected[i]+" is required<br />";
        }
    }
    return errors;
};

Functions.prototype.commandParser = function(message) {
    var params = message.match(/'([^']*)'|"([^"]*)"|(\S+)/g) || [];
    for(var i=0;i<params.length;i++){
        params[i] = params[i].replace(/"/g, "");
    }
    return params;
};

module.exports = Functions;