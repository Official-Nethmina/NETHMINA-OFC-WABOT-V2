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
async (nethmina, mek, msg, { from, q, isGroup, isOwner, isAdmins, reply }) => {
    try {
        // ගෲප් එකක්ද කියා පරික්ෂා කිරීම
        if (!isGroup) return reply("❌ This command can only be used in groups.");
        
        // ඇඩ්මින් හෝ බොට් අයිතිකරුද කියා පරික්ෂා කිරීම
        if (!isAdmins && !isOwner) return reply("❌ Only group admins or bot owner can use this command.");

        // 🎯 [FIX] index.js එකෙන් participants ආවේ නැතත් කෙලින්ම Group Metadata වලින් සාමාජිකයන් ලබාගැනීම
        const groupMetadata = await nethmina.groupMetadata(from);
        const groupParticipants = groupMetadata.participants || [];
        
        if (groupParticipants.length === 0) return reply("❌ Failed to fetch group members.");

        // සියලුම සාමාජිකයන්ගේ JID ලැයිස්තුව සකසා ගැනීම
        const memberJids = groupParticipants.map(u => u.id);
        const mentionAll = { mentions: memberJids };

        // රිප්ලයි කර ඇති මැසේජ් එකේ contextInfo එක ලබාගැනීම
        const contextInfo = mek.message?.extendedTextMessage?.contextInfo || 
                            mek.message?.imageMessage?.contextInfo || 
                            mek.message?.videoMessage?.contextInfo || 
                            mek.message?.audioMessage?.contextInfo || 
                            mek.message?.documentMessage?.contextInfo;

        // 1. ਰිප්ලයි කර ඇති මැසේජ් එකක් තිබේ නම් (Media හෝ Text)
        if (contextInfo && contextInfo.hasQuotedMessage) {
            const quotedType = Object.keys(contextInfo.quotedMessage)[0];
            const quotedContent = contextInfo.quotedMessage[quotedType];

            // Text මැසේජ් එකක් නම්
            if (quotedType === 'conversation' || quotedType === 'extendedTextMessage') {
                const txt = quotedContent.text || quotedContent;
                return await nethmina.sendMessage(from, { text: txt, ...mentionAll }, { quoted: mek });
            } 
            
            // වෙනත් ඕනෑම මීඩියා එකක් නම් (Crash-proof Forward Method)
            return await nethmina.sendMessage(from, { 
                forward: {
                    key: { remoteJid: from, id: contextInfo.stanzaId, participant: contextInfo.participant },
                    message: contextInfo.quotedMessage
                },
                contextInfo: { mentionedJid: memberJids }
            });
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
