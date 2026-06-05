const { cmd } = require('../command');

cmd({
    pattern: "boom",
    alias: ["spam", "bomb"],
    desc: "Spam directly or remotely via JID up to 1000 times safely without forwarded tag.",
    category: "owner",
    filename: __filename
},
async (nethmina, mek, msg, { from, q, isGroup, isOwner, reply }) => {
    try {
        // 🔒 Owner Check
        if (!isOwner) return await reply("❌ Only the bot owner can use this command.");

        if (!q) {
            return await reply(
                "❌ *Boom Command Formats:*\n\n" +
                "▫️ *Direct Chat:* `.boom [text] [count]`\n" +
                "▫️ *Reply Chat:* `.boom [count]`\n\n" +
                "▫️ *Remote Inbox:* `.boom [JID/Number] [text] [count]`\n" +
                "▫️ *Remote Reply:* `.boom [JID/Number] [count]`"
            );
        }

        // 🔄 රිප්ලයි දත්ත නිවැරදිව ලබා ගැනීම
        const quotedMessage = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage || 
                              mek.message?.imageMessage?.contextInfo?.quotedMessage || 
                              mek.message?.videoMessage?.contextInfo?.quotedMessage ||
                              mek.message?.audioMessage?.contextInfo?.quotedMessage ||
                              mek.message?.documentMessage?.contextInfo?.quotedMessage;

        const contextInfo = mek.message?.extendedTextMessage?.contextInfo || 
                            mek.message?.imageMessage?.contextInfo || 
                            mek.message?.videoMessage?.contextInfo ||
                            mek.message?.audioMessage?.contextInfo ||
                            mek.message?.documentMessage?.contextInfo;

        const isReplyMode = !!quotedMessage;

        const args = q.trim().split(" ");
        const firstArg = args[0];

        let targetJid = from;
        let textToSpam = "";
        let count = 0;

        // 🎯 Remote Mode ද බලමු
        const isRemote = firstArg.endsWith("@g.us") || 
                         firstArg.endsWith("@s.whatsapp.net") || 
                         (/^\d+$/.test(firstArg) && firstArg.length > 5);

        if (isRemote) {
            targetJid = /^\d+$/.test(firstArg) ? `${firstArg}@s.whatsapp.net` : firstArg;

            if (isReplyMode) {
                if (args.length < 2) return await reply("❌ Format: Reply to message + `.boom [JID/Number] [count]`");
                count = parseInt(args[1]);
            } else {
                if (args.length < 3) return await reply("❌ Format: `.boom [JID/Number] [text] [count]`");
                count = parseInt(args[args.length - 1]);
                textToSpam = args.slice(1, -1).join(" ").trim();
            }
        } else {
            if (isReplyMode) {
                count = parseInt(args[0]);
            } else {
                if (args.length < 2) return await reply("❌ Format: `.boom [text] [count]`");
                count = parseInt(args[args.length - 1]);
                textToSpam = args.slice(0, -1).join(" ").trim();
            }
        }

        // වැලිඩේෂන් චෙක්ස්
        if (isNaN(count) || count <= 0) {
            return await reply("❌ Invalid count number! Please enter a valid number.");
        }

        if (count > 1000) {
            return await reply("⚠️ Max limit is 1000 messages to keep the bot stable!");
        }

        // 🔥 [INITIAL REACT]
        await nethmina.sendMessage(from, { react: { text: "💥", key: mek.key } });

        // වැඩේ පටන් ගත් බව දැක්වීම
        await reply(`🚀 *Starting Clean Spamming...*\n🎯 Target: ${targetJid.split('@')[0]}\n📊 Total Count: ${count}\n📁 Type: ${isReplyMode ? 'Replied Media/Message' : 'Direct Text'}\n✨ Forward Tag: 📴 REMOVED`);

        // 🔄 Loop එක මඟින් Spam කිරීම
        for (let i = 0; i < count; i++) {
            if (isReplyMode) {
                // 🔥 [FORWARD TAG REMOVER] - Forward ලේබල් එක වංචා කර මීඩියා එක යැවීම
                await nethmina.sendMessage(targetJid, { 
                    forward: {
                        key: { 
                            remoteJid: from, 
                            id: contextInfo.stanzaId, 
                            participant: contextInfo.participant || contextInfo.remoteJid 
                        },
                        message: quotedMessage
                    },
                    contextInfo: {
                        forwardingScore: 0,
                        isForwarded: false
                    }
                });
            } else {
                // සාමාන්‍ය Text එකක් සෙන්ඩ් කිරීම
                await nethmina.sendMessage(targetJid, { text: textToSpam });
            }
            
            // 🔒 ANTI-BAN DELAY
            let safetyDelay = count > 100 ? 1200 : 400; 
            await new Promise(resolve => setTimeout(resolve, safetyDelay)); 
        }

        // 🔥 [SUCCESS REACT UPDATE]
        await nethmina.sendMessage(from, { react: { text: "✅", key: mek.key } });

        // සාර්ථකයි කියා රිප්ලයි එකක් යැවීම
        return await nethmina.sendMessage(from, { 
            text: `✅ *Spamming Completed Successfully Without Forward Tag!*\n\n🎯 *Target:* ${targetJid}\n📊 *Sent Count:* ${count}` 
        }, { quoted: mek });

    } catch (e) {
        console.error("Boom Command Error:", e);
        reply(`❌ *Error Occurred !!*\n\n${e.message || e}`);
    }
});
