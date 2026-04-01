const { cmd } = require("../command");
const fetch = require("node-fetch");

// Store game sessions per user
const pendingGame = {};

// ──────────────── Rock Paper Scissors ────────────────
cmd(
  {
    pattern: "rps",
    react: "✊",
    desc: "Play Rock Paper Scissors",
    category: "fun",
    filename: __filename,
  },
  async (nethmina, mek, m, { from, sender }) => {
    pendingGame[sender] = { type: "rps" };
    await nethmina.sendMessage(
      from,
      { text: `✊ *Rock Paper Scissors*\n\nReply with one:\n- rock\n- paper\n- scissors` },
      { quoted: mek }
    );
  }
);

// ──────────────── Math Quiz ────────────────
cmd(
  {
    pattern: "quiz",
    react: "🧮",
    desc: "Answer a random math quiz",
    category: "fun",
    filename: __filename,
  },
  async (nethmina, mek, m, { from, sender }) => {
    const num1 = Math.floor(Math.random() * 20) + 1;
    const num2 = Math.floor(Math.random() * 20) + 1;
    const answer = num1 + num2;

    pendingGame[sender] = { type: "quiz", answer };

    await nethmina.sendMessage(
      from,
      { text: `🧮 *Math Quiz*\n\nWhat is: ${num1} + ${num2} ?\nReply with your answer.` },
      { quoted: mek }
    );
  }
);

// ──────────────── Hangman ────────────────
const words = ["apple", "banana", "dragon", "whatsapp", "nethmina", "coding", "plugin"];

cmd(
  {
    pattern: "hangman",
    react: "🎯",
    desc: "Guess the hidden word",
    category: "fun",
    filename: __filename,
  },
  async (nethmina, mek, m, { from, sender }) => {
    const word = words[Math.floor(Math.random() * words.length)];
    const hidden = word.replace(/./g, "_ ");
    pendingGame[sender] = { type: "hangman", word, progress: Array(word.length).fill("_"), attempts: 6 };

    await nethmina.sendMessage(
      from,
      { text: `🎯 *Hangman Game Started!*\nWord: ${hidden}\n\nYou have 6 attempts.\nReply with one letter.` },
      { quoted: mek }
    );
  }
);

// ──────────────── Trivia ────────────────
cmd(
  {
    pattern: "trivia",
    react: "📚",
    desc: "Answer a random trivia question",
    category: "fun",
    filename: __filename,
  },
  async (nethmina, mek, m, { from, sender, reply }) => {
    try {
      const res = await fetch("https://opentdb.com/api.php?amount=1&type=multiple");
      const data = await res.json();
      const q = data.results[0];
      const options = [...q.incorrect_answers, q.correct_answer].sort(() => Math.random() - 0.5);

      pendingGame[sender] = { type: "trivia", answer: q.correct_answer };

      let text = `📚 *Trivia Time!*\n\n${q.question}\n\n`;
      options.forEach((o, i) => (text += `${i + 1}. ${o}\n`));
      text += `\nReply with the correct option or answer.`;

      await nethmina.sendMessage(from, { text }, { quoted: mek });
    } catch {
      reply("❌ Trivia API error.");
    }
  }
);

// ──────────────── Fast Typing ────────────────
cmd(
  {
    pattern: "fast",
    react: "⌨️",
    desc: "Typing speed challenge",
    category: "fun",
    filename: __filename,
  },
  async (nethmina, mek, m, { from, sender }) => {
    const words = ["whatsapp", "nethmina", "coding", "banana", "developer", "friendship"];
    const word = words[Math.floor(Math.random() * words.length)];

    pendingGame[sender] = { type: "fast", word, start: Date.now() };

    await nethmina.sendMessage(
      from,
      { text: `⌨️ *Fast Typing Challenge!*\n\nType this word within 15s:\n👉 ${word}` },
      { quoted: mek }
    );
  }
);

