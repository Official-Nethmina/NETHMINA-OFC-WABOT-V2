const { cmd } = require("../command");
const yts = require("yt-search");

cmd(
  {
    pattern: "yts",
    alias: ["yts", "youtubesearch"],
    react: "🔎",
    desc: "Search YouTube videos",
    category: "search",
    filename: __filename,
  },
  async (nethmina, mek, m, { from, quoted, q, reply }) => {
    try {
      if (!q) return reply("*Please provide a search query!* 🔍");

      reply("*Searching YouTube for you...* ⌛");

      const search = await yts(q);

      if (!search || !search.all || search.all.length === 0) {
        return reply("*No results found on YouTube.* ☹️");
      }

      const results = search.videos.slice(0, 10);

      let formattedResults = results.map((v, i) => {
        return `
*🎧❤️ NETHMINA OFC SONG DOWNLOADER ❤️🎧*

┌───────────────────
├ *🎬 Result:* ${i + 1}
├ *📀 Title:* ${v.title}
├ *⏱️ Duration:* ${v.timestamp}
├ *📆 Uploaded:* ${v.ago}
├ *👁️ Views:* ${v.views.toLocaleString()}
├ *📡 Channel:* ${v.author?.name || "Unknown"}
├ *🔗 Watch/Download:* ${v.url}
└───────────────────
`;
      }).join("\n");

      const caption = `
🔎 *YouTube Search Results*
─────────────────────────
*📥 Query:* ${q}

${formattedResults}

> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴᴇᴛʜᴍɪɴᴀ ᴏꜰᴄ
`;

      await nethmina.sendMessage(
        from,
        {
          image: {
            url: "https://github.com/Nethmina-dev/BOT-DATA/blob/main/Logo/ChatGPT%20Image%20Mar%2018,%202026,%2005_47_58%20PM.png?raw=true",
          },
          caption,
        },
        { quoted: mek }
      );

    } catch (err) {
      console.error(err);
      reply("*An error occurred while searching YouTube.* ❌");
    }
  }
);
