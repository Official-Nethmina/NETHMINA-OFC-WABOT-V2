const { cmd } = require("../command");

// 🧠 Global Variables හරහා Config සහ Cooldowns මතක තබා ගැනීම
global.autoReplyConfig = global.autoReplyConfig || { activeUntil: null, type: null, data: null };
global.autoReplyCooldowns = global.autoReplyCooldowns || {};

// =======================================================
// 🛡️ LISTENER: හැම මැසේජ් එකක්ම චෙක් කරලා Auto-Reply යවන කොටස
// =======================================================
cmd(
    {
        on: "text", // Prefix නැති හැම මැසේජ් එකක්ම මේකට අහුවෙනවා
        category: "owner",
        filename: __filename,
    },
    async (nethmina, mek, sms, { from, sender, isGroup }) => {
        try {
            // 🚫 SAFETY FIRST: ගෲප් මැසේජ් ඉග්නෝර් කිරීම (ගෲප් වල හැම මැසේජ් එකටම රිප්ලයි ගියොත් නම්බර් එක විනාඩි 2න් බෑන් වෙනවා)
            if (isGroup) return;

            // ⏱️ Auto Reply එකක් දැනට Active ද සහ වෙලාව ඉකුත් වී නැතිදැයි බැලීම
            if (!global.autoReplyConfig.activeUntil || Date.now() > global.autoReplyConfig.activeUntil) {
                return; // වෙලාව ඉවරයි නම් හෝ Active නැත්නම් මුකුත් කරන්නේ නැත
            }

            // 🛑 ANTI-SPAM: එකම යූසර්ට විනාඩි 5කට සැරයක් විතරක් යැවීමේ Logic එක
            const lastSentTime = global.autoReplyCooldowns[sender] || 0;
            const fiveMinutes = 5 * 60 * 1000; // Milliseconds වලින් විනාඩි 5

            if (Date.now() - lastSentTime < fiveMinutes) {
                return; // තවම විනාඩි 5ක් ගිහින් නැත්නම් රිප්ලයි කරන්නේ නැත
            }

            // ==========================================
            // 🚀 AUTO-REPLY MESSAGE එක SEND කිරීම
            // ==========================================
            if (global.autoReplyConfig.type === "text") {
                await nethmina.sendMessage(from, { text: global.autoReplyConfig.data });
            } 
            else if (global.autoReplyConfig.type === "media") {
                // සේව් කරගත් ඕනෑම මීඩියා එකක් (Image/Video/Sticker) Forward කිරීම
                await nethmina.sendMessage(from, { forward: global.autoReplyConfig.data });
            }

            // 🔄 මේ යූසර්ට මැසේජ් එක යැවූ වෙලාව අප්ඩේට් කිරීම (ඊළඟ විනාඩි 5ට බ්ලොක් කරයි)
            global.autoReplyCooldowns[sender] = Date.now();

        } catch (error) {
            console.error("Auto Reply Listener Error:", error);
        }
    }
);

