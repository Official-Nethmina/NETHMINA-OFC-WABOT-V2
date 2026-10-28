const { cmd } = require('../command');

// Shell ගණන් සහ මිල ගණන් (Price List - විශාල අංක වල සිට කුඩා අංක වලට අනුපිළිවෙලට ඇත)
const itemPrices = {
    "weekly lite": 18,
    "weekly": 86,
    "monthly": 430,
    "11500": 5150,
    "5600": 2500,
    "2180": 1010,
    "1060": 500,
    "520": 254,
    "310": 152,
    "100": 50,
    "50": 26,
    "25": 13
};

// ස්වයංක්‍රීයව Diamond ප්‍රමාණයකට අදාළ Shell ගණන ගණනය කිරීම (බුද්ධිමත් ක්‍රමය)
function calculateCustomDiamonds(amount) {
    let remaining = amount;
    let totalShells = 0;
    let breakdown = [];

    // ළඟම ඇති ලොකු පැකේජ් වලින් කොටස් කර Shells එකතු කිරීම
    const sortedPacks = [11500, 5600, 2180, 1060, 520, 310, 100, 50, 25];

    for (let pack of sortedPacks) {
        if (remaining >= pack) {
            let count = Math.floor(remaining / pack);
            remaining %= pack;
            let packUnitShell = itemPrices[pack.toString()];
            totalShells += count * packUnitShell;
            breakdown.push(`${pack}x${count}`);
        }
    }

    // ඉතිරි වන ප්‍රමාණයකට (උදා: ලිස්ට් එකේ නැති කුඩා අංකයකට) ඩීෆල්ට් එකක් ලෙස 25 පදනම් කර ගැනීම
    if (remaining > 0) {
        let extraShells = Math.ceil((remaining / 25) * 13);
        totalShells += extraShells;
    }

    return totalShells;
}

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
        const quotedText = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text || quotedMsg.imageMessage?.caption || quotedMsg.videoMessage?.caption || "";
        const matchNumbers = quotedText.replace(/[^0-9]/g, "");
        if (matchNumbers) {
            uid = matchNumbers;
        }
    }

    if (!uid) {
        return conn.sendMessage(from, { text: "❌ Please reply to a customer message containing their UID/ID to use this command." }, { quoted: mek });
    }

    // 4. Arguments (Item සහ Quantity) parse කරගැනීම
    if (!q) {
        return conn.sendMessage(from, { text: "ℹ️ Please specify the item name or diamond amount.\nExample: `.topup weekly` , `.topup weekly*2` or `.topup 1000`" }, { quoted: mek });
    }

    let inputArgs = q.trim().toLowerCase();
    let itemNameInput = inputArgs;
    let quantity = 1;

    // Quantity (* තිබේදැයි බලයි)
    if (inputArgs.includes("*")) {
        const parts = inputArgs.split("*");
        itemNameInput = parts[0].trim();
        const parsedQty = parseInt(parts[1]);
        if (!isNaN(parsedQty) && parsedQty > 0) {
            quantity = parsedQty;
        }
    }

    // Item එක මැච් කරගැනීම (දිගම / නිවැරදිම නම මුලින් පරීක්ෂා වේ - උදා: weekly lite)
    let matchedKey = "";
    const sortedKeys = Object.keys(itemPrices).sort((a, b) => b.length - a.length);

    for (const key of sortedKeys) {
        if (itemNameInput === key || itemNameInput.includes(key)) {
            matchedKey = key;
            break;
        }
    }

    let unitPrice = 0;
    let displayItemName = "";

    if (matchedKey) {
        // ලැයිස්තුවේ ඇති අයිටම් එකක් නම්
        unitPrice = itemPrices[matchedKey];
        displayItemName = matchedKey.toUpperCase();
    } else {
        // අංකයක් පමණක් දී ඇත්නම් (උදා: 1000, 2700, ආදී diamond ප්‍රමාණයක්)
        const numericInput = parseInt(itemNameInput.replace(/[^0-9]/g, ""));
        if (!isNaN(numericInput) && numericInput > 0) {
            unitPrice = calculateCustomDiamonds(numericInput);
            displayItemName = `${numericInput} DIAMONDS`;
        } else {
            // වෙනත් අක්ෂර සහිත අයිටම් එකක් නම්
            displayItemName = itemNameInput.toUpperCase();
            unitPrice = 86; 
        }
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
        const sentMsg = await conn.sendMessage(from, { 
            text: processingMsgText 
        }, { quoted: mek });

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

                await conn.sendMessage(from, { react: { text: "✅", key: finishedMsg.key } }).catch(() => {});
            } catch (err) {
                console.error("Top-up Completion Error:", err);
            }
        }, 30000); // තත්පර 30

    } catch (err) {
        console.error("Top-up Error:", err);
        return conn.sendMessage(from, { text: "❌ An error occurred while processing the top-up order." }, { quoted: mek });
    }
});
