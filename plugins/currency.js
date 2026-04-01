const axios = require("axios");
const { cmd } = require("../command");

function formatNumber(num) {
  return new Intl.NumberFormat().format(num.toFixed(2));
}

function getFlagEmoji(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

const currencyToCountry = {
  USD: "US",
  LKR: "LK",
  EUR: "EU",
  GBP: "GB",
  JPY: "JP",
  INR: "IN",
  AUD: "AU",
  CAD: "CA",
  SGD: "SG",
  CNY: "CN",

};

cmd(
  {
    pattern: "convert",
    alias: ["currency", "cur"],
    react: "💱",
    desc: "Convert one currency to another or get current rate",
    category: "tools",
    filename: __filename,
  },
  async (danuwa, mek, m, { args, reply }) => {
    try {
      if (!args.length || args[0] === "help") {
        return reply(
          `🧾 *Currency Converter Help*\n\n` +
            `🪙 *Usage:* .convert <amount> <from> <to>\n📌 Example: .convert 100 USD LKR\n\n` +
            `📉 *Current Rate:* .convert USD LKR\n\n💡 Supported: USD, EUR, LKR, INR, JPY, GBP, etc.`
        );
      }

      let amount = 1;
      let from, to;

      if (args.length === 2) {
        [from, to] = args;
      } else if (args.length === 3) {
        [amount, from, to] = args;
        amount = parseFloat(amount);
        if (isNaN(amount)) return reply("❌ *Invalid amount!* Must be a number.");
      } else {
        return reply("❌ *Invalid command!*\nType `.convert help` for usage.");
      }

      from = from.toUpperCase();
      to = to.toUpperCase();

      const res = await axios.get(`https://open.er-api.com/v6/latest/${from}`);
      const { rates, time_last_update_utc } = res.data;

      if (!rates[to]) return reply("❌ *Invalid target currency code!*");

      const converted = amount * rates[to];

      const fromFlag = currencyToCountry[from] ? getFlagEmoji(currencyToCountry[from]) : "";
      const toFlag = currencyToCountry[to] ? getFlagEmoji(currencyToCountry[to]) : "";

      reply(
        `💱 *Currency Conversion*\n\n` +
          `🔢 Amount: ${formatNumber(amount)} ${fromFlag} *${from}*\n` +
          `📤 Converted: ${formatNumber(converted)} ${toFlag} *${to}*\n\n` +
          `🕰️ Rate as of: ${time_last_update_utc}`
      );
    } catch (err) {
      console.error(err);
      reply("❌ *Error fetching rates. Please check your internet or currency codes.*");
    }
  }
);
