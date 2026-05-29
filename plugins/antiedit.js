const { getContentType } = require("@whiskeysockets/baileys");
const config = require('../config');

if (!global.msgStore) global.msgStore = new Map();

function extractText(msg) {
    if (!msg) return "";
    const type = getContentType(msg);
    if (!type) return "";
    if (type === "conversation") return msg.conversation || "";
    if (type === "extendedTextMessage") return msg.extendedTextMessage?.text || "";
    if (type === "imageMessage") return msg.imageMessage?.caption || "";
    if (type === "videoMessage") return msg.videoMessage?.caption || "";
    if (msg[type]) return msg[type].text || msg[type].caption || "";
    return "";
}

module.exports = {
    // Messages.upsert: නව මැසේජ් ආවම ස්ටෝර් කිරීම
    onMessage: async (conn, mek) => {
        try {
            if (!mek?.message) return;
            
            // බොට් විසින්ම යවන ඒවා ස්ටෝර් කරන්නේ නැහැ
            if (mek.key.fromMe) return;

            const msgId = mek.key.id;
            const content = extractText(mek.message);

            if (content && content.trim()) {
                global.msgStore.set(msgId, {
                    text: content,
                    sender: mek.key.participant || mek.key.remoteJid,
                    jid: mek.key.remoteJid,
                    time: new Date().toLocaleString("en-GB", {
                        timeZone: "Asia/Colombo",
                        hour12: true
                    })
                });

                // පැය 1කින් මෙමරියෙන් අයින් කරනවා
                setTimeout(() => global.msgStore.delete(msgId), 3600000);
            }
        } catch (e) {
            console.log("[antiedit] onMessage error:", e.message);
        }
    },

    // Messages.update: එඩිට් හඳුනාගැනීම
    onEdit: async (conn, update, reportTarget) => {
        try {
            // Config එකෙන් ANTI_EDIT ඔෆ් කරලා නම් රන් කරන්නේ නැහැ
            if (config.ANTI_EDIT === "false") return;
            if (!update?.update) return;

            const upd = update.update;
            const proto = upd.protocolMessage || upd.message?.protocolMessage || null;
            if (!proto) return;

            const isEdit = proto.type === 14 ||
                           proto.type === "MESSAGE_EDIT" ||
                           String(proto.type).toUpperCase() === "EDIT";

            if (!isEdit) return;

            const originalId = proto.key?.id;
            if (!originalId) return;

            const editedMsg = proto.editedMessage;
            if (!editedMsg) return;

            const newText = extractText(editedMsg);
            if (!newText?.trim()) return;

            const stored = global.msgStore.get(originalId);
            if (!stored) return; 

            // බොට්ගේම කමාන්ඩ්ස් හෝ මැසේජ් ස්කිප් කිරීම
            const skipPatterns = ["Pinging...", "🚀", "✅ *NETHMINA", "📊 [STATUS SYNC]"];
            if (skipPatterns.some(p => stored.text.includes(p))) return;

            // මැසේජ් එක ඇත්තටම වෙනස් වෙලා නැත්නම් ස්කිප් කරනවා
            if (stored.text === newText) return;

            const target = reportTarget || stored.jid;
            if (!target) return;

            // ✍️ ලස්සන බොක්ස් බෝඩර් ඩිසයින් එකක්
            let report = `*╭───〔 ✍️ MESSAGE EDIT DETECTED 〕──●●►*\n`;
            report += `*┃*\n`;
            report += `*┃* 🕒 *Time:* ${stored.time}\n`;
            report += `*┃* 👤 *User:* @${stored.sender.split("@")[0]}\n`;
            report += `*┃*\n`;
            report += `*┃* 📑 *Original Message:*\n`;
            report += `*┃* \`\`\`${stored.text}\`\`\`\n`;
            report += `*┃*\n`;
            report += `*┃* ✒️ *Edited Message:*\n`;
            report += `*┃* \`\`\`${newText}\`\`\`\n`;
            report += `*┃*\n`;
            report += `*╰──────────●●►*\n`;
            report += `> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴᴇᴛʜᴍɪɴᴀ ᴏꜰᴄ`;

            await conn.sendMessage(target, {
                text: report,
                mentions: [stored.sender]
            }, { quoted: update });

            // ස්ටෝර් එක අප්ඩේට් කිරීම (ආයෙත් එඩිට් කලොත් අල්ලගන්න)
            global.msgStore.set(originalId, { ...stored, text: newText });

        } catch (e) {
            console.log("[antiedit] onEdit error:", e.message);
        }
    }
};
