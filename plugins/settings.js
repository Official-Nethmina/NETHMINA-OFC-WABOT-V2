const { cmd } = require("../command");
const fs = require("fs");
const path = require("path");

// 🛠️ Config ෆයිල් එක තියෙන තැන නිවැරදිව ලබා ගැනීම
const configPath = path.join(__dirname, "../config.js");

// 🧠 යූසර්ගේ දැනට පවතින සෙටින්ග්ස් ස්ටේට් එක මතක තබා ගැනීමට
global.botSettingsState = global.botSettingsState || {};

// 🎛️ සෙටින්ග්ස් මැප් එක (අංක අනුව වෙනස් වන දේවල්)
const SETTINGS_MAP = {
    "1": { key: "AUTO_STATUS_SEEN", type: "boolean", name: "Auto Status Seen" },
    "2": { key: "AUTO_STATUS_REACT", type: "boolean", name: "Auto Status React" },
    "3": { key: "AUTO_CALL_REJECT", type: "boolean", name: "Auto Call Reject" },
    "4": { key: "ANTI_EDIT", type: "boolean", name: "Anti Edit" },
    "5": { key: "OWNER_REACT", type: "boolean", name: "Owner React" },
    "6": { key: "FORWARD_STATUS", type: "boolean", name: "Forward Status" },
    "7": { key: "SESSION_ID", type: "text", name: "Session ID" },
    "8": { key: "PREFIX", type: "text", name: "Bot Prefix" },
    "9": { key: "OWNER_NUMBER", type: "text", name: "Owner Number" },
    "10": { key: "OWNER_NAME", type: "text", name: "Owner Name" },
    "11": { key: "ALIVE_IMG", type: "text", name: "Alive Image URL" },
    "12": { key: "AUTO_READ", type: "text", name: "Auto Read Mode (all/commands/none)" },
    "13": { key: "WORK_TYPE", type: "text", name: "Work Type (inbox/public/private)" }
};