// ──────────────── Who Am I ────────────────
const whoamiList = [
  { clue: "I am the founder of Microsoft.", answer: "bill gates" },
  { clue: "I am Iron Man in the Marvel movies.", answer: "tony stark" },
  { clue: "I am the founder of Facebook.", answer: "mark zuckerberg" },
  { clue: "I am the king of the jungle.", answer: "lion" },
];

cmd(
  {
    pattern: "whoami",
    react: "🕵️",
    desc: "Guess the person/character",
    category: "fun",
    filename: __filename,
  },
  async (nethmina, mek, m, { from, sender }) => {
    const item = whoamiList[Math.floor(Math.random() * whoamiList.length)];
    pendingGame[sender] = { type: "whoami", answer: item.answer };

    await nethmina.sendMessage(
      from,
      { text: `🕵️ *Who Am I?*\n\nClue: ${item.clue}\nReply with your guess.` },
      { quoted: mek }
    );
  }
);

// ──────────────── Emoji Quiz ────────────────
const emojiQuiz = [
  { clue: "🎬🧙‍♂️💍", answer: "lord of the rings" },
  { clue: "👸❄️⛄", answer: "frozen" },
  { clue: "🦁👑", answer: "lion king" },
  { clue: "🚗💨🏎️", answer: "fast and furious" },
];

cmd(
  {
    pattern: "emojiquiz",
    react: "🤔",
    desc: "Guess movie/song from emojis",
    category: "fun",
    filename: __filename,
  },
  async (nethmina, mek, m, { from, sender }) => {
    const item = emojiQuiz[Math.floor(Math.random() * emojiQuiz.length)];
    pendingGame[sender] = { type: "emojiquiz", answer: item.answer };

    await nethmina.sendMessage(
      from,
      { text: `🤔 *Emoji Quiz*\n\nClue: ${item.clue}\nReply with your guess.` },
      { quoted: mek }
    );
  }
);

// ──────────────── Tic Tac Toe ────────────────
const renderBoard = (board) =>
  board.map((row) => row.map((c) => (c ? c : "⬜")).join(" ")).join("\n");

cmd(
  {
    pattern: "ttt",
    react: "❌",
    desc: "Play Tic Tac Toe with nethmina",
    category: "fun",
    filename: __filename,
  },
  async (nethmina, mek, m, { from, sender }) => {
    const board = [
      ["", "", ""],
      ["", "", ""],
      ["", "", ""],
    ];
    pendingGame[sender] = { type: "ttt", board };

    await nethmina.sendMessage(
      from,
      { text: `❌⭕ *Tic Tac Toe*\n\nYou are X. Reply with row,col (1-3).\n\n${renderBoard(board)}` },
      { quoted: mek }
    );
  }
);

