const { cmd } = require('../command');

cmd({
    pattern: "join",
    alias: ["joinme", "f_join"],
    desc: "To Join a Group from Invite link",
    category: "owner", // සාමාන්‍යයෙන් මේක owner command එකක්
    filename: __filename
}, 
async (conn, mek, m, { from, q, reply, sender }) => {
    try {
        // 1. Owner Check (94760860835)
        // ඔයාගේ නම්බර් එක මෙතන තියෙන නිසා වෙන කාටවත් බොට්ව ගෲප් වලට දාන්න බැහැ
        const ownerNumber = "94760860835";
        const isOwner = sender.includes(ownerNumber);

        if (!isOwner) {
            return reply("❌ *Access Denied* - Only my owner can use this command.");
        }

        // 2. ලින්ක් එක ලබා ගැනීම (Input හෝ Quoted Message එකෙන්)
        let input = q || (m.quoted ? m.quoted.text : null);
        
        if (!input) return reply("❌ Please provide a WhatsApp Group Link.\n\n*Example:* .join https://chat.whatsapp.com/L1abcde...");

        // 3. Link එකෙන් Invite Code එක පමණක් වෙන් කර ගැනීම
        const regex = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i;
        const match = input.match(regex);

        if (!match || !match[1]) {
            return reply("❌ *Invalid Group Link* - Please provide a valid WhatsApp group invite link.");
        }

        const inviteCode = match[1];

        // 4. Reaction: 📬
        await conn.sendMessage(from, { react: { text: '📬', key: mek.key } });

        // 5. ගෲප් එකට සම්බන්ධ වීම
        await conn.groupAcceptInvite(inviteCode);
        
        return reply("✅ *𝐒ᴜᴄᴄᴇꜱꜱꜰᴜʟʟ𝐘 𝐉ᴏɪɴᴇ𝐃 𝐓𝐎 𝐆ʀᴏᴜ𝐏 𝐕ɪ𝐀 𝐋ɪɴ𝐊*");

    } catch (e) {
        console.error("Join Command Error:", e);
        // යම් හෙයකින් බොට්ව කලින් රිමූව් කරලා තිබුණොත් හෝ ලින්ක් එක expire වෙලා නම්
        return reply(`❌ *Error Occurred!*\n\nCould not join the group. The link might be expired or I might be banned from that group.`);
    }
});
