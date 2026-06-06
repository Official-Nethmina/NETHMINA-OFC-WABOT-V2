const { cmd } = require("../command");
const config = require("../config");
const axios = require("axios");
const cheerio = require("cheerio"); // 🎯 HTML parse කරන්න cheerio දාගත්තා

// 💡 Ada Derana Sinhala Breaking News Page URL
const NEWS_URL = "https://sinhala.adaderana.lk/hot-news.php";

let lastNewsTitle = ""; // මේ පාර අපි අන්තිම නිවුස් එකේ Title එකෙන් තමයි අලුත් එකක්ද කියලා චෙක් කරන්නේ

// ==========================================
// 🕒 AUTO NEWS MONITOR SYSTEM (BACKGROUND TASK)
// ==========================================
setInterval(async () => {
    try {
        if (!global.botSocket) return; 

        // 🎯 Ada Derana වෙබ් අඩවියට පිවිසීම
        const response = await axios.get(NEWS_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
            },
            timeout: 10000
        });

        // Cheerio මඟින් HTML එක load කරගැනීම
        const $ = cheerio.load(response.data);
        
        // Ada Derana hot news පිටුවේ පළමු පුවත තියෙන තැන (HTML Class එක) අල්ලගන්නවා
        const firstNewsElement = $('.news-story').first();
        
        if (!firstNewsElement.length) return;

        // නිවුස් එකේ විස්තර ගලවා ගැනීම
        const newsTitle = firstNewsElement.find('h2 a').text().trim();
        const newsLink = "https://sinhala.adaderana.lk/" + firstNewsElement.find('h2 a').attr('href');
        const newsContent = firstNewsElement.find('p').text().trim();
        const newsImage = firstNewsElement.find('.story-image img').attr('src'); // Image URL එක

        if (!newsTitle) return;

        // 🎯 Check if it's a new article
        if (newsTitle !== lastNewsTitle) {
            if (lastNewsTitle === "") {
                lastNewsTitle = newsTitle;
                return;
            }

            lastNewsTitle = newsTitle; // Update last news title

            const newsMessage = `📰 *ADA DERANA BREAKING NEWS* 📰\n\n` +
                                `📌 *${newsTitle}*\n\n` +
                                `📝 ${newsContent}\n\n` +
                                `🔗 Link: ${newsLink}\n\n` +
                                `> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴᴇᴛʜᴍɪɴᴀ ᴏꜰᴄ ||`;

            const targetOwner = "94760860835@s.whatsapp.net";

            // 📸 නිවුස් එකට අදාල photo එකක් තියෙනවා නම් photo එකත් එක්කම inbox යවනවා, නැත්නම් text එක විතරක් යවනවා
            if (newsImage) {
                await global.botSocket.sendMessage(targetOwner, { 
                    image: { url: newsImage }, 
                    caption: newsMessage 
                });
            } else {
                await global.botSocket.sendMessage(targetOwner, { text: newsMessage });
            }
            
            console.log("📰 [AUTO NEWS] New breaking news sent to Owner Inbox!");
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
        alias: ["latestnews", "derana"],
        desc: "Get the latest breaking news manually",
        category: "tools",
        filename: __filename,
    },
    async (bot, mek, m, { from, reply }) => {
        try {
            await bot.sendMessage(from, { react: { text: "📰", key: mek.key } });

            const response = await axios.get(NEWS_URL, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
                },
                timeout: 10000
            });

            const $ = cheerio.load(response.data);
            const firstNewsElement = $('.news-story').first();

            if (!firstNewsElement.length) return reply("❌ Unable to parse news data at the moment.");

            const newsTitle = firstNewsElement.find('h2 a').text().trim();
            const newsLink = "https://sinhala.adaderana.lk/" + firstNewsElement.find('h2 a').attr('href');
            const newsContent = firstNewsElement.find('p').text().trim();
            const newsImage = firstNewsElement.find('.story-image img').attr('src');

            const newsMessage = `📰 *LATEST BREAKING NEWS* 📰\n\n` +
                                `📌 *${newsTitle}*\n\n` +
                                `📝 ${newsContent}\n\n` +
                                `🔗 Link: ${newsLink}`;

            if (newsImage) {
                return await bot.sendMessage(from, { 
                    image: { url: newsImage }, 
                    caption: newsMessage 
                }, { quoted: mek });
            } else {
                return reply(newsMessage);
            }

        } catch (e) {
            console.error("Manual News Error:", e.message);
            reply(`❌ Error while fetching latest news.\nReason: ${e.message}`);
        }
    }
);
