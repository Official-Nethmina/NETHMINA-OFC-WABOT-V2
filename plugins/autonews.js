const { cmd } = require("../command");
const config = require("../config");
const Parser = require("rss-parser");
const axios = require("axios"); // 🎯 Axios එක අලුතින් එකතු කළා
const parser = new Parser();

// 💡 HTTPS වලට update කරන ලද ලින්ක් එක
const NEWS_FEED_URL = "https://sinhala.adaderana.lk/rss.php";

let lastNewsLink = ""; 

// ==========================================
// 🕒 AUTO NEWS MONITOR SYSTEM (BACKGROUND TASK)
// ==========================================
setInterval(async () => {
    try {
        if (!global.botSocket) return; 

        // 🎯 Axios හරහා XML data එක secure ව ලබා ගැනීම
        const response = await axios.get(NEWS_FEED_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
            },
            timeout: 10000 // තත්පර 10කින් Request එක timeout කරනවා සිරවීම් වැලැක්වීමට
        });

        // ලබාගත් XML data එක parse කිරීම
        const feed = await parser.parseString(response.data);
        if (!feed.items || feed.items.length === 0) return;

        const latestNews = feed.items[0]; 

        if (latestNews.link !== lastNewsLink) {
            if (lastNewsLink === "") {
                lastNewsLink = latestNews.link;
                return;
            }

            lastNewsLink = latestNews.link; 

            const newsTitle = latestNews.title || "අලුත්ම පුවතක්";
            const newsContent = latestNews.contentSnippet || latestNews.content || "";
            const newsDate = latestNews.pubDate || new Date().toLocaleString();
            
            const newsMessage = `📰 *ADA DERANA BREAKING NEWS* 📰\n\n` +
                                `📌 *${newsTitle.trim()}*\n\n` +
                                `📝 ${newsContent.trim()}\n\n` +
                                `🕒 _Time: ${newsDate}_\n\n` +
                                `🔗 Link: ${latestNews.link}\n\n` +
                                `💻 *NETHMINA-OFC WA-BOT*`;

            const targetOwner = "94760860835@s.whatsapp.net";
            await global.botSocket.sendMessage(targetOwner, { text: newsMessage });
            console.log("📰 [AUTO NEWS] New breaking news sent to Owner Inbox!");
        }

    } catch (err) {
        console.error("❌ Auto News Checker Error:", err.message);
    }
}, 2 * 60 * 1000); 


// ==========================================
// 🕹️ MANUAL NEWS COMMAND (TEST COMMAND)
// ==========================================
cmd(
    {
        pattern: "news",
        alias: ["latestnews", "derana"],
        desc: "Get the latest breaking news manually",
        category: "tools",
        filename: __filename,
    },
    async (bot, mek, m, { from, reply }) => {
        try {
            await bot.sendMessage(from, { react: { text: "📰", key: mek.key } });

            // 🎯 Manual එකටත් Axios safe fetch එක දැම්මා
            const response = await axios.get(NEWS_FEED_URL, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
                },
                timeout: 10000
            });

            const feed = await parser.parseString(response.data);
            if (!feed.items || feed.items.length === 0) return reply("❌ Unable to fetch news at the moment.");

            const latestNews = feed.items[0];

            const newsTitle = latestNews.title || "අලුත්ම පුවතක්";
            const newsContent = latestNews.contentSnippet || latestNews.content || "";
            const newsDate = latestNews.pubDate || new Date().toLocaleString();

            const newsMessage = `📰 *LATEST BREAKING NEWS* 📰\n\n` +
                                `📌 *${newsTitle.trim()}*\n\n` +
                                `📝 ${newsContent.trim()}\n\n` +
                                `🕒 _Time: ${newsDate}_\n\n` +
                                `🔗 Link: ${latestNews.link}`;

            return reply(newsMessage);

        } catch (e) {
            console.error("Manual News Error:", e.message);
            reply(`❌ Error while fetching latest news.\nReason: ${e.message}`);
        }
    }
);
