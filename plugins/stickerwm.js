const { cmd } = require('../command');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

cmd({
    pattern: "wm",
    desc: "Sticker එකේ pack name සහ author name වෙනස් කරයි.",
    category: "convert",
    filename: __filename
},
async (conn, mek, m, { from, reply, quoted, args }) => {
    try {
        // 1. Quoted check - Baileys වල quoted message එක තියෙන්නේ මෙහෙමයි
        if (!quoted) return reply("*Please reply to a sticker. 😊*");

        // 2. Sticker එකක්ද කියලා හරියටම check කරනවා (සියලුම අවස්ථා ආවරණය වන පරිදි)
        const mime = quoted.mimetype || quoted.msg?.mimetype || '';
        const isSticker = mime.includes('sticker') || quoted.type === 'stickerMessage' || quoted.mtype === 'stickerMessage';

        if (!isSticker) return reply("*You did not reply to a sticker. Please reply to a sticker. 🙂*");

        // Default Watermark values
        let pack = "💟 𝙽𝙴𝚃𝙷𝙼𝙸𝙽𝙰 - 𝚂𝚃𝙸𝙲𝙺𝙴𝚁𝚂 💟"; 
        let author = "© 🧑🏻‍💻 ɴᴇᴛʜᴍɪɴᴀ ᴏꜰꜰɪᴄɪᴀʟ ᴄᴏᴍᴍᴜɴɪᴛʏ 🧑🏻‍💻";

        // 3. User පරාමිතීන් (Custom Pack | Author)
        const input = args.join(" ");
        if (input && input.includes('|')) {
            const [p, a] = input.split('|');
            pack = p.trim() || pack;
            author = a.trim() || author;
        }

        await conn.sendMessage(from, { react: { text: '🖊️', key: mek.key } });

        // 4. Media Download කිරීම - වඩාත් ආරක්ෂිත ක්‍රමය
        const msg = quoted.msg || quoted; // Sticker data තියෙන තැන
        const stream = await downloadContentFromMessage(msg, 'sticker');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // 5. Sticker එක නිර්මාණය කිරීම
        const sticker = new Sticker(buffer, {
            pack: pack,
            author: author,
            type: StickerTypes.FULL,
            categories: ['🤩', '🎉'],
            id: mek.key.id,
            quality: 80, // Quality එක 70-80 තැබීම වඩාත් සුදුසුයි Sticker size එක ලිමිට් එකේ තියාගන්න
        });

        const stickerBuffer = await sticker.toBuffer();
        return await conn.sendMessage(from, { sticker: stickerBuffer }, { quoted: mek });

    } catch (e) {
        console.error("WM Error: ", e);
        reply("*Something went wrong! Please try again. 🛠*");
    }
});
