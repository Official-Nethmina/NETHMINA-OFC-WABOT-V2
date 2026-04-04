const { cmd } = require('../command');

cmd({
    pattern: "profile",
    alias: ["pinfo", "userinfo"],
    desc: "Get user profile picture, username and bio.",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, sender, isOwner }) => {
    try {
        if (!isOwner) return reply("❌ This command is only for the bot owner.");

        await conn.sendMessage(from, { react: { text: '👤', key: mek.key } }).catch(() => null);
      
        let target;
        if (m.quoted) {
            target = m.quoted.sender;
        } else if (q && q.includes('@')) {
            target = q.trim();
        } else if (q) {
            target = q.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        } else {
            target = sender;
        }

        // 1. Profile Picture ලබා ගැනීම
        let ppUrl;
        try {
            ppUrl = await conn.profilePictureUrl(target, 'image');
        } catch (e) {
            ppUrl = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';
        }

        // 2. නම ලබා ගැනීම (Enhanced)
        let username = "Unknown User";
        try {
            // පළමුව බොට්ගේ කොන්ටැක්ට් ලිස්ට් එකෙන් බලයි
            const contact = await conn.onWhatsApp(target);
            if (contact && contact[0]) {
                username = await conn.getName(target);
            }
            
            // නම තවමත් අංකයම නම්, අංකය පමණක් පෙන්වන්න
            if (username.includes('@') || !username) {
                username = target.split('@')[0];
            }
        } catch (e) {
            username = target.split('@')[0];
        }

        // 3. Bio ලබා ගැනීම (Error Handling)
        let userBio = "Privacy Protected / No Bio";
        try {
            // fetchStatus සමහරවිට fails වෙනවා privacy නිසා
            const status = await conn.fetchStatus(target);
            if (status && status.status) {
                userBio = status.status;
            }
        } catch (e) {
            // Privacy නිසා bio එක පේන්නේ නැති විට
            userBio = "Hidden by User Privacy";
        }

        const userNum = target.split('@')[0];

        let caption = `👤 *ＵＳＥＲ  ＰＲＯＦＩＬＥ  ＩＮＦＯ*

┌────────────────────⊷
│ 📝 *Name:* ${username}
│ 🔢 *Number:* ${userNum}
│ 💬 *Bio:* ${userBio}
└────────────────────⊷

> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴᴇᴛʜᴍɪɴᴀ ᴏꜰᴄ`;

        await conn.sendMessage(from, { 
            image: { url: ppUrl }, 
            caption: caption,
            mentions: [target]
        }, { quoted: mek });

    } catch (e) {
        console.error("Profile Error:", e);
        reply("❌ Error fetching profile. Make sure the number is correct.");
    }
});
