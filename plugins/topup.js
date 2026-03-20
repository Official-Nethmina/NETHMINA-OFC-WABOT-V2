const axios = require("axios");
const config = require("../config");
const { cmd } = require("../command");

// ✅ Memory (per user)
let userMemory = {};

console.log("✅ AI Plugin Loaded");

// REGISTER AS REPLY HANDLER
cmd({
    // ❌ pattern දාන්න එපා (VERY IMPORTANT)

    filter: (text) => {
        console.log("📩 MESSAGE RECEIVED:", text);

        if (!text) return false;

        // ❌ ignore commands
        if (text.startsWith(".")) return false;

        // ❌ ignore very short messages
        if (text.length < 2) return false;

        return true;
    },

    desc: "AI Auto Reply",
    category: "ai",
    filename: __filename
},

// MAIN FUNCTION
async (conn, mek, m, { from, body, reply }) => {
    try {
        const userMsg = body.trim();

        // ✅ Memory setup
        if (!userMemory[from]) userMemory[from] = [];

        userMemory[from].push(userMsg);
        userMemory[from] = userMemory[from].slice(-5);

        // ✅ System prompt
        const systemPrompt = `
You are a WhatsApp AI assistant for a Gaming TopUp Store in Sri Lanka.

Rules:
- Reply short, friendly, and helpful
- Speak Sinhala / English / Singlish based on user
- Focus on helping customer to buy

Prices:
Free Fire:
100 Diamonds = Rs.350
210 Diamonds = Rs.700

PUBG:
60 UC = Rs.380

Flow:
1. Ask game name
2. Ask Player ID
3. Tell price
4. Give payment details
5. Ask for payment screenshot
`;

        // ✅ Build request
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

        // ✅ API CALL
        // inside function
if (mek.key.fromMe) return;

const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${config.GEMINI_API_KEY}`,
    { contents },
    {
        headers: { "Content-Type": "application/json" }
    }
);
        // ✅ Safe response
        const aiReply =
            response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "⚠️ Server busy. Try again later.";

        // Save bot reply
        userMemory[from].push(aiReply);

        // ✅ Send reply
        return reply(aiReply);

    } catch (error) {
        console.log("❌ AI ERROR:", error?.response?.data || error.message);
        return reply("⚠️ AI service error. Try again later.");
    }
});
