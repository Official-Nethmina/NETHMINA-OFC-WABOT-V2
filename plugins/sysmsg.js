const { cmd } = require('../command');
const { generateWAMessageFromContent } = require('@whiskeysockets/baileys');

cmd({
    pattern: "sysmsg",
    alias: ["systemmsg", "spoofsys", "sm"],
    desc: "Create a fake WhatsApp system/stub notification message.",
    category: "cheat",
    use: '.sysmsg [Your Text]',
    filename: __filename
},
async (nethmina, mek, msg, { from, q, isGroup, reply }) => {
    try {
        if (!isGroup) return await reply("❌ This command can only be used in groups.");
        if (!q) return await reply("❌ *Format:* `.sysmsg [බොරුවට දාන්න ඕන නිවේදනය]`\n\n*Example:* `.sysmsg WhatsApp Security update: Active successfully!`");

        const targetText = q.trim();

        await nethmina.sendMessage(from, { 
            react: { text: "🦹‍♂️", key: mek.key } 
        });

        // 🔥 [FIXED] Baileys වල අලුත්ම generateWAMessageFromContent ක්‍රමය මඟින් මැසේජ් එක නිර්මාණය කිරීම
        const protoMessage = generateWAMessageFromContent(from, {
            templateMessage: {
                hydratedTemplate: {
                    hydratedContentText: targetText // සමහර වර්ෂන් වලට මේක ප්‍රධාන පෙළ විදිහට ගන්නවා
                }
            }
        }, { 
            userJid: nethmina.user.id 
        });

        // 🔄 සිස්ටම් ස්ටබ් (Stub) දත්ත බලෙන් Inject කිරීම
        protoMessage.messageStubType = 21; // Group Subject Change Protocol ID
        protoMessage.messageStubParameters = [targetText]; // මැද නිල් පාටින් පෙනෙන Text එක
        protoMessage.key.participant = "0@s.whatsapp.net"; // Official WhatsApp System Sender

        // 📤 relayMessage මඟින් සර්වර් එකට කෙලින්ම මැසේජ් එක තල්ලු කිරීම (Mekedi check වෙන්නේ නැහැ)
        await nethmina.relayMessage(from, protoMessage.message, { 
            messageId: protoMessage.key.id 
        });

    } catch (e) {
        console.error("System Message Spoof Error:", e);
        reply(`❌ *Error Occurred !!*\n\n${e.message || e}`);
    }
});
