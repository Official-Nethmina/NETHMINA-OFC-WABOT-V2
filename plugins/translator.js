const { cmd } = require("../command");
const { translate } = require("@vitalets/google-translate-api");

// 🛠️ Languages list
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

                await bot.sendMessage(from, { react: { text: "🔤", key: mek.key } });

                let textToTranslate = q.trim();
                let extractedEmojis = "";

                // 🎯 FIX: වාක්‍යය අග තියෙන emojis විතරක් ගලවා ගැනීම (Emoji Regex)
                const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])+$/g;
                const hasEmojis = textToTranslate.match(emojiRegex);
                
                if (hasEmojis) {
                    extractedEmojis = hasEmojis[0]; // Emoji ටික වෙනම අරගන්නවා
                    textToTranslate = textToTranslate.replace(emojiRegex, "").trim(); // Translate කරන්න යවන text එකෙන් emoji අයින් කරනවා
                }

                // 🔄 Google Translate හරහා translate කරන්නේ emoji නැති පිරිසිදු text එක විතරයි
                const res = await translate(textToTranslate, { to: langCode });
                let translatedText = res.text.trim();

                // 🎯 FIX 1: මුල්ම අකුර CAPITAL කිරීම
                if (translatedText.length > 0) {
                    translatedText = translatedText.charAt(0).toUpperCase() + translatedText.slice(1);
                }

                // 🎯 FIX 2: SMART QUESTION MARK DETECTION
                const questionWords = /\b(මොකද|ඇයි|කොහොමද|කවුද|කොහේද|මොකක්|මොන|කීයටද|කීයක්|ද)\b/i;
                const engQuestionStarts = /^(What|Why|How|Who|Where|When|Which|Whom|Whose|Is|Are|Am|Do|Does|Did|Can|Could|Should|Would|Will|Shall)\b/i;
                
                if (!translatedText.includes('?')) {
                    if (questionWords.test(q) || engQuestionStarts.test(translatedText)) {
                        translatedText = `${translatedText}?`;
                    }
                }

                // 🎯 FIX 3: කලින් ගලවලා තියාගත්තු Emojis ටික ආපහු අගට එකතු කිරීම
                if (extractedEmojis) {
                    translatedText = `${translatedText} ${extractedEmojis}`;
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
