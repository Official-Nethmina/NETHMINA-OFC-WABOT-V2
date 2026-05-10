const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

module.exports = {
    onMessage: async (nethmina, mek) => {
        try {
            const from = mek.key.remoteJid;
            const type = Object.keys(mek.message || {})[0];
            
            // අපි බලනවා මේක රිප්ලයි එකක්ද සහ ඒ රිප්ලයි කරපු මැසේජ් එක View Once ද කියලා
            const quotedMsg = mek.message?.[type]?.contextInfo?.quotedMessage;
            if (!quotedMsg) return;

            const mtype = Object.keys(quotedMsg)[0];
            const isViewOnce = quotedMsg[mtype]?.viewOnce;

            if (isViewOnce) {
                // බොට්ගේ ඕනර් විතරක් මේක කළොත් වැඩ කරන විදිහට (ඔයාගේ නම්බර් එක මෙතන දාන්න)
                const ownerNumber = "94760860835@s.whatsapp.net";
                const sender = mek.key.fromMe ? nethmina.user.id.split(':')[0] + "@s.whatsapp.net" : (mek.key.participant || mek.key.remoteJid);

                if (sender.includes("94760860835")) {
                    const mediaMsg = quotedMsg[mtype];
                    
                    // මීඩියා වර්ගය හඳුනාගැනීම
                    let mediaType;
                    if (mtype === "imageMessage") mediaType = "image";
                    else if (mtype === "videoMessage") mediaType = "video";
                    else if (mtype === "audioMessage") mediaType = "audio";
                    else return;

                    // මැසේජ් එක ඩවුන්ලෝඩ් කිරීම
                    const stream = await downloadContentFromMessage(mediaMsg, mediaType);
                    let buffer = Buffer.from([]);
                    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

                    const captionText = `📥 *View Once Retrieved*\n\n👤 *From:* ${from}\n📝 *Caption:* ${mediaMsg.caption || "No caption"}\n\n> Powered by Nethmina OFC`;

                    // ඕනර්ගේ ඉන්බොක්ස් එකට යැවීම
                    if (mediaType === "image") {
                        await nethmina.sendMessage(ownerNumber, { image: buffer, caption: captionText });
                    } else if (mediaType === "video") {
                        await nethmina.sendMessage(ownerNumber, { video: buffer, caption: captionText });
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
