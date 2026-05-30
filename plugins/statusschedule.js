const { cmd } = require("../command");
const config = require("../config");
const cron = require("node-cron");

// 🕒 Schedule කරපු ස්ටේටස් තියාගන්න මෙමරිය (Memory Object)
if (!global.scheduledStatuses) global.scheduledStatuses = [];

// 🔄 බොට් ස්ටාර්ට් වෙද්දීම බැක්ග්‍රවුන්ඩ් එකෙන් හැම විනාඩියකම රන් වෙන ක්‍රෝන් ජොබ් එකක්
cron.schedule("* * * * *", async () => {
    const now = new Date();
    // ශ්‍රී ලංකාවේ වෙලාව (Asia/Colombo) ගන්නවා
    const currentTimeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Colombo' });
    
    const remainingTasks = [];

    for (const task of global.scheduledStatuses) {
        if (task.time === currentTimeStr) {
            try {
                if (task.type === "text") {
                    // 📝 Text Status Upload
                    await task.bot.sendMessage("status@broadcast", { text: task.content });
                } else if (task.type === "image" || task.type === "video") {
                    // 🖼️/🎥 Media Status Upload
                    await task.bot.sendMessage("status@broadcast", { 
                        [task.type]: task.content, 
                        caption: task.caption 
                    });
                }
                
                // ඕනර්ට වැඩේ සාර්ථකයි කියලා මැසේජ් එකක් යවනවා
                await task.bot.sendMessage(task.ownerJid, { text: `✅ *Status Scheduled Success!* Your status has been uploaded successfully at ${task.time}.` });
            } catch (err) {
                console.error("Status Scheduling Error:", err);
                await task.bot.sendMessage(task.ownerJid, { text: `❌ *Status Scheduling Failed:* Error uploading status at ${task.time}.` });
            }
        } else {
            remainingTasks.push(task);
        }
    }
    global.scheduledStatuses = remainingTasks;
}, {
    scheduled: true,
    timezone: "Asia/Colombo"
});

// ==========================================
// 🕒 STATUS SCHEDULE COMMAND
// ==========================================
cmd(
    {
        pattern: "setstatus",
        alias: ["schedulestatus", "setss"],
        desc: "Schedule a status upload for a specific time (24h format HH:MM)",
        category: "owner",
        filename: __filename,
    },
    async (bot, mek, m, { from, args, isOwner, reply }) => {
        try {
            // 🔒 බොට්ගේ ඕනර්ට විතරක් වැඩ කරන්න ලොජික් එක
            if (!isOwner) return reply("❌ Only the Bot Owner can use this command!");

            // 🎯 [FIX] කමාන්ඩ් එක ගැහුව ගමන් ඔටෝ රියැක්ට් වෙන කොටස
            await bot.sendMessage(from, { react: { text: "🕒", key: mek.key } }).catch(() => {});

            const timeInput = args[0]; // උදා: 14:30
            if (!timeInput || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeInput)) {
                return reply("💡 *Invalid Format!*\n\nUse: `.setschedule HH:MM` (24-hour format)\nExample: `.setschedule 15:45` (To schedule at 3:45 PM)");
            }

            // රිප්ලයි කරලා තියෙන මැසේජ් එකේ ටයිප් එක බලනවා
            const quotedMsg = m.quoted ? m.quoted : null;
            if (!quotedMsg) return reply("❌ Please reply to a Text, Image, or Video that you want to schedule as a status.");

            let type = "";
            let content = null;
            let caption = "";

            if (quotedMsg.type === "conversation" || quotedMsg.type === "extendedTextMessage") {
                type = "text";
                content = quotedMsg.text;
            } else if (quotedMsg.type === "imageMessage") {
                type = "image";
                caption = quotedMsg.caption || "";
                content = await quotedMsg.download(); 
            } else if (quotedMsg.type === "videoMessage") {
                type = "video";
                caption = quotedMsg.caption || "";
                content = await quotedMsg.download();
            } else {
                return reply("❌ Unsupported format! You can only schedule Text, Image, or Video statuses.");
            }

            // Task එක ග්ලෝබල් ලිස්ට් එකට එකතු කරනවා
            global.scheduledStatuses.push({
                bot,
                ownerJid: from,
                time: timeInput,
                type,
                content,
                caption,
            });

            reply(`🎯 *Status Scheduled Successfully!*\n\n🕒 *Time:* ${timeInput} (Sri Lanka Time)\n📂 *Type:* ${type.toUpperCase()}\n\n> Bot will upload it automatically at the set time!`);

        } catch (e) {
            console.error(e);
            reply(`❌ Error: ${e.message}`);
        }
    }
);

// ==========================================
// 📋 VIEW SCHEDULED STATUSES LIST
// ==========================================
cmd(
    {
        pattern: "listschedule",
        alias: ["lss","listss"],
        desc: "View all currently scheduled statuses",
        category: "owner",
        filename: __filename,
    },
    async (bot, mek, m, { from, isOwner, reply }) => {
        if (!isOwner) return reply("❌ Only Bot Owner can use this.");
        
        // 🎯 [FIX] කමාන්ඩ් එක ගැහුව ගමන් ඔටෝ රියැක්ට් වෙන කොටස
        await bot.sendMessage(from, { react: { text: "📋", key: mek.key } }).catch(() => {});

        if (!global.scheduledStatuses || global.scheduledStatuses.length === 0) {
            return reply("📅 No statuses are currently scheduled.");
        }

        let msg = "📋 *CURRENTLY SCHEDULED STATUSES*\n\n";
        global.scheduledStatuses.forEach((task, index) => {
            msg += `${index + 1}️⃣ 🕒 *Time:* ${task.time} | 📂 *Type:* ${task.type.toUpperCase()}\n`;
        });

        reply(msg);
    }
);
