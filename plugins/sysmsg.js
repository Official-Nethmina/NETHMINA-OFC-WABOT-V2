const { cmd } = require('../command');

cmd({
    pattern: "sysmsg",
    alias: ["systemmsg", "spoofsys", "sm"],
    react: "🦹‍♂️",
    desc: "Create a fake WhatsApp system/stub notification message.",
    category: "cheat",
    use: '.sysmsg [Your Text]',
    filename: __filename
},
async (nethmina, mek, msg, { from, q, isGroup, reply }) => {
    try {
        if (!isGroup) return await reply("❌ This command can only be used in groups.");
        if (!q) return await reply("❌ *Format:* `.sysmsg [බොරුවට දාන්න ඕන නිවේදනය]`\n\n*Example:* `.sysmsg WhatsApp Security update: Please send 1000 LKR to Bot Owner to avoid account ban!`");

        const targetText = q.trim();

        // 🔥 [CHEAT SYSTEM] වට්ස්ඇප් එක රැවටීමට Fake System Message එකක් සැකසීම
        // මෙහි stubType 21 (Group Subject Change) වැනි එකක් දමා, stubParameters වලට අපේ Text එක දෙනවා
        const fakeSystemNotification = {
            key: {
                remoteJid: from,
                fromMe: false, // බොට්ගෙන් ආපු එකක් නොවන බව පෙන්වීමට
                id: "SYS" + Math.random().toString(36).substring(2, 10).toUpperCase(),
                participant: "0@s.whatsapp.net" // WhatsApp Official System ID එක
            },
            messageStubType: 21, // Protocol stub type for group action
            messageStubParameters: [targetText], // අපේ Text එක මෙතනට දානවා
            participant: "0@s.whatsapp.net"
        };

        // 📤 ව්‍යාජ සිස්ටම් නිවේදනය ගෲප් එකට එවීම
        return await nethmina.sendMessage(from, fakeSystemNotification);

    } catch (e) {
        console.error("System Message Spoof Error:", e);
        reply(`❌ *Error Occurred !!*\n\n${e.message || e}`);
    }
});
