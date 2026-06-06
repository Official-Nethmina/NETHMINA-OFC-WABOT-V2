const { cmd } = require("../command");
const { translate } = require("@vitalets/google-translate-api");

// 🌐 LANGUAGE CODE DETECTION FUNCTION
// මේකෙන් .en, .si, .ja වගේ ගහන command එකෙන් language code එක extract කරගන්නවා
cmd(
    {
        pattern: "^[a-z]{2}$", // regex pattern එකක් පාවිච්චි කරලා අකුරු 2ක ඕනෑම command එකක් අල්ලනවා (eg: en, si, ja, ko)
        isRegex: true, // ඔයාගේ bot base එකේ regex commands support කරනවා නම් විතරයි මේක වැඩ කරන්නේ. 
        desc: "Translate and edit the message to target language",
        category: "tools",
        filename: __filename,
    },
    async (bot, mek, m, { from, body, reply, args, q }) => {
        // සටහන: ඔයාගේ bot base එකේ regex pattern මඟින් command name එක කෙලින්ම extract කරගන්න බැරි නම්,
        // අපි පහළ තියෙන ක්‍රමයට ඒක සාමාන්‍ය command එකක් විදිහට ලියමු.
    }
);

// 🛠️ වඩාත්ම සුරක්ෂිත ක්‍රමය: බහුලව පාවිච්චි වෙන languages වලට වෙන් වෙන්ව command එක හැදීම.
// ඔයාට අවශ්‍ය වෙන ප්‍රධානම languages ටික මෙතන තියෙනවා (English, Sinhala, Tamil, Japanese, Korean, Arabic).
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
                // පරිවර්තනය කරන්න ඕන text එක (command එකට පස්සේ තියෙන ටෙක්ස්ට් එක)
                if (!q) return reply(`✍️ Please provide a text to translate. \nExample: *.${cmdName} ඔයා මොකද කරන්නේ*`);

                // 🔄 මැසේජ් එක Edit කරන්න කලින් පොඩි loading ඉඟියක් (React එකක්) දාමු
                // await bot.sendMessage(from, { react: { text: "🔤", key: mek.key } });

                // Google Translate හරහා translate කිරීම
                const res = await translate(q, { to: langCode });
                const translatedText = res.text;

                // 🎯 FIXED: Bot තමන් එවපු මැසේජ් එකම EDIT කරන කොටස
                // WhatsApp වල මැසේජ් එකක් edit කරන්නේ මෙන්න මේ protocol එකෙන්:
                await bot.sendMessage(from, {
                    edit: mek.key, // Edit කරන්න ඕනේ දැනට ආපු මැසේජ් එකේම key එක
                    text: translatedText
                });

            } catch (e) {
                console.error(`TRANSLATE ERROR (${cmdName}):`, e);
                reply("❌ Translation failed. Please try again later.");
            }
        }
    );
});
