const { cmd } = require("../command");

// ==========================================
// 🚫 COMMAND 1: BLOCK USER
// ==========================================
cmd(
    {
        pattern: "block",
        desc: "Block a user using advanced node injection.",
        category: "owner",
        filename: __filename,
    },
    async (nethmina, mek, sms, { from, args, q, sender, reply, isOwner }) => {
        try {
            if (!isOwner) return await reply("❌ This command is only for my Admin/Owner! 🧑🏻‍💻");

            let targetJid;

            if (sms && sms.quoted && sms.quoted.sender) {
                targetJid = sms.quoted.sender;
            } else if (mek.message?.extendedTextMessage?.contextInfo?.participant) {
                targetJid = mek.message.extendedTextMessage.contextInfo.participant;
            } else if (q) {
                let cleanNumber = q.replace(/[^0-9]/g, "");
                if (cleanNumber.startsWith("0")) cleanNumber = "94" + cleanNumber.slice(1);
                targetJid = `${cleanNumber}@s.whatsapp.net`;
            } else {
                return await reply("❌ Please reply to a message or enter a number.");
            }

            // 🔥 FIX: Baileys updateBlockStatus Bug Bypass
            // සාමාන්‍ය ක්‍රමය වැඩ නැති නිසා අපි කෙලින්ම WhatsApp එකට iq query node එකක් යවනවා
            await nethmina.query({
                tag: 'iq',
                attrs: {
                    to: '@s.whatsapp.net',
                    type: 'set',
                    xmlns: 'blocklist',
                },
                content: [
                    {
                        tag: 'item',
                        attrs: {
                            action: 'block',
                            jid: targetJid,
                        }
                    }
                ]
            });

            return await nethmina.sendMessage(from, {
                text: `✅ [Bypass Success] Successfully blocked @${targetJid.split("@")[0]} from WhatsApp.`,
                mentions: [targetJid]
            }, { quoted: mek });

        } catch (error) {
            console.error("Block Bypass Error:", error);
            await reply(`❌ Error: ${error.message || error}`);
        }
    }
);

// ==========================================
// 🔓 COMMAND 2: UNBLOCK USER
// ==========================================
cmd(
    {
        pattern: "unblock",
        desc: "Unblock a user using advanced node injection.",
        category: "owner",
        filename: __filename,
    },
    async (nethmina, mek, sms, { from, args, q, sender, reply, isOwner }) => {
        try {
            if (!isOwner) return await reply("❌ This command is only for my Admin/Owner! 🧑🏻‍💻");

            let targetJid;

            if (sms && sms.quoted && sms.quoted.sender) {
                targetJid = sms.quoted.sender;
            } else if (mek.message?.extendedTextMessage?.contextInfo?.participant) {
                targetJid = mek.message.extendedTextMessage.contextInfo.participant;
            } else if (q) {
                let cleanNumber = q.replace(/[^0-9]/g, "");
                if (cleanNumber.startsWith("0")) cleanNumber = "94" + cleanNumber.slice(1);
                targetJid = `${cleanNumber}@s.whatsapp.net`;
            } else {
                return await reply("❌ Please reply to a message or enter a number.");
            }

            // 🔥 FIX: Baileys updateBlockStatus Bug Bypass (Unblock)
            await nethmina.query({
                tag: 'iq',
                attrs: {
                    to: '@s.whatsapp.net',
                    type: 'set',
                    xmlns: 'blocklist',
                },
                content: [
                    {
                        tag: 'item',
                        attrs: {
                            action: 'unblock',
                            jid: targetJid,
                        }
                    }
                ]
            });

            return await nethmina.sendMessage(from, {
                text: `✅ [Bypass Success] Successfully unblocked @${targetJid.split("@")[0]}.`,
                mentions: [targetJid]
            }, { quoted: mek });

        } catch (error) {
            console.error("Unblock Bypass Error:", error);
            await reply(`❌ Error: ${error.message || error}`);
        }
    }
);
