const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const config = require('../config');
const { cmd } = require('../command');

// Whitelist දත්ත ගබඩා කරන ෆයිල් එක
const whitelistPath = path.join(__dirname, 'anticall_whitelist.json');

function getWhitelist() {
    if (!fs.existsSync(whitelistPath)) return [];
    try { return JSON.parse(fs.readFileSync(whitelistPath, 'utf8')); } catch (e) { return []; }
}

function saveWhitelist(data) {
    fs.writeFileSync(whitelistPath, JSON.stringify(data, null, 2), 'utf8');
}

// Config එකේ AUTO_CALL_REJECT අගය වෙනස් කරන ෆන්ක්ෂන් එක
function updateConfigField(key, value) {
    const configPath = path.join(__dirname, "../config.js");
    if (fs.existsSync(configPath)) {
        let content = fs.readFileSync(configPath, 'utf8');
        const regex = new RegExp(`${key}:\\s*process\\.env\\.${key}\\s*\\|\\|\\s*["'][^"']*["']`, 'g');
        if (regex.test(content)) {
            content = content.replace(regex, `${key}: process.env.${key} || "${value}"`);
            fs.writeFileSync(configPath, content, 'utf8');
        }
    }
    require('../config')[key] = value;
}

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
                
                // 🛡️ Whitelist එකේ ඉන්න කෙනෙක් නම් කෝල් එක Reject කරන්නේ නැත
                const whitelist = getWhitelist();
                if (whitelist.includes(from)) continue;

                const callId = node.id;

                let callCount = callTracker.get(from) || 0;
                callCount++;
                callTracker.set(from, callCount);

                try {
                    // --- 🛠️ ඔයාගේ ඔරිජිනල් ලොජික් එක (වෙනස් කර නැත) ---
                    await new Promise(resolve => setTimeout(resolve, 1500));

                    // 1. Call එක Reject කිරීම
                    await conn.rejectCall(callId, from);

                    // 2. වාර ගණන අනුව Voice Note යැවීම (පළමු වාර 2 සඳහා පමණි)
                    if (callCount === 1 || callCount === 2) {
                        
                        const audioUrl = callCount === 1 
                            ? "https://mp3tourl.com/audio/1777905632834-ac8f977d-1be5-4b85-a7af-e07a9aa2e7ea.mp3" 
                            : "https://mp3tourl.com/audio/1777905649864-82b92309-aa9a-4006-ae4d-08105136e24a.mp3"; 

                        const msgText = callCount === 1 
                            ? `⚠️ *FIRST WARNING* ⚠️\n\nHello @${from.split('@')[0]},\n_Calls are not allowed here. Nethmina is currently in at busy situation. Please don't disturb for me.._`
                            : `🚫 *FINAL WARNING* 🚫\n\n_Stop calling! I told you calls are not allowed._`;

                        await conn.sendPresenceUpdate('recording', from);
                        
                        const tempDir = os.tmpdir();
                        const inputPath = path.join(tempDir, `call_${Date.now()}.mp3`);
                        const outputPath = path.join(tempDir, `call_${Date.now()}.opus`);

                        try {
                            const response = await axios({
                                method: 'get',
                                url: audioUrl,
                                responseType: 'arraybuffer'
                            });
                            fs.writeFileSync(inputPath, response.data);
                            
                            await convertToOpus(inputPath, outputPath);

                            await conn.sendMessage(from, { text: msgText, mentions: [from] });
                            await conn.sendMessage(from, {
                                audio: fs.readFileSync(outputPath),
                                mimetype: 'audio/ogg; codecs=opus',
                                ptt: true
                            });

                        } catch (vError) {
                            console.error("Voice Note Error:", vError);
                            await conn.sendMessage(from, { audio: { url: audioUrl }, mimetype: "audio/mpeg", ptt: true });
                        } finally {
                            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                        }

                    } else {
                        console.log(`🔇 Call rejected silently for: ${from} (Attempt: ${callCount})`);
                    }

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

// =======================================================
// 🎛️ NEW COMMANDS SECTION (ENGLISH RESPONSES)
// =======================================================

// 1. .callon කමාන්ඩ් එක
cmd({
    pattern: "callon",
    desc: "Allow a specific user to call the bot without being auto-rejected.",
    category: "owner",
    filename: __filename
}, async (nethmina, mek, sms, { from, args, q, isOwner }) => {
    if (!isOwner) return nethmina.sendMessage(from, { text: "❌ This command is only for the Bot Owner!" }, { quoted: mek });
    
    let targetJid = "";
    if (q) {
        let num = q.replace(/[^0-9]/g, "");
        if (num) targetJid = num + "@s.whatsapp.net";
    } else if (mek.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        targetJid = mek.message.extendedTextMessage.contextInfo.participant;
    } else if (!from.endsWith('@g.us')) {
        targetJid = from;
    }

    if (!targetJid) return nethmina.sendMessage(from, { text: "❌ Please mention a user, reply to a message, or provide a valid phone number." }, { quoted: mek });

    let whitelist = getWhitelist();
    if (!whitelist.includes(targetJid)) {
        whitelist.push(targetJid);
        saveWhitelist(whitelist);
    }

    return nethmina.sendMessage(from, { 
        text: `✅ *@${targetJid.split('@')[0]}* has been added to the whitelist. This user can now call the bot.`, 
        mentions: [targetJid] 
    }, { quoted: mek });
});

// 2. .calloff කමාන්ඩ් එක
cmd({
    pattern: "calloff",
    desc: "Remove a user from the whitelist so their calls get auto-rejected again.",
    category: "owner",
    filename: __filename
}, async (nethmina, mek, sms, { from, args, q, isOwner }) => {
    if (!isOwner) return nethmina.sendMessage(from, { text: "❌ This command is only for the Bot Owner!" }, { quoted: mek });
    
    let targetJid = "";
    if (q) {
        let num = q.replace(/[^0-9]/g, "");
        if (num) targetJid = num + "@s.whatsapp.net";
    } else if (mek.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        targetJid = mek.message.extendedTextMessage.contextInfo.participant;
    } else if (!from.endsWith('@g.us')) {
        targetJid = from;
    }

    if (!targetJid) return nethmina.sendMessage(from, { text: "❌ Please mention a user, reply to a message, or provide a valid phone number." }, { quoted: mek });

    let whitelist = getWhitelist();
    if (whitelist.includes(targetJid)) {
        whitelist = whitelist.filter(id => id !== targetJid);
        saveWhitelist(whitelist);
        return nethmina.sendMessage(from, { 
            text: `❌ *@${targetJid.split('@')[0]}* has been removed from the whitelist. Incoming calls will be rejected.`, 
            mentions: [targetJid] 
        }, { quoted: mek });
    } else {
        return nethmina.sendMessage(from, { 
            text: `ℹ️ *@${targetJid.split('@')[0]}* is not found in the whitelist.`, 
            mentions: [targetJid] 
        }, { quoted: mek });
    }
});

// 3. .anticall (on/off) Global Toggle එක
cmd({
    pattern: "anticall",
    desc: "Turn global anti-call auto-rejection on or off for everyone.",
    category: "owner",
    filename: __filename
}, async (nethmina, mek, sms, { from, q, isOwner }) => {
    if (!isOwner) return nethmina.sendMessage(from, { text: "❌ This command is only for the Bot Owner!" }, { quoted: mek });
    
    if (!q) return nethmina.sendMessage(from, { text: "ℹ️ Please specify 'on' or 'off'.\nExample: `.anticall on` or `.anticall off`" }, { quoted: mek });
    
    let mode = q.trim().toLowerCase();
    if (mode === "on") {
        updateConfigField("AUTO_CALL_REJECT", "true");
        return nethmina.sendMessage(from, { text: "✅ Anti-Call feature has been successfully enabled globally." }, { quoted: mek });
    } else if (mode === "off") {
        updateConfigField("AUTO_CALL_REJECT", "false");
        return nethmina.sendMessage(from, { text: "❌ Anti-Call feature has been successfully disabled globally." }, { quoted: mek });
    } else {
        return nethmina.sendMessage(from, { text: "❌ Invalid input! Please use `.anticall on` or `.anticall off`" }, { quoted: mek });
    }
});
