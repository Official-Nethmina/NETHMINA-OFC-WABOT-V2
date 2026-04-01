const config = require('../config');
let fs = require('fs');
const { cmd } = require('../command');

cmd({
    pattern: "speed",
    desc: "Check bot's ping",
    category: "main",
    use: '.ping2',
    filename: __filename
},
async(conn, mek, m, { from, quoted, reply }) => {
    try {
        // 1️⃣ React to the command
        try {
            await conn.sendMessage(from, { react: { text: "🤖", key: mek.key } });
        } catch(e) {
            console.log("Reaction failed:", e);
        }

        // 2️⃣ Send initial ping message
        const start = Date.now();
        const pingMsg = await conn.sendMessage(from, { text: '*_🏓 Pinging..._*' });
        const end = Date.now();

        // 3️⃣ Delete the initial ping message
        await conn.sendMessage(from, { delete: pingMsg.key });

        // 4️⃣ Send final pong message
        await conn.sendMessage(from, { text: `*🔥 Pong!*\n *${end - start} ms*` }, { quoted: mek });
    } catch (e) {
        console.log(e);
        reply('*Error !!*');
    }
});

cmd({
    pattern: "ping2",
    desc: "Check bot's ping",
    category: "main",
    use: '.ping',
    filename: __filename
},
async(conn, mek, m, { from, quoted, reply }) => {
    try {
        // 1️⃣ React to the command
        try {
            await conn.sendMessage(from, { react: { text: "♻️", key: mek.key } });
        } catch(e) {
            console.log("Reaction failed:", e);
        }

        // 2️⃣ Send initial ping message
        const startTime = Date.now();
        const pingMsg = await conn.sendMessage(from, { text: '*_🪄 Pinging..._*' });
        const endTime = Date.now();
        const ping = endTime - startTime;

        // 3️⃣ Edit previous message with final ping (Baileys v5)
        await conn.sendMessage(from, { text: `*♻️ Pong! Response speed: ${ping}ms*` }, { edit: pingMsg.key });
    } catch (e) {
        console.log(e);
        reply(`${e}`);
    }
});
