const { cmd } = require("../command");
const config = require("../config");

cmd(
    {
        pattern: "autoread",
        alias: ["readtype"],
        desc: "Change auto read messages status",
        category: "owner", // Ownerට විතරක් කරන්න පුළුවන් වෙන්න
        filename: __filename,
    },
    async (bot, mek, m, { from, q, reply, isOwner }) => {
        try {
            // Owner ද කියලා check කරනවා (ඔයාගේ bot එකේ isOwner logic එක වෙනස් නම් ඒ අනුව හදාගන්න)
            if (!isOwner) return reply("❌ Only the Bot Owner can use this command!");

            if (!q) {
                return reply(`*👁️ AUTO READ SYSTEM 👁️*

Current Status: *${config.AUTO_READ.toUpperCase()}*

*Available Options:*
1️⃣ *.autoread all* (All incoming messages)
2️⃣ *.autoread commands* (Only command messages)
3️⃣ *.autoread none* (Disable auto read)`);
            }

            const type = q.toLowerCase().trim();

            if (type === "all" || type === "commands" || type === "none") {
                config.AUTO_READ = type; // Runtime එකේදී config එක update කරනවා
                
                await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });
                return reply(`👁️ Auto Read Status successfully updated to: *${type.toUpperCase()}*`);
            } else {
                return reply("❌ Invalid option! Use *all*, *commands*, or *none*.");
            }

        } catch (e) {
            console.error(e);
            reply("❌ Error while changing auto read status.");
        }
    }
);
