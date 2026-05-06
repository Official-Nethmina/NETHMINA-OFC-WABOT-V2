// plugins/status_download.js

module.exports = {
    onMessage: async (nethmina, mek) => {
        try {
            const from = mek.key.remoteJid;
            const type = Object.keys(mek.message)[0];
            const body = (type === 'conversation') ? mek.message.conversation : 
                         (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : '';

            // අපි බලනවා මැසේජ් එක "save", "send", "එවන්න" වගේ එකක්ද කියලා
            const triggerWords = ["save", "send", "danna", "ewanna", "denna"];
            const isTrigger = triggerWords.some(word => body.toLowerCase().includes(word));

            // මැසේජ් එක status එකකට කරපු reply එකක්ද කියලා බලනවා
            const isReplyToStatus = mek.message?.extendedTextMessage?.contextInfo?.remoteJid === 'status@broadcast';

            if (isReplyToStatus && isTrigger) {
                // Status එකේ තොරතුරු ලබා ගැනීම
                const quotedMsg = mek.message.extendedTextMessage.contextInfo.quotedMessage;
                const quotedType = Object.keys(quotedMsg)[0];

                if (quotedType === 'imageMessage' || quotedType === 'videoMessage') {
                    const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
                    
                    // Media එක download කිරීම
                    const stream = await downloadContentFromMessage(
                        quotedMsg[quotedType], 
                        quotedType === 'imageMessage' ? 'image' : 'video'
                    );
                    
                    let buffer = Buffer.from([]);
                    for await (const chunk of stream) {
                        buffer = Buffer.concat([buffer, chunk]);
                    }

                    // අදාළ පුද්ගලයාගේ chat එකට status එක යැවීම
                    await nethmina.sendMessage(from, {
                        [quotedType === 'imageMessage' ? 'image' : 'video']: buffer,
                        caption: quotedMsg[quotedType].caption || '',
                        mimetype: quotedMsg[quotedType].mimetype
                    }, { quoted: mek });

                } else if (quotedType === 'conversation' || quotedType === 'extendedTextMessage') {
                    // Text status එකක් නම් text එක යැවීම
                    const statusText = quotedMsg.conversation || quotedMsg.extendedTextMessage.text;
                    await nethmina.sendMessage(from, { text: statusText }, { quoted: mek });
                }
            }
        } catch (e) {
            console.error("Status Download Error:", e);
        }
    }
};
