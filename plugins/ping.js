const { cmd } = require("../command");

cmd(
  {
    pattern: "ping",
    desc: "Bot response speed test",
    category: "main",
    filename: __filename,
  },
  async (nethmina, mek, m, { from }) => {

    // 1. React to the message
    try {
      await nethmina.sendMessage(from, {
        react: { text: "🏓", key: mek.key },
      });
    } catch (e) {
      console.log("Reaction failed:", e);
    }

    // 2. Send initial pong message
    const start = Date.now();
    const sent = await nethmina.sendMessage(
      from,
      { text: "🚀 Pinging..." },
      { quoted: mek }
    );

    // 3. Calculate latency and edit the message
    const latency = Date.now() - start;
    await nethmina.sendMessage(from, {
      text: `🏓 Pong!\n*Response time:* ${latency}ms`,
      edit: sent.key,
    });

  }
);
