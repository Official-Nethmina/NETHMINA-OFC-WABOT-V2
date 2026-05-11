const fs = require('fs');
const path = require('path');
const offChatsFile = path.join(__dirname, '../lib/off_voices.json');

module.exports = {
    pattern: "offvoice",
    alias: ["voiceoff"],
    function: async (conn, mek, m, { from, q, isOwner, reply }) => {
        if (!isOwner) return reply("❌ ඔබට මේ සඳහා අවසර නැත.");
        
        let target = q ? q.trim() : from; // JID එක දුන්නොත් ඒක, නැත්නම් ඒ වෙලාවේ ඉන්න චැට් එක
        if (!fs.existsSync(offChatsFile)) fs.writeFileSync(offChatsFile, JSON.stringify([]));
        
        let offChats = JSON.parse(fs.readFileSync(offChatsFile));
        
        if (offChats.includes(target)) return reply("⚠️ මේ චැට් එකේ දැනටමත් Auto Voice Off කරලා තියෙන්නේ.");
        
        offChats.push(target);
        fs.writeFileSync(offChatsFile, JSON.stringify(offChats));
        
        reply(`✅ Auto Voice Off කළා: ${target}`);
    }
};

// ආපහු On කරන්න ඕන වුණොත් මේකත් පාවිච්චි කරන්න පුළුවන්
module.exports.onvoice = {
    pattern: "onvoice",
    function: async (conn, mek, m, { from, q, isOwner, reply }) => {
        if (!isOwner) return reply("❌ ඔබට මේ සඳහා අවසර නැත.");
        
        let target = q ? q.trim() : from;
        if (!fs.existsSync(offChatsFile)) return reply("⚠️ කිසිම චැට් එකක් Off කරලා නැහැ.");
        
        let offChats = JSON.parse(fs.readFileSync(offChatsFile));
        
        if (!offChats.includes(target)) return reply("⚠️ මේ චැට් එකේ Auto Voice දැනටමත් On කරලා තියෙන්නේ.");
        
        offChats = offChats.filter(id => id !== target);
        fs.writeFileSync(offChatsFile, JSON.stringify(offChats));
        
        reply(`✅ Auto Voice On කළා: ${target}`);
    }
};
