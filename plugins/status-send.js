const { cmd } = require("../command");

cmd({
  pattern: "post",
  alias: ["poststatus", "status", "story", "repost", "reshare"],
  desc: "Posts replied media to bot's status",
  category: "utility",
  filename: __filename
}, async (client, message, match, { from, isCreator }) => {
  try {

    await conn.sendMessage(from, { react: { text: '✅', key: mek.key } }).catch(() => null);
    
    if (!isCreator) {
      return await client.sendMessage(from, {
        text: "*📛 This is an owner-only command.*"
      }, { quoted: message });
    }

    const quotedMsg = message.quoted ? message.quoted : message;
    const mimeType = (quotedMsg.msg || quotedMsg).mimetype || '';

    if (!mimeType) {
      return await client.sendMessage(message.chat, {
        text: "*Please reply to an image, video, or audio file.*"
      }, { quoted: message });
    }

    const buffer = await quotedMsg.download();
    const mtype = quotedMsg.mtype;
    const caption = quotedMsg.text || '';

    let statusContent = {};

    switch (mtype) {
      case "imageMessage":
        statusContent = {
          image: buffer,
          caption: caption
        };
        break;
      case "videoMessage":
        statusContent = {
          video: buffer,
          caption: caption
        };
        break;
      case "audioMessage":
        statusContent = {
          audio: buffer,
          mimetype: "audio/mp4",
          ptt: quotedMsg.ptt || false
        };
        break;
      default:
        return await client.sendMessage(message.chat, {
          text: "Only image, video, and audio files can be posted to status."
        }, { quoted: message });
    }

    await client.sendMessage("status@broadcast", statusContent);

    await client.sendMessage(message.chat, {
      text: "✅ 𝐒ᴛᴀᴛᴜ𝐒 𝐔ᴘʟᴏᴀᴅᴇ𝐃 𝐒ᴜᴄᴄᴇꜱꜱꜰᴜʟʟ𝐘."
    }, { quoted: message });

  } catch (error) {
    console.error("Status Error:", error);
    await client.sendMessage(message.chat, {
      text: "❌ Failed to post status:\n" + error.message
    }, { quoted: message });
  }
});
