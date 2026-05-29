const { cmd } = require("../command");
const { ytmp3, ytmp4, tiktok } = require("sadaslk-dlcore"); // 🎯 ytmp4 සහ tiktok functions මෙතනට එකතු කළා
const yts = require("yt-search");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const ffmpegPath = require('ffmpeg-static');
const { exec } = require('child_process');

// 🎧 [VOICE NOTE CONVERTER] - MP3 එක OPUS (Voice Note) කරන්න කෙලින්ම මෙතනම හැදූ ෆන්ක්ෂන් එක
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
    react: "🎶",
    desc: "Download Song",
    category: "download",
    filename: __filename,
  },
  async (bot, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("🎵 Send song name or YouTube link");

      const video = await getYoutube(q);
      if (!video) return reply("❌ No results found");

      // MP3 download first (to get URL)
      const mp3 = await ytmp3(video.url);
      if (!mp3?.url) return reply("❌ Failed to download MP3");

      // 🔄 [REAL FILE SIZE DETECTOR]
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

      const caption = `*🎧 𝐍𝐄𝐓𝐇𝐌𝐈𝐍𝐀 𝐎𝐅𝐂 𝐒𝐎𝐍𝐆 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄Ｒ 🎧*

┌───────────────●●►
├ *📀 Title:* ${video.title}
├ *⏱️ Duration:* ${video.timestamp}
├ *📆 Uploaded:* ${video.ago}
├ *👁️ Views:* ${video.views.toLocaleString()}
├ *👍 Likes:* ${video.likes || "N/A"}
├ *📡 Channel:* ${video.author?.name || "Unknown"}
├ *🔗 Watch/Download:* ${video.url}
├ *📥 Size:* ${fileSize}
└───────────────●●►

╭─〔 *🔢 SELECT FORMAT* 〕─●●►
|
├ 1️⃣ *AUDIO TYPE*
├ 2️⃣ *DOCUMENT TYPE*
├ 3️⃣ *VOICE NOTE*
╰┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈➤ˎˊ˗

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
              fileName: `${video.title}.mp3`
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
        
        delete global.replyHandlers[messageId];
      };

    } catch (e) {
      console.log("YTMP3 ERROR:", e);
      reply("❌ Error while downloading MP3");
    }
  }
);

// ==========================================
// 🎥 YOUTUBE VIDEO DOWNLOADER (WITH REPLY MENU)
// ==========================================
cmd(
  {
    pattern: "video",
    alias: ["ytv", "mp4", "ytmp4"],
    react: "🎥",
    desc: "Download YouTube MP4 by name or link",
    category: "download",
    filename: __filename,
  },
  async (bot, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("🎬 Send video name or YouTube link");

      const video = await getYoutube(q);
      if (!video) return reply("❌ No results found");

      // YTMP4 download first (to get URL)
      const data = await ytmp4(video.url, {
        format: "mp4",
        videoQuality: "360",
      });
      if (!data?.url) return reply("❌ Failed to download video");

      // 🔄 [REAL FILE SIZE DETECTOR]
      let fileSize = "Unknown";
      try {
        const sizeRes = await axios.head(data.url);
        const bytes = sizeRes.headers['content-length'];
        if (bytes) {
          fileSize = (bytes / (1024 * 1024)).toFixed(2) + " MB";
        }
      } catch (err) {}

      const caption = `*🎬 𝐍𝐄𝐓𝐇𝐌𝐈𝐍𝐀 𝐎𝐅𝐂 𝐕𝐈𝐃𝐄𝐎 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐑 🎬*

┌───────────────●●►
├ *📀 Title:* ${video.title}
├ *⏱️ Duration:* ${video.timestamp}
├ *📆 Uploaded:* ${video.ago}
├ *👁️ Views:* ${video.views.toLocaleString()}
├ *👍 Likes:* ${video.likes || "N/A"}
├ *📡 Channel:* ${video.author?.name || "Unknown"}
├ *🔗 Watch/Download:* ${video.url}
├ *📥 Size:* ${fileSize}
└───────────────●●►

╭─〔 *🔢 SELECT FORMAT* 〕─●●►
|
├ 1️⃣ *VIDEO TYPE*
├ 2️⃣ *DOCUMENT TYPE*
╰┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈➤ˎˊ˗

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
        const videoUrl = data.url;
        const vFilename = data.filename || `${video.title}.mp4`;
        
        if (choice === "1") {
          await bot.sendMessage(from, { react: { text: "📥", key: userReply.key } });
          await bot.sendMessage(
            from,
            {
              video: { url: videoUrl },
              mimetype: "video/mp4",
              fileName: vFilename,
              caption: "🎬 *Your video is ready!*",
              gifPlayback: false,
            },
            { quoted: userReply }
          );
        } 
        else if (choice === "2") {
          await bot.sendMessage(from, { react: { text: "📥", key: userReply.key } });
          await bot.sendMessage(
            from,
            {
              document: { url: videoUrl },
              mimetype: "video/mp4",
              fileName: vFilename,
              caption: "🎬 *Your video is ready!*"
            },
            { quoted: userReply }
          );
        }
        
        delete global.replyHandlers[messageId];
      };

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
    react: "📹",
    desc: "Download TikTok video",
    category: "download",
    filename: __filename,
  },
  async (bot, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("📱 Send TikTok link");

      const data = await tiktok(q);
      if (!data?.no_watermark) return reply("❌ Failed to download TikTok video");

      // 🔄 [REAL FILE SIZE DETECTOR]
      let fileSize = "Unknown";
      try {
        const sizeRes = await axios.head(data.no_watermark);
        const bytes = sizeRes.headers['content-length'];
        if (bytes) {
          fileSize = (bytes / (1024 * 1024)).toFixed(2) + " MB";
        }
      } catch (err) {}

      const caption = `*📹 𝐍𝐄𝐓𝐇𝐌𝐈𝐍𝐀 𝐎𝐅𝐂 𝐓𝐈𝐊𝐓𝐎𝐊 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐑 📹*

┌───────────────●●►
├ *📀 Title:* ${data.title || "TikTok Video"}
├ *👤 Author:* ${data.author || "Unknown"}
├ *⏱️ Duration:* ${data.runtime ? data.runtime + "s" : "Unknown"}
├ *📥 Size:* ${fileSize}
└───────────────●●►

> © ᴘᴏᴡᴇʀᴇʙ ʙʏ ɴᴇᴛʜᴍɪɴᴀ ᴏꜰᴄ ||`;

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
