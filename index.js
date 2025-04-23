const TelegramBot = require('node-telegram-bot-api');
const { default: translate } = require('google-translate-open-api');
require('dotenv').config();

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Главное меню
const mainMenu = {
  reply_markup: {
    keyboard: [
      ['🎯 Викторина', '🌐 Переводчик'],
      ['🗣 Практика разговора', '📘 Словарь'],
      ['🖼 Перевод по картинке']
    ],
    resize_keyboard: true
  }
};

// Приветствие
bot.onText(/\/start/, (msg) => {
  const name = msg.from.first_name || "друг";
  bot.sendMessage(msg.chat.id, `👋 Привет, ${name}!\nЯ бот для изучения английского языка. Выбери, с чего начнём:`, mainMenu);
});

// 🌐 Переводчик
bot.onText(/🌐 Переводчик/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Введите слово или фразу для перевода:');
  bot.once('message', async (answer) => {
    if (answer.chat.id !== chatId) return;
    const text = answer.text;
    const lang = /^[a-zA-Z]/.test(text) ? 'ru' : 'en';

    try {
      const result = await translate(text, {
        tld: "com",
        to: lang
      });
      const translated = result.data[0];
      bot.sendMessage(chatId, `Перевод: ${translated}`);
    } catch (err) {
      console.error(err);
      bot.sendMessage(chatId, '❌ Ошибка перевода. Попробуйте позже.');
    }
  });
});

// 🗣 Разговорная практика
bot.onText(/🗣 Практика разговора/, (msg) => {
  const id = msg.chat.id;
  bot.sendMessage(id, "🗣 Let's talk!\nHello! How are you today?");
  const prompts = [
    "What's your name?", "Where are you from?",
    "Do you like learning English?", "What's your hobby?"
  ];
  let step = 0;
  const listener = (msg) => {
    if (msg.chat.id === id && step < prompts.length) {
      bot.sendMessage(id, prompts[step++]);
    } else {
      bot.sendMessage(id, "That was fun! 😎", mainMenu);
      bot.removeListener('message', listener);
    }
  };
  bot.on('message', listener);
});

// 📘 Словарь
const vocabulary = {
  A1: ["book – книга", "apple – яблоко", "dog – собака"],
  A2: ["travel – путешествовать", "because – потому что"],
  slang: ["lit – круто", "no cap – честно", "sus – подозрительно"]
};

bot.onText(/📘 Словарь/, (msg) => {
  bot.sendMessage(msg.chat.id, "Выбери категорию:", {
    reply_markup: {
      keyboard: [['A1', 'A2'], ['Сленг'], ['🔙 Назад']],
      resize_keyboard: true
    }
  });
});

bot.on('message', (msg) => {
  const id = msg.chat.id;
  const text = msg.text;

  if (text === 'A1') bot.sendMessage(id, vocabulary.A1.join('\n'));
  else if (text === 'A2') bot.sendMessage(id, vocabulary.A2.join('\n'));
  else if (text === 'Сленг') bot.sendMessage(id, vocabulary.slang.join('\n'));
  else if (text === '🔙 Назад') bot.sendMessage(id, '↩️ Главное меню:', mainMenu);
});

// 🖼 Картинки
const imageQuiz = [
  { url: "https://upload.wikimedia.org/wikipedia/commons/1/15/Red_Apple.jpg", answer: "apple" },
  { url: "https://upload.wikimedia.org/wikipedia/commons/3/3a/Cat03.jpg", answer: "cat" }
];
bot.onText(/🖼 Перевод по картинке/, (msg) => {
  const id = msg.chat.id;
  const quiz = imageQuiz[Math.floor(Math.random() * imageQuiz.length)];
  bot.sendPhoto(id, quiz.url, { caption: "Что это на английском?" });
  bot.once('message', (msg) => {
    const answer = msg.text.toLowerCase();
    if (answer === quiz.answer) {
      bot.sendMessage(id, "✅ Верно!");
    } else {
      bot.sendMessage(id, `❌ Неправильно. Это было: ${quiz.answer}`);
    }
  });
});

// 🎯 Викторина с 3 уровнями
const quiz = {
  easy: [
    { q: "Переведи: «кошка»", a: "cat" },
    { q: "Переведи: «яблоко»", a: "apple" }
  ],
  medium: [
    { q: "Прошедшее от «go»", a: "went" },
    { q: "Синоним к «important»", a: "significant" }
  ],
  hard: [
    { q: "Переведи: «предприниматель»", a: "entrepreneur" },
    { q: "Переведи: «ответственность»", a: "responsibility" }
  ]
};

bot.onText(/🎯 Викторина/, (msg) => {
  bot.sendMessage(msg.chat.id, "Выбери уровень:", {
    reply_markup: {
      keyboard: [['Easy', 'Medium', 'Hard'], ['🔙 Назад']],
      resize_keyboard: true
    }
  });
});

['Easy', 'Medium', 'Hard'].forEach(level => {
  bot.onText(new RegExp(level), (msg) => {
    const id = msg.chat.id;
    const list = quiz[level.toLowerCase()];
    let score = 0, index = 0;

    const ask = () => {
      if (index < list.length) {
        bot.sendMessage(id, list[index].q);
      } else {
        bot.sendMessage(id, `🎯 Готово! Ты набрал ${score}/${list.length}`, mainMenu);
      }
    };

    const listener = (msg) => {
      if (msg.chat.id !== id) return;
      const answer = msg.text.toLowerCase();
      if (answer === list[index].a.toLowerCase()) {
        bot.sendMessage(id, "✅ Правильно!");
        score++;
      } else {
        bot.sendMessage(id, `❌ Неправильно. Ответ: ${list[index].a}`);
      }
      index++;
      if (index < list.length) {
        ask();
        bot.once('message', listener);
      } else {
        bot.sendMessage(id, `🎯 Результат: ${score}/${list.length}`, mainMenu);
      }
    };

    ask();
    bot.once('message', listener);
  });
});
