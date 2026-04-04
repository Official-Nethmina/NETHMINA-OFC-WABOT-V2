const { cmd } = require('../command');

cmd({
    pattern: "hidetag",
    alias: ["tag", "h", "tagall"],
    react: "🔊",
    desc: "Tag all members (Directly or via Inbox using JID)",
    category: "group",
    filename: __filename
},
async (conn, mek, m, { from, q, sender, reply }) => {
    try {
        const ownerNumber = "94760860835";
        const isOwner = sender.includes(ownerNumber);

        // 1. Inbox සිට JID එකක් මගින් Remote Tagging (Owner Only)
        if (!from.endsWith('@g.us') && isOwner && q && q.endsWith('@g.us')) {
            const targetJid = q.trim();

            try {
                // ගෲප් එකේ සාමාජිකයන් ලබා ගැනීම
                const metadata = await conn.groupMetadata(targetJid);
                const participants = metadata.participants.map(u => u.id);

                if (m.quoted) {
                    // Reaction: 🔊
                    await conn.sendMessage(from, { react: { text: '🔊', key: mek.key } });

                    // රිප්ලයි කර ඇති මැසේජ් එක ගෲප් එකට Forward කිරීම (Tag කරමින්)
                    await conn.sendMessage(targetJid, { 
                        forward: m.quoted.fakeObj ? m.quoted.fakeObj : mek, 
                        contextInfo: { 
                            mentionedJid: participants,
                            forwardingScore: 999, 
                            isForwarded: true 
                        } 
                    });

                    return reply(`✅ Successfully tagged all members in group:\n*${metadata.subject}*`);
                } else {
                    return reply("❌ Please reply to a message/media to tag it in the group.");
                }
            } catch (err) {
                return reply(`❌ Failed to fetch group metadata. Make sure I am in that group.\n\n*Error:* ${err.message}`);
            }
        }

        // 2. සාමාන්‍ය ගෲප් එකක් ඇතුළත Hidetag කිරීම
        const isGroupChat = from.endsWith('@g.us');
        if (!isGroupChat) return reply("❌ This command can only be used in groups or by owner in inbox with JID.");

        const groupMetadata = await conn.groupMetadata(from);
        const participants = groupMetadata.participants;
        const userParticipant = participants.find(p => p.id === sender.split(":")[0] + "@s.whatsapp.net");
        const isUserActuallyAdmin = userParticipant && (userParticipant.admin === 'admin' || userParticipant.admin === 'superadmin');

        if (!isUserActuallyAdmin && !isOwner) {
            return reply("❌ Only group admins can use this command.");
        }

        const adminsAndMembers = participants.map(u => u.id);

        // Reaction: 🔊
        await conn.sendMessage(from, { react: { text: '🔊', key: mek.key } });

        if (m.quoted) {
            // රිප්ලයි එකක් ඇත්නම් (Forwarding method)
            return await conn.sendMessage(from, { 
                forward: m.quoted.fakeObj ? m.quoted.fakeObj : mek, 
                contextInfo: { 
                    mentionedJid: adminsAndMembers,
                    forwardingScore: 999, 
                    isForwarded: true 
                } 
            });
        }

        if (q) {
            // Direct Text එකක් ඇත්නම්
            return await conn.sendMessage(from, { 
                text: q, 
                mentions: adminsAndMembers 
            }, { quoted: mek });
        }

    } catch (e) {
        console.error("Hidetag Error:", e);
        reply(`❌ Error: ${e.message}`);
    }
});
