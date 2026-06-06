const { cmd } = require("../command");
const { translate } = require("@vitalets/google-translate-api");

// 🛠️ බහුලව පාවිච්චි වෙන languages ලැයිස්තුව
const targetLanguages = [
    { cmdName: "en", langCode: "en" }, // English
    { cmdName: "si", langCode: "si" }, // Sinhala
    { cmdName: "ta", langCode: "ta" }, // Tamil
    { cmdName: "ja", langCode: "ja" }, // Japanese
    { cmdName: "ko", langCode: "ko" }, // Korean
    { cmdName: "ar", langCode: "ar" }  // Arabic
];

targetLanguages.forEach(({ cmdName, langCode }) => {
    cmd(
        {
            pattern: cmdName,
            desc: `Translate and edit message to ${cmdName.toUpperCase()}`,
            category: "tools",
            filename: __filename,
        },
        async (bot, mek, m, { from, q, reply }) => {
            try {
                if (!q) return reply(`✍️ Please provide a text to translate. \nExample: *.${cmdName} ඔයා මොකද කරන්නේ*`);

                // await bot.sendMessage(from, { react: { text: "🔤", key: mek.key } });

                // Google Translate හරහා translate කිරීම
                const res = await translate(q, { to: langCode });
                let translatedText = res.text.trim();

                // 🎯 FIX 1: මුල්ම අකුර CAPITAL කිරීම
                if (translatedText.length > 0) {
                    translatedText = translatedText.charAt(0).toUpperCase() + translatedText.slice(1);
                }

                // 🎯 FIX 2: SMART QUESTION MARK DETECTION (ප්‍රශ්නාර්ථ හඳුනාගැනීම)
                // සිංහල ප්‍රශ්නාර්ථ වචන හෝ English ප්‍රශ්නාර්ථ වචන තියෙනවාදැයි බලනවා
                const questionWords = /\b(මොකද|ඇයි|කොහොමද|කවුද|කොහේද|මොකක්|මොන|කීයටද|කීයක්|ද)\b/i;
                const engQuestionStarts = /^(What|Why|How|Who|Where|When|Which|Whom|Whose|Is|Are|Am|Do|Does|Did|Can|Could|Should|Would|Will|Shall)\b/i;
                
                // දැනටමත් වාක්‍යයේ අගට ප්‍රශ්නාර්ථයක් නැත්නම් විතරක් ක්‍රියාත්මක වේ
                if (!translatedText.includes('?')) {
                    if (questionWords.test(q) || engQuestionStarts.test(translatedText)) {
                        
                        // වාක්‍යය අග emoji එකක් තියෙනවා නම් ඒක අල්ලගන්න regex එකක්
                        const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])+$/g;
                        const hasEmojiAtEnd = emojiRegex.test(translatedText);

                        if (hasEmojiAtEnd) {
                            // Emoji එකට කලින් "?" ලකුණ දානවා (eg: What are you doing? 😳)
                            const match = translatedText.match(emojiRegex);
                            const emojis = match ? match[0] : "";
                            const textWithoutEmoji = translatedText.replace(emojiRegex, "").trim();
                            translatedText = `${textWithoutEmoji}? ${emojis}`;
                        } else {
                            // සාමාන්‍ය වාක්‍යයක් නම් අගටම දානවා
                            translatedText = `${translatedText}?`;
                        }
                    }
                }

                // 🎯 මැසේජ් එක EDIT කර පෙන්වීම
                await bot.sendMessage(from, {
                    edit: mek.key,
                    text: translatedText
                });

            } catch (e) {
                console.error(`TRANSLATE ERROR (${cmdName}):`, e);
                reply("❌ Translation failed. Please try again later.");
            }
        }
    );
});
