const { cmd } = require('../command');
const axios = require('axios');

// Price List Image URL එක
const priceImageUrl = "https://github.com/Official-Nethmina/Database/blob/main/2026%20Blue%20Color%20New%20Style%20diamond%20Post%20-%20Updated.png?raw=true";

cmd({
    pattern: "price",
    desc: "Send the top-up price list (Accessible to everyone)",
    category: "main",
    filename: __filename
}, async (conn, mek, sms, { from }) => {
    
    // 1. Command එකට 🧾 Reaction එක දැමීම
    await conn.sendMessage(from, { react: { text: "🧾", key: mek.key } }).catch(() => {});

    // 2. Price List Caption එක
    const priceCaption = `*💎 NETHMINA OFFICIAL DIAMOND STORE 💎*

🔹 \`TOPUP EVENT COVERED\`

- 25 Diamonds - LKR 100   
- 50 Diamonds - LKR 185   
- 100 Diamonds - LKR 330   
- 200 Diamonds - LKR 660   
- 310 Diamonds - LKR 970   
- 520 Diamonds - LKR 1,620   
- 1060 Diamonds - LKR 3,200   
- 2180 Diamonds - LKR 6,480   
- 3350 Diamonds - LKR 9,400   

🔹 \`SUPER PACKS\`  

- 2000 Diamonds - LKR 5,500   
- 3000 Diamonds - LKR 8,250   
- 4000 Diamonds - LKR 11,000   
- 5000 Diamonds - LKR 13,750   
- 6000 Diamonds - LKR 16,500   
- 7000 Diamonds - LKR 19,250   
- 8000 Diamonds - LKR 22,000   
- 9000 Diamonds - LKR 24,750   
- 10000 Diamonds - LKR 27,500

🔹 \`MEMBERSHIP LIST\`

- Weekly Lite - LKR 130   
- Weekly - LKR 570      
- Monthly - LKR 2,770   
- VIP - LKR 3,340
- Super VIP (S VIP) - LKR 5,050   

🔹 \`LEVEL UP PASS (ID)\`

- Level 6 - LKR 120  
- Level 10 - LKR 230
- Level 15 - LKR 230
- Level 20 - LKR 230
- Level 25 - LKR 230
- Level 30 - LKR 370

- FULL LEVEL UP PASS - LKR 1500

💳 \`PAYMENT METHODS & CONTACT\`  

- Bank Transfer / EzCash   
- 📱 WhatsApp: 076 086 0835   
- 💸 EzCash: 076 012 7262   

*ℹ️ Note: When making an EzCash payment, pay an additional LKR 20.*

> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴᴇᴛʜᴍɪɴᴀ ᴏꜰᴄ ||`;

    try {
        // 3. Image එක Buffer එකක් ලෙස ඩවුන්ඩෝඩ් කර කැප්ෂන් එක සමඟ යැවීම (Reliable Method)
        const response = await axios.get(priceImageUrl, { 
            responseType: 'arraybuffer',
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const imgBuffer = Buffer.from(response.data);

        await conn.sendMessage(from, {
            image: imgBuffer,
            caption: priceCaption
        }, { quoted: mek });

    } catch (err) {
        console.error("Price List Image Error, trying direct URL:", err.message);
        
        // Buffer අසාර්ථක වුවහොත් Direct URL එකෙන් යැවීම
        await conn.sendMessage(from, {
            image: { url: priceImageUrl },
            caption: priceCaption
        }, { quoted: mek });
    }
});
