const { cmd } = require('../command');

cmd({
    on: "body"
},    
async (conn, mek, m, { from, body, isOwner, readEnv }) => {
    try {
        // බොට් එවපු මැසේජ් එකක් නම් රිප්ලයි කරන්න එපා
        if (m.key.fromMe) return;

        const msgText = body ? body.toLowerCase().trim() : "";
         const config = await readEnv();
        
      //  if (config.AUTO_VOICE === 'true') {
            
            let voiceUrl = '';

            // වචනය පරීක්ෂා කිරීම
            if (msgText === 'hi' || msgText === 'hello') {
                voiceUrl = 'https://github.com/Nethmina-dev/BOT-DATA/raw/refs/heads/main/Voice-notes/hi%23old.mp3';
            } else if (msgText === 'mk' || msgText === 'මොකෝ') {
                voiceUrl = 'https://github.com/Nethmina-dev/BOT-DATA/raw/refs/heads/main/Voice-notes/Mk.mp3';
            }

            // අදාළ වචනය හමු වුණොත් පමණක් Voice Note එක යැවීම
            if (voiceUrl !== '') {
                // Recording... status එක පෙන්වන්න
                await conn.sendPresenceUpdate('recording', from);

                await conn.sendMessage(from, { 
                    audio: { url: voiceUrl }, 
                    mimetype: 'audio/mpeg', 
                    ptt: true // මේක true නිසා Voice Note එකක් ලෙස රවුමට පෙනේ
                }, { quoted: mek });
            }
      //  }
    } catch (e) {
        console.log("Auto Voice Error: ", e);
    }
});
