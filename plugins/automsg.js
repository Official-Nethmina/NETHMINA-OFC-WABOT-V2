const fs = require('fs');
const path = require('path');
const config = require('../config')
const {cmd , commands} = require('../command')

//auto_voice
cmd({
  on: "body"
},    
async (robin, mek, m, { from, body, isOwner }) => {
    const filePath = path.join(__dirname, '../lib/alldata/autovoice.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    for (const text in data) {
        if (body.toLowerCase() === text.toLowerCase()) {
            
            if (config.AUTO_VOICE === 'true') {
                if (isOwner) return;        
                await robin.sendPresenceUpdate('recording', from);
                await robin.sendMessage(from, { audio: { url: data[text] }, mimetype: 'audio/mpeg', ptt: false }, { quoted: mek });
            }
        }
    }                
});

//auto sticker 
cmd({
  on: "body"
},    
async (robin, mek, m, { from, body, isOwner }) => {
    const filePath = path.join(__dirname, '../lib/alldata/autosticker.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    for (const text in data) {
        if (body.toLowerCase() === text.toLowerCase()) {
            const config = await readEnv();
            
            if (config.AUTO_STICKER === 'true') {
                if (isOwner) return;        
                await robin.sendMessage(
                    from,
                    {
                      sticker: { url: data[text] },
                      packname: '💛 NETHMINA-STICKER 💛',
                      author: 'ΠΣTHMIΠΔ ΩҒC'
                    },
                    { quoted: mek }
                  );
            
            }
        }
    }                
});

//auto reply 
cmd({
  on: "body"
},    
async (robin, mek, m, { from, body, isOwner }) => {
    const filePath = path.join(__dirname, '../lib/alldata/autoreply.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    for (const text in data) {
        if (body.toLowerCase() === text.toLowerCase()) {
           
            if (config.AUTO_REPLY === 'true') {
                if (isOwner) return;        
                await m.reply(data[text])
            
            }
        }
    }                
});                  
