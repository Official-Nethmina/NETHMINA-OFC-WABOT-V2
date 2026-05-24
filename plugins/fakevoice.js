const { cmd } = require('../command');

cmd({
    pattern: "fakevoice",
    alias: ["fv", "fakeduration", "fvoic"],
    react: "⏳",
    desc: "Change the displayed duration of a replied audio/voice message.",
    category: "cheat",
    use: '.fakevoice [hours]',
    filename: __filename
},
async (nethmina, mek, msg, { from, q, reply }) => {
    try {
        // 🔥 [FIXED LOGIC] Voice Note සහ Audio දෙකේම contextInfo අහුවෙන විදිහට හැදුවා
        const messageType = Object.keys(mek.message || {})[0];
        const contextInfo = mek.message?.[messageType]?.contextInfo || mek.message?.extendedTextMessage?.contextInfo;
        const quotedMessage = contextInfo?.quotedMessage;

        // රිප්ලයි කරලා තියෙන්නේ ඕඩියෝ එකකටද කියා 100% නිවැරදිව පරික්ෂා කිරීම
        if (!contextInfo?.hasQuotedMessage || !quotedMessage?.audioMessage) {
            return await reply("❌ Please reply to an *Audio* or *Voice Message* to use this command.");
        }

        // පැය ගණන ලබාගැනීම (නැත්නම් default පැය 100ක් දීම)
        let hours = q ? parseInt(q.trim()) : 100;
        if (isNaN(hours) || hours <= 0) hours = 100;

        // පැය ගණන තත්පර වලට හැරවීම (1 hour = 3600 seconds)
        const fakeSeconds = hours * 3600;

        // ඔරිජිනල් ඕඩියෝ මැසේජ් එකේ දත්ත පිටපත් කර ගැනීම
        let audioMsg = JSON.parse(JSON.stringify(quotedMessage.audioMessage));

        // 🔥 [CHEAT INJECT] සැබෑ තත්පර ගණන වෙනුවට අපේ ව්‍යාජ තත්පර ගණන Inject කිරීම
        audioMsg.seconds = fakeSeconds;
        
        // හැමතිස්සෙම මේක නිල් පාට Voice Cut එකක් (PTT) විදිහටම යැවීමට True කිරීම
        audioMsg.ptt = true; 

        // මැසේජ් එකක් ලෙස එකලස් කිරීම
        const finalVoiceMessage = {
            audioMessage: audioMsg
        };

        // 📤 ව්‍යාජ වොයිස් කට් එක සෙන්ඩ් කිරීම
        await nethmina.sendMessage(from, finalVoiceMessage, { quoted: mek });

    } catch (e) {
        console.error("Fake Voice Error:", e);
        reply(`❌ *Error Occurred !!*\n\n${e.message || e}`);
    }
});
