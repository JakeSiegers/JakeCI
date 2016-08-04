function Login(JakeCI){
    this.JakeCI = JakeCI;
    this.ipBans = {};
}

Login.prototype.checkLogin = function(params){
    this.JakeCI.functions.verifyRequiredPostFields(params.data,['email','password']);

    if(params.data.email = 'test' && params.data.password == 'test'){
        params.success.call(params.scope);
        return;
    }

    throw new Error("Login Failed");
};

module.exports = Login;