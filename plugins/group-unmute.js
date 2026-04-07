const { cmd } = require('../command');
const { sleep } = require('../lib/functions');

cmd({
    pattern: "unmute",
    alias: ["tunmute", "open", "unmute-group"],
    desc: "Unmute the group (Instant or Scheduled for minutes, hours, or days).",
    category: "group",
    filename: __filename
},           
async (conn, mek, m, { from, q, reply, isGroup, isAdmins, isBotAdmins }) => {
    try {
        // 1. Group & Admin Checks (Using global permissions from index.js)
        if (!isGroup) return reply("❌ This command can only be used in groups.");
        if (!isBotAdmins) return reply("❌ I need to be an *admin* to unmute the group.");
        if (!isAdmins) return reply("❌ Only group admins can use this command.");

        // 2. Instant Unmute (If no input time provided)
        if (!q) {
            await conn.sendMessage(from, { react: { text: '🔊', key: mek.key } });
            await conn.groupSettingUpdate(from, 'not_announcement');
            return reply("✅ *𝐆ʀᴏᴜ𝐏 𝐔ɴᴍᴜᴛᴇ𝐃 𝐈ɴꜱᴛᴀɴᴛʟ𝐘.* \nEveryone can send messages now.");
        }

        // 3. Time Logic (Minutes/Hours/Days detection)
        let milliseconds = 0;
        let timeValue = parseInt(q.replace(/[^0-9]/g, ''));
        let timeUnit = q.toLowerCase().replace(/[0-9]/g, '').trim();

        if (isNaN(timeValue)) return reply("❌ Please provide a valid number. (Example: .unmute 10m)");

        if (timeUnit === 'd' || timeUnit === 'day' || timeUnit === 'days') {
            milliseconds = timeValue * 24 * 60 * 60 * 1000;
            reply(`⏳ *𝐒ᴄʜᴇ𝐃ᴜʟᴇ𝐃 𝐔ɴᴍᴜᴛᴇ:* Group will be unmuted in *${timeValue} day(s)*.`);
        } else if (timeUnit === 'h' || timeUnit === 'hour' || timeUnit === 'hours') {
            milliseconds = timeValue * 60 * 60 * 1000;
            reply(`⏳ *𝐒ᴄʜᴇ𝐃ᴜʟᴇ𝐃 𝐔ɴᴍᴜᴛᴇ:* Group will be unmuted in *${timeValue} hour(s)*.`);
        } else {
            // Default unit is minutes (m)
            milliseconds = timeValue * 60 * 1000;
            reply(`⏳ *𝐒ᴄʜᴇ𝐃ᴜʟᴇ𝐃 𝐔ɴᴍᴜᴛᴇ:* Group will be unmuted in *${timeValue} minute(s)*.`);
        }

        // 4. Reaction for Scheduled: ⏳
        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        // 5. Waiting for the scheduled time
        await sleep(milliseconds);

        // 6. Final Group Unmute Update
        await conn.groupSettingUpdate(from, 'not_announcement');
        await conn.sendMessage(from, { text: "🔊 *𝐆ʀᴏᴜ𝐏 𝐔ɴᴍᴜᴛᴇ𝐃 𝐀ᴜᴛᴏᴍᴀᴛɪᴄᴀʟʟ𝐘.* \nEveryone can send messages now." });

    } catch (e) {
        console.error("Scheduled Unmute Error:", e);
        reply("❌ Error occurred while scheduling unmute.");
    }
});
