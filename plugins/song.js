const { cmd, commands } = require("../command");
const yts = require("yt-search");
const { ytmp3 } = require("@vreden/youtube_scraper");

cmd(
  {
    pattern: "song",
    alias: ["mp3", "ytmp3", "music"],
    react: "🎶",
    desc: "Download Song",
    category: "download",
    filename: __filename,
  },
  async (danuwa, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("❌ *Please provide a song name or YouTube link*");

      const search = await yts(q);
      const data = search.videos[0];
      const url = data.url;

      // Download audio data
      const quality = "192";
      const songData = await ytmp3(url, quality);

      // Format file size if available
      let fileSize = songData?.download?.fileSizeH || songData?.download?.size || "Unknown";

      let desc = `
*🎧❤️ NETHMINA OFC SONG DOWNLOADER ❤️🎧*

┌───────────────────
├ *📀 Title:* ${data.title}
├ *⏱️ Duration:* ${data.timestamp}
├ *📆 Uploaded:* ${data.ago}
├ *👁️ Views:* ${data.views.toLocaleString()}
├ *👍 Likes:* ${data.likes || "N/A"}
├ *📡 Channel:* ${data.author?.name || "Unknown"}
├ *🔗 Watch/Download:* ${data.url}
├ *📥 Size:* ${fileSize}
└───────────────────

> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴᴇᴛʜᴍɪɴᴀ ᴏꜰᴄ ||
`;

      // Send info message
      await danuwa.sendMessage(
        from,
        { image: { url: data.thumbnail }, caption: desc },
        { quoted: mek }
      );

      // Duration Check (max 30 mins)
      let durationParts = data.timestamp.split(":").map(Number);
      let totalSeconds =
        durationParts.length === 3
          ? durationParts[0] * 3600 + durationParts[1] * 60 + durationParts[2]
          : durationParts[0] * 60 + durationParts[1];

      if (totalSeconds > 1800) {
        return reply("⏳ *Sorry, audio files longer than 30 minutes are not supported.*");
      }

      // Send Audio as Voice/Audio File
      await danuwa.sendMessage(
        from,
        {
          audio: { url: songData.download.url },
          mimetype: "audio/mpeg",
        },
        { quoted: mek }
      );

      // Send as Document
      await danuwa.sendMessage(
        from,
        {
          document: { url: songData.download.url },
          mimetype: "audio/mpeg",
          fileName: `${data.title}.mp3`,
          caption: "🎶 *Your song is ready!*",
        },
        { quoted: mek }
      );

      return reply("*Thank you for using NETHMINA OFC! ✅*");
    } catch (e) {
      console.log(e);
      reply(`❌ *Error:* ${e.message} 😞`);
    }
  }
);
