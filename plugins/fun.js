const { cmd } = require("../command");
const fetch = require("node-fetch");

async function getJSON(url) {
  try {
    const res = await fetch(url);
    return await res.json();
  } catch (e) {
    console.error("API Fetch Error:", e);
    return null;
  }
}

cmd(
  {
    pattern: "pickup",
    react: "💘",
    desc: "Get a cheesy pickup line",
    category: "fun",
    filename: __filename,
  },
  async (danuwa, mek, m, { from, reply }) => {
    const data = await getJSON("https://vinuxd.vercel.app/api/pickup");
    if (!data || !data.pickup) return reply("❌ No pickup line found.");
    await danuwa.sendMessage(from, { text: `💘 *Pickup Line:* ${data.pickup}` }, { quoted: mek });
  }
);

cmd(
  {
    pattern: "dare",
    react: "🔥",
    desc: "Get a random dare challenge",
    category: "fun",
    filename: __filename,
  },
  async (danuwa, mek, m, { from, reply }) => {
    const dares = await getJSON("https://api.truthordarebot.xyz/v1/dare");
    if (!dares || !dares.question) return reply("❌ Could not get a dare challenge.");
    await danuwa.sendMessage(from, { text: `🔥 *Dare:* ${dares.question}` }, { quoted: mek });
  }
);

cmd(
  {
    pattern: "wyr",
    react: "⚖️",
    desc: "Would You Rather question",
    category: "fun",
    filename: __filename,
  },
  async (danuwa, mek, m, { from, reply }) => {
    const data = await getJSON("https://api.truthordarebot.xyz/v1/wyr");
    if (!data || !data.question) return reply("❌ Could not get a WYR question.");
    await danuwa.sendMessage(from, { text: `⚖️ *Would You Rather:* ${data.question}` }, { quoted: mek });
  }
);

cmd(
  {
    pattern: "roast",
    react: "🔥",
    desc: "Get roasted!",
    category: "fun",
    filename: __filename,
  },
  async (danuwa, mek, m, { from, reply }) => {
    const data = await getJSON("https://insult.mattbas.org/api/insult.json");
    if (!data || !data.insult) return reply("❌ Could not fetch roast.");
    await danuwa.sendMessage(from, { text: `🔥 *Roast:* ${data.insult}` }, { quoted: mek });
  }
);

cmd(
  {
    pattern: "insult",
    react: "😈",
    desc: "Funny insult",
    category: "fun",
    filename: __filename,
  },
  async (danuwa, mek, m, { from, reply }) => {
    const data = await getJSON("https://evilinsult.com/generate_insult.php?lang=en&type=json");
    if (!data || !data.insult) return reply("❌ Could not fetch insult.");
    await danuwa.sendMessage(from, { text: `😈 *Insult:* ${data.insult}` }, { quoted: mek });
  }
);

cmd(
  {
    pattern: "compliment",
    react: "😊",
    desc: "Send a compliment",
    category: "fun",
    filename: __filename,
  },
  async (danuwa, mek, m, { from, reply }) => {
    const data = await getJSON("https://complimentr.com/api");
    if (!data || !data.compliment) return reply("❌ Could not fetch compliment.");
    await danuwa.sendMessage(from, { text: `😊 *Compliment:* ${data.compliment}` }, { quoted: mek });
  }
);

cmd(
  {
    pattern: "8ball",
    react: "🎱",
    desc: "Magic 8Ball answer",
    category: "fun",
    filename: __filename,
  },
  async (danuwa, mek, m, { from, q, reply }) => {
    if (!q) return reply("🎱 *Ask me a question!*\n\nExample: `.8ball Will I be rich?`");
    const answers = [
      "Yes, definitely!",
      "Nope, never.",
      "It’s possible, keep believing!",
      "Ask again later.",
      "Outlook not so good.",
    ];
    const ans = answers[Math.floor(Math.random() * answers.length)];
    await danuwa.sendMessage(from, { text: `🎱 *${ans}*` }, { quoted: mek });
  }
);
