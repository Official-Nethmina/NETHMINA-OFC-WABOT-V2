const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}
module.exports = {
SESSION_ID: process.env.SESSION_ID || "nrZFQB7K#Cx77hrla67pQObs4diihuQEmvvtVvu0BAxEY3-YfrIU",
ALIVE_IMG: process.env.ALIVE_IMG || "https://github.com/Nethmina-dev/BOT-DATA/blob/main/Logo/ChatGPT%20Image%20Mar%2018,%202026,%2005_47_58%20PM.png?raw=true",
ALIVE_MSG: process.env.ALIVE_MSG || "*Hello👋 NETHMINA Is Alive Now😍*",
OWNER_NUMBER: process.env.OWNER_NUMBER || "94760860835",  // Replace with the owner's phone number
OWNER_NAME: process.env.OWNER_NAME || "Bhashitha Nethmina",
PREFIX: process.env.PREFIX || ".", 
AUTO_STATUS_SEEN: process.env.AUTO_STATUS_SEEN || "true",
AUTO_STATUS_REACT: process.env.AUTO_STATUS_REACT || "true",
ALWAYS_ONLINE: process.env.ALWAYS_ONLINE || "false",
AUTO_RECORDING: process.env.AUTO_RECORDING || "false",
AUTO_TYPING: process.env.AUTO_TYPING || "false",
AUTO_REACT: process.env.AUTO_REACT || "true", // Main Switch
OWNER_REACT: process.env.OWNER_REACT || "true", // Owner React Switch
USER_REACT: process.env.USER_REACT || "false", // User React Switch
OWNER_REACT_EMOJI: process.env.OWNER_REACT_EMOJI || "🧑🏻‍💻",
AUTO_STICKER: process.env.AUTO_STICKER || "true",
AUTO_VOICE: process.env.AUTO_VOICE || "true",
AUTO_REPLY: process.env.AUTO_REPLY || "true"// Owner's Static Emoji
    



};
