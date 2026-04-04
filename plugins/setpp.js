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

        // Image එකක්ද බලමු
        const quotedMsg = m.quoted ? m.quoted : mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const isImage = quotedMsg?.imageMessage || quotedMsg?.viewOnceMessage?.message?.imageMessage || quotedMsg?.viewOnceMessageV2?.message?.imageMessage;

        if (!isImage) {
            return reply("❌ Please reply to an *image* to set it as full size PP.");
        }

        await conn.sendMessage(from, { react: { text: '📸', key: mek.key } }).catch(() => null);

        // --- ස්ථාවරව පින්තූරය Download කිරීම ---
        const downloadMsg = m.quoted ? m.quoted : m;
        const buffer = await downloadMsg.download(); 
        
        if (!buffer) return reply("❌ Failed to download image. Try again.");

        // Jimp හරහා සැකසීම
        const jimpImage = await Jimp.read(buffer);
        const img = await jimpImage
            .quality(100)
            .getBufferAsync(Jimp.MIME_JPEG);

        const botJid = conn.user.id.split(":")[0] + "@s.whatsapp.net";
        await conn.updateProfilePicture(botJid, img);

        return reply("✅ *𝐁ᴏᴛ 𝐅ᴜʟʟ 𝐒ɪᴢᴇ 𝐏𝐏 𝐔ᴘᴅᴀᴛᴇᴅ 𝐒ᴜᴄᴄᴇssꜰᴜʟʟ𝐲!*");

    } catch (e) {
        console.error("FullPP Error:", e);
        // Error එක මොකක්ද කියලා හරියටම දැනගන්න e.message එක දැම්මා
        reply(`❌ Error: ${e.message}`);
    }
});
