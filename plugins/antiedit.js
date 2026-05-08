const fs = require('fs');

if (!global.msgStore) global.msgStore = new Map();

module.exports = {
    onMessage: async (conn, mek) => {
        try {
            if (!mek.message || mek.message.protocolMessage) return;
            const msgId = mek.key.id;
            
            // මැසේජ් එකේ වර්ගය අනුව content එක ලබා ගැනීම
            let content = mek.message.conversation || 
                          mek.message.extendedTextMessage?.text || 
                          mek.message.imageMessage?.caption || 
                          mek.message.videoMessage?.caption || "";

            // මැසේජ් එක Text එකක් නොවී Media එකක් (Image/Video) නම් සහ Caption එකක් නැතිනම්
            // ඒකත් store කරගමු (පස්සේ caption එකක් දැම්මොත් අඳුනගන්න)
            if (!content && (mek.message.imageMessage || mek.message.videoMessage)) {
                content = "« Media without caption »";
            }

            if (content) {
                global.msgStore.set(msgId, {
                    text: content,
                    sender: mek.key.participant || mek.key.remoteJid,
                    time: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Colombo', hour12: true })
                });

                // පැයකට පසු Memory එකෙන් අයින් කිරීම (Memory පිරීම වැළැක්වීමට)
                setTimeout(() => global.msgStore.delete(msgId), 3600000);
            }
        } catch (e) { console.log("MsgStore Error:", e); }
    },

    onEdit: async (conn, mek) => {
        try {
            // Index.js එකේ messages.update එකෙන් එන දත්ත මෙතනදී නිවැරදිව කියවා ගමු
            const msgUpdate = mek.update;
            if (!msgUpdate || !msgUpdate.message) return;

            const protocolMsg = msgUpdate.message.protocolMessage;
            if (!protocolMsg || protocolMsg.type !== 14) return;

            const msgId = protocolMsg.key.id;
            const from = mek.key.remoteJid;
            const editedMsg = protocolMsg.editedMessage;

            if (!editedMsg) return;

            // අලුත් (Edit කළ) මැසේජ් එකේ content එක
            const newText = editedMsg.conversation || 
                            editedMsg.extendedTextMessage?.text || 
                            editedMsg.imageMessage?.caption || 
                            editedMsg.videoMessage?.caption;

            const oldMsg = global.msgStore.get(msgId);

            // පරණ එකක් තියෙනවා නම් සහ අලුත් එක ඊට වඩා වෙනස් නම් පමණක් වැඩේ පටන් ගන්න
            if (oldMsg && newText && oldMsg.text !== newText) {
                
                let report = `✍️ *Message Edited Detected*
                
🕒 *Time:* ${oldMsg.time}
👤 *User:* @${oldMsg.sender.split('@')[0]}

*📑 𝗢𝗿𝗶𝗴𝗶𝗻𝗮𝗹 𝗠𝗲𝘀𝘀𝗮𝗴𝗲:*
\`\`\`${oldMsg.text}\`\`\`

*✒️ 𝗘𝗱𝗶𝘁𝗲𝗱 𝗠𝗲𝘀𝘀𝗮𝗴𝗲:*
\`\`\`${newText}\`\`\`

> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴᴇᴛʜᴍɪɴᴀ ᴏꜰᴄ ||`;

                await conn.sendMessage(from, { 
                    text: report, 
                    mentions: [oldMsg.sender] 
                }, { quoted: mek });
                
                // එකපාරක් report කළ පසු store එකෙන් අයින් කරන්න
                global.msgStore.delete(msgId);
            }
        } catch (e) { 
            // මෙතන console error එකක් එන එක සාමාන්‍යයි සමහර වෙලාවට, ඒක ignore කරන්න
        }
    }
};
