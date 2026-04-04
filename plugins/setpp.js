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

        const quotedMsg = m.quoted ? m.quoted : mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const isImage = quotedMsg?.imageMessage || quotedMsg?.viewOnceMessage?.message?.imageMessage || quotedMsg?.viewOnceMessageV2?.message?.imageMessage;

        if (!isImage) return reply("❌ Please reply to an *image*.");

        await conn.sendMessage(from, { react: { text: '📸', key: mek.key } }).catch(() => null);

        const buffer = await m.quoted.download();
        const jimpImage = await Jimp.read(buffer);
        
        const width = jimpImage.getWidth();
        const height = jimpImage.getHeight();
        const size = Math.max(width, height); // වැඩිම පැත්ත ගනියි (Square එකක් හදන්න)

        // 1:1 ලස්සනට පේන්න වටේට Transparent canvas එකක් හදනවා
        const canvas = new Jimp(size, size, 0x00000000); // Transparent Background
        
        // පින්තූරය canvas එකේ මැදට තියනවා
        canvas.composite(jimpImage, (size - width) / 2, (size - height) / 2);
        
        const img = await canvas
            .quality(100)
            .getBufferAsync(Jimp.MIME_JPEG);

        const botJid = conn.user.id.split(":")[0] + "@s.whatsapp.net";
        await conn.updateProfilePicture(botJid, img);

        return reply("✅ *𝐁ᴏᴛ 𝐅ᴜʟʟ 𝐒ɪᴢᴇ 𝐏𝐏 𝐔ᴘᴅᴀᴛᴇᴅ 𝐒ᴜᴄᴄᴇssꜰᴜʟʟ𝐲!*");

    } catch (e) {
        console.error("FullPP Error:", e);
        reply(`❌ Error: ${e.message}`);
    }
});
