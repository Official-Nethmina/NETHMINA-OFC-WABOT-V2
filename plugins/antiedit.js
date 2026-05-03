const { unwrapMessage } = require('./antidelete'); // කලින් ලිපියේ unwrapMessage function එක මෙතනටත් ඕන වෙනවා

// මැසේජ් තාවකාලිකව තබා ගැනීමට (Original messages store)
const editStore = new Map();

module.exports = {
    name: 'antiedit',

    onMessage: async (conn, msg) => {
        if (!msg?.message || msg.key.fromMe) return;

        const keyId = msg.key.id;
        const remoteJid = msg.key.remoteJid;

        // මැසේජ් එකේ Text එක ලබා ගැනීම
        let originalText = msg.message.conversation || 
                           msg.message.extendedTextMessage?.text || 
                           msg.message.imageMessage?.caption || 
                           msg.message.videoMessage?.caption || 
                           '';

        // මැසේජ් එක text එකක් නම් පමණක් Store එකට දාන්න
        if (originalText) {
            editStore.set(keyId, {
                text: originalText,
                sender: msg.key.participant || remoteJid,
                time: new Date()
            });

            // විනාඩි 10 කට පසු Store එකෙන් ඉවත් කරන්න (RAM එක ඉතිරි කර ගැනීමට)
            setTimeout(() => {
                editStore.delete(keyId);
            }, 10 * 60 * 1000);
        }
    },

    onEdit: async (conn, update) => {
        // update එකේ තියෙන්නේ edit කරපු මැසේජ් එකේ තොරතුරු
        const keyId = update.key.id;
        const from = update.key.remoteJid;
        const stored = editStore.get(keyId);

        if (!stored) return; // අපේ ළඟ කලින් මැසේජ් එක නැත්නම් මුකුත් කරන්න එපා

        // අලුත් (Edited) මැසේජ් එක ලබා ගැනීම
        const newText = update.message.protocolMessage?.editedMessage?.conversation || 
                        update.message.protocolMessage?.editedMessage?.extendedTextMessage?.text || 
                        "";

        if (!newText || newText === stored.text) return;

        const time = new Date().toLocaleTimeString('en-US', { hour12: true, timeZone: 'Asia/Colombo' });
        const date = new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Colombo' });

        let editCaption = `✏️ *Message Edited Detected*

👤 *Sender:* @${stored.sender.split('@')[0]}
📅 *Date:* ${date}
🕒 *Time:* ${time}

🚫 *Original Message:*
${stored.text}

✅ *Edited Message:*
${newText}`;

        try {
            await conn.sendMessage(from, { 
                text: editCaption, 
                mentions: [stored.sender] 
            }, { quoted: update });
            
            // මැසේජ් එක යැවූ පසු Store එකෙන් අයින් කරන්න (නැවත edit කළොත් අලුත් එක ගන්න)
            editStore.set(keyId, { ...stored, text: newText });

        } catch (err) {
            console.log('❌ AntiEdit Error:', err.message);
        }
    }
};
