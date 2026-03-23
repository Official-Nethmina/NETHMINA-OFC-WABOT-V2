const axios = require("axios");
const config = require("../config");
const { cmd } = require("../command");

// 🧠 Memory per user
let userMemory = {};

console.log("✅ AI TopUp Plugin Loaded");

cmd({
    // ❌ NO pattern → this becomes reply handler
    filter: (text) => {
        console.log("📩 MESSAGE RECEIVED:", text);

        if (!text) return false;

        // ❌ ignore commands
        if (text.startsWith(".")) return false;

        // ❌ ignore short messages
        if (text.length < 2) return false;

        return true;
    },

    desc: "TopUp AI Auto Reply",
    category: "ai",
    filename: __filename
},

async (conn, mek, m, { from, body, reply }) => {
    try {
        // ❌ ignore bot's own messages
        if (mek.key.fromMe) return;

        const userMsg = body.trim();

        // 🧠 Memory setup
        if (!userMemory[from]) userMemory[from] = [];

        userMemory[from].push(userMsg);

        // keep last 5 messages only
        userMemory[from] = userMemory[from].slice(-5);

        // 🧠 SYSTEM PROMPT
        const systemPrompt = `
You are a smart WhatsApp AI assistant for a Gaming TopUp Store in Sri Lanka.

Rules:
- Reply short, friendly, human-like
- Speak Sinhala / English / Singlish
- Focus on converting user into buyer

Products:
Free Fire:
100 Diamonds = Rs.350
210 Diamonds = Rs.700

PUBG:
60 UC = Rs.380

Payment:
Bank: BOC
Account: 12345678
Name: A. Perera

Flow:
1. Ask game name
2. Ask Player ID
3. Tell price
4. Give payment details
5. Ask for payment screenshot
`;

        // 📦 Build Gemini request
        const contents = [
            {
                role: "user",
                parts: [{ text: systemPrompt }]
            },
            ...userMemory[from].map(msg => ({
                role: "user",
                parts: [{ text: msg }]
            }))
        ];

        // 🚀 GEMINI API CALL (WORKING)
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${config.GEMINI_API_KEY}`,
            { contents },
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        // ✅ Extract reply safely
        let aiReply =
            response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "⚠️ Server busy. Try again later.";

        // 🧠 Save bot reply
        userMemory[from].push(aiReply);

        // 📤 Send reply
        return reply(aiReply);

    } catch (error) {
        console.log("❌ AI ERROR:", error?.response?.data || error.message);

        return reply("⚠️ AI service error. Try again later.");
    }
});
