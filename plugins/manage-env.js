const { cmd } = require('../command');
const config = require('../config');

// 1. ALIVE IMAGE UPDATE
cmd({
    pattern: "update-img",
    alias: ["setaliveimg"],
    desc: "Update the Bot's Alive Image URL",
    category: "settings",
    filename: __filename
}, async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");
    const newImg = args[0];
    if (!newImg || !newImg.startsWith("http")) return reply("❌ Please provide a valid Image URL.");
    
    config.ALIVE_IMG = newImg;
    return reply("✅ *ALIVE_IMG* updated successfully.");
});

// 2. ALIVE MESSAGE UPDATE
cmd({
    pattern: "update-msg",
    alias: ["setalivemsg"],
    desc: "Update the Bot's Alive Message",
    category: "settings",
    filename: __filename
}, async (conn, mek, m, { from, q, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");
    if (!q) return reply("❌ Please provide a message. Example: `.update-msg Hello I am online`.");
    
    config.ALIVE_MSG = q;
    return reply("✅ *ALIVE_MSG* updated successfully.");
});

// 3. OWNER NUMBER UPDATE
cmd({
    pattern: "update-owner",
    alias: ["setowner"],
    desc: "Update the Owner Number",
    category: "settings",
    filename: __filename
}, async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");
    const newNum = args[0]?.replace(/[^0-9]/g, '');
    if (!newNum) return reply("❌ Please provide a valid number. Example: `.update-owner 94760860835`.");
    
    config.OWNER_NUMBER = newNum;
    return reply(`✅ *OWNER_NUMBER* updated to: ${newNum}`);
});

// --- මීට කලින් සාදා දුන් Settings ටික ---

// 4. AUTO STATUS SEEN
cmd({
    pattern: "auto-seen",
    alias: ["autoview"],
    desc: "Enable or disable auto-viewing of statuses",
    category: "settings",
    filename: __filename
}, async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");
    if (args[0] === "on") { config.AUTO_STATUS_SEEN = "true"; return reply("✅ *AUTO_STATUS_SEEN* enabled."); }
    if (args[0] === "off") { config.AUTO_STATUS_SEEN = "false"; return reply("❌ *AUTO_STATUS_SEEN* disabled."); }
    reply("Usage: .auto-seen on/off");
});

// 5. STATUS REACT
cmd({
    pattern: "status-react",
    desc: "Enable or disable status-reacting",
    category: "settings",
    filename: __filename
}, async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");
    if (args[0] === "on") { config.AUTO_STATUS_REACT = "true"; return reply("✅ *AUTO_STATUS_REACT* enabled."); }
    if (args[0] === "off") { config.AUTO_STATUS_REACT = "false"; return reply("❌ *AUTO_STATUS_REACT* disabled."); }
    reply("Usage: .status-react on/off");
});

// 6. ALWAYS ONLINE
cmd({
    pattern: "always-online",
    desc: "Enable or disable always online mode",
    category: "settings",
    filename: __filename
}, async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");
    if (args[0] === "on") { config.ALWAYS_ONLINE = "true"; return reply("✅ *ALWAYS_ONLINE* enabled."); }
    if (args[0] === "off") { config.ALWAYS_ONLINE = "false"; return reply("❌ *ALWAYS_ONLINE* disabled."); }
    reply("Usage: .always-online on/off");
});

// 7. AUTO RECORDING & TYPING
cmd({
    pattern: "auto-record",
    desc: "Enable or disable auto recording presence",
    category: "settings",
    filename: __filename
}, async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 Only owner can use this!*");
    config.AUTO_RECORDING = args[0] === "on" ? "true" : "false";
    reply(`✅ *AUTO_RECORDING* set to ${args[0]}`);
});

cmd({
    pattern: "auto-typing",
    desc: "Enable or disable auto typing presence",
    category: "settings",
    filename: __filename
}, async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 Only owner can use this!*");
    config.AUTO_TYPING = args[0] === "on" ? "true" : "false";
    reply(`✅ *AUTO_TYPING* set to ${args[0]}`);
});