// =======================================================
// ⚙️ COMMAND 1: AUTO-REPLY SET කරන COMMMAND එක
// =======================================================
cmd(
    {
        pattern: "autoreply",
        alias: ["setreply", "sar"],
        desc: "Set auto-reply with a specific duration (e.g., 10m or 2h) for text/media.",
        category: "owner",
        filename: __filename,
    },
    async (nethmina, mek, sms, { from, args, q, sender, reply, isOwner }) => {
        try {
            if (!isOwner) return await reply("❌ This command is only for my Owner! 🧑🏻‍💻");

            const timeArg = args[0];
            if (!timeArg) {
                return await reply("❌ Please provide a time duration!\n\n*Examples:*\n🔹 Text: `.autoreply 10m Hello I am away` \n🔹 Media: Reply to any Image/Video/Sticker with `.autoreply 2h` ");
            }

            // ⏱️ Time Regex එකෙන් මිනිත්තු (m) හෝ පැය (h) වෙන් කර ගැනීම
            const timeMatch = timeArg.match(/^(\d+)([mh])$/i);
            if (!timeMatch) {
                return await reply("❌ Invalid time format! Use *m* for minutes and *h* for hours. (e.g., `10m` or `2h`) ");
            }

            const timeValue = parseInt(timeMatch[1]);
            const timeUnit = timeMatch[2].toLowerCase();
            let durationMs = 0;

            if (timeUnit === "m") durationMs = timeValue * 60 * 1000;
            if (timeUnit === "h") durationMs = timeValue * 60 * 60 * 1000;

            const expirationTime = Date.now() + durationMs;
            const isQuoted = !!(mek.message?.extendedTextMessage?.contextInfo?.quotedMessage);

            // ----------------------------------------
            // CASE A: මීඩියා එකකට හෝ වෙනත් මැසේජ් එකකට REPLY කර ඇති විට
            // ----------------------------------------
            if (isQuoted) {
                const context = mek.message.extendedTextMessage.contextInfo;
                
                // Baileys එකට කියවන්න පුළුවන් Fake Message Object එකක් හැදීම (Forward කිරීම සඳහා)
                const fakeMek = {
                    key: {
                        remoteJid: from,
                        fromMe: false,
                        id: context.stanzaId,
                        participant: context.participant
                    },
                    message: context.quotedMessage
                };

                global.autoReplyConfig = {
                    activeUntil: expirationTime,
                    type: "media",
                    data: fakeMek
                };

                // Cooldowns ලිස්ට් එක Reset කිරීම (අලුත් Session එකක් නිසා)
                global.autoReplyCooldowns = {};

                return await reply(`✅ *Auto-Reply Activated Successfully!* \n\n⏱️ *Duration:* ${timeValue} ${timeUnit === "m" ? "Minutes" : "Hours"}\n📂 *Type:* Media / Replied Message\n\n_Bot will automatically reply to inbox messages. Each user gets it once every 5 minutes._`);
            } 
            // ----------------------------------------
            // CASE B: නිකන්ම TEXT මැසේජ් එකක් ටයිප් කර ඇති විට
            // ----------------------------------------
            else {
                const textMessage = args.slice(1).join(" ");
                if (!textMessage) {
                    return await reply("❌ Please provide a text message after the time! Example: `.autoreply 30m I am busy` ");
                }

                global.autoReplyConfig = {
                    activeUntil: expirationTime,
                    type: "text",
                    data: textMessage
                };

                global.autoReplyCooldowns = {};

                return await reply(`✅ *Auto-Reply Activated Successfully!* \n\n⏱️ *Duration:* ${timeValue} ${timeUnit === "m" ? "Minutes" : "Hours"}\n📝 *Message:* ${textMessage}\n\n_Bot will automatically reply to inbox messages. Each user gets it once every 5 minutes._`);
            }

        } catch (error) {
            console.error("Set Auto Reply Error:", error);
            await reply(`❌ Error setting auto-reply: ${error.message || error}`);
        }
    }
);

// =======================================================
// 🛑 COMMAND 2: වෙලාව ඉවර වෙන්න කලින් MANUAL STOP කරන එක
// =======================================================
cmd(
    {
        pattern: "stopreply",
        desc: "Manually stop the currently active auto-reply.",
        category: "owner",
        filename: __filename,
    },
    async (nethmina, mek, sms, { from, reply, isOwner }) => {
        try {
            if (!isOwner) return await reply("❌ This command is only for my Owner! 🧑🏻‍💻");

            global.autoReplyConfig = { activeUntil: null, type: null, data: null };
            global.autoReplyCooldowns = {};

            return await reply("🛑 *Auto-Reply system has been manually stopped.* All configurations cleared.");
        } catch (error) {
            await reply("❌ Error stopping auto-reply.");
        }
    }
);
