module.exports = {
    onMessage: async (conn, mek) => {
        try {
            if (!mek.message) return;

            const from = mek.key.remoteJid;
            const type = Object.keys(mek.message)[0];
            const body = (type === 'conversation') ? mek.message.conversation : 
                         (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : '';

            // Command එක .vlist හෝ .voicelist ලෙස භාවිතා කළ හැක
            if (body.toLowerCase().trim() === '.vlist' || body.toLowerCase().trim() === '.voicelist') {

              await conn.sendMessage(from, { 
                    react: { 
                        text: '🎙️', 
                        key: mek.key 
                    } 
                });
                
                // අපේ ප්‍රධාන voiceData සහ list එක මෙතන තියෙන්න ඕනේ
                const ownerExceptionWords = ["puh", "yno", "ynna", "yannm"];
                
                const voiceData = {
                    "hi,hii,hey,halo": "...", "mk,mko krnne": "...", "hy,හායි,හලෝ": "...",
                    "bye,byee": "...", "bs,budu sarnyi": "...", "fuck,sex,sexy,hukahn,hukpn": "...",
                    "gm,good morning": "...", "gn,good night": "...", "ai ai,aii": "...",
                    "hm,mm,hmm,mmm": "...", "pissud,pissu,pissuda": "...", "hutta,hutto...": "...",
                    "kewad,kawad...": "...", "ko,koo": "...", "ummh,adareyi": "...",
                    "kollekd,kellekd": "...", "love": "...", "thota puluwnnm": "...",
                    "yno,ynna,yannm": "...", "patiyo,mcho": "...", "puh": "...", "nethmina,bro": "..."
                };

                let publicKeywords = [];
                let ownerKeywords = [];

                // Keywords වෙන් කරගැනීම
                for (const key in voiceData) {
                    const words = key.split(',');
                    words.forEach(w => {
                        const trimmed = w.trim();
                        if (ownerExceptionWords.includes(trimmed)) {
                            ownerKeywords.push(trimmed);
                        } else {
                            publicKeywords.push(trimmed);
                        }
                    });
                }

                // List එක සකස් කිරීම
                let message = `*─── [ 🎙️ AUTO VOICE LIST ] ───*\n\n`;
                
                message += `*📢 PUBLIC KEYWORDS:*\n`;
                message += `_හැමෝටම වැඩ කරන වචන_\n`;
                message += `> ${publicKeywords.join(', ')}\n\n`;

                message += `*🔐 OWNER ONLY:*\n`;
                message += `_ඔබට පමණක් වැඩ කරන වචන_\n`;
                message += `> ${ownerKeywords.join(', ')}\n\n`;

                message += `*💡 TIP:* Owner හට ඕනෑම වචනයක් ඉදිරියට # යොදා voice එක ලබාගත හැක. (Ex: #hi)\n\n`;
                message += `*Powered by AutoVoice*`;

                // මැසේජ් එක යැවීම
                await conn.sendMessage(from, { text: message }, { quoted: mek });
            }
        } catch (e) {
            console.log("VoiceList Plugin Error:", e);
        }
    }
};
