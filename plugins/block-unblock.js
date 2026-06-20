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

            // 1️⃣ Reply කරපු මැසේජ් එකෙන් JID එක අල්ලගන්න ක්‍රම
            if (sms && sms.quoted && sms.quoted.sender) {
                targetJid = sms.quoted.sender;
            } else if (mek.message?.extendedTextMessage?.contextInfo?.participant) {
                targetJid = mek.message.extendedTextMessage.contextInfo.participant;
            } 
            // 2️⃣ නම්බර් එකක් Type කරලා තිබ්බොත් (.block 076xxxxxxx)
            else if (q) {
                let cleanNumber = q.replace(/[^0-9]/g, "");
                if (cleanNumber.startsWith("0")) {
                    cleanNumber = "94" + cleanNumber.slice(1);
                }
                targetJid = `${cleanNumber}@s.whatsapp.net`;
            } else {
                return await reply("❌ Please reply to a user's message or provide a phone number with country code!\n\n*Example:* `.block 0760127262` or reply with `.block` ");
            }

            // 🛡️ Baileys `bad-request` එක මඟහැරීමට Fallback Loop එකක් (ක්‍රම 3ක් ට්‍රයි කරයි)
            let success = false;
            let lastError = "";

            // ක්‍රමය A: සාමාන්‍ය JID එකෙන් (@s.whatsapp.net)
            try {
                await nethmina.updateBlockStatus(targetJid, "block");
                success = true;
            } catch (err) {
                lastError = err.message || err;
            }

            // ක්‍රමය B: සාමාන්‍ය JID එක ෆේල් වුනොත් `@lid` එකට හරවා උත්සාහ කිරීම (Bad-request එකට ස්ථිර විසඳුම)
            if (!success && targetJid.includes("@s.whatsapp.net")) {
                try {
                    let lidJid = targetJid.replace("@s.whatsapp.net", "@lid");
                    await nethmina.updateBlockStatus(lidJid, "block");
                    success = true;
                } catch (err) {
                    lastError = err.message || err;
                }
            }

            // ක්‍රමය C: බොට්ගේ On-wa චෙක් එකක් දාලා සැබෑ JID එකෙන්ම ට්‍රයි කිරීම
            if (!success) {
                try {
                    const [result] = await nethmina.onWhatsApp(targetJid);
                    if (result && result.exists) {
                        await nethmina.updateBlockStatus(result.jid, "block");
                        success = true;
                    }
                } catch (err) {
                    lastError = err.message || err;
                }
            }

            // ප්‍රතිඵලය පරිශීලකයාට දැනුම්දීම
            if (success) {
                return await nethmina.sendMessage(from, {
                    text: `✅ Successfully blocked @${targetJid.split("@")[0]} from WhatsApp.`,
                    mentions: [targetJid]
                }, { quoted: mek });
            } else {
                return await reply(`❌ Failed to block user.\nReason: ${lastError}`);
            }

        } catch (error) {
            console.error("Block Error:", error);
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

            // 🔓 Unblock එකටත් Fallback Loop එකම භාවිතා කරමු
            let success = false;
            let lastError = "";

            try {
                await nethmina.updateBlockStatus(targetJid, "unblock");
                success = true;
            } catch (err) {
                lastError = err.message || err;
            }

            if (!success && targetJid.includes("@s.whatsapp.net")) {
                try {
                    let lidJid = targetJid.replace("@s.whatsapp.net", "@lid");
                    await nethmina.updateBlockStatus(lidJid, "unblock");
                    success = true;
                } catch (err) {
                    lastError = err.message || err;
                }
            }

            if (success) {
                return await nethmina.sendMessage(from, {
                    text: `✅ Successfully unblocked @${targetJid.split("@")[0]}.`,
                    mentions: [targetJid]
                }, { quoted: mek });
            } else {
                return await reply("❌ Failed to unblock user. " + lastError);
            }

        } catch (error) {
            console.error("Unblock Error:", error);
            await reply(`❌ Error: ${error.message || error}`);
        }
    }
);
