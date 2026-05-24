// Special thanks for - KHAN MD & NETHMINA-OFC
const { cmd } = require("../command");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

// Safety Configuration (Anti-Ban)
const SAFETY = {
  MAX_JIDS: 20,
  BASE_DELAY: 2000,
  EXTRA_DELAY: 4000,
};

cmd({
  pattern: "forward",
  alias: ["fwd"],
  desc: "Bulk forward media to groups",
  category: "owner",
  filename: __filename
}, async (nethmina, mek, msg, { q, isOwner, reply }) => {
  try {
    // Owner check
    if (!isOwner) return await reply("*📛 Owner Only Command*");
    
    // Quoted message check - ඔයාගේ bot එකේ structure එකට අනුව check කිරීම
    const quotedMessage = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage || 
                          mek.message?.imageMessage?.contextInfo?.quotedMessage || 
                          mek.message?.videoMessage?.contextInfo?.quotedMessage || 
                          mek.message?.documentMessage?.contextInfo?.quotedMessage || 
                          mek.message?.audioMessage?.contextInfo?.quotedMessage;

    if (!quotedMessage) return await reply("*🍁 Please reply to a message*");

    // Quoted Key එක සහ Type එක සොයා ගැනීම
    const quotedKey = mek.message?.extendedTextMessage?.contextInfo?.stanzaId || 
                      mek.message?.imageMessage?.contextInfo?.stanzaId || 
                      mek.message?.videoMessage?.contextInfo?.stanzaId;
                      
    const mtype = Object.keys(quotedMessage)[0];

    // ===== [BULLETPROOF JID PROCESSING] ===== //
    if (!q || q.trim().length === 0) {
      return await reply(
        "❌ Please provide group JIDs\n" +
        "Examples:\n" +
        ".fwd 120363411055156472@g.us,120363333939099948@g.us\n" +
        ".fwd 120363411055156472 120363333939099948"
      );
    }
    
    // Extract JIDs (supports comma or space separated)
    const rawJids = q.trim().split(/[\s,]+/).filter(jid => jid.trim().length > 0);
    
    // Process JIDs (accepts with or without @g.us)
    const validJids = rawJids
      .map(jid => {
        const cleanJid = jid.replace(/@g\.us$/i, "");
        return /^\d+$/.test(cleanJid) ? `${cleanJid}@g.us` : null;
      })
      .filter(jid => jid !== null)
      .slice(0, SAFETY.MAX_JIDS);

    if (validJids.length === 0) {
      return await reply("❌ No valid group JIDs found.");
    }

    // ===== [ENHANCED MEDIA HANDLING] ===== //
    let messageContent = {};
    
    if (["imageMessage", "videoMessage", "audioMessage", "stickerMessage", "documentMessage"].includes(mtype)) {
      const mediaData = quotedMessage[mtype];
      const msgTypeForDownload = mtype.replace("Message", "");
      
      // Baileys Safe Download Method
      const stream = await downloadContentFromMessage(mediaData, msgTypeForDownload);
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }
      
      switch (mtype) {
        case "imageMessage":
          messageContent = {
            image: buffer,
            caption: mediaData.caption || '',
            mimetype: mediaData.mimetype || "image/jpeg"
          };
          break;
        case "videoMessage":
          messageContent = {
            video: buffer,
            caption: mediaData.caption || '',
            mimetype: mediaData.mimetype || "video/mp4"
          };
          break;
        case "audioMessage":
          messageContent = {
            audio: buffer,
            mimetype: mediaData.mimetype || "audio/mp4",
            ptt: mediaData.ptt || false
          };
          break;
        case "stickerMessage":
          messageContent = {
            sticker: buffer,
            mimetype: mediaData.mimetype || "image/webp"
          };
          break;
        case "documentMessage":
          messageContent = {
            document: buffer,
            mimetype: mediaData.mimetype || "application/octet-stream",
            fileName: mediaData.fileName || "document"
          };
          break;
      }
    } 
    else if (mtype === "extendedTextMessage" || mtype === "conversation") {
      messageContent = {
        text: quotedMessage.conversation || quotedMessage.extendedTextMessage?.text || ""
      };
    } 
    else {
      // වෙනත් ඕනෑම මැසේජ් ටයිප් එකක් කෙලින්ම forward කිරීම
      messageContent = { forward: { key: { remoteJid: mek.key.remoteJid, id: quotedKey }, message: quotedMessage } };
    }

    // ===== [OPTIMIZED SENDING WITH PROGRESS] ===== //
    await reply(`🔄 *Starting forward to ${validJids.length} groups...*`);
    let successCount = 0;
    const failedJids = [];
    
    for (const [index, jid] of validJids.entries()) {
      try {
        // Forward content or structure
        if (messageContent.forward) {
            await nethmina.sendMessage(jid, quotedMessage, { quoted: { key: { id: quotedKey, remoteJid: jid }, message: quotedMessage } });
        } else {
            await nethmina.sendMessage(jid, messageContent);
        }
        successCount++;
        
        // Progress update (every 10 groups)
        if ((index + 1) % 10 === 0) {
          await reply(`🔄 𝐒ᴇɴ𝐃 𝐓𝐎 ${index + 1}/${validJids.length} 𝐆ʀᴏᴜᴘ𝐒...`);
        }
        
        const delayTime = (index + 1) % 10 === 0 ? SAFETY.EXTRA_DELAY : SAFETY.BASE_DELAY;
        await new Promise(resolve => setTimeout(resolve, delayTime));
        
      } catch (error) {
        failedJids.push(jid.replace('@g.us', ''));
        await new Promise(resolve => setTimeout(resolve, SAFETY.BASE_DELAY));
      }
    }

    // ===== [COMPREHENSIVE REPORT] ===== //
    let report = `✅ *𝙵𝙾𝚁𝚆𝙰𝚁𝙳 𝙲𝙾𝙼𝙿𝙻𝙴𝚃𝙴*\n\n` +
                 `📤 𝚂𝚄𝙲𝙲𝙴𝚂𝚂: ${successCount}/${validJids.length}\n` +
                 `📦 𝙲𝙾𝙽𝚃𝙴𝙽𝚃 𝚃𝚈𝙿𝙴: ${mtype.replace('Message', '') || 'text'}\n`;
    
    if (failedJids.length > 0) {
      report += `\n❌ Failed (${failedJids.length}): ${failedJids.slice(0, 5).join(', ')}`;
      if (failedJids.length > 5) report += ` +${failedJids.length - 5} more`;
    }
    
    if (rawJids.length > SAFETY.MAX_JIDS) {
      report += `\n⚠️ Note: Limited to first ${SAFETY.MAX_JIDS} JIDs`;
    }

    await reply(report);

  } catch (error) {
    console.error("Forward Error:", error);
    await reply(`💢 Error: ${error.message.substring(0, 100)}`);
  }
});
