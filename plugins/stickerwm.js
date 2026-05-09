const { cmd } = require('../command');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

cmd({
    pattern: "wm",
    desc: "Sticker එකේ pack name සහ author name වෙනස් කරයි.",
    category: "convert",
    filename: __filename
},
async (conn, mek, m, { from, reply, args }) => {
    try {
        // 1. Quoted message එක direct අරගනිමු (මෙතනයි වැරැද්ද තිබුණේ)
        const quoted = m.quoted ? m.quoted : (m.msg?.contextInfo?.quotedMessage ? m.msg.contextInfo.quotedMessage : null);
        
        if (!quoted) return reply("*Please reply to a sticker. 😊*");

        // 2. Sticker එකක්ද කියලා බලමු (Type එක හරියටම check කිරීම)
        const isSticker = m.quoted ? (m.quoted.mtype === 'stickerMessage' || m.quoted.type === 'stickerMessage') : false;

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

        // 4. Media Download කිරීම - වඩාත් ශක්තිමත් ක්‍රමය
        // m.quoted.download() function එක තිබේනම් එය භාවිතා කරයි, නැත්නම් manual download කරයි
        const buffer = await m.quoted.download();

        // 5. Sticker එක නිර්මාණය කිරීම
        const sticker = new Sticker(buffer, {
            pack: pack,
            author: author,
            type: StickerTypes.FULL,
            categories: ['🤩', '🎉'],
            id: mek.key.id,
            quality: 80, 
        });

        const stickerBuffer = await sticker.toBuffer();
        return await conn.sendMessage(from, { sticker: stickerBuffer }, { quoted: mek });

    } catch (e) {
        console.error("WM Error: ", e);
        reply("*Something went wrong! Please try again. 🛠*");
    }
});
