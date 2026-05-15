const { cmd } = require("../command");

const config = require("../config");
global.workType = global.workType || config.WORK_TYPE || "all";

cmd({
    pattern: "worktype",
    desc: "Change bot work type (all/private/inbox/group)",
    category: "owner",
    use: ".worktype all",
    filename: __filename
},
async (conn, mek, m, { from, isOwner, args, reply }) => {
    if (!isOwner) return reply("❌ This command is only for Owner!");
    if (!args[0]) return reply(`*Current Work Type:* ${global.workType.toUpperCase()}\n\n*Available Modes:*\n1. .worktype all\n2. .worktype private\n3. .worktype inbox\n4. .worktype group`);

    const mode = args[0].toLowerCase();
    const validModes = ["all", "private", "inbox", "group"];

    if (!validModes.includes(mode)) return reply("❌ Invalid mode! Use all, private, inbox, or group.");

    global.workType = mode;
    return reply(`✅ *Bot Work Type updated to:* ${mode.toUpperCase()}`);
});
