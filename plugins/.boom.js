const { cmd } = require('../command');

cmd({
    pattern: "boom",
    alias: ["spam", "bomb"],
    desc: "Spam directly or remotely via JID up to 1000 times safely.",
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

        // 🔄 [100% FIXED UNIVERSAL EXTRACTOR] - බොට්ගේ ඕනෑම වර්ෂන් එකක රිප්ලයි දත්ත වරදින්නේ නැතිව ඇදගැනීම
        const msgType = mek.message ? Object.keys(mek.message)[0] : null;
        const contextInfo = mek.message?.[msgType]?.contextInfo || 
                            mek.message?.extendedTextMessage?.contextInfo || 
                            mek.contextInfo || 
                            msg?.contextInfo;

        const isReplyMode = !!(contextInfo && contextInfo.hasQuotedMessage);

        const args = q.trim().split(" ");
        const firstArg = args[0];

        let targetJid = from;
        let textToSpam = "";
        let count = 0;

        // 🎯 [SMART REMOTE CHECK] පළමු කොටස JID එකක්ද නැත්නම් ෆෝන් නම්බර් එකක්ද කියා බැලීම
        // දිග 5ට වඩා වැඩි නම්බර් පමණක් JID ලෙස ගනී (කෙටි කවුන්ට් ඉලක්කම් මඟ හැරීමට)
        const isRemote = firstArg.endsWith("@g.us") || 
                         firstArg.endsWith("@s.whatsapp.net") || 
                         (/^\d+$/.test(firstArg) && firstArg.length > 5);

        if (isRemote) {
            // JID එක සකසා ගැනීම
            targetJid = /^\d+$/.test(firstArg) ? `${firstArg}@s.whatsapp.net` : firstArg;

            if (isReplyMode) {
                // Format: .boom [jid/number] [count] (Remote with Reply)
                if (args.length < 2) return await reply("❌ Format: Reply to message + `.boom [JID/Number] [count]`");
                count = parseInt(args[1]);
            } else {
                // Format: .boom [jid/number] [text] [count] (Remote Direct Text)
                if (args.length < 3) return await reply("❌ Format: `.boom [JID/Number] [text] [count]`");
                count = parseInt(args[args.length - 1]);
                textToSpam = args.slice(1, -1).join(" ").trim();
            }
        } else {
            // 🎯 සාමාන්‍ය චැට් එක ඇතුළේ වැඩ කරන මෝඩ් එක (Local Mode)
            if (isReplyMode) {
                // Format: .boom [count] (Local with Reply)
                count = parseInt(q.trim());
            } else {
                // Format: .boom [text] [count] (Local Direct Text)
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

        // 🔥 [MANUAL INITIAL REACT] - හැමදේම සාර්ථක නම් මුලින්ම 💥 රියැක්ට් කරයි
        await nethmina.sendMessage(from, { react: { text: "💥", key: mek.key } });

        // වැඩේ පටන් ගත් බව දැක්වීම
        await reply(`🚀 *Starting Safe Spamming...*\n🎯 Target: ${targetJid.split('@')[0]}\n📊 Total Count: ${count}\n🛡️ Mode: Anti-Ban Delay (${count > 100 ? '1.5s' : '0.5s'})\n📁 Type: ${isReplyMode ? 'Replied Content (Sticker/Media/Text)' : 'Direct Text Message'}`);

        // 🔄 Loop එක මඟින් Spam කිරීම
        for (let i = 0; i < count; i++) {
            if (isReplyMode) {
                // ඕනෑම ස්ටිකර්, ඉමේජ්, වීඩියෝ හෝ ටෙක්ස්ට් එකක් ක්‍රෑෂ් නොවී ෆෝවර්ඩ් කිරීම
                await nethmina.sendMessage(targetJid, { 
                    forward: {
                        key: { 
                            remoteJid: from, 
                            id: contextInfo.stanzaId, 
                            participant: contextInfo.participant || contextInfo.remoteJid 
                        },
                        message: contextInfo.quotedMessage
                    }
                });
            } else {
                await nethmina.sendMessage(targetJid, { text: textToSpam });
            }
            
            // 🔒 ANTI-BAN DELAY
            let safetyDelay = count > 100 ? 1500 : 500; 
            await new Promise(resolve => setTimeout(resolve, safetyDelay)); 
        }

        // 🔥 [SUCCESS REACT UPDATE] වැඩේ ඉවර වූ පසු 💥 එක ✅ එකට මාරු කිරීම
        await nethmina.sendMessage(from, { react: { text: "✅", key: mek.key } });

        // 📝 සාර්ථකයි කියා රිප්ලයි මැසේජ් එකක් යැවීම
        return await nethmina.sendMessage(from, { 
            text: `✅ *Spamming Completed Successfully!*\n\n🎯 *Target:* ${targetJid}\n📊 *Sent Count:* ${count}\n✨ *Status:* Done` 
        }, { quoted: mek });

    } catch (e) {
        console.error("Boom Remote Error:", e);
        reply(`❌ *Error Occurred !!*\n\n${e.message || e}`);
    }
});
