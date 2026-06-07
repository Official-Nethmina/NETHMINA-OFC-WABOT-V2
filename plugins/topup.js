const { cmd } = require("../command");
const config = require("../config");

// 🧠 Users ලාගේ Chat States (පියවරවල්) මතක තබා ගැනීමට Memory Object එකක්
// Real production එකකදී මේක database එකකට දාන්න පුළුවන්, දැනට Memory එක පාවිච්චි කරමු.
global.topupSessions = global.topupSessions || {};

// 🛠️ Helper Functions
function cleanNumber(str) {
    return str.replace(/[^0-9]/g, '');
}

// 🎯 Main Command: ඕනෑම මැසේජ් එකක් ආවම (Hi, Hello, Ayye, Bro හෝ වෙනත්) බොට් Session එකක් නැත්නම් වැඩේ පටන් ගන්නවා
cmd(
    {
        on: "body",
        notCmd: true, // 🎯 මේ පේළිය අලුතින් එකතු කරන්න! (එතකොට . නැතුව නිකන් "hi" ගැහුවත් බොට් අල්ලගන්නවා)
        category: "business",
        filename: __filename,
    },
    async (bot, mek, m, { from, body, reply, isGroup }) => {
        // ගෲප් මැසේජ් වලට බොට් රිප්ලයි නොකර ඉන්බොක්ස් (DM) වලට විතරක් වැඩ කිරීමට
        if (isGroup) return;
        if (!body) return;

        const text = body.trim();
        const sender = m.sender;

        // බොට්ගේම මැසේජ් වලට බොට් රිප්ලයි කිරීම වැලැක්වීම
        if (m.fromMe) return;

        // 🔄 User Session එකක් දැනටමත් තියෙනවාදැයි බැලීම
        let session = global.topupSessions[sender];

        // 🚀 STEP 0: මුල්ම වතාවට මැසේජ් එකක් එවන විට (භාෂාව තේරීම)
        if (!session) {
            global.topupSessions[sender] = {
                step: "CHOOSE_LANGUAGE",
                lang: null,
                game: null,
                category: null,
                product: null,
                price: 0,
                uid: null,
                payment: null
            };

            const langMsg = `*Please select a language to continue the service (සේවාව ඉදිරියට පවත්වාගෙන යාම සඳහා භාෂාවක් තෝරන්න 👇)*\n\n1⃣ English\n\n2⃣ සිංහල`;
            return await reply(langMsg);
        }

        // ==========================================
        // 🌐 STEP 1: LANGUAGE SELECTION PROCESSING
        // ==========================================
        if (session.step === "CHOOSE_LANGUAGE") {
            if (text === "1") {
                session.lang = "en";
                session.step = "MAIN_HELP";
                return await reply("Hello, I'm the topup assistant of Nethmina Official Community Topup Store. Do you need any help?");
            } else if (text === "2") {
                session.lang = "si";
                session.step = "MAIN_HELP";
                return await reply("ආයුබෝවන්, මම Nethmina Official Community එකෙහි ඔබගේ Topup සහායකයා. ඔබට කිසියම් උදව්වක් අවශ්‍යද?");
            } else {
                // වචනයක් ගැහුවොත් හෝ වෙනත් අංකයක් ගැහුවොත් ආයෙත් භාෂාව අහනවා
                const langMsg = `*Please select a language to continue the service (සේවාව ඉදිරියට පවත්වාගෙන යාම සඳහා භාෂාවක් තෝරන්න 👇)*\n\n1⃣ English\n\n2⃣ සිංහල`;
                return await reply(langMsg);
            }
        }

        // ==========================================
        // 🛠️ STEP 2: MAIN HELP / TOPUP OR OTHER HELP
        // ==========================================
        if (session.step === "MAIN_HELP") {
            const isYesEn = /^(yes|need|help|i need help|up|topup|top up|1)/i.test(text);
            const isYesSi = /(ඔව්|උදව්|ඕනේ|ටොප්අප්|ටොප් අප්)/i.test(text);
            
            // Bot එක දන්නේ නැති වෙනත් වැඩක් ඇහුවොත් (e.g., make a whatsapp bot, social booting etc.)
            const isUnkownWork = /(bot|website|social|booting|hack|make|create|හදන්න)/i.test(text);

            if (isUnkownWork) {
                session.step = "CONNECT_ADMIN";
                if (session.lang === "en") {
                    return await reply("Sorry, I'm only supporting you with TopUp tasks. I can't do what you need, so would you like one of our agents or an admin to connect you?\n\nReply with *YES* to connect.");
                } else {
                    return await reply("කණගාටුයි, මම ඔබට සහාය දක්වන්නේ ටොප්අප් (TopUp) සම්බන්ධ වැඩකටයුතු සඳහා පමණි. ඔබ ඉල්ලා සිටින දේ මට කළ නොහැක. එබැවින් අපගේ නියෝජිතයෙකු හෝ ඇඩ්මින්වරයෙකු ඔබ හා සම්බන්ධ කිරීමට ඔබ කැමතිද?\n\nසම්බන්ධ වීමට *ඔව්* ලෙස රිප්ලයි කරන්න.");
                }
            }

            if (isYesEn || isYesSi) {
                session.step = "CHOOSE_GAME";
                let msg = "";
                if (session.lang === "en") {
                    msg = `I'm your helpful TopUp assistant of Nethmina Official Community 🙋‍♀️\nI have a Topup store created by Nethmina Official Community Owner NETHMINA OFC. I topup Free Fire, PUBG, Blood Strike Games. My main topup is Free Fire diamond topup store. My service time is from 8.00 a.m to 10.00 p.m.\n\n*Please select the game you want to TopUp:* \n\n1. Free Fire 🔥\n2. Blood Strike 🩸\n3. PUBG 🥷`;
                } else {
                    msg = `මම Nethmina Official Community හි ඔබගේ උපකාරක TopUp සහායකයා වේ 🙋‍♀️\nමම Nethmina Official Community හි හිමිකරු වන NETHMINA OFC විසින් සාදන ලද Topup store එකක් පවත්වාගෙන යමි. මම Free Fire, PUBG, Blood Strike ක්‍රීඩා සඳහා Topup කරමි. මගේ ප්‍රධාන සේවාව වන්නේ Free Fire diamond topup කිරීමයි. මගේ සේවා කාලය උදේ 8.00 සිට රාත්‍රී 10.00 දක්වා වේ.\n\n*කරුණාකර ඔබට ටොප්අප් කිරීමට අවශ්‍ය ක්‍රීඩාව තෝරන්න:* \n\n1. Free Fire 🔥\n2. Blood Strike 🩸\n3. PUBG 🥷`;
                }
                return await reply(msg);
            } else {
                // වෙනත් සාමාන්‍ය උදව්වක් නම්
                if (session.lang === "en") {
                    return await reply("How can I assist you with your TopUp needs? Please let me know what you are looking for.");
                } else {
                    return await reply("ඔබගේ ටොප්අප් අවශ්‍යතාවය සඳහා මම ඔබට උදව් කරන්නේ කෙසේද? කරුණාකර ඔබට අවශ්‍ය දේ පවසන්න.");
                }
            }
        }

        // ==========================================
        // 👥 STEP: CONNECT ADMIN HANDLING
        // ==========================================
        if (session.step === "CONNECT_ADMIN") {
            if (/^(yes|ඔව්)/i.test(text)) {
                session.step = "WAITING_ADMIN";
                if (session.lang === "en") {
                    return await reply("Please wait for an admin to connect. Our team will be with you shortly.");
                } else {
                    return await reply("කරුණාකර ඇඩ්මින්වරයෙකු සම්බන්ධ වන තෙක් රැඳී සිටින්න. අපගේ කණ්ඩායම ළඟදීම ඔබ හා සම්බන්ධ වනු ඇත.");
                }
            }
        }

        if (session.step === "WAITING_ADMIN") return; // ඇඩ්මින් එනකන් බොට් මැසේජ් process කරන්නේ නැත.

        // ==========================================
        // 🎮 STEP 3: GAME SELECTION
        // ==========================================
        if (session.step === "CHOOSE_GAME") {
            if (text === "2" || text === "3" || /^(blood|pubg)/i.test(text)) {
                if (session.lang === "en") {
                    return await reply("We have currently not available this service. Please choose another option.");
                } else {
                    return await reply("අප සතුව දැනට මෙම සේවාව ලබා ගැනීමට නොහැක. කරුණාකර වෙනත් විකල්පයක් තෝරන්න.");
                }
            } else if (text === "1" || /^(free fire|ff)/i.test(text)) {
                session.step = "CHOOSE_CATEGORY";
                let catMsg = "";
                if (session.lang === "en") {
                    catMsg = `*Please select a category from the menu below:* \n\n1️⃣ Diamond Packs 💎\n2️⃣ Memberships & Subscriptions 💳\n3️⃣ Level Up Pass 🎮\n4️⃣ Evo Access (E badge) 🎯`;
                } else {
                    catMsg = `*කරුණාකර පහත මෙනුවෙන් ප්‍රවර්ගයක් තෝරන්න:* \n\n1️⃣ Diamond Packs 💎\n2️⃣ Memberships & Subscriptions 💳\n3️⃣ Level Up Pass 🎮\n4️⃣ Evo Access (E badge) 🎯`;
                }
                return await reply(catMsg);
            }
        }

        // ==========================================
        // 🗂️ STEP 4: CATEGORY & PRICE LIST SELECTION
        // ==========================================
        if (session.step === "CHOOSE_CATEGORY") {
            if (text === "1") {
                session.category = "DIAMONDS";
                session.step = "SELECT_PRODUCT";
                const menu = `🔹 *Regular Top-Up Packs*\n1. 25💎 - LKR 70/=\n2. 50💎 - LKR 140/=\n3. 100💎 - LKR 265/=\n4. 200💎 - LKR 525/=\n5. 310💎 - LKR 800/=\n6. 520💎 - LKR 1,330/=\n7. 1060💎 - LKR 2,620/=\n8. 1580💎 - LKR 3,950/=\n9. 2180💎 - LKR 5,290/=\n\n🔹 *Super Packs*\n10. 2000💎 - LKR 4,300/=\n11. 3000💎 - LKR 6,450/=\n12. 4000💎 - LKR 8,600/=\n13. 5000💎 - LKR 10,750/=\n14. 6000💎 - LKR 12,900/=\n15. 7000💎 - LKR 15,050/=\n16. 8000💎 - LKR 17,200/=\n17. 9000💎 - LKR 19,350/=\n18. 10000💎 - LKR 21,500/=\n\n*⛔ මෙහි සඳහන් ඇතැම් මිල ගණන් වෙනස් වීමට හැකි බව කරුණාවෙන් සලකන්න.*\n\n_Reply with number (1-18) to select:_`;
                return await reply(menu);
            } 
            else if (text === "2") {
                session.category = "MEMBERSHIP";
                session.step = "SELECT_PRODUCT";
                const menu = `🔵 *Memberships & Subscriptions* \n1. Weekly Lite - LKR 110/=\n2. Weekly Membership - LKR 470/=\n3. Monthly Membership - LKR 2,250/=\n4. VIP Membership - LKR 2,700/=\n5. Super VIP - LKR 4,410/=\n\n_Reply with number (1-5) to select:_`;
                return await reply(menu);
            } 
            else if (text === "3") {
                session.category = "LEVELUP";
                session.step = "SELECT_PRODUCT";
                const menu = `⭕ *(Indonesian & Singapore Servers Recommend)*\n\n1. Level 6 – LKR 110 / ඩයමන්ඩ් 120\n2. Level 10 – LKR 220 / ඩයමන්ඩ් 215\n3. Level 15 – LKR 220 / ඩයමන්ඩ් 215\n4. Level 20 – LKR 220 / ඩයමන්ඩ් 215\n5. Level 25 – LKR 220 / ඩයමන්ඩ් 215\n6. Level 30 – LKR 360 / ඩයමන්ඩ් 375\n7. 🆙 Level All – LKR 1350 / ඩයමන්ඩ් 1355\n\n_Reply with number (1-7) to select:_`;
                return await reply(menu);
            } 
            else if (text === "4") {
                session.category = "EVO";
                session.step = "SELECT_PRODUCT";
                const menu = `🔹 *EVO Access*\n\n1. 📅 3 Days - LKR 210/=\n2. 📅 7 Days - LKR 270/=\n3. 📅 30 Days - LKR 790/=\n\n_Reply with number (1-3) to select:_`;
                return await reply(menu);
            }
        }

        // ==========================================
        // 🛒 STEP 5: PRODUCT SELECTION & PRICING
        // ==========================================
        if (session.step === "SELECT_PRODUCT") {
            const num = parseInt(text);
            if (isNaN(num)) return await reply(session.lang === "en" ? "❌ Invalid selection. Please enter a valid number." : "❌ අවලංගු තේරීමක්. කරුණාකර නිවැරදි අංකයක් ඇතුලත් කරන්න.");

            // 💎 DIAMOND PRICING MAPPING
            if (session.category === "DIAMONDS") {
                const diaPacks = [
                    { name: "25 Diamonds", price: 70 }, { name: "50 Diamonds", price: 140 }, { name: "100 Diamonds", price: 265 },
                    { name: "200 Diamonds", price: 525 }, { name: "310 Diamonds", price: 800 }, { name: "520 Diamonds", price: 1330 },
                    { name: "1060 Diamonds", price: 2620 }, { name: "1580 Diamonds", price: 3950 }, { name: "2180 Diamonds", price: 5290 },
                    { name: "2000 Diamonds", price: 4300 }, { name: "3000 Diamonds", price: 6450 }, { name: "4000 Diamonds", price: 8600 },
                    { name: "5000 Diamonds", price: 10750 }, { name: "6000 Diamonds", price: 12900 }, { name: "7000 Diamonds", price: 15050 },
                    { name: "8000 Diamonds", price: 17200 }, { name: "9000 Diamonds", price: 19350 }, { name: "10000 Diamonds", price: 21500 }
                ];
                if (num < 1 || num > 18) return reply("❌ Choose between 1-18");
                session.product = diaPacks[num - 1].name;
                session.price = diaPacks[num - 1].price;
            } 
            // 💳 MEMBERSHIP MAPPING
            else if (session.category === "MEMBERSHIP") {
                const memPacks = [
                    { name: "Weekly Lite Membership", price: 110, shells: 17 },
                    { name: "Weekly Membership", price: 470, shells: 86 },
                    { name: "Monthly Membership", price: 2250, shells: 430 },
                    { name: "VIP Membership", price: 2700, shells: 516 }, // 1 weekly + 1 monthly = 86+430
                    { name: "Super VIP Membership", price: 4410, shells: 774 } // 4 weekly + 1 monthly = (86*4)+430
                ];
                if (num < 1 || num > 5) return reply("❌ Choose between 1-5");
                session.product = memPacks[num - 1].name;
                session.price = memPacks[num - 1].price;
                session.shells = memPacks[num - 1].shells;
            } 
            // 🎮 LEVEL UP PASS MAPPING
            else if (session.category === "LEVELUP") {
                const lvlPacks = [
                    { name: "Level Up Pass (Level 6)", price: 110 }, { name: "Level Up Pass (Level 10)", price: 220 },
                    { name: "Level Up Pass (Level 15)", price: 220 }, { name: "Level Up Pass (Level 20)", price: 220 },
                    { name: "Level Up Pass (Level 25)", price: 220 }, { name: "Level Up Pass (Level 30)", price: 360 },
                    { name: "Level Up Pass (Level All)", price: 1350 }
                ];
                if (num < 1 || num > 7) return reply("❌ Choose between 1-7");
                session.product = lvlPacks[num - 1].name;
                session.price = lvlPacks[num - 1].price;
            } 
            // 🎯 EVO ACCESS MAPPING
            else if (session.category === "EVO") {
                const evoPacks = [
                    { name: "EVO Access (3 Days)", price: 210 },
                    { name: "EVO Access (7 Days)", price: 270 },
                    { name: "EVO Access (30 Days)", price: 790 }
                ];
                if (num < 1 || num > 3) return reply("❌ Choose between 1-3");
                session.product = evoPacks[num - 1].name;
                session.price = evoPacks[num - 1].price;
            }

            // Move to UID confirmation
            session.step = "GET_UID";
            if (session.lang === "en") {
                return await reply(`🎯 Selected Product: *${session.product}* (LKR ${session.price}/=)\n\n👉 Now, please send your Free Fire Player *UID* to continue the topup. (Numbers only)`);
            } else {
                return await reply(`🎯 ඔබ තෝරාගත් පැකේජය: *${session.product}* (LKR ${session.price}/=)\n\n👉 ටොප්අප් එක ඉදිරියට කරගෙන යාම සඳහා කරුණාකර ඔබගේ Free Fire Player *UID* එක එවන්න. (ඉලක්කම් පමණි)`);
            }
        }

        // ==========================================
        // 🆔 STEP 6: UID NUMBERS ONLY VALIDATION
        // ==========================================
        if (session.step === "GET_UID") {
            const isPureNumber = /^\d+$/.test(text); // Check if string contains only numbers

            if (!isPureNumber) {
                if (session.lang === "en") {
                    return await reply("❌ Error: Invalid UID! Please send your UID containing *numbers only*.");
                } else {
                    return await reply("❌ වැරදි UID එකක්! කරුණාකර *ඉලක්කම් පමණක්* ඇතුලත් ඔබගේ නිවැරදි UID එක එවන්න.");
                }
            }

            session.uid = text; // Save UID
            session.step = "SELECT_PAYMENT";

            let payMsg = "";
            if (session.lang === "en") {
                payMsg = `🎯 UID Saved: *${session.uid}*\n\n💳 Please select your payment method:\n\n1. Ez cash 📲\n2. Bank Transfer 🏦`;
            } else {
                payMsg = `🎯 UID එක සුරැකුණි: *${session.uid}*\n\n💳 කරුණාකර ඔබ මුදල් ගෙවන ක්‍රමය තෝරන්න:\n\n1. Ez cash 📲\n2. Bank Transfer 🏦`;
            }
            return await reply(payMsg);
        }

        // ==========================================
        // 💳 STEP 7: PAYMENT METHOD SELECTION
        // ==========================================
        if (session.step === "SELECT_PAYMENT") {
            if (text === "2" || /bank/i.test(text)) {
                // Bank Transfer Not Available
                if (session.lang === "en") {
                    return await reply("We have currently not available this payment method. Please choose Ez cash.");
                } else {
                    return await reply("අප සතුව දැනට මෙම ගෙවීම් ක්‍රමය ලබා ගැනීමට නොහැක. කරුණාකර Ez cash තෝරන්න.");
                }
            } else if (text === "1" || /ez/i.test(text)) {
                session.payment = "EZ_CASH";
                session.step = "AWAITING_SLIP";

                const totalBill = session.price + 20; // 20/= Tax added

                const billMsg = `*‼️EZ CASH වලින් සල්ලි එවන හැමෝම අනිවාර්යයෙන් කියවන්න ‼️*\n\n` +
                                `🔘 *Ez Cash එකෙන් Service Fee එකක් විදියට ඔයාල මුදල් එවන එක් වතාකට අපෙන් දැන් 20/=ක මුදලක් කපා ගන්නවා 😣*\n\n` +
                                `👉 *Ez Cash No : 0760127262*\n\n` +
                                `*‼️ අපට Ez Cash වලින් Top Up කර ගන්න අය අපට ගෙවන මුලු එකතුවට අනිවාර්යයෙන් 20ක් වැඩිපුර දැමීමට අවශ්‍යයි ‼️*\n` +
                                `*‼️ මෙය Ez Cash හරහා මුදල් ගෙවන අයට පමනක් වලංගු වේ..‼️*\n\n` +
                                `*‼️ We require those who top up with Ez Cash to add 20 more to the total amount they pay us‼️*\n` +
                                `*‼️ This is only valid for those who pay via Ez Cash..‼️*\n\n` +
                                `--------------------------------\n` +
                                `🛒 Product Price: LKR ${session.price}/=\n` +
                                `➕ Ez Cash Tax Fee: LKR 20/=\n` +
                                `💰 *Your Total Balance is :- LKR ${totalBill}/=* \n` +
                                `--------------------------------\n\n` +
                                (session.lang === "en" ? 
                                "📸 Please send a clear Screenshot or Photo of your Transaction Slip after the payment." : 
                                "📸 මුදල් ගෙවීමෙන් පසු කරුණාකර ගෙවූ රිසිට්පතෙහි (Slip/Screenshot) පැහැදිලි ඡායාරූපයක් එවන්න.");

                return await reply(billMsg);
            }
        }

        // ==========================================
        // 📸 STEP 8: RECEIPT SLIP PROCESSING
        // ==========================================
        if (session.step === "AWAITING_SLIP") {
            // User කෙනෙක් Image, Document (PDF) එකක් එවනකන් බලනවා
            const isMedia = m.mtype === "imageMessage" || m.mtype === "documentMessage";

            if (isMedia) {
                // Shell Calculation & Time Logic (බොස්ලාට විතරක් පෙනෙන, යූසර්ට නොපෙනෙන Processing Template එක)
                const shellCount = session.shells ? session.shells : "-";
                const totalShell = session.shells ? session.shells : "-";
                
                // ඇණවුමේ ප්‍රමාණය අනුව වෙලාව තීරණය කිරීම (පැකේජයේ මිල අනුව)
                let estTime = "1-2 min";
                if (session.price >= 2000) {
                    estTime = "4-5 min";
                }

                const processingTemplate = `⏳ Processing your top-up request...\n\n` +
                                           `Player: ${session.uid}\n` +
                                           `Product: ${session.product}\n` +
                                           `Quantity: 1\n` +
                                           `Price/Unit: ${shellCount} SHELLS\n` +
                                           `Total: ${totalShell} SHELLS\n` +
                                           `Estimated Time: ~${estTime}`;

                // මුලින්ම යූසර්ට ස්තූති කර මැසේජ් එක දෙනවා
                if (session.lang === "en") {
                    await reply("Please wait for complete your topup and Thanks for trusted our service. If we check your payment and completed your topup we will kindly inform you with a message.");
                } else {
                    await reply("ඔබගේ ටොප්අප් එක සම්පූර්ණ වන තෙක් කරුණාකර රැඳී සිටින්න. අපගේ සේවාව විශ්වාස කිරීම ගැන ඔබට ස්තූතියි. අප ඔබගේ ගෙවීම පරීක්ෂා කර ටොප්අප් එක නිම කල පසු කරුණාකර පණිවිඩයකින් දැනුම් දෙනු ලැබේ.");
                }

                // 🎯 ක්ෂණිකව බොස්ගේ (Nethmina OFC) ඉන්බොක්ස් එකට Order එක සහ Slip එක Forward/Send කිරීම
                const ownerInbox = "94760860835@s.whatsapp.net";
                
                // Slip එක අයිතිකාරයාට යැවීම
                await bot.sendMessage(ownerInbox, { 
                    forward: mek, 
                    caption: `🔔 *NEW TOPUP ORDER RECEIVED!* 🔔\n\n${processingTemplate}\n\n👤 From: @${sender.split('@')[0]}`,
                    mentions: [sender]
                });

                // වැඩේ ඉවර නිසා Session එක Reset කරනවා
                delete global.topupSessions[sender];
                return;
            } else {
                // Slip එකක් වෙනුවට ටෙක්ස්ට් එකක් එවුවොත් මතක් කිරීම
                if (session.lang === "en") {
                    return await reply("❌ Please send the Transaction Slip (Image/Screenshot) to complete your order.");
                } else {
                    return await reply("❌ කරුණාකර ඔබගේ ඇණවුම තහවුරු කිරීමට ගෙවීම් රිසිට්පතෙහි ඡායාරූපයක් (Slip/Screenshot) එවන්න.");
                }
            }
        }
    }
);
