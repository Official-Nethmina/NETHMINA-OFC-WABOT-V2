const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}
module.exports = {
SESSION_ID: process.env.SESSION_ID || "Oiw2iLbC#nvfW0jU6R0d7z38SS2OkJ_z639nwzV6MpTeLEcM7-OI",
ALIVE_IMG: process.env.ALIVE_IMG || "https://github.com/Nethmina-dev/BOT-DATA/blob/main/Logo/ChatGPT%20Image%20Mar%2018,%202026,%2005_47_58%20PM.png?raw=true",
ALIVE_MSG: process.env.ALIVE_MSG || "*Hello👋 NETHMINA Is Alive Now😍*",
BOT_OWNER: '94701332157',  // Replace with the owner's phone number
GEMINI_API_KEY: process.env.GEMINI_API_KEY || "AIzaSyBtWgE7I3XGcYs105ygHinSr0pLSo8PXgw",



};
