const { cmd } = require('../command');
const Jimp = require('jimp');

cmd({
    pattern: "setpp",
    alias: ["fullpp", "setbotpp"],
    desc: "Set bot profile picture without cropping (Full Size).",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { from, isOwner, reply }) => {
    try {
        if (!isOwner) return reply("❌ This command is only for the bot owner.");

        // --- 2. IMAGE DETECTION FIX ---
        // මෙතනදී අපි බලනවා රිප්ලයි කරපු මැසේජ් එකේ imageMessage එකක් තියෙනවාද කියලා
        const quotedMsg = m.quoted ? m.quoted : mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const isImage = quotedMsg?.imageMessage || quotedMsg?.viewOnceMessage?.message?.imageMessage || quotedMsg?.viewOnceMessageV2?.message?.imageMessage;

        if (!isImage) {
            return reply("❌ Please reply to an *image* to set it as full size PP.");
        }
        // ------------------------------

        await conn.sendMessage(from, { react: { text: '📸', key: mek.key } }).catch(() => null);

        // 3. පින්තූරය Download කර ගැනීම (m.quoted හරහා හෝ කෙලින්ම)
        const buffer = await m.quoted.download();
        
        const jimpImage = await Jimp.read(buffer);
        const img = await jimpImage
            .quality(100)
            .getBufferAsync(Jimp.MIME_JPEG);

        const botJid = conn.user.id.split(":")[0] + "@s.whatsapp.net";
        await conn.updateProfilePicture(botJid, img);

        return reply("✅ *𝐁ᴏᴛ 𝐅ᴜʟʟ 𝐒ɪᴢᴇ 𝐏𝐏 𝐔ᴘᴅᴀᴛᴇᴅ 𝐒ᴜᴄᴄᴇssꜰᴜʟʟ𝐲!*");

    } catch (e) {
        console.error("FullPP Error:", e);
        reply("❌ Error updating PP. Make sure 'jimp' is installed.");
    }
});
