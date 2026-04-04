cmd({
    pattern: "settings",
    alias: ["set", "config"],
    desc: "Display all bot settings and usage commands.",
    category: "settings",
    filename: __filename
},
async (conn, mek, m, { from, reply, pushname }) => {
    try {
        const settingsText = `
⚙️ *ＮＥＴＨＭＩＮＡ-ＭＤ  ＳＥＴＴＩＮＧＳ*

Hello *${pushname}*, here are the available commands to control the bot:

┌───⊷ *ＰＲＥＳＥＮＣＥ*
│ 🎙️ *.auto-record* <on/off>
│ ⌨️ *.auto-typing* <on/off>
│ 🟢 *.always-online* <on/off>
└───────────────⊷

┌───⊷ *ＳＴＡＴＵＳ*
│ 👀 *.auto-seen* <on/off>
│ ❤️ *.status-react* <on/off>
└───────────────⊷

┌───⊷ *ＡＵＴＯ  ＲＥＡＣＴ*
│ 🔔 *.auto-react* <on/off>
│ 🤴 *.owner-react* <on/off>
│ 🎲 *.user-react* <on/off>
└───────────────⊷

┌───⊷ *ＣＵＳＴＯＭＩＺＥ*
│ 🖼️ *.update-img* <url>
│ 💬 *.update-msg* <text>
│ 👑 *.update-owner* <number>
└───────────────⊷

📌 *Example:* .auto-seen on

> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴᴇᴛʜᴍɪɴᴀ ᴏꜰᴄ`;

        // Profile Picture එකක් තිබේ නම් එය සමඟ යැවීම (Optional)
        await conn.sendMessage(from, { 
            image: { url: config.ALIVE_IMG }, 
            caption: settingsText 
        }, { quoted: mek });

    } catch (e) {
        console.error("Settings Menu Error:", e);
        reply("❌ Error generating settings menu.");
    }
});
