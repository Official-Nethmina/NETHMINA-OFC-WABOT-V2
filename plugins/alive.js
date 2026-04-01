const {cmd , commands} = require('../command')
const config = require('../config');

cmd({
    pattern: "alive",
    alias: ["bot","robo","robot"],
    react: "🎃",
    desc: "Check bot online or no.",
    category: "main",
    filename: __filename
},
async(nethmina, mek, m,{from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
await nethmina.sendPresenceUpdate('recording', from);
await nethmina.sendMessage(from, { audio: { url: "https://github.com/Nethmina-dev/BOT-DATA/raw/refs/heads/main/Voice-notes/alive.opus" }, mimetype: 'audio/opus', ptt: true }, { quoted: mek });
return await nethmina.sendMessage(from,{image: {url: config.ALIVE_IMG},caption: config.ALIVE_MSG},{quoted: mek})
    
}catch(e){
console.log(e)
reply(`${e}`)
}
})

