const { cmd } = require('../command');

cmd({
    pattern: "setpp",
    alias: ["setbotpp", "botpp"],
    desc: "Set bot profile picture (Normal Crop).",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { from, isOwner, reply }) => {
    try {
        // 1. Owner Check
        if (!isOwner) return reply("❌ This command is only for the bot owner.");

        // 2. Image එකක්ද බලමු (m.quoted හරහා)
        const quotedMsg = m.quoted ? m.quoted : mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const isImage = quotedMsg?.imageMessage || quotedMsg?.viewOnceMessage?.message?.imageMessage || quotedMsg?.viewOnceMessageV2?.message?.imageMessage;

        if (!isImage) {
            return reply("❌ Please reply to an *image* to set it as bot profile picture.");
        }

        await conn.sendMessage(from, { react: { text: '📸', key: mek.key } }).catch(() => null);

        // 3. පින්තූරය Download කර ගැනීම
        // m.quoted.download() එක index.js එකේ අපි හදපු sms(conn, mek) එක හරහා වැඩ කරනවා
        const buffer = await m.quoted.download();

        if (!buffer) return reply("❌ Failed to download the image. Please try again.");

        // 4. WhatsApp Profile Picture එක Update කිරීම
        const botJid = conn.user.id.split(":")[0] + "@s.whatsapp.net";
        
        await conn.updateProfilePicture(botJid, buffer);

        return reply("✅ *𝐁ᴏᴛ 𝐏ʀᴏꜰɪʟᴇ 𝐏ɪᴄᴛᴜʀᴇ 𝐔ᴘᴅᴀᴛᴇᴅ 𝐒ᴜᴄᴄᴇssꜰᴜʟʟ𝐲!*");

    } catch (e) {
        console.error("SetPP Error:", e);
        reply(`❌ Error: ${e.message}`);
    }
});
