const { cmd } = require("../command");

cmd(
  {
    pattern: "ping",
    desc: "Bot response speed test",
    category: "main",
    filename: __filename,
  },
  async (nethmina, mek, m, { reply, from }) => {
    // 1️⃣ React to the message
    try {
      await nethmina.sendMessage(from, { react: { text: "🏓", key: mek.key } });
    } catch (e) {
      console.log("Reaction failed:", e);
    }

    // 2️⃣ Ping response
    const start = Date.now();
    await reply("🏓 Pinging...");
    const end = Date.now();
    await reply(`🏓 Pong! Response time: *${end - start}ms*`);
  }
);

cmd({
    pattern: "speed",
    desc: "Check bot\'s ping",
    category: "main",
    use: '.ping2',
    filename: __filename
},
async(conn, mek, m,{from, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
  await nethmina.sendMessage(from, { react: { text: "🤖", key: mek.key } });
    } catch (e) {
      console.log("Reaction failed:", e);
    }
var inital = new Date().getTime();
let ping = await conn.sendMessage(from , { text: '*_🏓 Pinging..._*'  }, { quoted: mek } )
var final = new Date().getTime();
await conn.sendMessage(from, { delete: ping.key })
return await conn.sendMessage(from , { text: '*🔥 Pong!*\n *' + (final - inital) + ' ms* '  }, { quoted: mek } )
} catch (e) {
reply('*Error !!*')
l(e)
}
})

cmd({
    pattern: "ping2",
    desc: "Check bot\'s ping",
    category: "main",
    use: '.ping',
    filename: __filename
},
async(conn, mek, m,{from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
  await nethmina.sendMessage(from, { react: { text: "♻️", key: mek.key } });
    } catch (e) {
      console.log("Reaction failed:", e);
    }
const startTime = Date.now()
        const message = await conn.sendMessage(from, { text: '*_🪄 Pinging..._*' })
        const endTime = Date.now()
        const ping = endTime - startTime
        await conn.sendMessage(from, { text: `*♻️ Pong! Response speed...: : ${ping}ms*`}, { quoted: message })
    } catch (e) {
        console.log(e)
        reply(`${e}`)
    }
})
