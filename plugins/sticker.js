const { cmd } = require("../command");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys"); 
const { Sticker, StickerTypes } = require("wa-sticker-formatter");
const fs = require("fs");
const path = require("path");
const ffmpegPath = require('ffmpeg-static');
const { exec } = require('child_process');

// 🛠️ FIXED: Clean and working media downloader function
async function downloadMedia(message, type) {
    try {
        // message.message ඇතුලේ තියෙන සැබෑ media object එක ගන්නවා
        const mediaObject = message.message?.[`${type}Message`] || message[`${type}Message`] || message;
        
        if (!mediaObject) throw new Error("Media object not found");

        const stream = await downloadContentFromMessage(mediaObject, type);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        return buffer;
    } catch (err) {
        console.error("Download function error:", err);
        return null;
    }
}

// ==========================================
// 🎨 IMAGE/VIDEO TO STICKER CONVERTER
// ==========================================
cmd(
    {
        pattern: "sticker",
        alias: ["s", "stiker"],
        desc: "Convert Image or Video to Sticker",
        category: "convert",
        filename: __filename,
    },
    async (bot, mek, m, { from, reply }) => {
        try {
            // Target message එක quoted ද නැද්ද කියලා බලනවා
            const target = m.quoted ? m.quoted : m;
            
            // Image එකක්ද Video එකක්ද කියලා නිවැරදිව හොයාගන්නවා
            const isImage = m.quoted ? (m.quoted.type === 'imageMessage' || m.quoted.imageMessage) : (m.type === 'imageMessage');
            const isVideo = m.quoted ? (m.quoted.type === 'videoMessage' || m.quoted.videoMessage) : (m.type === 'videoMessage');

            if (!isImage && !isVideo) {
                return reply("📸 Please reply to an image/video or send one with *.sticker*");
            }

            await bot.sendMessage(from, { react: { text: "🎨", key: mek.key } });

            // Media එක download කරගන්නවා
            const mediaType = isImage ? 'image' : 'video';
            const buffer = await downloadMedia(target, mediaType);

            if (!buffer) {
                return reply("❌ Failed to download media. Please try again.");
            }

            // Create sticker
            const sticker = new Sticker(buffer, {
                pack: "💟 𝙽𝙴𝚃𝙷𝙼𝙸𝙽𝙰 - 𝚂𝚃𝙸𝙲𝙺𝙴𝚁𝚂 💟", 
                author: "© 🧑🏻‍💻 ɴᴇᴛʜᴍɪɴᴀ ᴏꜰꜰɪᴄɪᴀʟ ᴄᴏᴍᴍᴜɴɪᴛʏ 🧑🏻‍💻",          
                type: StickerTypes.FULL,    
                quality: 75                 
            });

            const stickerBuffer = await sticker.toBuffer();
            await bot.sendMessage(from, { sticker: stickerBuffer }, { quoted: mek });

        } catch (e) {
            console.error("STICKER ERROR:", e);
            reply("❌ Error while creating sticker! Make sure the video is short (under 7s).");
        }
    }
);

// ==========================================
// 🖼️ STICKER TO IMAGE/VIDEO CONVERTER (TAKE)
// ==========================================
cmd(
    {
        pattern: "take",
        alias: ["toimg", "tovideo", "photo"],
        desc: "Convert Sticker back to Image or Video",
        category: "convert",
        filename: __filename,
    },
    async (bot, mek, m, { from, reply }) => {
        try {
            const isSticker = m.quoted && (m.quoted.type === 'stickerMessage' || m.quoted.stickerMessage);

            if (!isSticker) {
                return reply("🗿 Please reply to a sticker with *.take* command");
            }

            await bot.sendMessage(from, { react: { text: "🔄", key: mek.key } });

            // Sticker එක download කරගන්නවා
            const buffer = await downloadMedia(m.quoted, 'sticker');
            if (!buffer) {
                return reply("❌ Failed to download sticker.");
            }

            // Animated ද නැද්ද කියලා check කරනවා
            const stickerData = m.quoted.message?.stickerMessage || m.quoted;
            const isAnimated = stickerData.isAnimated === true || stickerData.isAnimated === 'true';

            // Temp directory එකක් නැත්නම් හදාගන්නවා
            const tmpDir = path.join(__dirname, '../tmp');
            if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

            const inputPath = path.join(tmpDir, `st_${Date.now()}.webp`);
            fs.writeFileSync(inputPath, buffer);

            if (isAnimated) {
                // 🎥 Animated Sticker to Video (MP4)
                const outputPath = path.join(tmpDir, `vid_${Date.now()}.mp4`);

                exec(`"${ffmpegPath}" -vcodec libwebp -i "${inputPath}" -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" "${outputPath}" -y`, async (err) => {
                    try {
                        if (err) throw err;

                        await bot.sendMessage(from, {
                            video: fs.readFileSync(outputPath),
                            mimetype: "video/mp4",
                            caption: "🔄 Sticker successfully converted to Video!"
                        }, { quoted: mek });

                    } catch (vidErr) {
                        console.error(vidErr);
                        reply("❌ Failed to convert animated sticker. Make sure ffmpeg-static is installed.");
                    } finally {
                        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                    }
                });

            } else {
                // 📸 Normal Sticker to Image (JPG)
                const outputPath = path.join(tmpDir, `img_${Date.now()}.jpg`);

                exec(`"${ffmpegPath}" -i "${inputPath}" "${outputPath}" -y`, async (err) => {
                    try {
                        if (err) throw err;

                        await bot.sendMessage(from, {
                            image: fs.readFileSync(outputPath),
                            caption: "🔄 Sticker successfully converted to Image!"
                        }, { quoted: mek });

                    } catch (imgErr) {
                        console.error(imgErr);
                        reply("❌ Failed to convert sticker to image.");
                    } finally {
                        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                    }
                });
            }

        } catch (e) {
            console.error("TAKE ERROR:", e);
            reply("❌ Something went wrong while converting the sticker.");
        }
    }
);
