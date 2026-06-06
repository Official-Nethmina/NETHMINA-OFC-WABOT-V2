const { cmd } = require("../command");
const config = require("../config");
const axios = require("axios");
const cheerio = require("cheerio");

// 💡 Hiru News Sinhala Latest News Page URL
const NEWS_URL = "https://www.hirunews.lk/sinhala/local-news.php";

let lastNewsTitle = ""; // අන්තිම නිවුස් එකේ Title එක මතක තියාගන්න

// ==========================================
// 🕒 AUTO NEWS MONITOR SYSTEM (BACKGROUND TASK)
// ==========================================
setInterval(async () => {
    try {
        if (!global.botSocket) return; 

        // 🎯 Hiru News වෙබ් අඩවියට පිවිසීම
        const response = await axios.get(NEWS_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 15000
        });

        const $ = cheerio.load(response.data);
        
        // Hiru News පිටුවේ පළමු පුවත තියෙන ප්‍රධාන කොටස අල්ලගන්නවා
        const firstNewsElement = $('.trending-section .row').first();
        if (!firstNewsElement.length) return;

        // නිවුස් එකේ විස්තර ගලවා ගැනීම
        const newsTitle = firstNewsElement.find('.trending-title a').text().trim();
        const newsLink = firstNewsElement.find('.trending-title a').attr('href');
        
        // පින්තූරය (Hiru News වල inline style background image එකක් හෝ img tag එකක් තියෙන්නේ. අපි ලස්සනට ඒක extract කරමු)
        let newsImage = firstNewsElement.find('.trending-main-img img').attr('src');
        if (!newsImage) {
            // නිවුස් එකේ ඇතුලේ තියෙන image එකක්ද බලනවා
            newsImage = firstNewsElement.find('.img-fluid').attr('src');
        }

        if (!newsTitle) return;

        // 🎯 Check if it's a new article
        if (newsTitle !== lastNewsTitle) {
            if (lastNewsTitle === "") {
                lastNewsTitle = newsTitle;
                return;
            }

            lastNewsTitle = newsTitle; // Update last news title

            const newsMessage = `📰 *HIRU NEWS BREAKING NEWS* 📰\n\n` +
                                `📌 *${newsTitle}*\n\n` +
                                `🔗 Link: ${newsLink}\n\n` +
                                `💻 *NETHMINA-OFC WA-BOT*`;

            const targetOwner = "94760860835@s.whatsapp.net";

            // 📸 Photo එකක් තියෙනවා නම් ඒකත් එක්කම Inbox යවනවා
            if (newsImage && newsImage.startsWith('http')) {
                await global.botSocket.sendMessage(targetOwner, { 
                    image: { url: newsImage }, 
                    caption: newsMessage 
                });
            } else {
                await global.botSocket.sendMessage(targetOwner, { text: newsMessage });
            }
            
            console.log("📰 [AUTO NEWS] New Hiru breaking news sent to Owner Inbox!");
        }

    } catch (err) {
        console.error("❌ Auto News Checker Error:", err.message);
    }
}, 2 * 60 * 1000); // ⏱️ හැම විනාඩි 2කට වරක්ම චෙක් කරනවා


// ==========================================
// 🕹️ MANUAL NEWS COMMAND (TEST COMMAND)
// ==========================================
cmd(
    {
        pattern: "news",
        alias: ["latestnews", "hiru"],
        desc: "Get the latest breaking news manually from Hiru News",
        category: "tools",
        filename: __filename,
    },
    async (bot, mek, m, { from, reply }) => {
        try {
            await bot.sendMessage(from, { react: { text: "📰", key: mek.key } });

            const response = await axios.get(NEWS_URL, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                timeout: 15000
            });

            const $ = cheerio.load(response.data);
            const firstNewsElement = $('.trending-section .row').first();

            if (!firstNewsElement.length) return reply("❌ Unable to parse Hiru news data at the moment.");

            const newsTitle = firstNewsElement.find('.trending-title a').text().trim();
            const newsLink = firstNewsElement.find('.trending-title a').attr('href');
            let newsImage = firstNewsElement.find('.trending-main-img img').attr('src') || firstNewsElement.find('.img-fluid').attr('src');

            const newsMessage = `📰 *LATEST HIRU NEWS* 📰\n\n` +
                                `📌 *${newsTitle}*\n\n` +
                                `🔗 Link: ${newsLink}`;

            if (newsImage && newsImage.startsWith('http')) {
                return await bot.sendMessage(from, { 
                    image: { url: newsImage }, 
                    caption: newsMessage 
                }, { quoted: mek });
            } else {
                return reply(newsMessage);
            }

        } catch (e) {
            console.error("Manual News Error:", e.message);
            reply(`❌ Error while fetching Hiru news.\nReason: ${e.message}`);
        }
    }
);
