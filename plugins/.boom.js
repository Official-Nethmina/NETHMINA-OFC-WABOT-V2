const { cmd } = require('../command');

cmd({
    pattern: "boom",
    alias: ["spam", "bomb"],
    react: "💥",
    desc: "Spam text or replied media up to 1000 times safely.",
    category: "owner",
    filename: __filename
},
async (nethmina, mek, msg, { from, q, isOwner, reply }) => {
    try {
        // 🔒 Owner Check
        if (!isOwner) return await reply("❌ Only the bot owner can use this command.");

        if (!q) return await reply("❌ *Format:*\nDirect Text: `.boom [text] [count]`\nReply Media/Text: `.boom [count]`");

        let isReplyMode = false;
        let count = 0;
        let textToSpam = "";

        // රිප්ලයි කර ඇති මැසේජ් එකේ contextInfo එක ලබාගැනීම
        const contextInfo = mek.message?.extendedTextMessage?.contextInfo || 
                            mek.message?.imageMessage?.contextInfo || 
                            mek.message?.videoMessage?.contextInfo || 
                            mek.message?.audioMessage?.contextInfo || 
                            mek.message?.documentMessage?.contextInfo ||
                            mek.message?.stickerMessage?.contextInfo;

        // 🎯 රිප්ලයි මෝඩ් එකද කියා පරික්ෂා කිරීම
        if (contextInfo && contextInfo.hasQuotedMessage) {
            isReplyMode = true;
            count = parseInt(q.trim()); // රිප්ලයි එකකදී මුළු 'q' එකම count එක විදිහට ගන්නවා
        } else {
            // සාමාන්‍ย ටෙක්ස්ට් මෝඩ් එක
            const args = q.split(" ");
            if (args.length < 2) return await reply("❌ Please provide both text and count.\nExample: `.boom Hello 50`");
            
            const countStr = args[args.length - 1];
            count = parseInt(countStr);
            textToSpam = args.slice(0, -1).join(" ").trim();
        }

        // Count එක නිවැරදිද කියා පරික්ෂා කිරීම
        if (isNaN(count) || count <= 0) {
            return await reply("❌ Invalid count number! Please enter a valid number.");
        }

        // 🛡️ ANTI-BAN MAX LIMIT: 1000
        if (count > 1000) {
            return await reply("⚠️ Max limit is 1000 messages to keep the bot stable!");
        }

        // Spamming ආරම්භ කරන බව හැඟවීමට මැසේජ් එකක්
        await reply(`🚀 *Starting Safe Spamming...*\n📊 Total: ${count}\n🛡️ Mode: Anti-Ban Delay (${count > 100 ? '1.5s' : '0.5s'})\n📁 Type: ${isReplyMode ? 'Replied Media/Message' : 'Direct Text'}`);

        // 🔄 Loop එක මඟින් Spam කිරීම
        for (let i = 0; i < count; i++) {
            if (isReplyMode) {
                // 🔥 [FORWARD METHOD] රිප්ලයි කර ඇති Sticker, Image, Audio, Text ඕනෑම දෙයක් ක්‍රෑෂ් නොවී වේගයෙන් යැවීම
                await nethmina.sendMessage(from, { 
                    forward: {
                        key: { remoteJid: from, id: contextInfo.stanzaId, participant: contextInfo.participant },
                        message: contextInfo.quotedMessage
                    }
                });
            } else {
                // සාමාන්‍ය Text එකක් නම්
                await nethmina.sendMessage(from, { text: textToSpam });
            }
            
            // 🔒 ANTI-BAN DYNAMIC DELAY
            let safetyDelay = count > 100 ? 1500 : 500; 
            await new Promise(resolve => setTimeout(resolve, safetyDelay)); 
        }

        return await nethmina.sendMessage(from, { text: "✅ *Spamming Completed Successfully!*" }, { quoted: mek });

    } catch (e) {
        console.error("Boom Media Error:", e);
        reply(`❌ *Error Occurred !!*\n\n${e.message || e}`);
    }
});
