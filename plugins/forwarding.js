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
  desc: "Bulk forward media to groups and numbers",
  category: "owner",
  filename: __filename
}, async (nethmina, mek, msg, { q, isOwner, reply }) => {
  try {
    // Owner check
    if (!isOwner) return await reply("*📛 Owner Only Command*");
    
    // Quoted message check
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

    // ===== [BULLETPROOF JID & NUMBER PROCESSING] ===== //
    if (!q || q.trim().length === 0) {
      return await reply(
        "❌ Please provide Group JIDs or WhatsApp Numbers\n\n" +
        "*Examples:*\n" +
        "🔹 .fwd 120363411055156472@g.us 94760860835\n" +
        "🔹 .fwd 94760860835,94712345678,120363411055156472"
      );
    }
    
    // Extract targets (supports comma or space separated)
    const rawInputs = q.trim().split(/[\s,]+/).filter(input => input.trim().length > 0);
    
    // Process Group JIDs and Private Numbers intelligently
    const validJids = rawInputs
      .map(input => {
        let clean = input.trim();
        
        // 1. දැනටමත් නිවැරදිම format එකෙන් තියෙනවා නම් ඒ විදිහටම ගන්නවා
        if (clean.endsWith("@g.us") || clean.endsWith("@s.whatsapp.net")) {
          return clean;
        }
        
        // 2. අග තියෙන අනවශ්‍ය කෑලි අයින් කරනවා
        clean = clean.replace(/@g\.us$/i, "").replace(/@s\.whatsapp\.net$/i, "");
        
        // ඉතිරි වෙන්නේ ඉලක්කම් විතරක් නම් චෙක් කරනවා
        if (/^\d+$/.test(clean)) {
          // දිග 15කට වඩා වැඩි නම් ඒක Group JID එකක් (e.g. 120363xxxxxxxxx)
          if (clean.length > 15) {
            return `${clean}@g.us`;
          } else {
            // නැත්නම් ඒක සාමාන්‍ය පෞද්ගලික දුරකථන අංකයක් (Inbox)
            return `${clean}@s.whatsapp.net`;
          }
        }
        return null;
      })
      .filter(jid => jid !== null)
      .slice(0, SAFETY.MAX_JIDS);

    if (validJids.length === 0) {
      return await reply("❌ No valid Group JIDs or Numbers found.");
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
      messageContent = { forward: { key: { remoteJid: mek.key.remoteJid, id: quotedKey }, message: quotedMessage } };
    }

    // ===== [OPTIMIZED SENDING WITH PROGRESS] ===== //
    await reply(`🔄 *Starting forward to ${validJids.length} targets (Groups/Inbox)...*`);
    let successCount = 0;
    const failedJids = [];
    
    for (const [index, jid] of validJids.entries()) {
      try {
        if (messageContent.forward) {
            await nethmina.sendMessage(jid, quotedMessage, { quoted: { key: { id: quotedKey, remoteJid: jid }, message: quotedMessage } });
        } else {
            await nethmina.sendMessage(jid, messageContent);
        }
        successCount++;
        
        // Progress update (every 10 targets)
        if ((index + 1) % 10 === 0) {
          await reply(`🔄 𝐒ᴇɴ𝐃 𝐓𝐎 ${index + 1}/${validJids.length} 𝐓ᴀʀɢᴇᴛ𝐒...`);
        }
        
        const delayTime = (index + 1) % 10 === 0 ? SAFETY.EXTRA_DELAY : SAFETY.BASE_DELAY;
        await new Promise(resolve => setTimeout(resolve, delayTime));
        
      } catch (error) {
        // Report එක ලස්සනට පේන්න clean කරලා දානවා
        failedJids.push(jid.split('@')[0]);
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
    
    if (rawInputs.length > SAFETY.MAX_JIDS) {
      report += `\n⚠️ Note: Limited to first ${SAFETY.MAX_JIDS} targets`;
    }

    await reply(report);

  } catch (error) {
    console.error("Forward Error:", error);
    await reply(`💢 Error: ${error.message.substring(0, 100)}`);
  }
});
