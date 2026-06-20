const { cmd } = require("../command");

// ==========================================
// 🚫 COMMAND 1: BLOCK USER (Forced Usync Hack)
// ==========================================
cmd(
    {
        pattern: "block",
        desc: "Strict block a user using usync query bypass.",
        category: "owner",
        filename: __filename,
    },
    async (nethmina, mek, sms, { from, args, q, sender, reply, isOwner }) => {
        try {
            if (!isOwner) return await reply("❌ This command is only for my Admin/Owner! 🧑🏻‍💻");

            let targetJid;

            if (sms && sms.quoted && sms.smsQuotedMsgs) {
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

            // 🔥 HACK: `usync` Node එක manually සකසා සර්වර් එකට යැවීම
            // මේකෙන් ඕනෑම පැරණි හෝ Custom Baileys වර්ෂන් එකක bad-request එන එක වළකිනවා
            await nethmina.query({
                tag: 'iq',
                attrs: {
                    to: '@s.whatsapp.net',
                    type: 'set',
                    id: nethmina.generateMessageID(),
                    xmlns: 'privacy'
                },
                content: [
                    {
                        tag: 'list',
                        attrs: { name: 'default', action: 'deny' },
                        content: [
                            {
                                tag: 'item',
                                attrs: { value: targetJid, type: 'jid', action: 'deny' }
                            }
                        ]
                    }
                ]
            });

            return await nethmina.sendMessage(from, {
                text: `✅ [Strict Blocked] Successfully blocked @${targetJid.split("@")[0]} inside WhatsApp Server.`,
                mentions: [targetJid]
            }, { quoted: mek });

        } catch (error) {
            console.error("Strict Block Error:", error);
            await reply(`❌ Error: ${error.message || error}`);
        }
    }
);

// ==========================================
// 🔓 COMMAND 2: UNBLOCK USER (Forced Usync Hack)
// ==========================================
cmd(
    {
        pattern: "unblock",
        desc: "Strict unblock a user using privacy query bypass.",
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

            // 🔥 HACK: Privacy list එකෙන් 'none' (allow) කිරීම
            await nethmina.query({
                tag: 'iq',
                attrs: {
                    to: '@s.whatsapp.net',
                    type: 'set',
                    id: nethmina.generateMessageID(),
                    xmlns: 'privacy'
                },
                content: [
                    {
                        tag: 'list',
                        attrs: { name: 'default', action: 'allow' },
                        content: [
                            {
                                tag: 'item',
                                attrs: { value: targetJid, type: 'jid', action: 'allow' }
                            }
                        ]
                    }
                ]
            });

            return await nethmina.sendMessage(from, {
                text: `✅ [Strict Unblocked] Successfully unblocked @${targetJid.split("@")[0]}.`,
                mentions: [targetJid]
            }, { quoted: mek });

        } catch (error) {
            console.error("Strict Unblock Error:", error);
            await reply(`❌ Error: ${error.message || error}`);
        }
    }
);
