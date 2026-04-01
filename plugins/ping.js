const { cmd } = require("../command");

cmd(
  {
    pattern: "ping",
    desc: "Bot response speed test",
    category: "main",
    filename: __filename,
  },
  async (nethmina, mek, m, { reply, from }) => {
    // 1️⃣ React to the message
    try {
      await nethmina.sendMessage(from, { react: { text: "🏓", key: mek.key } });
    } catch (e) {
      console.log("Reaction failed:", e);
    }

    // 2️⃣ Ping response
    const start = Date.now();
    await reply("🏓 Pinging...");
    const end = Date.now();
    await reply(`🏓 Pong! Response time: *${end - start}ms*`);
  }
);

