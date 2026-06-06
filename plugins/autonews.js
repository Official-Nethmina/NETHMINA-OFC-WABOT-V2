const { cmd } = require("../command");
const config = require("../config");
const Parser = require("rss-parser");
const parser = new Parser();

// 💡 Ada Derana Sinhala RSS Feed Link
const NEWS_FEED_URL = "http://sinhala.adaderana.lk/rss.php";

// Memory එකේ අන්තිමට ආපු නිවුස් එකේ ලින්ක් එක සේව් කරගන්න variable එකක්
// (බොට් රන් වෙනකොට එකම නිවුස් එක දෙපාරක් යෑම වැලැක්වීමට)
let lastNewsLink = ""; 

// ==========================================
// 🕒 AUTO NEWS MONITOR SYSTEM (BACKGROUND TASK)
// ==========================================
// බොට් කනෙක්ට් වුනාට පස්සේ හැම විනාඩි 2කට වරක්ම අලුත් නිවුස් ආවාදැයි auto චෙක් කරනවා
setInterval(async () => {
    try {
        // global.nethmina instance එක ඔයාගේ main file එකෙන් හෝ config එකෙන් global කරලා තියෙන්න ඕනේ.
        // නැතහොත් අපි මේ function එක ක්‍රියාත්මක කරන්නේ බොට්ගේ socket එක හරහායි.
        if (!global.botSocket) return; 

        const feed = await parser.parseURL(NEWS_FEED_URL);
        if (!feed.items || feed.items.length === 0) return;

        // අලුත්ම නිවුස් එක (ලැයිස්තුවේ මුලින්ම තියෙන එක)
        const latestNews = feed.items[0]; 

        // 🎯 Check if it's a new article
        if (latestNews.link !== lastNewsLink) {
            
            // පළමු වතාවට රන් වෙනකොට පරණ නිවුස් ඔක්කොම ඉන්බොක්ස් එකට යන එක නවත්වන්න
            if (lastNewsLink === "") {
                lastNewsLink = latestNews.link;
                return;
            }

            lastNewsLink = latestNews.link; // Update last news link

            // Format News Text
            const newsTitle = latestNews.title || "අලුත්ම පුවතක්";
            const newsContent = latestNews.contentSnippet || latestNews.content || "";
            const newsDate = latestNews.pubDate || new Date().toLocaleString();
            
            const newsMessage = `📰 *ADA DERANA BREAKING NEWS* 📰\n\n` +
                                `📌 *${newsTitle.trim()}*\n\n` +
                                `📝 ${newsContent.trim()}\n\n` +
                                `🕒 _Time: ${newsDate}_\n\n` +
                                `🔗 Link: ${latestNews.link}\n\n` +
                                `> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴᴇᴛʜᴍɪɴᴀ ᴏꜰᴄ ||`;

            // 🎯 Ownerගේ inbox (DM) එකට නිවුස් එක සෙන්ඩ් කිරීම
            // ඔයාගේ ownerNumber එක "94760860835" නිසා ඒකට auto මැසේජ් එක යනවා
            const targetOwner = "94760860835@s.whatsapp.net";
            
            await global.botSocket.sendMessage(targetOwner, { text: newsMessage });
            console.log("📰 [AUTO NEWS] New breaking news sent to Owner Inbox!");
        }

    } catch (err) {
        console.error("❌ Auto News Checker Error:", err);
    }
}, 2 * 60 * 1000); // ⏱️ හැම විනාඩි 2කට වරක්ම චෙක් කරනවා (2 minutes)


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

            const feed = await parser.parseURL(NEWS_FEED_URL);
            if (!feed.items || feed.items.length === 0) return reply("❌ Unable to fetch news at the moment.");

            const latestNews = feed.items[0];

            const newsTitle = latestNews.title || "අලුත්ම පුවතක්";
            const newsContent = latestNews.contentSnippet || latestNews.content || "";
            const newsDate = latestNews.pubDate || new Date().toLocaleString();

            const newsMessage = `📰 *LATEST BREAKING NEWS* 📰\n\n` +
                                `📌 *${newsTitle.trim()}*\n\n` +
                                `📝 ${newsContent.trim()}\n\n` +
                                `🕒 _Time: ${newsDate}_\n\n` +
                                `🔗 Link: ${latestNews.link}\n\n` +
                                `> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴᴇᴛʜᴍɪɴᴀ ᴏꜰᴄ ||`;

            return reply(newsMessage);

        } catch (e) {
            console.error(e);
            reply("❌ Error while fetching latest news.");
        }
    }
);
