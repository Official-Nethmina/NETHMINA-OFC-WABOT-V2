const axios = require("axios");

// 🎧 Words → voice URLs mapping
const voiceReplies = {
  hi: "https://github.com/Nethmina-dev/BOT-DATA/raw/refs/heads/main/Voice-notes/hi%23old.mp3",
  mk: "https://github.com/Nethmina-dev/BOT-DATA/raw/refs/heads/main/Voice-notes/Mk.mp3"
};

module.exports = {
  onMessage: async (conn, mek) => {
    try {
      if (!mek.message) return;

      const type = Object.keys(mek.message)[0];
      const msg =
        type === "conversation"
          ? mek.message.conversation
          : mek.message.extendedTextMessage?.text || "";

      if (!msg) return;

      const text = msg.toLowerCase().trim();
      const from = mek.key.remoteJid;

      // 🔍 Check matching keyword
      const matchKey = Object.keys(voiceReplies).find(k =>
        text === k || text.includes(k)
      );

      if (!matchKey) return;

      const voiceUrl = voiceReplies[matchKey];

      // 📥 Download audio → buffer
      const res = await axios.get(voiceUrl, {
        responseType: "arraybuffer"
      });
      const buffer = Buffer.from(res.data);

      // 🎤 Send voice note (PTT)
      await conn.sendMessage(
        from,
        {
          audio: buffer,
          mimetype: "audio/mpeg",
          ptt: true
        },
        { quoted: mek }
      );

    } catch (err) {
      console.log("AutoVoice Error:", err);
    }
  }
};
