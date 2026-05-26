const { cmd } = require("../command");
const { getContentType, downloadContentFromMessage } = require("@whiskeysockets/baileys");

cmd({
    pattern: "save",
    alias: ["sv", "statussave"],
    desc: "Save status of a specific user to owner inbox",
    category: "owner",
    use: ".save [user_number]",
    filename: __filename
}, async (nethmina, m, msg, { from, args, isOwner, reply, sender }) => {
    try {
        // 🔒 Owner ද කියලා චෙක් කිරීම
        if (!isOwner) return reply("❌ This command is only for the Bot Owner.");

        // 📱 අංකය ඇතුළත් කරලාද බලනවා
        if (!args[0]) return reply("💡 Please provide a phone number.\n*Example:* `.save 94760860835`");

        // ඉලක්කම් විතරක් ඉතිරි කරගෙන නිවැරදි WhatsApp JID එක හදාගන්නවා
        let inputNum = args[0].replace(/[^0-9]/g, ""); 
        let targetJid = inputNum + "@s.whatsapp.net";

        // ⏳ රිඇක්ෂන් එකක් දාලා වැඩේ පටන් ගන්නවා
        await nethmina.sendMessage(from, { react: { text: "⏳", key: m.key } });

        // `index.js` එකෙන් එකතු කරපු මෙමරිය චෙක් කරනවා
        if (!global.latestStatuses || !global.latestStatuses[targetJid] || global.latestStatuses[targetJid].length === 0) {
            await nethmina.sendMessage(from, { react: { text: "❌", key: m.key } });
            return reply(`📭 No active statuses found in bot memory for *${inputNum}*.\n\n_Note: Bot can only save statuses that were uploaded AFTER the bot was connected and active._`);
        }

        const userStatuses = global.latestStatuses[targetJid];
        let foundStatusCount = 0;
        const ownerJid = sender.split("@")[0] + "@s.whatsapp.net";

        for (const statusMek of userStatuses) {
            if (!statusMek.message) continue;

            // ස්ටේටස් වල බහුතරයක් වෙලාවට එන්නේ message stub එකක් හෝ විශේෂිත types නිසා නිවැරදිව වර්ගය හඳුනාගැනීම
            const type = getContentType(statusMek.message);
            if (!type) continue;

            const pushName = statusMek.pushName || "Status User";
            
            // කැප්ෂන් එක හෝ ටෙක්ස්ට් එක අල්ලගැනීම
            const caption = statusMek.message[type]?.caption || 
                            statusMek.message.conversation || 
                            statusMek.message.extendedTextMessage?.text || "";

            let headerCaption = `📥 *STATUS SAVED*\n\n👤 *From:* ${pushName}\n📝 *Caption:* ${caption ? caption : "No Caption"}\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴᴇᴛʜᴍɪɴᴀ ᴏꜰᴄ ||`;

            // 1️⃣ TEXT STATUS (📝)
            if (type === "extendedTextMessage" || type === "conversation") {
                const textContent = statusMek.message.conversation || statusMek.message.extendedTextMessage?.text || "";
                if (textContent.trim()) {
                    await nethmina.sendMessage(ownerJid, { 
                        text: `📝 *Text Status Saved*\n\n👤 *From:* ${pushName}\n\n\`\`\`${textContent}\`\`\`\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴᴇᴛʜᴍɪɴᴀ ᴏꜰᴄ ||` 
                    });
                    foundStatusCount++;
                }
            } 
            // 2️⃣ MEDIA STATUS (🖼️ / 🎥 / 🎵)
            else if (type === "imageMessage" || type === "videoMessage" || type === "audioMessage") {
                try {
                    let msgType = "image";
                    if (type === "videoMessage") msgType = "video";
                    if (type === "audioMessage") msgType = "audio";

                    const media = statusMek.message[type];
                    
                    // Baileys හරහා මීඩියා එක බෆර් එකකට බාගත කිරීම
                    const stream = await downloadContentFromMessage(media, msgType);
                    let buffer = Buffer.from([]);
                    for await (const chunk of stream) {
                        buffer = Buffer.concat([buffer, chunk]);
                    }

                    let msgOptions = {
                        [msgType]: buffer,
                        mimetype: media.mimetype
                    };
                    
                    // Audio එකක් නෙවෙයි නම් විතරක් කැප්ෂන් එක දානවා (Audio වලට caption බෑ)
                    if (msgType !== "audio") {
                        msgOptions.caption = headerCaption;
                    } else {
                        // ඕඩියෝ (Voice Note) එකක් නම් වෙනම විස්තර මැසේජ් එකක් යවනවා උඩින්
                        await nethmina.sendMessage(ownerJid, { text: `🎵 *Audio Status Saved*\n👤 *From:* ${pushName}` });
                        msgOptions.ptt = true; // Voice note එකක් විදියට ප්ලේ වෙන්න
                    }

                    await nethmina.sendMessage(ownerJid, msgOptions);
                    foundStatusCount++;
                } catch (err) {
                    console.error("Error downloading media status:", err);
                }
            }
        }

        // වැඩේ සාර්ථකව අවසන් වුණාම රිඇක්ෂන් එක දානවා
        if (foundStatusCount > 0) {
            await nethmina.sendMessage(from, { react: { text: "✅", key: m.key } });
        } else {
            await nethmina.sendMessage(from, { react: { text: "❌", key: m.key } });
            reply("❌ Found status entries but failed to process or download them.");
        }

    } catch (e) {
        console.error(e);
        reply(`*Error:* ${e.message}`);
    }
});
