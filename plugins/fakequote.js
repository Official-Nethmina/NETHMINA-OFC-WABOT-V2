const { cmd } = require('../command');

cmd({
    pattern: "fake",
    alias: ["spoof", "fquote"],
    desc: "Create a fake quoted reply message directly or remotely from Inbox.",
    category: "fun",
    use: '.fake @user | text | reply (in group) OR .fake [Group_JID] | [User_Number] | [Fake_Text] | [Bot_Reply] (in Inbox)',
    filename: __filename
},
async (nethmina, mek, msg, { from, q, isGroup, isOwner, reply }) => {
    try {
        // 🔥 [MANUAL REACT FIX] කමාන්ඩ් එක ගැහුව ගමන් රිඇක්ෂන් එක වැදීම
        await nethmina.sendMessage(from, { react: { text: "🎭", key: mek.key } });

        if (!q) {
            return await reply(
                "🎭 *Fake Command Usage:*\n\n" +
                "🔹 *In Group Mode:* `.fake @user | ඔහු කී කතාව | බොට්ගේ රිප්ලයි එක`\n\n" +
                "🔸 *In Owner Inbox (Remote Mode):*\n" +
                "`.fake [Group_JID] | [User_Number] | ඔහු කී කතාව | බොට්ගේ රිප්ලයි එක`\n\n" +
                "*Example (Inbox):* `.fake 120363xxxx@g.us | 9477xxxxxxx | මම අද හැමෝටම රීලෝඩ් දානවා | අඩේ සිරාවටමද? 🤩`"
            );
        }

        // '|' ලකුණෙන් කොටස් වලට වෙන් කර ගැනීම
        const parts = q.split("|");

        let targetGroupJid = from;
        let targetUserJid = "";
        let fakeText = "";
        let botReplyText = "";

        // 1️⃣ [REMOTE INBOX MODE] - බොට් ඕනර් ඉන්බොක්ස් එකේ ඉඳන් ගහන විට
        if (!isGroup) {
            if (!isOwner) return await reply("❌ This remote feature is only for the Bot Owner.");
            if (parts.length < 4) {
                return await reply("❌ Inbox Format: `.fake [Group_JID] | [User_Number] | [Fake_Text] | [Bot_Reply]`");
            }

            const inputGroupJid = parts[0].trim();
            if (!inputGroupJid.endsWith("@g.us")) {
                return await reply("❌ Invalid Group JID! It must end with @g.us");
            }
            targetGroupJid = inputGroupJid;

            // ෆෝන් නම්බර් එක පිරිසිදු කර JID එකක් බවට පත් කිරීම
            let rawNumber = parts[1].trim().replace(/[^0-9]/g, '');
            if (rawNumber.length === 0) return await reply("❌ Please provide a valid phone number.");
            targetUserJid = `${rawNumber}@s.whatsapp.net`;

            fakeText = parts[2].trim();
            botReplyText = parts[3].trim();

        } else {
            // 2️⃣ [LOCAL GROUP MODE] - ගෲප් එක ඇතුළේ සාමාන්‍යයෙන් පාවිච්චි කරන විට
            if (parts.length < 3) {
                return await reply("❌ Group Format: `.fake @user | [Fake_Text] | [Bot_Reply]`");
            }

            // මැන්ෂන් කරපු කෙනාගේ JID එක ලබා ගැනීම
            const mentionedJids = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            if (mentionedJids.length === 0) {
                return await reply("❌ Please tag/mention (@user) the person you want to spoof.");
            }
            targetUserJid = mentionedJids[0];

            fakeText = parts[1].trim();
            botReplyText = parts[2].trim();
        }

        // 🛡️ Random Message ID එකක් හැදීම
        const randomMsgId = "FAKE" + Math.random().toString(36).substring(2, 12).toUpperCase();

        // 🔥 ව්‍යාජ Quoted Message ව්‍යුහය (Fake Structure) සකසා ගැනීම
        const fakeQuotedMessage = {
            key: {
                remoteJid: targetGroupJid,
                fromMe: false, // බොටා නෙවෙයි වෙන කෙනෙක් කිව්වා වගේ පෙන්වීමට
                id: randomMsgId, 
                participant: targetUserJid // අහුවෙන කෙනාගේ WhatsApp JID එක
            },
            message: {
                conversation: fakeText // ඔහු කීවා වැනි ව්‍යාජ වදන
            }
        };

        // 📤 බොටා ලව්වා ව්‍යාජ රිප්ලයි එක අදාළ ගෲප් එකට සෙන්ඩ් කිරීම
        await nethmina.sendMessage(targetGroupJid, { 
            text: botReplyText 
        }, { 
            quoted: fakeQuotedMessage 
        });

        // ඉන්බොක්ස් එකෙන් කරා නම් ඕනර්ට සාර්ථකයි කියා පණිවිඩයක් යැවීම
        if (!isGroup) {
            return await reply(`✅ Fake quote successfully deployed to target group!`);
        }

    } catch (e) {
        console.error("Fake Quote Error:", e);
        reply(`❌ *Error Occurred !!*\n\n${e.message || e}`);
    }
});
