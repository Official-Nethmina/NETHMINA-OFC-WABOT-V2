const fs = require('fs');
const path = require('path');
const { cmd } = require('../command');

// JSON file එක තියෙන තැන
const offChatsFile = path.join(__dirname, '../lib/off_voices.json');

// .offvoice Command එක
cmd({
    pattern: "offvoice",
    alias: ["voff"],
    desc: "Disable auto voice for this chat",
    category: "main",
    filename: __filename
}, async (conn, mek, m, { from, q, isOwner, reply }) => {
    try {
        if (!isOwner) return reply("❌ ඔබට මේ සඳහා අවසර නැත.");

        const libDir = path.dirname(offChatsFile);
        if (!fs.existsSync(libDir)) fs.mkdirSync(libDir, { recursive: true });
        if (!fs.existsSync(offChatsFile)) fs.writeFileSync(offChatsFile, JSON.stringify([]));

        let target = q ? q.trim() : from;
        let offChats = JSON.parse(fs.readFileSync(offChatsFile));

        if (offChats.includes(target)) return reply("⚠️ මේ චැට් එකේ දැනටමත් Auto Voice Off කරලා තියෙන්නේ.");

        offChats.push(target);
        fs.writeFileSync(offChatsFile, JSON.stringify(offChats));
        return reply(`✅ Auto Voice Off කළා:\n${target}`);
    } catch (e) {
        reply("❌ Error: " + e.message);
    }
});

// .onvoice Command එක
cmd({
    pattern: "onvoice",
    alias: ["von"],
    desc: "Enable auto voice for this chat",
    category: "main",
    filename: __filename
}, async (conn, mek, m, { from, q, isOwner, reply }) => {
    try {
        if (!isOwner) return reply("❌ ඔබට මේ සඳහා අවසර නැත.");
        if (!fs.existsSync(offChatsFile)) return reply("⚠️ කිසිම චැට් එකක් Off කරලා නැහැ.");

        let target = q ? q.trim() : from;
        let offChats = JSON.parse(fs.readFileSync(offChatsFile));

        if (!offChats.includes(target)) return reply("⚠️ මේ චැට් එකේ Auto Voice දැනටමත් On කරලා තියෙන්නේ.");

        offChats = offChats.filter(id => id !== target);
        fs.writeFileSync(offChatsFile, JSON.stringify(offChats));
        return reply(`✅ Auto Voice On කළා:\n${target}`);
    } catch (e) {
        reply("❌ Error: " + e.message);
    }
});
