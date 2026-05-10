const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}
module.exports = {
SESSION_ID: process.env.SESSION_ID || "2iJiySDb#0qdDsW__t1xQOSTMKeigudoetmKsnTSTyHSqSWgtOv0",
ALIVE_IMG: process.env.ALIVE_IMG || "https://ibb.co/7dxSbB6T",
OWNER_NUMBER: process.env.OWNER_NUMBER || "94760860835",
OWNER_NAME: process.env.OWNER_NAME || "Bhashitha Nethmina",
PREFIX: process.env.PREFIX || ".", 
AUTO_STATUS_SEEN: process.env.AUTO_STATUS_SEEN || "true",
AUTO_STATUS_REACT: process.env.AUTO_STATUS_REACT || "true",
AUTO_CALL_REJECT: process.env.AUTO_CALL_REJECT || "true",
OWNER_REACT: process.env.OWNER_REACT || "false",
FORWARD_STATUS: process.env.FORWARD_STATUS || "false",


};
