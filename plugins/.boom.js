const { cmd } = require('../command');

cmd({
    pattern: "boom",
    alias: ["spam", "bomb"],
    react: "💥",
    desc: "Spam directly or remotely via JID up to 1000 times safely.",
    category: "owner",
    filename: __filename
},
async (nethmina, mek, msg, { from, q, isGroup, isOwner, reply }) => {
    try {
        // 🔒 Owner Check (ඉන්බොක්ස් රිමෝට් වැඩ නිසා ඕනර්ට විතරක් ලොක් කළා)
        if (!isOwner) return await reply("❌ Only the bot owner can use this command.");

        if (!q) {
            return await reply(
                "❌ *Boom Command Formats:*\n\n" +
                "1️⃣ *Direct Text:* `.boom [text] [count]`\n" +
                "2️⃣ *Reply Media/Text:* `.boom [count]`\n" +
                "3️⃣ *Remote Spam (From Inbox):* `.boom [JID/Number] [text] [count]`"
            );
        }

        let targetJid = from;
        let textToSpam = "";
        let count = 0;
        let isReplyMode = false;

        // රිප්ලයි කර ඇති මැසේජ් එකේ contextInfo එක ලබාගැනීම
        const contextInfo = mek.message?.extendedTextMessage?.contextInfo || 
                            mek.message?.imageMessage?.contextInfo || 
                            mek.message?.videoMessage?.contextInfo || 
                            mek.message?.audioMessage?.contextInfo || 
                            mek.message?.documentMessage?.contextInfo ||
                            mek.message?.stickerMessage?.contextInfo;

        if (contextInfo && contextInfo.hasQuotedMessage) {
            isReplyMode = true;
        }

        const args = q.trim().split(" ");

        // 🎯 [CASE 1] ඉන්බොක්ස් එකේ ඉඳන් රිමෝට් ජේඅයිඩී (JID) එකකට යවනවා නම්
        if (!isGroup && (args[0].endsWith("@g.us") || args[0].endsWith("@s.whatsapp.net") || /^\d+$/.test(args[0]))) {
            
            let rawInputJid = args[0];
            // නම්බර් එකක් විතරක් ගැහුවොත් ඒක JID එකකට හරවා ගැනීම
            if (/^\d+$/.test(rawInputJid)) {
                targetJid = `${rawInputJid}@s.whatsapp.net`;
            } else {
                targetJid = rawInputJid;
            }

            if (isReplyMode) {
                // රිමෝට් + රිප්ලයි මෝඩ් (උදා: ස්ටිකර් එකකට රිප්ලයි කරලා `.boom [JID] [COUNT]`)
                if (args.length < 2) return await reply("❌ Format: Reply to media + `.boom [JID] [count]`");
                count = parseInt(args[1]);
            } else {
                // රිමෝට් + සාමාන්‍ය ටෙක්ස්ට් මෝඩ් (උදා: `.boom [JID] [text] [COUNT]`)
                if (args.length < 3) return await reply("❌ Format: `.boom [JID] [text] [count]`");
                count = parseInt(args[args.length - 1]);
                textToSpam = args.slice(1, -1).join(" ").trim();
            }

        } else {
            // 🎯 [CASE 2] සාමාන්‍ය විදිහට ඒ චැට් එක ඇතුළෙන්ම Spam කරනවා නම්
            if (isReplyMode) {
                count = parseInt(q.trim());
            } else {
                if (args.length < 2) return await reply("❌ Format: `.boom [text] [count]`");
                count = parseInt(args[args.length - 1]);
                textToSpam = args.slice(0, -1).join(" ").trim();
            }
        }

        // Count එක පරික්ෂා කිරීම
        if (isNaN(count) || count <= 0) {
            return await reply("❌ Invalid count number! Please enter a valid number.");
        }

        // 🛡️ ANTI-BAN MAX LIMIT: 1000
        if (count > 1000) {
            return await reply("⚠️ Max limit is 1000 messages to keep the bot stable!");
        }

        // Spamming පටන් ගත් බව ඕනර්ට දැනුම් දීම
        await reply(`🚀 *Starting Safe Spamming...*\n🎯 Target: ${targetJid.split('@')[0]}\n📊 Total Count: ${count}\n🛡️ Mode: Anti-Ban Delay (${count > 100 ? '1.5s' : '0.5s'})\n📁 Type: ${isReplyMode ? 'Replied Media' : 'Text'}`);

        // 🔄 Loop එක මඟින් Spam කිරීම
        for (let i = 0; i < count; i++) {
            if (isReplyMode) {
                // මීඩියා හෝ රිප්ලයි මැසේජ් ෆෝවර්ඩ් කිරීම
                await nethmina.sendMessage(targetJid, { 
                    forward: {
                        key: { remoteJid: from, id: contextInfo.stanzaId, participant: contextInfo.participant },
                        message: contextInfo.quotedMessage
                    }
                });
            } else {
                // සාමාන්‍ය ටෙක්ස්ට් යැවීම
                await nethmina.sendMessage(targetJid, { text: textToSpam });
            }
            
            // 🔒 ANTI-BAN DYNAMIC DELAY
            let safetyDelay = count > 100 ? 1500 : 500; 
            await new Promise(resolve => setTimeout(resolve, safetyDelay)); 
        }

        // 📝 [UPDATE] වැඩේ ඉවර වුණාම ඔයා ගහපු .boom cmd එකටම රිප්ලයි එකක් විදිහට සාර්ථකයි කියලා මැසේජ් එකක් යැවීම
        return await nethmina.sendMessage(from, { 
            text: `✅ *Spamming Completed Successfully!*\n\n🎯 *Target:* ${targetJid}\n📊 *Sent Count:* ${count}\n✨ *Status:* Done` 
        }, { quoted: mek });

    } catch (e) {
        console.error("Boom Remote Error:", e);
        reply(`❌ *Error Occurred !!*\n\n${e.message || e}`);
    }
});
