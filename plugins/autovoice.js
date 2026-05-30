const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const os = require('os');
const ffmpegPath = require('ffmpeg-static');

const processedMessages = new Set();
const offChatsFile = path.join(__dirname, '../lib/off_voices.json');

const voiceData = {
    "hi,hii,halo": "https://mp3tourl.com/audio/1777910165360-cf504b8b-95bb-4ae5-8961-78a5ccfc8d8f.mp3",
    "mk,mko krnne": "https://mp3tourl.com/audio/1777910196056-487d7486-78dc-43b9-88d9-55cf57c6c7cb.mp3",
    "hy,හායි,හලෝ": "https://mp3tourl.com/audio/1778259822854-80f34266-3cfa-4f0c-9b86-c4809c79ebca.mp3",
    "bye,byee": "https://mp3tourl.com/audio/1778305373905-198089fa-f1b8-48d9-a728-c95dbd27543b.mp3",
    "bs,budu sarnyi": "https://mp3tourl.com/audio/1778305427736-4057aab7-129c-45ed-a341-d15ebb04e464.mp3",
    "fuck,sex,sexy,hukahn,hukpn": "https://mp3tourl.com/audio/1778305486997-d4d3e96a-9825-4a59-b2eb-76a0bac37472.mp3",
    "gm,good morning": "https://mp3tourl.com/audio/1778305538644-2b1fb414-681b-41ac-ae9a-0d07d64c3770.m4a",
    "gn,good night": "https://mp3tourl.com/audio/1778315278554-c0af2a0a-f4d3-4913-a241-02b99d430368.mp3",
    "ai ai,aii": "https://mp3tourl.com/audio/1778305739899-bd371fee-d65a-4a95-aabb-7309ac6df90e.mp3",
    "hm,mm,hmm,mmm": "https://mp3tourl.com/audio/1778315331296-41d9c99d-e62e-44cf-9cfe-a5957bd75b10.mp3",
    "pissud,pissu,pissuda": "https://mp3tourl.com/audio/1778305832535-f10955b3-68b1-4a99-8c2e-168450737c23.mp3",
    "hutta,hutto,pco,pky,pckyo,hukanno,pakayo,pakya,utto,huththo,uttiye,huttiye": "https://mp3tourl.com/audio/1778305945222-2e5e0533-3b1e-42e3-8b9d-0e5a4b61e405.mp3",
    "kewad,kawad,kewd,kawada,kawayi": "https://mp3tourl.com/audio/1778306050683-b20bb36e-6166-426a-924c-724902fbcea8.mp3",
    "ko,koo": "https://mp3tourl.com/audio/1778306084359-eb4e75c6-bd45-4bee-8c2a-fd3e10a039d5.mp3",
    "ummh,adareyi,adarei": "https://mp3tourl.com/audio/1778306130900-3a11c961-447c-4fd4-91f6-75e1d1f1a975.mp3",
    "kollekd,kellekd": "https://mp3tourl.com/audio/1778306187607-20f4164f-994a-461f-89e3-5aa576422774.mp3",
    "love": "https://mp3tourl.com/audio/1778315358198-e08991f7-162a-494e-8982-c17c10f0b7b9.mp3",
    "thota puluwnnm,puluwnd": "https://mp3tourl.com/audio/1778306315124-4a797f41-2908-4ea4-8438-2b6a14a612aa.mp3",
    "yno,ynna,yannm": "https://mp3tourl.com/audio/1778306274122-e104cbee-e525-41b8-b283-848d361e8cf0.mp3",
    "patiyo,mcho": "https://mp3tourl.com/audio/1778305621396-88a0eacc-a22b-41a1-a3f3-5da62d288f9d.mp3",
    "puh": "https://mp3tourl.com/audio/1778308752311-12d424ce-bb45-4cdc-87aa-af4b95aab4a9.mp3",
    "nethmina,bro,brh,mchn,hey there": "https://mp3tourl.com/audio/1778259922627-93e04ee7-bf64-4f07-9668-832bc05a0d3e.mp3"
};

