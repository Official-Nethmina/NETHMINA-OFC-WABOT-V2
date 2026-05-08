const { cmd } = require('../command');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

cmd({
    pattern: "wm",
    desc: "Sticker එකේ pack name සහ author name වෙනස් කරයි.",
    category: "convert",
    filename: __filename
},
async (conn, mek, m, { from, reply, quoted, body, args }) => {
    try {
        // 1. Quoted message එකක් තියෙනවාද බලනවා
        if (!quoted) return reply("*Please reply to a sticker. 😊*");

        // 2. Sticker එකක්ද කියලා හරියටම check කරනවා (mtype හෝ type පාවිච්චි කරමින්)
        const isSticker = quoted.mtype === 'stickerMessage' || 
                          quoted.type === 'stickerMessage' ||
                          (quoted.message && quoted.message.stickerMessage);

        if (!isSticker) return reply("*You did not reply to a sticker. Please reply to a sticker. 🙂*");

        // Default Watermark values
        let pack = "💟 𝙽𝙴𝚃𝙷𝙼𝙸𝙽𝙰 - 𝚂𝚃𝙸𝙲𝙺𝙴𝚁𝚂 💟"; 
        let author = "© 🧑🏻‍💻 ɴᴇᴛʜᴍɪɴᴀ ᴏꜰꜰɪᴄɪᴀʟ ᴄᴏᴍᴍᴜɴɪᴛʏ 🧑🏻‍💻";

        // 3. User පරාමිතීන් දීලා තියෙනවා නම් (e.g. .wm MyPack | MyName)
        const input = args.join(" ");
        if (input && input.includes('|')) {
            const [p, a] = input.split('|');
            pack = p.trim() || pack;
            author = a.trim() || author;
        }

        await conn.sendMessage(from, { react: { text: '🖊️', key: mek.key } });

        // 4. Sticker content එක නිවැරදිව ලබා ගැනීම
        const stickerMsg = quoted.message?.stickerMessage || quoted;
        
        // 5. Download Media Buffer
        const stream = await downloadContentFromMessage(stickerMsg, 'sticker');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        const sticker = new Sticker(buffer, {
            pack: pack,
            author: author,
            type: StickerTypes.FULL,
            categories: ['🤩', '🎉'],
            id: mek.key.id,
            quality: 100, // Quality එක 100 කළා
        });

        const stickerBuffer = await sticker.toBuffer();
        return await conn.sendMessage(from, { sticker: stickerBuffer }, { quoted: mek });

    } catch (e) {
        console.error("WM Error: ", e);
        reply("*Something went wrong! Please try again. 🛠*");
    }
});
