const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}
module.exports = {
SESSION_ID: process.env.SESSION_ID || "G2gU3AiL#A36TrC5UWr7TRc3f7PK6IcX7LVHx-uFHHCbnOSyIYtg",
ALIVE_IMG: process.env.ALIVE_IMG || "https://github.com/Nethmina-dev/BOT-DATA/blob/main/Logo/ChatGPT%20Image%20Mar%2018,%202026,%2005_47_58%20PM.png?raw=true",
ALIVE_MSG: process.env.ALIVE_MSG || "*Hello👋 NETHMINA Is Alive Now😍*",
OWNER_NUMBER: process.env.OWNER_NUMBER || "94760860835",  // Replace with the owner's phone number
OWNER_NAME: process.env.OWNER_NAME || "Bhashitha Nethmina",
PREFIX: process.env.PREFIX || ".", 
AUTO_STATUS_SEEN: process.env.AUTO_STATUS_SEEN || "true",
AUTO_STATUS_REACT: process.env.AUTO_STATUS_REACT || "true",
ALWAYS_ONLINE: process.env.ALWAYS_ONLINE || "false",
AUTO_RECORDING: process.env.AUTO_RECORDING || "true",
AUTO_TYPING: process.env.AUTO_TYPING || "false",
AUTO_VOICE: process.env.AUTO_VOICE || "true",
    



};
