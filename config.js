const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}
module.exports = {
SESSION_ID: process.env.SESSION_ID || "SroQxKoT#J6Z1PjKO6PyY24KNEw5nu2Bb-FXSf-JQ3vY7Md_H4Mg",
ALIVE_IMG: process.env.ALIVE_IMG || "https://github.com/Nethmina-dev/BOT-DATA/blob/main/Logo/ChatGPT%20Image%20Mar%2018,%202026,%2005_47_58%20PM.png?raw=true",
OWNER_NUMBER: process.env.OWNER_NUMBER || "94760860835",
OWNER_NAME: process.env.OWNER_NAME || "Bhashitha Nethmina",
PREFIX: process.env.PREFIX || ".", 
AUTO_STATUS_SEEN: process.env.AUTO_STATUS_SEEN || "true",
AUTO_STATUS_REACT: process.env.AUTO_STATUS_REACT || "true",
AUTO_CALL_REJECT: process.env.AUTO_CALL_REJECT || "true",
OWNER_REACT: process.env.OWNER_REACT || "false",


};
