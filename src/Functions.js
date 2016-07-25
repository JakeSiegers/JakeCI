
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
    if(errors.length > 0){
        throw new Error(errors);
    }
};

Functions.prototype.commandParser = function(message) {
    var params = message.match(/'([^']*)'|"([^"]*)"|(\S+)/g) || [];
    for(var i=0;i<params.length;i++){
        params[i] = params[i].replace(/"/g, "");
    }
    return params;
};

Functions.prototype.getDateTime = function(){

    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return year + "-" + month + "-" + day + " " + hour + ":" + min + ":" + sec;

};

module.exports = Functions;