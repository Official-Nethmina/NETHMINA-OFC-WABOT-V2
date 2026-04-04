const { cmd } = require('../command');
const { sleep } = require('../lib/functions');

cmd({
    pattern: "leave",
    alias: ["left", "leftgc", "kickme"],
    desc: "Leave the group silently",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { from, sender, reply }) => {
    try {
        // 1. Group Check (JID එකෙන් කෙලින්ම බලනවා)
        const isGroupChat = from.endsWith('@g.us');
        if (!isGroupChat) return; // මැසේජ් එකක් යවන්නේ නැතුවම නතර වේ.

        // 2. Owner Check (94760860835)
        const ownerNumber = "94760860835";
        if (!sender.includes(ownerNumber)) return; // වෙනත් අය ගැහුවොත් රිප්ලයි යන්නේ නැත.

        // 3. Reaction එකක් විතරක් දාන්න (අවශ්‍ය නැත්නම් මේ පේළිය අයින් කරන්න)
        await conn.sendMessage(from, { react: { text: '👋', key: mek.key } });

        // 4. පොඩි වෙලාවක් රැඳී සිට ගෲප් එකෙන් අයින් වීම
        await sleep(1000); 
        await conn.groupLeave(from);

    } catch (e) {
        console.error("Leave Error:", e);
    }
});