// ──────────────── Reply Handler ────────────────
cmd(
  {
    on: "text",
  },
  async (nethmina, mek, m, { from, sender, body, reply }) => {
    if (!pendingGame[sender]) return;
    const game = pendingGame[sender];
    const input = body.trim().toLowerCase();

    // RPS
    if (game.type === "rps") {
      const choices = ["rock", "paper", "scissors"];
      if (!choices.includes(input)) return;
      const nethminaChoice = choices[Math.floor(Math.random() * choices.length)];

      let result = "🤝 It's a draw!";
      if (
        (input === "rock" && nethminaChoice === "scissors") ||
        (input === "paper" && nethminaChoice === "rock") ||
        (input === "scissors" && nethminaChoice === "paper")
      ) {
        result = "🎉 You win!";
      } else if (input !== nethminaChoice) {
        result = "😢 You lose!";
      }

      await nethmina.sendMessage(from, { text: `✊ You: ${input}\n🤖 nethmina: ${nethminaChoice}\n\n${result}` }, { quoted: mek });
      delete pendingGame[sender];
    }

    // Math Quiz
    else if (game.type === "quiz") {
      const guess = parseInt(input);
      if (isNaN(guess)) return reply("❌ Please reply with a number.");
      if (guess === game.answer) {
        await nethmina.sendMessage(from, { text: `🎉 Correct! The answer was ${game.answer}` }, { quoted: mek });
      } else {
        await nethmina.sendMessage(from, { text: `😢 Wrong! The correct answer was ${game.answer}` }, { quoted: mek });
      }
      delete pendingGame[sender];
    }

    // Hangman
    else if (game.type === "hangman") {
      if (!/^[a-z]$/.test(input)) return reply("❌ Reply with a single letter.");
      let found = false;

      game.word.split("").forEach((ch, i) => {
        if (ch === input && game.progress[i] === "_") {
          game.progress[i] = ch;
          found = true;
        }
      });

      if (!found) game.attempts--;

      if (!game.progress.includes("_")) {
        await nethmina.sendMessage(from, { text: `🎉 You guessed it! Word: ${game.word}` }, { quoted: mek });
        delete pendingGame[sender];
      } else if (game.attempts <= 0) {
        await nethmina.sendMessage(from, { text: `💀 Game over! The word was: ${game.word}` }, { quoted: mek });
        delete pendingGame[sender];
      } else {
        await nethmina.sendMessage(
          from,
          { text: `🎯 Word: ${game.progress.join(" ")}\n❤️ Attempts left: ${game.attempts}` },
          { quoted: mek }
        );
      }
    }

    // Trivia
    else if (game.type === "trivia") {
      if (input.includes(game.answer.toLowerCase())) {
        await nethmina.sendMessage(from, { text: `✅ Correct! Answer: ${game.answer}` }, { quoted: mek });
      } else {
        await nethmina.sendMessage(from, { text: `❌ Wrong! Correct answer: ${game.answer}` }, { quoted: mek });
      }
      delete pendingGame[sender];
    }

    // Fast Typing
    else if (game.type === "fast") {
      const now = Date.now();
      const diff = (now - game.start) / 1000;
      if (input === game.word) {
        if (diff <= 15) {
          await nethmina.sendMessage(from, { text: `⚡ Fast! You typed correctly in ${diff.toFixed(1)}s` }, { quoted: mek });
        } else {
          await nethmina.sendMessage(from, { text: `⏱️ Too late! You took ${diff.toFixed(1)}s` }, { quoted: mek });
        }
      } else {
        await nethmina.sendMessage(from, { text: `❌ Wrong word. The correct word was: ${game.word}` }, { quoted: mek });
      }
      delete pendingGame[sender];
    }

    // Who Am I
    else if (game.type === "whoami") {
      if (input.includes(game.answer)) {
        await nethmina.sendMessage(from, { text: `🎉 Correct! I am ${game.answer}` }, { quoted: mek });
      } else {
        await nethmina.sendMessage(from, { text: `❌ Wrong! The answer was: ${game.answer}` }, { quoted: mek });
      }
      delete pendingGame[sender];
    }

    // Emoji Quiz
    else if (game.type === "emojiquiz") {
      if (input.includes(game.answer)) {
        await nethmina.sendMessage(from, { text: `🎬 Correct! It was *${game.answer}*` }, { quoted: mek });
      } else {
        await nethmina.sendMessage(from, { text: `❌ Wrong! Correct answer: *${game.answer}*` }, { quoted: mek });
      }
      delete pendingGame[sender];
    }

    // Tic Tac Toe
    else if (game.type === "ttt") {
      const [r, c] = input.split(",").map((n) => parseInt(n) - 1);
      if (isNaN(r) || isNaN(c) || r < 0 || r > 2 || c < 0 || c > 2) return reply("❌ Invalid move. Use row,col (1-3).");
      if (game.board[r][c]) return reply("❌ Spot already taken.");

      game.board[r][c] = "X";

      // nethmina move
      const empty = [];
      game.board.forEach((row, i) =>
        row.forEach((cell, j) => {
          if (!cell) empty.push([i, j]);
        })
      );
      if (empty.length > 0) {
        const [br, bc] = empty[Math.floor(Math.random() * empty.length)];
        game.board[br][bc] = "O";
      }

      await nethmina.sendMessage(from, { text: `❌⭕ *Tic Tac Toe*\n\n${renderBoard(game.board)}` }, { quoted: mek });
    }
  }
);
