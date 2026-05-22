const { getContentType } = require("@whiskeysockets/baileys");

if (!global.msgStore) global.msgStore = new Map();

// =====================================================
// Helper: ඕනෑම message object එකෙන් text ගන්නවා
// =====================================================
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

    // =====================================================
    // Messages.upsert: නව message ආවම store කරනවා
    // =====================================================
    onMessage: async (conn, mek) => {
        try {
            if (!mek?.message) return;

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

                // 1 පැය පසු auto-delete
                setTimeout(() => global.msgStore.delete(msgId), 3_600_000);
            }
        } catch (e) {
            console.log("[antiedit] onMessage error:", e.message);
        }
    },

    // =====================================================
    // Messages.update: Edit detect කිරීම
    // Baileys custom fork (AmilaPrabathKumara) edit events
    // protocolMessage.type === 14  →  EDIT
    // =====================================================
    onEdit: async (conn, update, reportTarget) => {
        try {
            if (!update?.update) return;

            const upd = update.update;

            // protocolMessage දෙකෙන් එකක් check කිරීම
            const proto = upd.protocolMessage
                       || upd.message?.protocolMessage
                       || null;

            if (!proto) return;

            // Type 14 = MESSAGE_EDIT  (Baileys enum EDIT)
            const isEdit = proto.type === 14 ||
                           proto.type === "MESSAGE_EDIT" ||
                           String(proto.type).toUpperCase() === "EDIT";

            if (!isEdit) return;

            // Edit කරන ලද original message ID
            const originalId = proto.key?.id;
            if (!originalId) return;

            // Edited content
            const editedMsg = proto.editedMessage;
            if (!editedMsg) return;

            const newText = extractText(editedMsg);
            if (!newText?.trim()) return;

            // Store එකෙන් original message ගන්නවා
            const stored = global.msgStore.get(originalId);
            if (!stored) return; // Store නැත්නම් (bot restart etc.) skip

            // Bot ගේ own automated messages ignore
            const skipPatterns = ["Pinging...", "🚀", "✅ *NETHMINA"];
            if (skipPatterns.some(p => stored.text.includes(p))) return;

            // Text ඇත්තටම change වෙලා නම් විතරක් report
            if (stored.text === newText) return;

            // Report යවන target: index.js pass කරන reportTarget use කරනවා
            // fallback: stored JID  (update.key දැන් reliable නෑ fork එකේ)
            const target = reportTarget || stored.jid;
            if (!target) return;

            const report =
                `✍️ *MESSAGE EDIT DETECTED*\n\n` +
                `🕒 *Time:* ${stored.time}\n` +
                `👤 *User:* @${stored.sender.split("@")[0]}\n\n` +
                `📑 *Original Message:*\n${stored.text}\n\n` +
                `✒️ *Edited Message:*\n${newText}\n\n` +
                `> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴᴇᴛʜᴍɪɴᴀ ᴏꜰᴄ`;

            await conn.sendMessage(target, {
                text: report,
                mentions: [stored.sender]
            });

            // Store update — ආයෙත් edit කළොත් නව text compare කරන්න
            global.msgStore.set(originalId, { ...stored, text: newText });

        } catch (e) {
            console.log("[antiedit] onEdit error:", e.message);
        }
    }
};
