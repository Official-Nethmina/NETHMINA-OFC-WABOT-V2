const { cmd } = require('../command');

cmd({
    pattern: "boom",
    alias: ["spam", "bomb"],
    react: "💥",
    desc: "Spam messages up to 1000 with high safety bypass delay.",
    category: "owner",
    filename: __filename
},
async (nethmina, mek, msg, { from, q, isOwner, reply }) => {
    try {
        // 🔒 Owner check
        if (!isOwner) return await reply("❌ Only the bot owner can use this command.");

        if (!q) return await reply("❌ Format: `.boom [text] [count]`\nExample: `.boom Hello 50`");

        // Input split logic
        const args = q.split(" ");
        if (args.length < 2) return await reply("❌ Please provide both text and count.\nExample: `.boom Hello 50`");

        const countStr = args[args.length - 1];
        const count = parseInt(countStr);

        // Check valid number
        if (isNaN(count) || count <= 0) {
            return await reply("❌ Invalid count number! Please enter a number at the end.");
        }

        // Extract text
        const textToSpam = args.slice(0, -1).join(" ").trim();
        if (textToSpam.length === 0) return await reply("❌ Please provide text to send.");

        // 🛡️ NEW MAX LIMIT: 1000 Messages
        if (count > 1000) {
            return await reply("⚠️ Max limit is 1000 messages to keep the bot stable!");
        }

        // Spam low-count text notification
        await reply(`🚀 *Starting Safe Spamming...*\n💬 Message: ${textToSpam}\n📊 Total: ${count}\n🛡️ Mode: Anti-Ban High Delay (1.5s)`);

        // Loop execution
        for (let i = 0; i < count; i++) {
            await nethmina.sendMessage(from, { text: textToSpam });
            
            // 🔥 ANTI-BAN DELAY TRICK
            // Count eka wadi weddi delay ekath wadi wenna logical dynamic delay ekak damma
            let safetyDelay = count > 100 ? 1500 : 500; 
            await new Promise(resolve => setTimeout(resolve, safetyDelay)); 
        }

        return await nethmina.sendMessage(from, { text: "✅ *Spamming Completed Successfully!*" }, { quoted: mek });

    } catch (e) {
        console.error("Boom 1000 Limit Error:", e);
        reply(`❌ *Error Occurred !!*\n\n${e.message || e}`);
    }
});
