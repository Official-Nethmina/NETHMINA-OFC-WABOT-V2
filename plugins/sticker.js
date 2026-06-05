const { cmd } = require("../command");
const { downloadMediaMessage } = require("@whiskeysockets/baileys"); // 🎯 Baileys official downloader එක
const { Sticker, StickerTypes } = require("wa-sticker-formatter");
const fs = require("fs");
const path = require("path");
const ffmpegPath = require('ffmpeg-static');
const { exec } = require('child_process');

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
            // 🎯 Check where the media is (direct message or quoted reply)
            const isGroup = from.endsWith('@g.us');
            const targetMessage = m.quoted ? m.quoted : m;
            
            // Get the type of message
            const msgType = m.quoted ? m.quoted.type : m.type;

            // Check if it is an image or video
            const isImage = msgType === 'imageMessage' || (m.quoted && m.quoted.imageMessage);
            const isVideo = msgType === 'videoMessage' || (m.quoted && m.quoted.videoMessage);

            if (!isImage && !isVideo) {
                return reply("📸 Please reply to an image/video or send one with *.sticker*");
            }

            // Reaction
            await bot.sendMessage(from, { react: { text: "🎨", key: mek.key } });

            // 🎯 FIXED: Official Baileys media downloader එක පාවිච්චි කිරීම
            // මේකෙන් image/video decryption ප්‍රශ්න සේරම විසඳෙනවා
            let buffer;
            if (m.quoted) {
                // Quoted message එකක් download කරන්න (Baileys structured format එකට හදාගන්නවා)
                const quotedKey = {
                    key: {
                        remoteJid: from,
                        fromMe: m.quoted.fromMe,
                        id: m.quoted.id,
                        participant: m.quoted.sender
                    },
                    message: m.quoted.message
                };
                buffer = await downloadMediaMessage(quotedKey, 'buffer', {}, { logger: console });
            } else {
                buffer = await downloadMediaMessage(mek, 'buffer', {}, { logger: console });
            }

            if (!buffer) return reply("❌ Failed to download media. Please try again.");

            // Create sticker
            const sticker = new Sticker(buffer, {
                pack: "Nethmina Bot Pack", 
                author: "Machan",          
                type: StickerTypes.FULL,    
                quality: 60                 
            });

            const stickerBuffer = await sticker.toBuffer();

            // Send sticker
            await bot.sendMessage(from, { sticker: stickerBuffer }, { quoted: mek });

        } catch (e) {
            console.error("STICKER ERROR:", e);
            reply("❌ Error while creating sticker! Make sure FFMPEG is working properly.");
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
            const isSticker = m.quoted && (m.quoted.type === 'stickerMessage' || m.quoted.stickerMessage);

            if (!isSticker) {
                return reply("🗿 Please reply to a sticker with *.take* command");
            }

            await bot.sendMessage(from, { react: { text: "🔄", key: mek.key } });

            // 🎯 FIXED: Sticker download එකත් නිවැරදිව සිද්ධ කිරීම
            const quotedKey = {
                key: {
                    remoteJid: from,
                    fromMe: m.quoted.fromMe,
                    id: m.quoted.id,
                    participant: m.quoted.sender
                },
                message: m.quoted.message
            };
            
            const buffer = await downloadMediaMessage(quotedKey, 'buffer', {}, { logger: console });
            if (!buffer) return reply("❌ Failed to download sticker.");

            // Animated sticker එකක්ද කියලා බලන්න ක්‍රම 2ක් check කරනවා
            const stickerData = m.quoted.message?.stickerMessage || m.quoted;
            const isAnimated = stickerData.isAnimated === true || stickerData.isAnimated === 'true';

            // Paths for temporary files
            const inputPath = path.join(__dirname, `../tmp_st_${Date.now()}.webp`);
            fs.writeFileSync(inputPath, buffer);

            if (isAnimated) {
                // 🎥 Animated Sticker to Video (MP4)
                const outputPath = path.join(__dirname, `../tmp_vid_${Date.now()}.mp4`);

                exec(`"${ffmpegPath}" -vcodec libwebp -i "${inputPath}" -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" "${outputPath}" -y`, async (err) => {
                    try {
                        if (err) {
                            console.error("FFMPEG ANIMATED ERROR:", err);
                            throw err;
                        }

                        await bot.sendMessage(from, {
                            video: fs.readFileSync(outputPath),
                            mimetype: "video/mp4",
                            caption: "🔄 Sticker successfully converted to Video!"
                        }, { quoted: mek });

                    } catch (vidErr) {
                        reply("❌ Failed to convert animated sticker to video. check if FFMPEG is installed.");
                    } finally {
                        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                    }
                });

            } else {
                // 📸 Normal Sticker to Image (JPG)
                const outputPath = path.join(__dirname, `../tmp_img_${Date.now()}.jpg`);

                exec(`"${ffmpegPath}" -i "${inputPath}" "${outputPath}" -y`, async (err) => {
                    try {
                        if (err) {
                            console.error("FFMPEG IMAGE ERROR:", err);
                            throw err;
                        }

                        await bot.sendMessage(from, {
                            image: fs.readFileSync(outputPath),
                            caption: "🔄 Sticker successfully converted to Image!"
                        }, { quoted: mek });

                    } catch (imgErr) {
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
