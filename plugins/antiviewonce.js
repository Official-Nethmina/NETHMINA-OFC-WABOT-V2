const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

module.exports = {
    onMessage: async (nethmina, mek) => {
        try {
            const from = mek.key.remoteJid;
            const type = Object.keys(mek.message || {})[0];
            
            const quotedMsg = mek.message?.[type]?.contextInfo?.quotedMessage;
            if (!quotedMsg) return;

            const mtype = Object.keys(quotedMsg)[0];
            const isViewOnce = quotedMsg[mtype]?.viewOnce;

            if (isViewOnce) {
                const ownerNumber = "94760860835@s.whatsapp.net";
                
                // මැසේජ් එක එවපු කෙනාගේ JID එක සහ නම ලබා ගැනීම
                const senderJid = mek.message[type].contextInfo.participant || from;
                const senderName = mek.pushName || "Unknown User";

                // ඔයාගේ නම්බර් එකෙන් විතරක් රිප්ලයි කළොත් වැඩ කරන පරීක්ෂාව
                if (mek.key.fromMe || mek.key.participant?.includes("94760860835") || from.includes("94760860835")) {
                    
                    const mediaMsg = quotedMsg[mtype];
                    let mediaType;
                    if (mtype === "imageMessage") mediaType = "image";
                    else if (mtype === "videoMessage") mediaType = "video";
                    else if (mtype === "audioMessage") mediaType = "audio";
                    else return;

                    const stream = await downloadContentFromMessage(mediaMsg, mediaType);
                    let buffer = Buffer.from([]);
                    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

                    // මෙතනින් නම සහ Mention එක හදනවා
                    const captionText = `📥 *View Once Retrieved*\n\n👤 *From:* ${senderName} (@${senderJid.split('@')[0]})\n📝 *Caption:* ${mediaMsg.caption || "No caption"}\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴᴇᴛʜᴍɪɴᴀ ᴏꜰᴄ ||`;

                    if (mediaType === "image") {
                        await nethmina.sendMessage(ownerNumber, { image: buffer, caption: captionText, mentions: [senderJid] });
                    } else if (mediaType === "video") {
                        await nethmina.sendMessage(ownerNumber, { video: buffer, caption: captionText, mentions: [senderJid] });
                    } else if (mediaType === "audio") {
                        await nethmina.sendMessage(ownerNumber, { audio: buffer, mimetype: mediaMsg.mimetype || "audio/mp4", ptt: mediaMsg.ptt || false });
                    }
                }
            }
        } catch (e) {
            console.log("❌ Anti-ViewOnce Error:", e);
        }
    }
};
