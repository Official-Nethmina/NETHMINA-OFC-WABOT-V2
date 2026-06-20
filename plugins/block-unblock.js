const { cmd } = require("../command");

// ==========================================
// 🚫 COMMAND 1: BLOCK USER
// ==========================================
cmd(
    {
        pattern: "block",
        desc: "Block a user from the bot.",
        category: "owner",
        filename: __filename,
    },
    async (nethmina, mek, sms, { from, args, q, sender, reply, isOwner }) => {
        try {
            if (!isOwner) return await reply("❌ This command is only for my Admin/Owner! 🧑🏻‍💻");

            let targetJid;

            // 1️⃣ Reply කරපු මැසේජ් එකෙන් JID එක අල්ලගන්න ක්‍රම (Fallbacks සහිතව)
            if (sms && sms.quoted && sms.quoted.sender) {
                targetJid = sms.quoted.sender;
            } else if (mek.message?.extendedTextMessage?.contextInfo?.participant) {
                targetJid = mek.message.extendedTextMessage.contextInfo.participant;
            } 
            // 2️⃣ නම්බර් එකක් Type කරලා තිබ්බොත් (.block 076xxxxxxx)
            else if (q) {
                let cleanNumber = q.replace(/[^0-9]/g, ""); // ඉලක්කම් විතරක් ගන්නවා
                
                // නම්බර් එක 0න් පටන් ගත්තොත් ඒක 94 වලට හරවනවා (Sri Lanka Country Code)
                if (cleanNumber.startsWith("0")) {
                    cleanNumber = "94" + cleanNumber.slice(1);
                }
                
                targetJid = `${cleanNumber}@s.whatsapp.net`;
            } else {
                return await reply("❌ Please reply to a user's message or provide a phone number with country code!\n\n*Example:* `.block 0760127262` or reply with `.block` ");
            }

            // 🛠️ Baileys Block Function එක රන් කිරීම
            await nethmina.updateBlockStatus(targetJid, "block");
            
            await nethmina.sendMessage(from, {
                text: `✅ Successfully blocked @${targetJid.split("@")[0]} from WhatsApp.`,
                mentions: [targetJid]
            }, { quoted: mek });

        } catch (error) {
            console.error("Block Error:", error);
            // 🎯 සිදුවන සැබෑ Error එක චැට් එකට පෙන්වීම
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
        desc: "Unblock a previously blocked user.",
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
            } 
            else if (q) {
                let cleanNumber = q.replace(/[^0-9]/g, "");
                
                if (cleanNumber.startsWith("0")) {
                    cleanNumber = "94" + cleanNumber.slice(1);
                }
                
                targetJid = `${cleanNumber}@s.whatsapp.net`;
            } else {
                return await reply("❌ Please reply to a user's message or provide a phone number with country code!\n\n*Example:* `.unblock 0760127262` or reply with `.unblock` ");
            }

            // 🛠️ Baileys Unblock Function එක රන් කිරීම
            await nethmina.updateBlockStatus(targetJid, "unblock");
            
            await nethmina.sendMessage(from, {
                text: `✅ Successfully unblocked @${targetJid.split("@")[0]}.`,
                mentions: [targetJid]
            }, { quoted: mek });

        } catch (error) {
            console.error("Unblock Error:", error);
            await reply(`❌ Error: ${error.message || error}`);
        }
    }
);
