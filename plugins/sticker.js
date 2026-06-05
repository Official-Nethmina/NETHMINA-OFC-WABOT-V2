const { cmd } = require("../command");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys"); // ඔයා පාවිච්චි කරන baileys version එක අනුව මේක වෙනස් වෙන්න පුළුවන්
const { Sticker, StickerTypes } = require("wa-sticker-formatter");
const fs = require("fs");
const path = require("path");
const ffmpegPath = require('ffmpeg-static');
const { exec } = require('child_process');

// 🛠️ Helper function to download media from message
async function downloadMedia(message, type) {
    const stream = await downloadContentFromMessage(message, type);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }
    return buffer;
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
            // 🎯 Check if it's an image or video (or a reply to one)
            const isImage = m.quoted ? m.quoted.type === 'imageMessage' : m.type === 'imageMessage';
            const isVideo = m.quoted ? m.quoted.type === 'videoMessage' : m.type === 'videoMessage';
            const mediaMessage = m.quoted ? m.quoted : m;

            if (!isImage && !isVideo) {
                return reply("📸 Please reply to an image/video or send one with *.sticker*");
            }

            // Reaction
            await bot.sendMessage(from, { react: { text: "🎨", key: mek.key } });

            // Download media
            const mediaType = isImage ? 'image' : 'video';
            const buffer = await downloadMedia(mediaMessage, mediaType);

            // Create sticker
            const sticker = new Sticker(buffer, {
                pack: "Nethmina Bot Pack", // ඔයාට කැමති නමක් දාන්න
                author: "Machan",          // ඔයාට කැමති නමක් දාන්න
                type: StickerTypes.FULL,    // FULL, CROPPED, ROUNDED
                quality: 60                 // Sticker quality (0-100)
            });

            const stickerBuffer = await sticker.toBuffer();

            // Send sticker
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
            // 🎯 Check if it's a sticker reply
            const isSticker = m.quoted && m.quoted.type === 'stickerMessage';

            if (!isSticker) {
                return reply("🗿 Please reply to a sticker with *.take* command");
            }

            await bot.sendMessage(from, { react: { text: "🔄", key: mek.key } });

            // Download Sticker
            const stickerMessage = m.quoted;
            const buffer = await downloadMedia(stickerMessage, 'sticker');

            // Paths for temporary files
            const isAnimated = stickerMessage.isAnimated; // Animated sticker එකක්ද කියලා බලනවා
            const inputPath = path.join(__dirname, `../tmp_st_${Date.now()}.webp`);
            fs.writeFileSync(inputPath, buffer);

            if (isAnimated) {
                // 🎥 Animated Sticker to Video (MP4) conversion using FFMPEG
                const outputPath = path.join(__dirname, `../tmp_vid_${Date.now()}.mp4`);

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
                        reply("❌ Failed to convert animated sticker to video.");
                    } finally {
                        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                    }
                });

            } else {
                // 📸 Normal Sticker to Image (JPG) conversion using FFMPEG
                const outputPath = path.join(__dirname, `../tmp_img_${Date.now()}.jpg`);

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
