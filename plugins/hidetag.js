const { cmd } = require('../command');

cmd({
    pattern: "hidetag",
    alias: ["tag", "h"],  
    react: "🔊",
    desc: "To Tag all Members for Any Message/Media",
    category: "group",
    use: '.hidetag Hello',
    filename: __filename
},
async (nethmina, mek, msg, { from, q, isGroup, isOwner, isAdmins, participants, reply }) => {
    try {
        // ගෲප් එකක්ද කියා පරික්ෂා කිරීම
        if (!isGroup) return reply("❌ This command can only be used in groups.");
        
        // ඇඩ්මින් හෝ බොට් අයිතිකරුද කියා පරික්ෂා කිරීම
        if (!isAdmins && !isOwner) return reply("❌ Only group admins or bot owner can use this command.");

        // ගෲප් එකේ ඉන්න සියලුම සාමාජිකයන්ගේ JID ලබාගැනීම
        const mentionAll = { mentions: participants.map(u => u.id) };

        // රිප්ලයි කර ඇති මැසේජ් එකේ වර්ගය හඳුනාගැනීම
        const quotedMessage = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage || 
                              mek.message?.imageMessage?.contextInfo?.quotedMessage || 
                              mek.message?.videoMessage?.contextInfo?.quotedMessage;

        // 1. රිප්ලයි කර ඇති මැසේජ් එකක් තිබේ නම් (Media හෝ Text)
        if (mek.message?.extendedTextMessage?.contextInfo?.hasQuotedMessage) {
            const contextInfo = mek.message.extendedTextMessage.contextInfo;
            
            // රිප්ලයි කර ඇති මැසේජ් එකේ content එක ගැනීම
            const quotedType = Object.keys(contextInfo.quotedMessage)[0];
            const quotedContent = contextInfo.quotedMessage[quotedType];

            let messageContent = {};

            if (quotedType === 'conversation' || quotedType === 'extendedTextMessage') {
                // Text මැසේජ් එකක් නම්
                const txt = quotedContent.text || quotedContent;
                messageContent = { text: txt, ...mentionAll };
            } else if (quotedType === 'imageMessage') {
                // Image එකක් නම්
                messageContent = { image: { url: 'https://images.xyz' }, caption: quotedContent.caption || "", ...mentionAll };
                // සැබෑ මීඩියා එක ෆෝවර්ඩ් කිරීම වඩාත් ස්ථාවර නිසා කෙලින්ම message content එක වෙනස් කිරීම
                return await nethmina.sendMessage(from, { forward: contextInfo.stanzaId, contextInfo: { mentionedJid: participants.map(u => u.id) } });
            } else {
                // වෙනත් ඕනෑම මීඩියා එකක් නම් එය සියලු දෙනාව මෙන්ෂන් කරමින් Forward කිරීම (Crash-proof ක්‍රමය)
                return await nethmina.sendMessage(from, { 
                    forward: {
                        key: { remoteJid: from, id: contextInfo.stanzaId, participant: contextInfo.participant },
                        message: contextInfo.quotedMessage
                    },
                    contextInfo: { mentionedJid: participants.map(u => u.id) }
                });
            }

            return await nethmina.sendMessage(from, messageContent, { quoted: mek });
        }

        // 2. කෙලින්ම ටෙක්ස්ට් එකක් ටයිප් කර තිබේ නම් (.hidetag අයිබෝවන්)
        if (q && q.trim().length > 0) {
            return await nethmina.sendMessage(from, {
                text: q,
                ...mentionAll
            }, { quoted: mek });
        }

        // කිසිවක් කර නොමැති නම්
        return reply("❌ Please provide a text message or reply to a message/media to tag everyone.");

    } catch (e) {
        console.error("Hidetag Error:", e);
        reply(`❌ *Error Occurred !!*\n\n${e.message || e}`);
    }
});
