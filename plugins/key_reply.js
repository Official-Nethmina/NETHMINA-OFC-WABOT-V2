const { cmd } = require("../command");

// 🧠 Global Variable එකක් හරහා Keyword Config එක මතක තබා ගැනීම
global.keywordReplyConfig = global.keywordReplyConfig || { triggerWord: null, type: null, data: null };

// =======================================================
// 🛡️ LISTENER: මැසේජ් එකක Keyword එක තියෙනවද බලා රිප්ලයි කරන කොටස
// =======================================================
cmd(
    {
        on: "text", // හැම මැසේජ් එකක්ම ස්කෑන් කරනවා
        category: "owner",
        filename: __filename,
    },
    async (nethmina, mek, sms, { from, sender, isGroup }) => {
        try {
            // 🚫 ආරක්ෂාව සඳහා Inbox (DMs) වලට පමණක් සීමා කර ඇත (ගෲප් වල ස්පෑම් වීම වැළැක්වීමට)
            if (isGroup) return;

            // දැනට Keyword එකක් සෙට් කරලා නැත්නම් ඉග්නෝර් කරයි
            if (!global.keywordReplyConfig.triggerWord) return;

            // 📥 යූසර් එවපු මැසේජ් එකේ Text එක එකතු කරගැනීම
            let incomingText = "";
            if (mek.message?.conversation) incomingText = mek.message.conversation;
            else if (mek.message?.extendedTextMessage?.text) incomingText = mek.message.extendedTextMessage.text;
            else if (mek.message?.imageMessage?.caption) incomingText = mek.message.imageMessage.caption;
            else if (mek.message?.videoMessage?.caption) incomingText = mek.message.videoMessage.caption;

            // කැපිටල්/සිම්පල් ප්‍රශ්න නැති වෙන්න ඔක්කොම lowercase කරනවා
            incomingText = incomingText.toLowerCase();
            const targetKeyword = global.keywordReplyConfig.triggerWord.toLowerCase();

            // 🎯 මැසේජ් එක ඇතුලේ වචනය තියෙනවද කියා බැලීම
            if (incomingText.includes(targetKeyword)) {
                
                if (global.keywordReplyConfig.type === "text") {
                    await nethmina.sendMessage(from, { text: global.keywordReplyConfig.data });
                } 
                else if (global.keywordReplyConfig.type === "media") {
                    // සේව් කරගත් මීඩියා එක (Image/Video/Sticker) Forward කිරීම
                    await nethmina.sendMessage(from, { forward: global.keywordReplyConfig.data });
                }
            }

        } catch (error) {
            console.error("Keyword Reply Listener Error:", error);
        }
    }
);

// =======================================================
// ⚙️ COMMAND 1: KEYWORD AUTO-REPLY සෙට් කරන COMMMAND එක
// =======================================================
cmd(
    {
        pattern: "wreply",
        alias: ["keywordreply", "kreply"],
        desc: "Set an endless auto-reply based on a keyword trigger.",
        category: "owner",
        filename: __filename,
    },
    async (nethmina, mek, sms, { from, args, q, sender, reply, isOwner }) => {
        try {
            if (!isOwner) return await reply("❌ This command is only for my Owner! 🧑🏻‍💻");

            if (!q) {
                return await reply("❌ Please provide a keyword and a message!\n\n*Examples:*\n🔹 *Text:* `.wreply gm | Good Morning!`\n🔹 *Media:* Reply to an image/sticker with `.wreply sendme` ");
            }

            const isQuoted = !!(mek.message?.extendedTextMessage?.contextInfo?.quotedMessage);

            // ----------------------------------------
            // CASE A: මීඩියා එකකට REPLY කරමින් කමාන්ඩ් එක ගසා ඇති විට
            // ----------------------------------------
            if (isQuoted) {
                const context = mek.message.extendedTextMessage.contextInfo;
                
                const fakeMek = {
                    key: {
                        remoteJid: from,
                        fromMe: false,
                        id: context.stanzaId,
                        participant: context.participant
                    },
                    message: context.quotedMessage
                };

                // මුළු 'q' එකම Trigger Word එක විදිහට ගන්නවා
                global.keywordReplyConfig = {
                    triggerWord: q.trim(),
                    type: "media",
                    data: fakeMek
                };

                return await reply(`🎯 *Keyword Auto-Reply Activated!*\n\n🔑 *Trigger Word:* "${global.keywordReplyConfig.triggerWord}"\n📂 *Reply Type:* Media (Replied Item)\n\n_This will run endlessly until you type_ \`.stopwreply\``);
            } 
            // ----------------------------------------
            // CASE B: සාමාන්‍ย TEXT මැසේජ් එකක් සෙට් කරන විට
            // ----------------------------------------
            else {
                let triggerWord = "";
                let replyText = "";

                // Pipe (|) ලකුණ පාවිච්චි කරලා තියෙනවා නම් ඒකෙන් වෙන් කරනවා
                if (q.includes("|")) {
                    const parts = q.split("|");
                    triggerWord = parts[0].trim();
                    replyText = parts[1].trim();
                } else {
                    // නැත්නම් පළවෙනි වචනය trigger එක විදිහටත් ඉතිරි ටික reply එක විදිහටත් ගන්නවා
                    const parts = q.split(" ");
                    triggerWord = parts[0].trim();
                    replyText = parts.slice(1).join(" ").trim();
                }

                if (!triggerWord || !replyText) {
                    return await reply("❌ Invalid Format! Use: `.wreply [word] | [message]`");
                }

                global.keywordReplyConfig = {
                    triggerWord: triggerWord,
                    type: "text",
                    data: replyText
                };

                return await reply(`🎯 *Keyword Auto-Reply Activated!*\n\n🔑 *Trigger Word:* "${global.keywordReplyConfig.triggerWord}"\n📝 *Reply Message:* ${global.keywordReplyConfig.data}\n\n_This will run endlessly until you type_ \`.stopwreply\``);
            }

        } catch (error) {
            console.error("Set Keyword Reply Error:", error);
            await reply(`❌ Error: ${error.message || error}`);
        }
    }
);

// =======================================================
// 🛑 COMMAND 2: KEYWORD SYSTEM එක MANUAL STOP කරන එක
// =======================================================
cmd(
    {
        pattern: "stopwreply",
        desc: "Stop the active keyword auto-reply system.",
        category: "owner",
        filename: __filename,
    },
    async (nethmina, mek, sms, { from, reply, isOwner }) => {
        try {
            if (!isOwner) return await reply("❌ This command is only for my Owner! 🧑🏻‍💻");

            global.keywordReplyConfig = { triggerWord: null, type: null, data: null };
            return await reply("🛑 *Keyword Auto-Reply system has been stopped.* All rules cleared.");
        } catch (error) {
            await reply("❌ Error stopping keyword system.");
        }
    }
);
