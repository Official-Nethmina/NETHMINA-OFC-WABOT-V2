const { cmd } = require('../command');
const { sleep } = require('../lib/functions');

cmd({
    pattern: "mute",
    alias: ["tmute", "sched_mute"],
    desc: "Mute the group (Instant or Scheduled).",
    category: "group",
    filename: __filename
},           
async (conn, mek, m, { from, q, reply, isGroup, isAdmins, isBotAdmins, isOwner }) => {
    try {
        // 1. Group & Admin Checks (Using Global Permissions)
        if (!isGroup) return reply("❌ This command can only be used in groups.");
        if (!isAdmins && !isOwner) return reply("❌ Only group admins can use this command.");
        if (!isBotAdmins) return reply("❌ I need to be an admin to mute the group.");

        // 2. Instant Mute Logic (කිසිම Input එකක් නැතිනම්)
        if (!q) {
            await conn.sendMessage(from, { react: { text: '🔇', key: mek.key } }).catch(() => null);
            await conn.groupSettingUpdate(from, 'announcement');
            return reply("✅ *𝐆ʀᴏᴜ𝐏 𝐌ᴜᴛᴇ𝐃 𝐈ɴꜱᴛᴀɴᴛʟ𝐘.*");
        }

        // 3. Time Logic (Minutes/Hours)
        let timeValue = parseInt(q.replace(/[^0-9]/g, ''));
        if (isNaN(timeValue)) return reply("❌ Please provide a valid number. (Ex: .mute 10m)");

        let timeUnit = q.toLowerCase().replace(/[0-9]/g, '').trim();
        let milliseconds = 0;
        let displayTime = "";

        if (timeUnit === 'h' || timeUnit === 'hour' || timeUnit === 'hours') {
            milliseconds = timeValue * 60 * 60 * 1000;
            displayTime = `${timeValue} hour(s)`;
        } else {
            // Default unit is minutes (m)
            milliseconds = timeValue * 60 * 1000;
            displayTime = `${timeValue} minute(s)`;
        }

        // 4. Scheduling Response
        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } }).catch(() => null);
        await reply(`⏳ *𝐒ᴄʜᴇ𝐃ᴜ𝐋ᴇ𝐃 𝐌ᴜ𝐓ᴇ:* Group will be muted in *${displayTime}*.`);

        // 5. නියමිත වේලාව තෙක් රැඳී සිටීම (background process)
        await sleep(milliseconds);

        // 6. Group එක Mute කිරීම
        await conn.groupSettingUpdate(from, 'announcement');
        await conn.sendMessage(from, { 
            text: `🔇 *𝐆ʀᴏᴜ𝐏 𝐌ᴜ𝐓ᴇ𝐃 𝐀ᴜ𝐓ᴏ𝐌ᴀ𝐓ɪᴄᴀʟʟ𝐘.*\nTime set: ${displayTime}\nOnly admins can send messages now.` 
        });

    } catch (e) {
        console.error("Scheduled Mute Error:", e);
        reply("❌ Error occurred while scheduling mute.");
    }
});
