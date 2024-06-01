const axios = require("axios");
require("dotenv").config();

const authorisationToAccessToken = async (token) =>{
    if(typeof token !== 'string'){
        return null;
    }
    try{
        const response = await axios.post("https://oauth2.googleapis.com/token", {
            code: token,
            client_id: process.env.oauth_client_id,
            redirect_uri: "http://localhost/oauth",
            grant_type: "authorization_code"
        });
        return response.data;
    }catch(err){
        console.warn(err);
        return null;
    }
};

module.exports = authorisationToAccessToken;