const ownerExceptionWords = ["puh", "ynoo", "ynnm"]; 
const exactMatchOnlyWords = ["patiyo", "mcho", "nethmina", "bro", "brh", "mchn"]; 

const convertToOpus = (input, output) => {
    return new Promise((resolve, reject) => {
        exec(`"${ffmpegPath}" -i "${input}" -c:a libopus -b:a 128k -vbr on "${output}"`, (error) => {
            if (error) reject(error);
            else resolve();
        });
    });
};

module.exports = {
    onMessage: async (conn, mek) => {
        try {
            if (!mek.message) return;
            const from = mek.key.remoteJid;
            const isGroup = from.endsWith('@g.us');
            const isMe = mek.key.fromMe;
            
            // --- [MODE CHECK LOGIC] ---
            const config = require("../config");
            const currentWorkType = (global.workType || config.WORK_TYPE || "all").toLowerCase();

            if (currentWorkType === "inbox" && isGroup && !isMe) return; // Inbox mode නම් ගෲප් වලට යැවීම නවත්වයි
            if (currentWorkType === "private" && !isMe) return; // Private mode නම් ඔනර්ට විතරයි

            // --- [අලුතින් දැමූ OFF CHECK LOGIC] ---
            if (fs.existsSync(offChatsFile)) {
                const offChats = JSON.parse(fs.readFileSync(offChatsFile));
                if (offChats.includes(from)) return;
            }
            const type = Object.keys(mek.message)[0];
            const body = (type === 'conversation') ? mek.message.conversation : 
                         (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : 
                         (type === 'imageMessage') ? mek.message.imageMessage.caption : 
                         (type === 'videoMessage') ? mek.message.videoMessage.caption : '';

            if (!body) return;
            let lowerBody = body.toLowerCase().trim();
            const msgId = mek.key.id;

            if (processedMessages.has(msgId)) return;

            let isForceSend = false;
            if (isMe && lowerBody.startsWith('#')) {
                isForceSend = true;
                lowerBody = lowerBody.slice(1).trim(); 
            }

            let audioUrl = null;
            for (const key in voiceData) {
                const keywords = key.split(',');
                const isMatch = keywords.some(word => {
                    const trimmedWord = word.trim().toLowerCase();
                    if (isForceSend && trimmedWord === lowerBody) return true;
                    if (isMe && !isForceSend && !ownerExceptionWords.includes(trimmedWord)) return false;
                    if (exactMatchOnlyWords.includes(trimmedWord)) return lowerBody === trimmedWord;
                    const regex = new RegExp(`\\b${trimmedWord}\\b`, 'g');
                    return regex.test(lowerBody);
                });

                if (isMatch) { audioUrl = voiceData[key]; break; }
            }

            if (audioUrl) {
                processedMessages.add(msgId);
                await conn.sendPresenceUpdate('recording', from);
                const tempDir = os.tmpdir();
                const inputPath = path.join(tempDir, `voice_${Date.now()}.mp3`);
                const outputPath = path.join(tempDir, `voice_${Date.now()}.opus`);

                try {
                    const response = await axios({ method: 'get', url: audioUrl, responseType: 'arraybuffer' });
                    fs.writeFileSync(inputPath, response.data);
                    await convertToOpus(inputPath, outputPath);
                    await conn.sendMessage(from, { audio: fs.readFileSync(outputPath), mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: mek });
                } catch (vError) {
                    await conn.sendMessage(from, { audio: { url: audioUrl }, mimetype: "audio/mpeg", ptt: true }, { quoted: mek });
                } finally {
                    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                    setTimeout(() => processedMessages.delete(msgId), 120000);
                }
            }
        } catch (e) {
            console.log("AutoVoice Error:", e);
        }
    }
};
