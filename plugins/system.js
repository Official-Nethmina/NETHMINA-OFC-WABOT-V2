const config = require('../config')
const {cmd , commands} = require('../command')
const os = require("os")
const {runtime} = require('../lib/functions')
cmd({
    pattern: "system",
    desc: "check bot uptime",
    category: "main",
    filename: __filename
},
async(conn, mek, m,{from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
  
  try {
            await conn.sendMessage(from, { react: { text: "♠️", key: mek.key } });
        } catch (e) {
            console.log("Reaction failed:", e);
        }

let status = `┌──────────────────────────
├ *⏰ Uptime:* ${runtime(process.uptime())}
├ *📟 Ram usage:* ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB / ${Math.round(require('os').totalmem / 1024 / 1024)}MB
├ *⚙️ HostName:* ${os.hostname()}
├ *👨‍💻 Owner:* Nethmina OFC ( Bhashitha Nethmina )
└──────────────────────────
> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴᴇᴛʜᴍɪɴᴀ ᴏꜰᴄ ||
`
await conn.sendMessage(from,{image:{url:config.ALIVE_IMG},caption:`${status}`},{quoted:mek})

}catch(e){
console.log(e)
reply(`${e}`)
}
})
