const { cmd } = require("../command");
const { ytmp3, ytmp4, tiktok } = require("sadaslk-dlcore"); 
const yts = require("yt-search");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const ffmpegPath = require('ffmpeg-static');
const { exec } = require('child_process');

// 🎧 [VOICE NOTE CONVERTER]
function convertToOpus(input, output) {
  return new Promise((resolve, reject) => {
    exec(`"${ffmpegPath}" -i "${input}" -vn -c:a libopus -b:a 64k -vbr on "${output}" -y`, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

async function getYoutube(query) {
  const isUrl = /(youtube\.com|youtu\.be)/i.test(query);
  if (isUrl) {
    const id = query.split("v=")[1] || query.split("/").pop();
    const info = await yts({ videoId: id });
    return info;
  }

  const search = await yts(query);
  if (!search.videos.length) return null;
  return search.videos[0];
}

// ==========================================
// 🎧 YOUTUBE AUDIO DOWNLOADER
// ==========================================
cmd(
  {
    pattern: "song",
    alias: ["mp3", "ytmp3", "music"],
    desc: "Download Song",
    category: "download",
    filename: __filename,
  },
  async (bot, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("🎵 Send song name or YouTube link");

      // 🎯 Auto React for command execution
      await bot.sendMessage(from, { react: { text: "🎶", key: mek.key } });

      const video = await getYoutube(q);
      if (!video) return reply("❌ No results found");

      const mp3 = await ytmp3(video.url);
      if (!mp3?.url) return reply("❌ Failed to download MP3");

      let fileSize = "Unknown";
      try {
        const sizeRes = await axios.head(mp3.url);
        const bytes = sizeRes.headers['content-length'];
        if (bytes) {
          fileSize = (bytes / (1024 * 1024)).toFixed(2) + " MB";
        } else if (mp3.size) {
          fileSize = mp3.size;
        }
      } catch (err) {
        if (mp3.size) fileSize = mp3.size;
      }

      const caption = `*🎧 𝐒𝐎𝐍𝐆 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐑 🎧*

┌────────────●●►
├ *📀 \`Title\`* : ${video.title}
├ *⏱️ \`Duration\`* : ${video.timestamp}
├ *📆 \`Uploaded\`* : ${video.ago}
├ *👁️ \`Views:\`* : ${video.views.toLocaleString()}
├ *👍 \`Likes\`* :  ${video.likes || "N/A"}
├ *📡 \`Channel\`* :  ${video.author?.name || "Unknown"}
├ *🔗 \`Watch/Download\`* : ${video.url}
├ *📥 \`Size\`* : ${fileSize}
└────────────●●►

╭─〔 *🔢 SELECT FORMAT* 〕─
│
├ 1️⃣ *AUDIO TYPE*
├ 2️⃣ *DOCUMENT TYPE*
├ 3️⃣ *VOICE NOTE*
╰┈┈┈┈┈┈┈┈┈┈┈┈➤ˎˊ˗

> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴᴇᴛʜᴍɪɴᴀ ᴏꜰᴄ ||`;

      const sentMsg = await bot.sendMessage(
        from,
        {
          image: { url: video.thumbnail },
          caption,
        },
        { quoted: mek }
      );

      const messageId = sentMsg.key.id;

      if (!global.replyHandlers) global.replyHandlers = {};
      
      global.replyHandlers[messageId] = async (userReply) => {
        const choice = userReply.body.trim();
        const audioUrl = mp3.url;
        
        if (choice === "1") {
          await bot.sendMessage(from, { react: { text: "📥", key: userReply.key } });
          await bot.sendMessage(
            from,
            {
              audio: { url: audioUrl },
              mimetype: "audio/mpeg",
              fileName: `${video.title}.mp3`
            },
            { quoted: userReply }
          );
        } 
        else if (choice === "2") {
          await bot.sendMessage(from, { react: { text: "📥", key: userReply.key } });
          await bot.sendMessage(
            from,
            {
              document: { url: audioUrl },
              mimetype: "audio/mpeg",
              fileName: `${video.title}.mp3`,
              caption: `🎧 *${video.title}*\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴᴇᴛʜᴍɪɴᴀ ᴏꜰᴄ ||` // 🎯 මෙන්න මෙතනට කැප්ෂන් එක එකතු කළා
            },
            { quoted: userReply }
          );
        }
        else if (choice === "3") {
          await bot.sendMessage(from, { react: { text: "📥", key: userReply.key } });
          
          const inputPath = path.join(__dirname, `../tmp_in_${Date.now()}.mp3`);
          const outputPath = path.join(__dirname, `../tmp_out_${Date.now()}.opus`);

          try {
            const response = await axios({
              method: 'get',
              url: audioUrl,
              responseType: 'arraybuffer'
            });
            fs.writeFileSync(inputPath, response.data);
         
            await convertToOpus(inputPath, outputPath);
 
            await bot.sendMessage(from, {
              audio: fs.readFileSync(outputPath),
              mimetype: 'audio/ogg; codecs=opus',
              ptt: true
            }, { quoted: userReply });

          } catch (vError) {
            console.error("Voice Note Error:", vError);
            await bot.sendMessage(from, { audio: { url: audioUrl }, mimetype: "audio/mpeg", ptt: true }, { quoted: userReply });
          } finally {
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
          }
        }
      };

      // 🎯 [FIX] විනාඩි 3කට පසු මෙමරියෙන් නිවැරදිව අයින් කිරීම (Handler එකෙන් එළියේ)
      setTimeout(() => {
          if (global.replyHandlers && global.replyHandlers[messageId]) {
              delete global.replyHandlers[messageId];
          }
      }, 3 * 60 * 1000); // 3 Minutes

    } catch (e) {
      console.log("YTMP3 ERROR:", e);
      reply("❌ Error while downloading MP3");
    }
  }
);
// ==========================================
// 🎥 YOUTUBE VIDEO DOWNLOADER
// ==========================================
cmd(
  {
    pattern: "video",
    alias: ["ytv", "mp4", "ytmp4"],
    desc: "Download YouTube MP4 by name or link with Quality Selection",
    category: "download",
    filename: __filename,
  },
  async (bot, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("🎬 Send video name or YouTube link");

      // 🎯 Auto React for command execution
      await bot.sendMessage(from, { react: { text: "🎥", key: mek.key } });

      const video = await getYoutube(q);
      if (!video) return reply("❌ No results found");

      // 🔄 [UPDATE] මුල් මෙනු එකට වීඩියෝ එකේ Size එක හොයන ලොජික් එකක් දැම්මා
      let videoSize = "Check options below";
      try {
        const dataCheck = await ytmp4(video.url, { format: "mp4", videoQuality: "360" });
        if (dataCheck?.url) {
          const sizeRes = await axios.head(dataCheck.url);
          const bytes = sizeRes.headers['content-length'];
          if (bytes) videoSize = `~ ${(bytes / (1024 * 1024)).toFixed(2)} MB (360p)`;
        }
      } catch (err) {}
      
      // මුල් මෙනු එක (Format Menu)
      const caption = `*🎬 𝐕𝐈𝐃𝐄𝐎 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐑 🎬*

┌────────────●●►
├ *📀 \`Title:\`* ${video.title}
├ *⏱️ \`Duration:\`* ${video.timestamp}
├ *📆 \`Uploaded:\`* ${video.ago}
├ *👁️ \`Views:\`* ${video.views.toLocaleString()}
├ *👍 \`Likes:\`* ${video.likes || "N/A"}
├ *📡 \`Channel:\`* ${video.author?.name || "Unknown"}
├ *📥 \`Size:\`* ${videoSize}
├ *🔗 \`Watch/Download:\`* ${video.url}
└────────────●●►

╭─〔 *🔢 SELECT FORMAT* 〕─●●►
│
├ 1️⃣ *VIDEO TYPE (Normal)*
├ 2️⃣ *DOCUMENT TYPE (HD File)*
╰┈┈┈┈┈┈┈┈┈┈┈┈➤ˎˊ˗

> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴᴇᴛʜᴍɪɴᴀ ᴏꜰᴄ ||`;

      const sentMsg = await bot.sendMessage(
        from,
        {
          image: { url: video.thumbnail },
          caption,
        },
        { quoted: mek }
      );

      const messageId = sentMsg.key.id;
      if (!global.replyHandlers) global.replyHandlers = {};
      
      // 🔄 FIRST REPLY HANDLER: FORMAT SELECTION
      global.replyHandlers[messageId] = async (userReply) => {
        const formatChoice = userReply.body.trim();
        
        if (formatChoice !== "1" && formatChoice !== "2") {
          return bot.sendMessage(from, { text: "❌ Invalid Choice! Please reply with 1 or 2." }, { quoted: userReply });
        }

        // Quality තෝරන්න දෙන මැසේජ් එක
        const qualityCaption = `*🎬 𝐒𝐄𝐋𝐄𝐂𝐓 𝐕𝐈𝐃𝐄𝐎 𝐐𝐔𝐀𝐋𝐈𝐓𝐘 🎬*

📽️ *Video:* ${video.title}

📂 *Format Selected:* ${formatChoice === "1" ? "Normal Video" : "Document File"}

╭─〔 *🔢 REPLY WITH NUMBER* 〕─●●►
│
├ 1️⃣ *360p* (Low)
├ 2️⃣ *480p* (Medium)
├ 3️⃣ *720p* (HD)
├ 4️⃣ *1080p* (FULL HD)
╰┈┈┈┈┈┈┈┈┈┈┈┈➤ˎˊ˗

> Reply with the option number...`;

        const qSentMsg = await bot.sendMessage(from, { text: qualityCaption }, { quoted: userReply });
        const qMessageId = qSentMsg.key.id;

        // 🔄 SECOND REPLY HANDLER: QUALITY SELECTION
        global.replyHandlers[qMessageId] = async (qualityReply) => {
          const qualityChoice = qualityReply.body.trim();
          
          let targetQuality = "360"; // Default
          if (qualityChoice === "1") targetQuality = "360";
          else if (qualityChoice === "2") targetQuality = "480";
          else if (qualityChoice === "3") targetQuality = "720";
          else if (qualityChoice === "4") targetQuality = "1080";
          else {
            return bot.sendMessage(from, { text: "❌ Invalid Quality Choice! Please reply with 1, 2, 3 or 4." }, { quoted: qualityReply });
          }

          // 📥 ඩවුන්ලෝඩ් වෙන බව පෙන්වන්න Reaction එකක් දානවා
          await bot.sendMessage(from, { react: { text: "📥", key: qualityReply.key } });

          try {
            // යූසර් තෝරපු Quality එකෙන් API එකට රික්වෙස්ට් එක යවනවා
            const data = await ytmp4(video.url, {
              format: "mp4",
              videoQuality: targetQuality,
            });

            if (!data?.url) return bot.sendMessage(from, { text: "❌ Failed to fetch download link for this quality!" }, { quoted: qualityReply });

            const videoUrl = data.url;
            const vFilename = data.filename || `${video.title}.mp4`;

            // 📤 FORMAT 1: NORMAL VIDEO
            if (formatChoice === "1") {
              await bot.sendMessage(
                from,
                {
                  video: { url: videoUrl },
                  mimetype: "video/mp4",
                  fileName: vFilename,
                  caption: `🎬 *Your Video is ready!*\n📀 *Quality:* ${targetQuality}p\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴᴇᴛʜᴍɪɴᴀ ᴏꜰᴄ ||`,
                  gifPlayback: false,
                },
                { quoted: qualityReply }
              );
            } 
            // 📤 FORMAT 2: DOCUMENT FILE
            else if (formatChoice === "2") {
              await bot.sendMessage(
                from,
                {
                  document: { url: videoUrl },
                  mimetype: "video/mp4",
                  fileName: vFilename,
                  caption: `🎬 *Your Video Document is ready!*\n📀 *Quality:* ${targetQuality}p\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴᴇᴛʜᴍɪɴᴀ ᴏꜰᴄ ||`
                },
                { quoted: qualityReply }
              );
            }

          } catch (downloadErr) {
            console.error("Download Error inside handler:", downloadErr);
            bot.sendMessage(from, { text: "❌ Error while generating video link. Try a lower quality." }, { quoted: qualityReply });
          }
        };

        // 🎯 [FIX] Quality තෝරන මෙනු එකේ Timeout එක නිවැරදිව මෙතනට දැම්මා (Quality Handler එක ඉවර වුන ගමන්)
        setTimeout(() => {
            if (global.replyHandlers && global.replyHandlers[qMessageId]) {
                delete global.replyHandlers[qMessageId];
            }
        }, 3 * 60 * 1000); // 3 Minutes

      };

      // Format මෙනු එකට අදාළ Timeout එක
      setTimeout(() => {
          if (global.replyHandlers && global.replyHandlers[messageId]) {
              delete global.replyHandlers[messageId];
          }
      }, 3 * 60 * 1000); // 3 Minutes
      
    } catch (e) {
      console.log("YTMP4 ERROR:", e);
      reply("❌ Error while downloading video");
    }
  }
);

// ==========================================
// 📱 TIKTOK VIDEO DOWNLOADER
// ==========================================
cmd(
  {
    pattern: "tiktok",
    alias: ["tt"],
    desc: "Download TikTok video",
    category: "download",
    filename: __filename,
  },
  async (bot, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("📱 Send TikTok link");

      // 🎯 Auto React for command execution
      await bot.sendMessage(from, { react: { text: "📹", key: mek.key } });

      const data = await tiktok(q);
      if (!data?.no_watermark) return reply("❌ Failed to download TikTok video");

      let fileSize = "Unknown";
      try {
        const sizeRes = await axios.head(data.no_watermark);
        const bytes = sizeRes.headers['content-length'];
        if (bytes) {
          fileSize = (bytes / (1024 * 1024)).toFixed(2) + " MB";
        }
      } catch (err) {}

      const caption = `*📹 𝐓𝐈𝐊𝐓𝐎𝐊 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐑 📹*

┌────────────●●►
├ *📀 \`Title:\`* ${data.title || "TikTok Video"}
├ *👤 \`Author:\`* ${data.author || "Unknown"}
├ *⏱️ \`Duration:\`* ${data.runtime ? data.runtime + "s" : "Unknown"}
├ *📥 \`Size:\`* ${fileSize}
└────────────●●►

> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴᴇᴛʜᴍɪɴᴀ ᴏꜰᴄ ||`;

      await bot.sendMessage(
        from,
        {
          video: { url: data.no_watermark },
          caption,
        },
        { quoted: mek }
      );
    } catch (e) {
      console.log("TIKTOK ERROR:", e);
      reply("❌ Error while downloading TikTok video");
    }
  }
);
