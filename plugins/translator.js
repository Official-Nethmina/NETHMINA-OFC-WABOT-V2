const { cmd } = require("../command");
const { translate } = require("@vitalets/google-translate-api");

// 🛠️ SINGLISH TO UNICODE CONVERTER FUNCTION
// මේකෙන් ඔයා Singlish වලින් ලියන ඒවා (eg: oya -> ඔයා) සිංහල අකුරු බවට පත් කරනවා
function singlishToUnicode(text) {
    let sngl = text.toLowerCase();
    
    // බහුලවම යෙදෙන Singlish වචන සහ අකුරු Mapping එකක් (මූලික නීති)
    const rules = [
        { s: 'chch', u: 'ච්ඡ' }, { s: 'thth', u: 'ත්ථ' }, { s: 'sh', u: 'ශ්' }, 
        { s: 'ch', u: 'ච්' }, { s: 'th', u: 'ත්' }, { s: 'kh', u: 'ඛ්' }, 
        { s: 'gh', u: 'ඝ්' }, { s: 'dh', u: 'ද්' }, { s: 'ph', u: 'ඵ්' }, 
        { s: 'bh', u: 'භ්' }, { s: 'ny', u: 'ඤ්' }, { s: 'nd', u: 'ඳ' },
        { s: 'ng', u: 'ඟ' }, { s: 'mb', u: 'ඹ' },

        // ස්වර (Vowels)
        { s: 'aa', u: 'ආ' }, { s: 'ae', u: 'ඈ' }, { s: 'ii', u: 'ඊ' }, 
        { s: 'uu', u: 'ඌ' }, { s: 'ee', u: 'ඒ' }, { s: 'oo', u: 'ඕ' }, 
        { s: 'au', u: 'ඖ' }, { s: 'ai', u: 'ඓ' },

        // තනි අකුරු (Consonants + Vowels)
        { s: 'a', u: 'අ' }, { s: 'b', u: 'බ' }, { s: 'd', u: 'ද' }, 
        { s: 'e', u: 'එ' }, { s: 'f', u: 'ෆ' }, { s: 'g', u: 'ග' }, 
        { s: 'h', u: 'හ' }, { s: 'i', u: 'ඉ' }, { s: 'j', u: 'ජ' }, 
        { s: 'k', u: 'ක' }, { s: 'l', u: 'ල' }, { s: 'm', u: 'ම' }, 
        { s: 'n', u: 'න' }, { s: 'o', u: 'ඔ' }, { s: 'p', u: 'ප' }, 
        { s: 'q', u: 'ක්' }, { s: 'r', u: 'ර' }, { s: 's', u: 'ස' }, 
        { s: 't', u: 'ට' }, { s: 'u', u: 'උ' }, { s: 'v', u: 'ව' }, 
        { s: 'w', u: 'ව' }, { s: 'x', u: 'ක්ෂ' }, { s: 'y', u: 'ය' }, 
        { s: 'z', u: 'ස' }
    ];

    // Singlish Text එක සරලව සිංහල ශබ්ද වලට හරවන logic එකක් (Basic phonetic)
    // සටහන: වඩාත් සංකීර්ණ වචන වලදී පොඩි වෙනස්කම් වෙන්න පුළුවන්, නමුත් Google Translate එකට තේරුම් ගන්න මේක ඇති.
    let converted = sngl;
    
    // පොදු වචන කීපයක් කෙලින්ම mapping දාමු ලේසි වෙන්න
    const commonWords = {
        'oya': 'ඔයා', 'oyata': 'ඔයාට', 'moko': 'මොකෝ', 'mokada': 'මොකද',
        'kohomada': 'කොහොමද', 'mama': 'මම', 'mata': 'මට', 'na': 'නෑ', 'ne': 'නෑ',
        'monawada': 'මොනවාද', 'ai': 'ඇයි', 'yanawa': 'යනවා', 'karanne': 'කරන්නේ'
    };

    let words = converted.split(' ');
    let processedWords = words.map(w => {
        // වචනය කෙලින්ම තියෙනවා නම් ඒක ගන්නවා
        if (commonWords[w]) return commonWords[w];
        
        // නැත්නම් අකුරෙන් අකුර රීති අනුව මාරු කරනවා
        let tempWord = w;
        rules.forEach(rule => {
            let regex = new RegExp(rule.s, 'g');
            tempWord = tempWord.replace(regex, rule.u);
        });
        return tempWord;
    });

    return processedWords.join(' ');
}

// 🌐 LANGUAGES TO TRANSLATE
const targetLanguages = [
    { cmdName: "en", langCode: "en" }, // English
    { cmdName: "si", langCode: "si" }, // Sinhala
    { cmdName: "ja", langCode: "ja" }, // Japanese
    { cmdName: "ko", langCode: "ko" }, // Korean
    { cmdName: "ar", langCode: "ar" }  // Arabic
];

targetLanguages.forEach(({ cmdName, langCode }) => {
    cmd(
        {
            pattern: cmdName,
            desc: `Translate (Supports Singlish) and edit message to ${cmdName.toUpperCase()}`,
            category: "tools",
            filename: __filename,
        },
        async (bot, mek, m, { from, q, reply }) => {
            try {
                if (!q) return reply(`✍️ Please provide a text to translate. \nExample: *.${cmdName} oya kohomada*`);

                // await bot.sendMessage(from, { react: { text: "🔤", key: mek.key } });

                let textToTranslate = q;

                // 🎯 SMART SINGLISH DETECTION
                // Text එකේ ඉංග්‍රීසි අකුරු විතරක් තියෙනවා නම් (සිංහල අකුරු නැත්නම්) ඒක Singlish කියලා හිතලා සිංහලට හරවනවා
                const hasSinhala = /[\u0D80-\u0DFF]/.test(q);
                if (!hasSinhala && langCode !== 'si') { 
                    // සිංහල අකුරු නැත්නම් විතරක් Singlish -> Unicode කන්වර්ට් කරනවා
                    textToTranslate = singlishToUnicode(q);
                }

                // Google Translate හරහා translate කිරීම
                // Singlish වලින් ආපු එක සිංහල කරලා දෙන නිසා, Google Translate එකට ලේසියෙන්ම ඒක ඉංග්‍රීසි කරන්න පුළුවන්
                const res = await translate(textToTranslate, { to: langCode });
                let translatedText = res.text.trim();

                // 🎯 FIX 1: මුල්ම අකුර CAPITAL කිරීම
                if (translatedText.length > 0) {
                    translatedText = translatedText.charAt(0).toUpperCase() + translatedText.slice(1);
                }

                // 🎯 FIX 2: SMART QUESTION MARK DETECTION
                const questionWords = /\b(මොකද|ඇයි|කොහොමද|කවුද|කොහේද|මොකක්|මොන|කීයටද|කීයක්|ද|moko|mokada|kohomada|ai)\b/i;
                const engQuestionStarts = /^(What|Why|How|Who|Where|When|Which|Whom|Whose|Is|Are|Am|Do|Does|Did|Can|Could|Should|Would|Will|Shall)\b/i;
                
                if (!translatedText.includes('?')) {
                    if (questionWords.test(q) || engQuestionStarts.test(translatedText)) {
                        
                        const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])+$/g;
                        const hasEmojiAtEnd = emojiRegex.test(translatedText);

                        if (hasEmojiAtEnd) {
                            const match = translatedText.match(emojiRegex);
                            const emojis = match ? match[0] : "";
                            const textWithoutEmoji = translatedText.replace(emojiRegex, "").trim();
                            translatedText = `${textWithoutEmoji}? ${emojis}`;
                        } else {
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
