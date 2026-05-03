const { cmd } = require('../command');

cmd({
    pattern: "profile",
    alias: ["pinfo", "userinfo"],
    desc: "Get user profile picture, username and bio.",
    category: "main",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, sender, pushname }) => {
    try {
        const userPushname = m.pushName || pushname || 'User';
        
        await conn.sendMessage(from, {
            react: { text: '👤', key: mek.key }
        }).catch(() => null);

        let target;
        let name;

        // 🔍 Target detection logic fix
        if (m.quoted) {
            target = m.quoted.sender || m.quoted.participant;
            name = m.quoted.pushName || "User";
        } else if (q) {
            const num = q.replace(/[^0-9]/g, '');
            if (num.length < 10) return reply("❌ කරුණාකර නිවැරදි අංකයක් ලබා දෙන්න.");
            target = num + '@s.whatsapp.net';
            name = "User";
        } else {
            target = sender;
            name = pushname;
        }

        // 🛡️ Ensure target is valid
        if (!target || typeof target !== 'string') target = sender;

        // 🖼 Profile Picture
        let ppUrl;
        try {
            ppUrl = await conn.profilePictureUrl(target, 'image');
        } catch {
            // පින්තූරයක් නැතිනම් හෝ Privacy දාලා නම් default image එක
            ppUrl = 'https://i.ibb.co/2WzRZ6G/user.png';
        }

        // 💬 Bio / Status (Privacy නිසා error එන්න වැඩිම ඉඩක් තියෙන්නේ මෙතන)
        let userBio = "Hidden by Privacy";
        try {
            const status = await conn.fetchStatus(target);
            if (status && status.status) userBio = status.status;
        } catch {
            userBio = "Hidden by Privacy";
        }

        // 🧠 Name resolve (conn.getName සමහර වෙලාවට වැඩ කරන්නේ නැහැ)
        if (!name || name === "User") {
            try {
                name = await conn.getName(target) || target.split('@')[0];
            } catch {
                name = target.split('@')[0];
            }
        }

        const userNum = target.split('@')[0];

        // 🧾 Final Caption
        let caption = `👤 *USER PROFILE INFO*

┌────────────────────⊷
│ 📝 *Name:* ${name} 
│ 🔢 *Number:* ${userNum}
│ 👤 *Tag:* @${userNum}
│ 🔗 *Wa.me:* https://wa.me/${userNum}
│ 💬 *Bio:* ${userBio}
└────────────────────⊷

> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴᴇᴛʜᴍɪɴᴀ ᴏꜰᴄ ||`;

        // 📤 Send Message
        await conn.sendMessage(from, {
            image: { url: ppUrl },
            caption: caption,
            mentions: [target]
        }, { quoted: mek });

    } catch (e) {
        console.error("Profile Error:", e);
        reply("❌ තොරතුරු ලබාගැනීමේදී දෝෂයක් සිදුවුණා.");
    }
});
