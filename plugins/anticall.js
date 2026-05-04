const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const config = require('../config');

// එක් එක් අංකයෙන් ආපු කෝල් ගණන මතක තබා ගැනීමට
const callTracker = new Map();

// Voice Note එක Opus වලට හරවන function එක (Alive එකේ විදියටම)
const convertToOpus = (input, output) => {
    return new Promise((resolve, reject) => {
        exec(`"${ffmpegPath}" -i "${input}" -c:a libopus -b:a 128k -vbr on "${output}"`, (error) => {
            if (error) reject(error);
            else resolve();
        });
    });
};

module.exports = {
    handleCall: async (conn, call) => {
        if (String(config.AUTO_CALL_REJECT) !== 'true') return;

        for (const node of call) {
            if (node.status === 'offer') {
                const from = node.from;
              if (from.endsWith('@g.us')) return; // Group calls ආවොත් මෙතනින් නතර වෙනවා
                const callId = node.id;

                let callCount = callTracker.get(from) || 0;
                callCount++;
                callTracker.set(from, callCount);

                try {
                    // --- තත්පර 1.5ක Delay එකක් ---
                    await new Promise(resolve => setTimeout(resolve, 1500));

                    // 1. Call එක Reject කිරීම
                    await conn.rejectCall(callId, from);

                    // 2. වාර ගණන අනුව Voice Note යැවීම (පළමු වාර 2 සඳහා පමණි)
                    if (callCount === 1 || callCount === 2) {
                        
                        // කෝල් 1 ට සහ 2 ට වෙන වෙනම URL මෙතනට දාන්න
                        const audioUrl = callCount === 1 
                            ? "https://mp3tourl.com/audio/1777905632834-ac8f977d-1be5-4b85-a7af-e07a9aa2e7ea.mp3" // 1st Voice Note
                            : "https://mp3tourl.com/audio/1777905649864-82b92309-aa9a-4006-ae4d-08105136e24a.mp3"; // 2nd Voice Note (ඔයාට ඕන එකක් දාන්න)

                        const msgText = callCount === 1 
                            ? `⚠️ *FIRST WARNING* ⚠️\n\nHello @${from.split('@')[0]},\n_Calls are not allowed here. Nethmina is currently in at busy situation. Please don't disturb for me.._`
                            : `🚫 *FINAL WARNING* 🚫\n\n_Stop calling! I told you calls are not allowed._`;

                        // Recording status පෙන්වීම
                        await conn.sendPresenceUpdate('recording', from);
                        
                        const tempDir = os.tmpdir();
                        const inputPath = path.join(tempDir, `call_${Date.now()}.mp3`);
                        const outputPath = path.join(tempDir, `call_${Date.now()}.opus`);

                        try {
                            // 1. Audio එක Download කිරීම
                            const response = await axios({
                                method: 'get',
                                url: audioUrl,
                                responseType: 'arraybuffer'
                            });
                            fs.writeFileSync(inputPath, response.data);
                            
                            // 2. Opus වලට Convert කිරීම
                            await convertToOpus(inputPath, outputPath);

                            // 3. Message එක සහ Voice Note එක යැවීම
                            await conn.sendMessage(from, { text: msgText, mentions: [from] });
                            await conn.sendMessage(from, {
                                audio: fs.readFileSync(outputPath),
                                mimetype: 'audio/ogg; codecs=opus',
                                ptt: true
                            });

                        } catch (vError) {
                            console.error("Voice Note Error:", vError);
                            // Convert කරන්න බැරි වුණොත් සාමාන්‍ය විදියට audio එක යැවීම
                            await conn.sendMessage(from, { audio: { url: audioUrl }, mimetype: "audio/mpeg", ptt: true });
                        } finally {
                            // Temp files මකා දැමීම
                            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                        }

                    } else {
                        // 3 වැනි වාරයේ සිට කිසිදු මැසේජ් එකක් නැතුව Reject කිරීම පමණි
                        console.log(`🔇 Call rejected silently for: ${from} (Attempt: ${callCount})`);
                    }

                    // --- Reset Logic (විනාඩි 5කින් මේ අංකයේ Count එක Reset වේ) ---
                    setTimeout(() => {
                        callTracker.delete(from);
                    }, 300000); 

                } catch (err) {
                    console.error("❌ Error rejecting call:", err.message);
                }
            }
        }
    }
};
