const { cmd } = require('../command')
const config = require('../config')
const axios = require('axios')
const fs = require("fs")
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

cmd({
    pattern: "alive",
    react: "🎃",
    desc: "Check bot online or no.",
    category: "main",
    filename: __filename
},
async (nethmina, mek, m, { from, quoted, reply }) => {
    try {
        // 1. Send reaction
        if (mek.key) {
            await nethmina.sendMessage(from, { react: { text: "🎃", key: mek.key } });
        }

        const audioUrl = 'https://github.com/Nethmina-dev/BOT-DATA/raw/refs/heads/main/Voice-notes/alive.mp3';
        const inputPath = `./temp_alive_${Date.now()}.mp3`;
        const outputPath = `./temp_alive_${Date.now()}.opus`;

        try {
    
            const response = await axios({ 
                method: 'get', 
                url: audioUrl, 
                responseType: 'stream',
                timeout: 30000 
            });
            
            const writer = fs.createWriteStream(inputPath);
            response.data.pipe(writer);

            await new Promise((res, rej) => {
                writer.on('finish', res);
                writer.on('error', rej);
            });

            try {
                await execPromise('ffmpeg -version');
            } catch (ffmpegError) {
                console.log('FFmpeg not installed, sending original audio');
        
                const audioBuffer = fs.readFileSync(inputPath);
                await nethmina.sendMessage(from, {
                    audio: audioBuffer,
                    mimetype: 'audio/mpeg',
                    ptt: true
                }, { quoted: mek });
                
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                throw new Error('FFMPEG_NOT_INSTALLED');
            }

            try {
                await execPromise(`ffmpeg -i ${inputPath} -c:a libopus -b:a 64k -vbr on -f ogg ${outputPath} -y`);
                
                const buffer = fs.readFileSync(outputPath);
                await nethmina.sendMessage(from, {
                    audio: buffer,
                    mimetype: 'audio/ogg; codecs=opus',
                    ptt: true
                }, { quoted: mek });
            } catch (ffmpegError) {
                console.error('FFmpeg conversion error:', ffmpegError);

                const audioBuffer = fs.readFileSync(inputPath);
                await nethmina.sendMessage(from, {
                    audio: audioBuffer,
                    mimetype: 'audio/mpeg',
                    ptt: true
                }, { quoted: mek });
            }

            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

        } catch (err) {
            console.error('Audio processing error:', err);

            try {
                await nethmina.sendMessage(from, {
                    audio: { url: audioUrl },
                    mimetype: 'audio/mpeg',
                    ptt: true
                }, { quoted: mek });
            } catch (audioError) {
                console.error('Fallback audio error:', audioError);
            }
        }
        

        // 4. Send Video Note (PTV)
        await nethmina.sendMessage(from, {
            video: { url: "https://github.com/Nethmina-dev/BOT-DATA/raw/refs/heads/main/Video-notes/PTV-20250623-WA0021.mp4" },
            mimetype: 'video/mp4',
            ptv: true
        }, { quoted: mek });

        // 5. Send Image with Caption
        await nethmina.sendMessage(from, { 
            image: { url: config.ALIVE_IMG }, 
            caption: config.ALIVE_MSG 
        }, { quoted: mek });

        // 6. Clean up temp files
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

    } catch (e) {
        console.error('Main Error:', e);
        reply(`*Error:* ${e.message}`);
    }
});
