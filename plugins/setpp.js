const { cmd } = require('../command');
const Jimp = require('jimp'); // මේක අනිවාර්යයෙන්ම අවශ්‍යයි

cmd({
    pattern: "setpp",
    alias: ["fullpp", "setbotpp"],
    desc: "Set bot profile picture without cropping (Full Size).",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { from, isCreator, reply }) => {
    try {
        // 1. Owner Check
        if (!isCreator) return reply("❌ This command is only for the bot owner.");

        // 2. පින්තූරයක්ද බලන්න
        if (!m.quoted || !['imageMessage'].includes(m.quoted.mtype)) {
            return reply("❌ Please reply to an *image* to set it as full size PP.");
        }

        await conn.sendMessage(from, { react: { text: '📸', key: mek.key } }).catch(() => null);

        // 3. පින්තූරය Download කර ගැනීම
        const buffer = await m.quoted.download();
        
        // 4. Jimp හරහා Full Size Buffer එක සකස් කිරීම
        const jimpImage = await Jimp.read(buffer);
        const width = jimpImage.getWidth();
        const height = jimpImage.getHeight();
        const min = Math.min(width, height);
        const max = Math.max(width, height);
        
        // පින්තූරය Crop නොවී Quality එක රැකෙන සේ සකස් කිරීම
        const cropped = jimpImage.crop(0, 0, width, height);
        
        // ප්‍රමාණය සකස් කිරීම (WhatsApp වලට ගැලපෙන ලෙස)
        const img = await cropped
            .quality(100)
            .getBufferAsync(Jimp.MIME_JPEG);

        // 5. WhatsApp සර්වර් එකට Full Size Update එක යැවීම
        await conn.updateProfilePicture(conn.user.id, img);

        return reply("✅ *𝐁ᴏᴛ 𝐅ᴜʟʟ 𝐒ɪᴢᴇ 𝐏𝐏 𝐔ᴘᴅᴀᴛᴇᴅ 𝐒ᴜᴄᴄᴇssꜰᴜʟʟ𝐲!* \nNo cropping was applied.");

    } catch (e) {
        console.error("FullPP Error:", e);
        reply("❌ Error: Make sure 'jimp' is installed. (npm install jimp)");
    }
});
