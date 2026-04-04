const config = require('../config');
const { cmd } = require('../command');

cmd({
    on: "body"
}, 
async (conn, mek, m, { from }) => {
    try {
        // 1. Auto Recording (හඬ පටියක් රෙකෝඩ් කරන බව පෙන්වීම)
        if (config.AUTO_RECORDING === 'true') {
            await conn.sendPresenceUpdate('recording', from);
        }

        // 2. Auto Typing / Composing (ටයිප් කරන බව පෙන්වීම)
        if (config.AUTO_TYPING === 'true') {
            await conn.sendPresenceUpdate('composing', from);
        }

        // 3. Always Online (සැමවිටම ඔන්ලයින් පෙන්වීම)
        if (config.ALWAYS_ONLINE === "true") {
            await conn.sendPresenceUpdate("available", from);
        }

    } catch (e) {
        // ලොග් එකේ එරර් එක පෙන්වීම (අවශ්‍ය නම් පමණි)
        // console.error("[Presence Controller Error]", e);
    }
});
