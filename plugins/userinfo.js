const { cmd } = require('../command');

cmd({
    pattern: "profile",
    alias: ["pinfo", "userinfo"],
    desc: "Get user profile picture, username and bio.",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, sender, isOwner, pushname }) => {
    try {
        if (!isOwner) return reply("❌ This command is only for the bot owner.");

        await conn.sendMessage(from, { react: { text: '👤', key: mek.key } }).catch(() => null);
      
        let target;
        let targetPushName = "Unknown";

        // 1. Target User & PushName හඳුනා ගැනීම
        if (m.quoted) {
            target = m.quoted.sender;
            // රිප්ලයි කළ මැසේජ් එකේ තියෙන pushname එක ගන්නවා
            targetPushName = m.quoted.pushName || "User";
        } else if (q) {
            target = q.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            targetPushName = "User"; // අංකයකින් ගද්දි pushname එක කලින්ම දන්නෙ නෑ
        } else {
            target = sender;
            targetPushName = pushname; // තමන්ගෙම නම් කෙලින්ම pushname එක ගන්නවා
        }

        // 2. Profile Picture ලබා ගැනීම
        let ppUrl;
        try {
            ppUrl = await conn.profilePictureUrl(target, 'image');
        } catch (e) {
            ppUrl = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';
        }

        // 3. Bio (Status) ලබා ගැනීමට උත්සාහ කිරීම
        let userBio = "Hidden by Privacy";
        try {
            // fetchStatus එකට පොඩි වෙලාවක් දෙන්න ඕනෙ (Delay)
            const status = await conn.fetchStatus(target);
            if (status && status.status) {
                userBio = status.status;
            }
        } catch (e) {
            userBio = "Privacy Protected";
        }

        // 4. අවසාන නම තීරණය කිරීම (PushName එක ප්‍රමුඛතාවය දෙයි)
        let finalName = targetPushName || target.split('@')[0];

        const userNum = target.split('@')[0];

        let caption = `👤 *ＵＳＥＲ  ＰＲＯＦＩＬＥ  ＩＮＦＯ*

┌────────────────────⊷
│ 📝 *Name:* ${finalName}
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
