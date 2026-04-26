const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const { Readable, PassThrough } = require('stream');

const hiTriggers = ['hi', 'hello', 'hey', 'hii', 'helo'];

if (global.autoVoice) {
    const msgText = m.body?.toLowerCase().trim();

    if (hiTriggers.includes(msgText)) {
        try {
            // 👤 React
            await conn.sendMessage(from, {
                react: { text: '🎙️', key: mek.key }
            }).catch(() => null);

            // 📥 Download MP3
            const response = await axios.get(
                'https://github.com/Nethmina-dev/BOT-DATA/raw/refs/heads/main/Voice-notes/hi%23old.mp3',
                { responseType: 'arraybuffer', maxRedirects: 5 }
            );
            const mp3Buffer = Buffer.from(response.data);

            // 🔄 Convert MP3 → OGG Opus via ffmpeg
            const audioBuffer = await new Promise((resolve, reject) => {
                const input = new Readable();
                input.push(mp3Buffer);
                input.push(null);

                const output = new PassThrough();
                const chunks = [];

                output.on('data', chunk => chunks.push(chunk));
                output.on('end', () => resolve(Buffer.concat(chunks)));
                output.on('error', reject);

                ffmpeg(input)
                    .inputFormat('mp3')
                    .audioCodec('libopus')
                    .outputFormat('ogg')
                    .audioBitrate('128k')
                    .pipe(output, { end: true });
            });

            // 🎵 Send voice note
            await conn.sendMessage(from, {
                audio: audioBuffer,
                mimetype: 'audio/ogg; codecs=opus',
                ptt: true
            }, { quoted: mek });

        } catch (e) {
            console.error("Auto voice error:", e);
        }
    }
}
