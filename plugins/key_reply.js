const { cmd } = require("../command");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

// 🧠 Global Variable එකක් හරහා Keyword Config එක මතක තබා ගැනීම
global.keywordReplyConfig = global.keywordReplyConfig || { triggerWord: null, type: null, msgType: null, buffer: null, caption: null, textData: null };

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
            // 🚫 ආරක්ෂාව සඳහා Inbox (DMs) වලට පමණක් සීමා කර ඇත
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
                
                // 🔹 CASE 1: TEXT REPLY එකක් නම්
                if (global.keywordReplyConfig.type === "text") {
                    await nethmina.sendMessage(from, { text: global.keywordReplyConfig.textData });
                } 
                // 🔹 CASE 2: MEDIA REPLY එකක් නම් (Image/Video/Sticker)
                else if (global.keywordReplyConfig.type === "media") {
                    const msgType = global.keywordReplyConfig.msgType;
                    const options = {};
                    
                    // කැප්ෂන් එකක් තිබුනොත් ඒකත් එකතු කරනවා (Sticker වලට කැප්ෂන් බෑ)
                    if (global.keywordReplyConfig.caption && msgType !== "sticker") {
                        options.caption = global.keywordReplyConfig.caption;
                    }

                    await nethmina.sendMessage(from, { [msgType]: global.keywordReplyConfig.buffer, ...options });
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
                return await reply("❌ Please provide a keyword!\n\n*Examples:*\n🔹 *Text:* `.wreply gm | Good Morning!`\n🔹 *Media:* Reply to an image/sticker with `.wreply sendme` ");
            }

            const isQuoted = !!(mek.message?.extendedTextMessage?.contextInfo?.quotedMessage);

            // ----------------------------------------
            // CASE A: මීඩියා එකකට REPLY කරමින් කමාන්ඩ් එක ගසා ඇති විට
            // ----------------------------------------
            if (isQuoted) {
                const quotedMsg = mek.message.extendedTextMessage.contextInfo.quotedMessage;
                let msgType = "";
                let mediaMessage = null;
                let caption = null;

                // මීඩියා ටයිප් එක හරියටම අල්ලගැනීම
                if (quotedMsg.imageMessage) { msgType = "image"; mediaMessage = quotedMsg.imageMessage; caption = quotedMsg.imageMessage.caption; }
                else if (quotedMsg.videoMessage) { msgType = "video"; mediaMessage = quotedMsg.videoMessage; caption = quotedMsg.videoMessage.caption; }
                else if (quotedMsg.stickerMessage) { msgType = "sticker"; mediaMessage = quotedMsg.stickerMessage; }
                else if (quotedMsg.documentMessage) { msgType = "document"; mediaMessage = quotedMsg.documentMessage; caption = quotedMsg.documentMessage.caption; }
                
                if (!mediaMessage) {
                    return await reply("❌ Please reply to a valid Image, Video, Sticker or Document!");
                }

                await reply("⏳ *Processing media... Please wait...*");

                // Baileys මඟින් මීඩියා එක Buffer එකක් විදිහට ඩවුන්ලෝඩ් කරගැනීම (Hard disk එක පිරෙන්නේ නැත)
                const stream = await downloadContentFromMessage(mediaMessage, msgType);
                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }

                global.keywordReplyConfig = {
                    triggerWord: q.trim(),
                    type: "media",
                    msgType: msgType,
                    buffer: buffer,
                    caption: caption,
                    textData: null
                };

                return await reply(`🎯 *Media Keyword Auto-Reply Activated!*\n\n🔑 *Trigger Word:* "${global.keywordReplyConfig.triggerWord}"\n📂 *Media Type:* ${msgType}\n📝 *Caption:* ${caption || "No Caption"}\n\n_Bot will reply with this media whenever the keyword is detected!_`);
            } 
            // ----------------------------------------
            // CASE B: සාමාන්‍ය TEXT මැසේජ් එකක් සෙට් කරන විට
            // ----------------------------------------
            else {
                let triggerWord = "";
                let replyText = "";

                if (q.includes("|")) {
                    const parts = q.split("|");
                    triggerWord = parts[0].trim();
                    replyText = parts[1].trim();
                } else {
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
                    msgType: null,
                    buffer: null,
                    caption: null,
                    textData: replyText
                };

                return await reply(`🎯 *Text Keyword Auto-Reply Activated!*\n\n🔑 *Trigger Word:* "${global.keywordReplyConfig.triggerWord}"\n📝 *Reply Message:* ${global.keywordReplyConfig.textData}`);
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

            global.keywordReplyConfig = { triggerWord: null, type: null, msgType: null, buffer: null, caption: null, textData: null };
            return await reply("🛑 *Keyword Auto-Reply system has been stopped.* All rules cleared.");
        } catch (error) {
            await reply("❌ Error stopping keyword system.");
        }
    }
);
