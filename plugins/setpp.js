const { cmd } = require('../command');
const Jimp = require('jimp');

cmd({
    pattern: "setpp",
    alias: ["fullpp", "setbotpp"],
    desc: "Set bot profile picture without cropping (Full Size).",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { from, isOwner, reply }) => { // මෙතන isOwner ලෙස වෙනස් කළා
    try {
        // 1. Owner Check (දැන් index.js එකෙන් එන isOwner මෙතන වැඩ කරනවා)
        if (!isOwner) return reply("❌ This command is only for the bot owner.");

        // 2. Quoted Image එකක්ද බලන්න
        if (!m.quoted || !['imageMessage'].includes(m.quoted.mtype)) {
            return reply("❌ Please reply to an *image* to set it as full size PP.");
        }

        await conn.sendMessage(from, { react: { text: '📸', key: mek.key } }).catch(() => null);

        // 3. පින්තූරය Download කර ගැනීම
        const buffer = await m.quoted.download();
        
        // 4. Jimp හරහා Full Size සකස් කිරීම
        const jimpImage = await Jimp.read(buffer);
        const width = jimpImage.getWidth();
        const height = jimpImage.getHeight();
        
        // Quality එක 100% තබාගෙන Buffer එකක් ලබා ගැනීම
        const img = await jimpImage
            .quality(100)
            .getBufferAsync(Jimp.MIME_JPEG);

        // 5. WhatsApp සර්වර් එකට Update එක යැවීම
        // conn.user.id එකෙන් bot ගේ JID එක නිවැරදිව ලබා ගැනීම
        const botJid = conn.user.id.split(":")[0] + "@s.whatsapp.net";
        await conn.updateProfilePicture(botJid, img);

        return reply("✅ *𝐁ᴏᴛ 𝐅ᴜʟʟ 𝐒ɪᴢᴇ 𝐏𝐏 𝐔ᴘᴅᴀᴛᴇᴅ 𝐒ᴜᴄᴄᴇssꜰᴜʟʟ𝐲!*");

    } catch (e) {
        console.error("FullPP Error:", e);
        reply("❌ Error updating PP. Make sure 'jimp' is installed.");
    }
});
