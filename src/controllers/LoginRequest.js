function LoginRequest(JakeCI){
    this.JakeCI = JakeCI;
}

LoginRequest.prototype.index = function(request,response){
    this.JakeCI.models['Login'].checkLogin({
        data:request.body,
        success:function(){
            request.session.authenticated = true;
            this.JakeCI.sendResponse(response,{});
        },
        scope:this
    });
};

module.exports = LoginRequest;