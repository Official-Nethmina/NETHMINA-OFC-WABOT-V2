const { cmd } = require('../command');

// Shell ගණන් සහ මිල ගණන් (Price List)
const itemPrices = {
    "weekly": 86,
    "weekly lite": 18,
    "monthly": 430,
    "diamond 25": 13,
    "diamond 50": 26, // 13 * 2 (User ඉල්ලපු විදිහට)
    "diamond 100": 50,
    "310": 152,
    "520": 254,
    "1060": 500,
    "2180": 1010,
    "5600": 2500,
    "11500": 5150
};

cmd({
    pattern: "topup",
    desc: "Process customer top-up order (Owner only)",
    category: "owner",
    filename: __filename
}, async (conn, mek, sms, { from, q, isOwner }) => {
    // 1. Owner Check එක
    if (!isOwner) {
        return conn.sendMessage(from, { text: "❌ This command is only for the Bot Owner!" }, { quoted: mek });
    }

    // 2. Command එකට 💎 Reaction එක දැමීම
    await conn.sendMessage(from, { react: { text: "💎", key: mek.key } }).catch(() => {});

    // 3. Reply කළ මැසේජ් එකකින් UID එක ඩෙටෙක්ට් කිරීම
    let uid = "";
    const quotedMsg = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    
    if (quotedMsg) {
        // Reply කරපු මැසේජ් එකේ text එක ලබා ගැනීම
        const quotedText = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text || quotedMsg.imageMessage?.caption || quotedMsg.videoMessage?.caption || "";
        
        // මැසේජ් එකෙන් ඉලක්කම් (Numbers) පමණක් තෝරා ගැනීම
        const matchNumbers = quotedText.replace(/[^0-9]/g, "");
        if (matchNumbers) {
            uid = matchNumbers;
        }
    }

    if (!uid) {
        return conn.sendMessage(from, { text: "❌ Please reply to a customer message containing their UID/ID to use this command." }, { quoted: mek });
    }

    // 4. Arguments (Item සහ Quantity) parse කරගැනීම (ഉదా: weekly*2 හෝ weekly)
    if (!q) {
        return conn.sendMessage(from, { text: "ℹ️ Please specify the item name.\nExample: `.topup weekly` or `.topup weekly*2`" }, { quoted: mek });
    }

    let inputArgs = q.trim().toLowerCase();
    let itemNameInput = inputArgs;
    let quantity = 1;

    // වර්ණනා (quantity) වෙනස් කිරීම (* තිබේදැයි බලයි)
    if (inputArgs.includes("*")) {
        const parts = inputArgs.split("*");
        itemNameInput = parts[0].trim();
        const parsedQty = parseInt(parts[1]);
        if (!isNaN(parsedQty) && parsedQty > 0) {
            quantity = parsedQty;
        }
    }

    // Item එක මැච් කරගැනීම
    let matchedKey = "";
    for (const key of Object.keys(itemPrices)) {
        if (itemNameInput === key || itemNameInput.includes(key)) {
            matchedKey = key;
            break;
        }
    }

    // ලිස්ට් එකේ නැති අයිටම් එකක් නම් ස්වයංක්‍රීයව Diamond 25 පදනම් කර හෝ ඩීෆල්ට් එකක් දැමීම (අවශ්‍ය නම්)
    let unitPrice = 86; // Default weekly
    let displayItemName = "Weekly";

    if (matchedKey) {
        unitPrice = itemPrices[matchedKey];
        displayItemName = matchedKey.toUpperCase();
    } else {
        // අයිටම් එක හරියටම නැත්නම් ඉන්පුට් එකම පෙන්වීම
        displayItemName = itemNameInput.toUpperCase();
        unitPrice = 86; 
    }

    const totalPrice = unitPrice * quantity;

    // 5. පළමු Processing මැසේජ් එක සැකසීම
    const processingMsgText = `*✅ Your top-up order has been received successfully and is now being processed.*

👤 \`Player:\` \`\`\`${uid}\`\`\` 
📦 \`Item:\` \`\`\`${displayItemName}\`\`\` 
🔢 \`Quantity:\` \`\`\`${quantity}\`\`\` 
💎 \`Price/Unit:\` \`\`\`${unitPrice} SHELLS\`\`\` 
💰 \`Total:\` \`\`\`${totalPrice} SHELLS\`\`\` 
⚡ \`Estimated Time:\` \`\`\`~5 Seconds\`\`\` 

*⏳ Please wait a moment while we complete your top-up.*`;

    try {
        // පළමු මැසේජ් එක යැවීම
        const sentMsg = await conn.sendMessage(from, { 
            text: processingMsgText 
        }, { quoted: mek });

        // යැවූ මැසේජ් එකට ⏳ Reaction එක දැමීම
        await conn.sendMessage(from, { react: { text: "⏳", key: sentMsg.key } }).catch(() => {});

        // 6. තත්පර 30 කට පසු Completion මැසේජ් එක යැවීම
        setTimeout(async () => {
            const completedMsgText = `*✅ Your top-up has been completed successfully!*

📌 \`Status:\` \`\`\`COMPLETED ✅\`\`\` 
⚡ \`Delivery:\` \`\`\`SUCCESSFUL ☑️\`\`\` 

🎮 Please check your game account to confirm that you have received your top-up.

🙏 Thank you for choosing us! ❤️

💖 We appreciate your support and look forward to serving you again!

© 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝚗𝚎𝚝𝚑𝚖𝚒𝚗𝚊𝚘𝚏𝚌 ||`;

            try {
                const finishedMsg = await conn.sendMessage(from, { 
                    text: completedMsgText 
                }, { quoted: sentMsg });

                // මැසේජ් එකට ✅ Reaction එක දැමීම
                await conn.sendMessage(from, { react: { text: "✅", key: finishedMsg.key } }).catch(() => {});
            } catch (err) {
                console.error("Top-up Completion Error:", err);
            }
        }, 30000); // තත්පර 30 (30000 ms)

    } catch (err) {
        console.error("Top-up Error:", err);
        return conn.sendMessage(from, { text: "❌ An error occurred while processing the top-up order." }, { quoted: mek });
    }
});
