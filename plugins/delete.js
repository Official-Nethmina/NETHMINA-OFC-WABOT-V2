const { cmd } = require('../command');

cmd({
    pattern: "delete",
    alias: ["del"],
    desc: "Delete for everyone and auto-remove command.",
    category: "group",
    use: '.del (reply to a message)',
    filename: __filename
},
async (conn, mek, m, { from, quoted, isOwner, isAdmins, isBotAdmins, reply }) => {
    try {
        // 1. Permissions Check (අයිතිකරු හෝ ඇඩ්මින් ද කියා බැලීම)
        if (!isOwner && !isAdmins) return; 

        // 2. Quoted Check (මැසේජ් එකකට රිප්ලයි කර ඇත්දැයි බැලීම)
        if (!quoted) return reply("❌ Please reply to the message you want to delete.");

        // 3. Bot Admin Check (වෙනත් අයගේ මැසේජ් මැකීමට බොට් ඇඩ්මින් විය යුතුය)
        if (!quoted.fromMe && !isBotAdmins) {
            return reply("❌ I need to be an *Admin* to delete messages for everyone.");
        }

        // 4. Reaction එක ලබා දීම (මැකීමට පෙර)
        await conn.sendMessage(from, { react: { text: '🗑', key: mek.key } }).catch(() => null);

        // 5. Target Message එක Delete කිරීම (Delete for Everyone)
        const targetKey = {
            remoteJid: from,
            fromMe: quoted.fromMe,
            id: quoted.id,
            participant: quoted.sender
        };
        await conn.sendMessage(from, { delete: targetKey });

        // 6. ඔයාගේ .del කමාන්ඩ් එකත් මැකීම (Auto-Cleanup)
        // තත්පර 1ක පොඩි වෙලාවක් ලබා දෙනවා reaction එක පෙනෙන්නට
        setTimeout(async () => {
            await conn.sendMessage(from, { delete: mek.key });
        }, 1000);

    } catch (e) {
        console.error("Delete Error:", e);
    }
});