// =======================================================
// 🗂️ FUNCTION: MENU.JS එකේ විදිහටම OPTIONS සහ CONTEXTINFO සෑදීම
// =======================================================
function getSettingsDesign() {
    return {
        options: {
            quoted: {
                key: { 
                    remoteJid: 'status@broadcast', 
                    fromMe: false, 
                    participant: '0@s.whatsapp.net' 
                },
                message: {
                    contactMessage: {
                        displayName: "NETHMINA-OFC ツ",
                        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;NETHMINA-OFC ツ;;;\nFN:NETHMINA-OFC ツ\nitem1.TEL;waid=94760860835:+94 76 086 0835\nitem1.X-ABLabel:PSTN\nEND:VCARD`
                    }
                }
            }
        },
        contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363233544482017@newsletter',
                serverMessageId: 143,
                newsletterName: 'NETHMINA-OFC-WABOT-V2'
            }
        }
    };
}

// =======================================================
// 💾 FUNCTION: CONFIG.JS ෆයිල් එක අප්ඩේට් කර සේව් කරන කොටස
// =======================================================
function updateConfigFile(key, newValue) {
    const config = require("../config");
    config[key] = newValue;

    const fileContent = `const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}
module.exports = {
SESSION_ID: process.env.SESSION_ID || "${config.SESSION_ID}",
ALIVE_IMG: process.env.ALIVE_IMG || "${config.ALIVE_IMG}",
OWNER_NUMBER: process.env.OWNER_NUMBER || "${config.OWNER_NUMBER}",
OWNER_NAME: process.env.OWNER_NAME || "${config.OWNER_NAME}",
PREFIX: process.env.PREFIX || "${config.PREFIX}", 
AUTO_STATUS_SEEN: process.env.AUTO_STATUS_SEEN || "${config.AUTO_STATUS_SEEN}",
AUTO_STATUS_REACT: process.env.AUTO_STATUS_REACT || "${config.AUTO_STATUS_REACT}",
AUTO_CALL_REJECT: process.env.AUTO_CALL_REJECT || "${config.AUTO_CALL_REJECT}",
ANTI_EDIT: process.env.ANTI_EDIT || "${config.ANTI_EDIT}",
OWNER_REACT: process.env.OWNER_REACT || "${config.OWNER_REACT}",
AUTO_READ: process.env.AUTO_READ || "${config.AUTO_READ}",
FORWARD_STATUS: process.env.FORWARD_STATUS || "${config.FORWARD_STATUS}",
WORK_TYPE: process.env.WORK_TYPE || '${config.WORK_TYPE}',
};`;

    fs.writeFileSync(configPath, fileContent);
    delete require.cache[require.resolve("../config")];
}

// =======================================================
// 🎨 FUNCTION: ඔයා දුන්න නවතම UI DESIGN එකට අනුව MENU එක හැදීම
// =======================================================
function generateSettingsMenu() {
    delete require.cache[require.resolve("../config")];
    const config = require("../config");

    const statusIcon = (val) => val === "true" ? "🟩 *ON*" : "🟥 *OFF*";

    return `╭──────────────╮
│ ⚙️ *𝐁𝐎𝐓 𝐂𝐎𝐍𝐅𝐈𝐆 𝐏𝐀𝐍𝐄𝐋* ⚙️ │
╰──────────────╯

╭🧑🏻‍💻 *\`DEVELOPER:\`*  ${config.OWNER_NAME}
│📌 *\`CURRENT PREFIX:\`*  [  ${config.PREFIX}  ]
│💼 *\`SYSTEM MODE:\`*  ${config.WORK_TYPE.toUpperCase()}
╰──────────●●►

╭┈┈┈┈┈●●►
│⚡ *𝐎𝐍 / 𝐎𝐅𝐅 𝐒𝐖𝐈𝐓𝐂𝐇 𝐂𝐎𝐍𝐓𝐑𝐎𝐋𝐒*
╰┈┈┈┈┈┈┈┈┈┈┈┈➤ˎˊ˗

╭──────────●●►
┃ *[01] Auto Status Seen*  ➔ ${statusIcon(config.AUTO_STATUS_SEEN)}
┃ *[02] Auto Status React*  ➔ ${statusIcon(config.AUTO_STATUS_REACT)}
┃ *[03] Auto Call Reject*  ➔ ${statusIcon(config.AUTO_CALL_REJECT)}
┃ *[04] Anti Edit*  ➔ ${statusIcon(config.ANTI_EDIT)}
┃ *[05] Owner React*  ➔ ${statusIcon(config.OWNER_REACT)}
┃ *[06] Forward Status*  ➔ ${statusIcon(config.FORWARD_STATUS)}
╰──────────●●►
 _(Reply with number to Toggle)_

╭┈┈┈┈┈●●►
│⚙️ *TEXT VALUE CONFIGURATIONS*
╰┈┈┈┈┈┈┈┈┈┈┈┈➤ˎˊ˗

╭──────────●●►
┃ *[07] Session ID*  ➔ 🔑 _[Secured Key]_
┃ *[08] Bot Prefix*  ➔ [ ${config.PREFIX} ]
┃ *[09] Owner Number*  ➔ +${config.OWNER_NUMBER}
┃ *[10] Owner Name*  ➔ ${config.OWNER_NAME}
┃ *[11] Alive Image URL*  ➔ ${config.ALIVE_IMG}
┃ *[12] Auto Read Mode*  ➔ ${config.AUTO_READ}
┃ *[13] Work Type*  ➔ ${config.WORK_TYPE}
╰──────────●●►
_(Reply with number to Edit Value)_

💡 *Tips:* When changing the text, you can type the new value after entering the number.
🛑 Type *.cancel* to stop this at any time.`;
}

// =======================================================
// 📡 LISTENER: NUMBER REPLIES අල්ලලා වැඩේ සිද්ධ කරන කොටස
// =======================================================
cmd(
    {
        on: "text",
        category: "owner",
        filename: __filename,
    },
    async (nethmina, mek, sms, { from, sender, reply, isOwner }) => {
        try {
            if (!isOwner) return; 

            let incomingText = "";
            if (mek.message?.conversation) incomingText = mek.message.conversation;
            else if (mek.message?.extendedTextMessage?.text) incomingText = mek.message.extendedTextMessage.text;

            incomingText = incomingText.trim();
            const userState = global.botSettingsState[sender];

            if (!userState) return;

            const design = getSettingsDesign();

            if (incomingText.toLowerCase() === ".cancel") {
                delete global.botSettingsState[sender];
                return await nethmina.sendMessage(from, { text: "❌ *Settings configuration session closed.*" }, design.options);
            }

            // ----------------------------------------
            // STEP 1: ප්‍රධාන මෙනුවේදී අංකයක් තේරූ විට
            // ----------------------------------------
            if (userState.step === "MAIN_MENU") {
                const selectedNumber = incomingText;
                const setting = SETTINGS_MAP[selectedNumber];

                if (!setting) return; 

                const config = require("../config");

                // A. Boolean (ON/OFF) ටොගල් එකක් නම්
                if (setting.type === "boolean") {
                    const currentValue = config[setting.key];
                    const newValue = currentValue === "true" ? "false" : "true";

                    updateConfigFile(setting.key, newValue);

                    await nethmina.sendMessage(from, { text: `✅ *${setting.name}* updated to ${newValue === "true" ? "🟩 ON" : "🟥 OFF"} successfully!` }, design.options);
                    
                    // 🖼️ අලුත් මෙනුව Alive Image එක සහ VCard Context එක සමඟ යැවීම
                    const updatedMenu = generateSettingsMenu();
                    const freshConfig = require("../config");
                    return await nethmina.sendMessage(from, { 
                        image: { url: freshConfig.ALIVE_IMG }, 
                        caption: updatedMenu,
                        contextInfo: design.contextInfo
                    }, design.options);
                } 
                // B. Text/Value වෙනස් කරන එකක් නම්
                else if (setting.type === "text") {
                    global.botSettingsState[sender] = {
                        step: "AWAITING_TEXT_INPUT",
                        key: setting.key,
                        name: setting.name
                    };

                    return await nethmina.sendMessage(from, { text: `📝 *You selected to change [${setting.name}]*\n\nCurrent value: \`${config[setting.key]}\`\n\n👉🏽 *Please reply with the NEW value now:*` }, design.options);
                }
            }

            // ----------------------------------------
            // STEP 2: TEXT VALUE එකක් TYPE කරලා එවපු විට
            // ----------------------------------------
            if (userState.step === "AWAITING_TEXT_INPUT") {
                const targetKey = userState.key;
                const targetName = userState.name;
                const newValue = incomingText;

                if (!newValue) return await nethmina.sendMessage(from, { text: "❌ Value cannot be empty! Please type a valid value." }, design.options);

                updateConfigFile(targetKey, newValue);

                await nethmina.sendMessage(from, { text: `✅ *${targetName}* dynamic value updated to \`${newValue}\` successfully!` }, design.options);

                global.botSettingsState[sender] = { step: "MAIN_MENU" };
                
                // 🖼️ අලුත් මෙනුව Alive Image එක සහ VCard Context එක සමඟ යැවීම
                const updatedMenu = generateSettingsMenu();
                const freshConfig = require("../config");
                return await nethmina.sendMessage(from, { 
                    image: { url: freshConfig.ALIVE_IMG }, 
                    caption: updatedMenu,
                    contextInfo: design.contextInfo
                }, design.options);
            }

        } catch (error) {
            console.error("Settings Listener Error:", error);
        }
    }
);

// =======================================================
// ⚙️ MAIN COMMAND: .SETTINGS කමාන්ඩ් එක ක්‍රියාත්මක වීම
// =======================================================
cmd(
    {
        pattern: "settings",
        alias: ["config", "panel", "botconfig"],
        desc: "Open the professional bot configuration panel.",
        category: "owner",
        filename: __filename,
    },
    async (nethmina, mek, sms, { from, reply, isOwner, sender }) => {
        try {
            if (!isOwner) return await reply("❌ This command is only for my Owner! 🧑🏻‍💻");

            global.botSettingsState[sender] = { step: "MAIN_MENU" };

            const config = require("../config");
            const menu = generateSettingsMenu();
            const design = getSettingsDesign();
            
            // 🔥 Alive Image, නවතම UI සහ Vcard/Status Broadcast Context සමඟ මෙනුව යැවීම
            return await nethmina.sendMessage(from, { 
                image: { url: config.ALIVE_IMG }, 
                caption: menu,
                contextInfo: design.contextInfo
            }, design.options);

        } catch (error) {
            console.error("Settings Command Error:", error);
            await reply(`❌ Error loading panel: ${error.message}`);
        }
    }
);
