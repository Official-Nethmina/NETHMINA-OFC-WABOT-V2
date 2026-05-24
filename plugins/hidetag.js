const { cmd } = require('../command');

cmd({
    pattern: "hidetag",
    alias: ["tag", "h"],  
    react: "🔊",
    desc: "Tag all members directly in group or via Owner's Inbox using JID",
    category: "group",
    use: '.hidetag Hello (in group) OR .hidetag jid@g.us Hello (in Inbox)',
    filename: __filename
},
async (nethmina, mek, msg, { from, q, isGroup, isOwner, isAdmins, reply }) => {
    try {
        let targetJid = from;
        let messageText = q ? q.trim() : "";

        // 1. ඉන්බොක්ස් (PM) එකෙන් Command එක පාවිච්චි කරද්දී
        if (!isGroup) {
            // ඕනර් කෙනෙක්ද කියා පරික්ෂා කිරීම
            if (!isOwner) return reply("❌ This remote-hidetag feature is only for the Bot Owner.");
            
            if (!q) return reply("❌ Please use format: `.hidetag [group_jid] [message]` OR reply to a media with `.hidetag [group_jid]`");

            // ටයිප් කරපු එකෙන් පළමු වචනය (JID එක) වෙන් කර ගැනීම
            const args = q.split(" ");
            const inputJid = args[0];

            // JID එක නිවැරදි ගෲප් JID එකක්ද කියා පරික්ෂා කිරීම
            if (!inputJid.endsWith("@g.us")) {
                return reply("❌ Invalid Group JID! It must end with @g.us\nExample: `120363xxxxxx@g.us`");
            }

            targetJid = inputJid;
            // JID කෑල්ල අයින් කර ඉතිරි මැසේජ් එක විතරක් තබා ගැනීම
            messageText = args.slice(1).join(" ").trim();
        } else {
            // 2. ගෲප් එකක් ඇතුළේදී Command එක පාවිච්චි කරද්දී
            if (!isAdmins && !isOwner) return reply("❌ Only group admins or bot owner can use this command.");
        }

        // 🎯 අදාළ ගෲප් එකේ සාමාජිකයන් ලබාගැනීම
        let groupMetadata;
        try {
            groupMetadata = await nethmina.groupMetadata(targetJid);
        } catch (err) {
            return reply("❌ Failed to fetch group metadata. Make sure the bot is in that group!");
        }

        const groupParticipants = groupMetadata.participants || [];
        if (groupParticipants.length === 0) return reply("❌ No participants found in the target group.");

        // සියලුම සාමාජිකයන්ගේ JID ලැයිස්තුව
        const memberJids = groupParticipants.map(u => u.id);
        const mentionAll = { mentions: memberJids };

        // රිප්ලයි කර ඇති මැසේජ් එකේ contextInfo එක ලබාගැනීම
        const contextInfo = mek.message?.extendedTextMessage?.contextInfo || 
                            mek.message?.imageMessage?.contextInfo || 
                            mek.message?.videoMessage?.contextInfo || 
                            mek.message?.audioMessage?.contextInfo || 
                            mek.message?.documentMessage?.contextInfo;

        // 🅰️ රිප්ලයි කර ඇති මැසේජ් එකක් තිබේ නම් (Media හෝ Text)
        if (contextInfo && contextInfo.hasQuotedMessage) {
            const quotedType = Object.keys(contextInfo.quotedMessage)[0];
            const quotedContent = contextInfo.quotedMessage[quotedType];

            // Text මැසේජ් එකක් නම්
            if (quotedType === 'conversation' || quotedType === 'extendedTextMessage') {
                const txt = quotedContent.text || quotedContent;
                await nethmina.sendMessage(targetJid, { text: txt, ...mentionAll });
            } else {
                // වෙනත් ඕනෑම මීඩියා එකක් නම් (Crash-proof Forward Method)
                await nethmina.sendMessage(targetJid, { 
                    forward: {
                        key: { remoteJid: from, id: contextInfo.stanzaId, participant: contextInfo.participant },
                        message: contextInfo.quotedMessage
                    },
                    contextInfo: { mentionedJid: memberJids }
                });
            }

            if (!isGroup) return reply(`✅ Successfully hidetagged the quoted message to group: ${groupMetadata.subject}`);
            return;
        }

        // 🅱️ කෙලින්ම ටෙක්ස්ට් එකක් ටයිප් කර තිබේ නම්
        if (messageText.length > 0) {
            await nethmina.sendMessage(targetJid, {
                text: messageText,
                ...mentionAll
            });

            if (!isGroup) return reply(`✅ Successfully hidetagged message to group: ${groupMetadata.subject}`);
            return;
        }

        // කිසිවක් කර නොමැති නම්
        return reply("❌ Please provide a text message or reply to a message/media.");

    } catch (e) {
        console.error("Hidetag Update Error:", e);
        reply(`❌ *Error Occurred !!*\n\n${e.message || e}`);
    }
});
