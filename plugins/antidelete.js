const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage, getContentType } = require('@whiskeysockets/baileys');

if (!global.messageStore) global.messageStore = new Map();
if (!global.mediaStore) global.mediaStore = new Map();

const tempFolder = path.join(__dirname, '../temp');
if (!fs.existsSync(tempFolder)) fs.mkdirSync(tempFolder, { recursive: true });

module.exports = {
    onMessage: async (conn, mek) => {
        if (!mek.message || mek.key.fromMe) return;
        const keyId = mek.key.id;
        const type = getContentType(mek.message);
        
        global.messageStore.set(keyId, mek);

        const mediaTypes = ['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage'];
        if (mediaTypes.includes(type)) {
            try {
                const stream = await downloadContentFromMessage(mek.message[type], type.replace('Message', ''));
                let buffer = Buffer.from([]);
                for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                
                const ext = type === 'imageMessage' ? '.jpg' : type === 'videoMessage' ? '.mp4' : type === 'audioMessage' ? '.ogg' : '.webp';
                const filePath = path.join(tempFolder, `${keyId}${ext}`);
                fs.writeFileSync(filePath, buffer);
                global.mediaStore.set(keyId, filePath);
            } catch (e) { console.log("AntiDelete Media Save Error:", e); }
        }
    },

    onDelete: async (conn, update) => {
        try {
            const keyId = update.key.id;
            const stored = global.messageStore.get(keyId);
            if (!stored) return;

            const from = update.key.remoteJid;
            const sender = update.key.participant || from;

            // --- [DATE & TIME සකස් කිරීම] ---
            const now = new Date();
            const date = now.toLocaleDateString('en-GB', { timeZone: 'Asia/Colombo' }); // DD/MM/YYYY
            const time = now.toLocaleTimeString('en-US', { hour12: true, timeZone: 'Asia/Colombo' });

            let caption = `🗑️ *Deleted Message Recovered*\n\n👤 *Sender:* @${sender.split('@')[0]}\n📅 *Date:* ${date}\n🕒 *Time:* ${time}`;
            const mediaPath = global.mediaStore.get(keyId);

            if (mediaPath && fs.existsSync(mediaPath)) {
                if (mediaPath.endsWith('.jpg')) await conn.sendMessage(from, { image: { url: mediaPath }, caption, mentions: [sender] });
                else if (mediaPath.endsWith('.mp4')) await conn.sendMessage(from, { video: { url: mediaPath }, caption, mentions: [sender] });
                else if (mediaPath.endsWith('.webp')) {
                    await conn.sendMessage(from, { sticker: { url: mediaPath } });
                    await conn.sendMessage(from, { text: caption, mentions: [sender] });
                }
            } else {
                const text = stored.message.conversation || stored.message.extendedTextMessage?.text || "Media Message";
                await conn.sendMessage(from, { text: `${caption}\n\n📝 *Message:* ${text}`, mentions: [sender] });
            }
        } catch (e) { console.log("AntiDelete Error:", e); }
    }
};
