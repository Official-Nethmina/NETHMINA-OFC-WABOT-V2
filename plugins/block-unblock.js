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
            // 🛑 Owner කෙනෙක්ද කියලා මුලින්ම චෙක් කරනවා
            if (!isOwner) return await reply("❌ This command is only for my Admin/Owner! 🧑🏻‍💻");

            let targetJid;

            // 1️⃣ User කෙනෙක්ගේ මැසේජ් එකකට Reply කරලා තිබ්බොත් ඒකෙන් JID එක ගන්නවා
            if (mek.message?.extendedTextMessage?.contextInfo?.participant) {
                targetJid = mek.message.extendedTextMessage.contextInfo.participant;
            } 
            // 2️⃣ නම්බර් එකක් text එකක් විදියට දීලා තිබ්බොත් (.block 9476xxxxxxx)
            else if (q) {
                let cleanNumber = q.replace(/[^0-9]/g, ""); // ඉලක්කම් ටික විතරක් ගන්නවා
                targetJid = `${cleanNumber}@s.whatsapp.net`;
            } 
            // කිසිවක් කර නැත්නම් උපදෙස් දෙනවා
            else {
                return await reply("❌ Please reply to a user's message or provide a phone number with country code!\n\n*Example:* `.block 94760860835` or reply with `.block` ");
            }

            // 🛠️ Baileys Block Function
            await nethmina.updateBlockStatus(targetJid, "block");
            
            // Tag කරලා මැසේජ් එකක් යැවීම
            await nethmina.sendMessage(from, {
                text: `✅ Successfully blocked @${targetJid.split("@")[0]} from WhatsApp.`,
                mentions: [targetJid]
            }, { quoted: mek });

        } catch (error) {
            console.error("Block Command Error:", error);
            await reply("❌ Failed to block the user. Make sure the number is valid.");
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
            // 🛑 Owner කෙනෙක්ද කියලා මුලින්ම චෙක් කරනවා
            if (!isOwner) return await reply("❌ This command is only for my Admin/Owner! 🧑🏻‍💻");

            let targetJid;

            // 1️⃣ User කෙනෙක්ගේ මැසේජ් එකකට Reply කරලා තිබ්බොත් ඒකෙන් JID එක ගන්නවා
            if (mek.message?.extendedTextMessage?.contextInfo?.participant) {
                targetJid = mek.message.extendedTextMessage.contextInfo.participant;
            } 
            // 2️⃣ නම්බර් එකක් text එකක් විදියට දීලා තිබ්බොත් (.unblock 9476xxxxxxx)
            else if (q) {
                let cleanNumber = q.replace(/[^0-9]/g, "");
                targetJid = `${cleanNumber}@s.whatsapp.net`;
            } 
            // කිසිවක් කර නැත්නම් උපදෙස් දෙනවා
            else {
                return await reply("❌ Please reply to a user's message or provide a phone number with country code!\n\n*Example:* `.unblock 94760860835` or reply with `.unblock` ");
            }

            // 🛠️ Baileys Unblock Function
            await nethmina.updateBlockStatus(targetJid, "unblock");
            
            // Tag කරලා මැසේජ් එකක් යැවීම
            await nethmina.sendMessage(from, {
                text: `✅ Successfully unblocked @${targetJid.split("@")[0]}. Now they can message you.`,
                mentions: [targetJid]
            }, { quoted: mek });

        } catch (error) {
            console.error("Unblock Command Error:", error);
            await reply("❌ Failed to unblock the user.");
        }
    }
);
