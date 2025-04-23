const TelegramBot = require('node-telegram-bot-api');
const { default: translate } = require('google-translate-open-api');
require('dotenv').config();

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// ——— Кнопки меню ———
bot.onText(/\/start/, (msg) => {
  const id = msg.chat.id;
  bot.sendMessage(id, 'Привет! Выбери, что хочешь делать 👇', {
    reply_markup: {
      keyboard: [
        ['🎯 Викторина', '🌐 Переводчик'],
        ['🗣 Практика разговора', '📘 Словарь'],
        ['🖼 Перевод по картинке']
      ],
      resize_keyboard: true
    }
  });
});

// ——— Переводчик ———
bot.onText(/🌐 Переводчик/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Введите фразу для перевода:');
  bot.once('message', async (msg) => {
    const text = msg.text;
    const lang = detectLanguage(text);
    try {
      const result = await translate(text, { to: lang });
      bot.sendMessage(chatId, `Перевод: ${result.data[0]}`);
    } catch (err) {
      console.error(err);
      bot.sendMessage(chatId, '❌ Ошибка перевода. Попробуйте позже.');
    }
  });
});


// ——— Практика разговора ———
bot.onText(/🗣 Практика разговора/, (msg) => {
  const id = msg.chat.id;
  bot.sendMessage(id, "🗣 Давай поговорим!\n\nHello! How are you today?");
  const prompts = [
    "What's your name?",
    "Where are you from?",
    "What do you like to do in your free time?",
    "Do you like learning English?",
    "What's your favorite food?"
  ];
  let step = 0;
  const listener = (msg) => {
    if (msg.chat.id === id && step < prompts.length) {
      bot.sendMessage(id, prompts[step]);
      step++;
    } else {
      bot.removeListener('message', listener);
      bot.sendMessage(id, "Great! That was fun 😊");
    }
  };
  bot.on('message', listener);
});

// ——— Словарь ———
const vocabulary = {
  A1: ["book – книга", "apple – яблоко", "dog – собака", "go – идти", "house – дом"],
  A2: ["travel – путешествовать", "yesterday – вчера", "often – часто", "because – потому что", "important – важный"],
  slang: [
    "cool – круто", "bro – братан", "YOLO – живём один раз", "lit – офигенно",
    "ghost – игнорировать", "no cap – честно", "sus – подозрительный", "salty – обиженный",
    "flex – хвастаться", "lowkey – по-тихому", "highkey – явно", "vibe – атмосфера",
    "cringe – неловко", "savage – дерзко", "slay – блистать", "ship – шипперить"
  ]
};
bot.onText(/📘 Словарь/, (msg) => {
  bot.sendMessage(msg.chat.id, "Выбери раздел словаря:", {
    reply_markup: {
      keyboard: [['A1', 'A2'], ['Сленг'], ['🔙 Назад']],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  });
});
bot.on('message', (msg) => {
  const text = msg.text;
  const id = msg.chat.id;
  if (text === 'A1') {
    bot.sendMessage(id, `📗 A1:\n${vocabulary.A1.join('\n')}`);
  } else if (text === 'A2') {
    bot.sendMessage(id, `📘 A2:\n${vocabulary.A2.join('\n')}`);
  } else if (text === 'Сленг') {
    bot.sendMessage(id, `📙 Сленг:\n${vocabulary.slang.join('\n')}`);
  } else if (text === '🔙 Назад') {
    bot.sendMessage(id, 'Возврат в меню. Напиши /start');
  }
});

// ——— Картинки ———
const imageQuiz = [
  { url: "https://i.imgur.com/1Q9Z1ZB.jpg", answer: "apple" },
  { url: "https://i.imgur.com/UDPUzFd.jpg", answer: "dog" },
  { url: "https://i.imgur.com/hCzsO3Q.jpg", answer: "book" },
  { url: "https://i.imgur.com/TL4NnmW.jpg", answer: "car" },
  { url: "https://i.imgur.com/VTCfTV4.jpg", answer: "house" }
];
bot.onText(/🖼 Перевод по картинке/, (msg) => {
  const id = msg.chat.id;
  const quiz = imageQuiz[Math.floor(Math.random() * imageQuiz.length)];
  bot.sendPhoto(id, quiz.url, { caption: 'Что изображено на картинке? Напиши по-английски:' });
  bot.once('message', (msg) => {
    const answer = msg.text.trim().toLowerCase();
    if (answer === quiz.answer) {
      bot.sendMessage(id, '✅ Правильно!');
    } else {
      bot.sendMessage(id, `❌ Неправильно. Это было: ${quiz.answer}`);
    }
  });
});

// ——— Блок с вопросами ———
const quiz = {
  easy: [
    { q: "Переведи: «кошка»", a: "cat" },
    { q: "Переведи: «собака»", a: "dog" },
    { q: "Переведи: «яблоко»", a: "apple" }
  ],
  medium: [
    { q: "Переведи: «путешествовать»", a: "travel" },
    { q: "Переведи: «вчера»", a: "yesterday" },
    { q: "Прошедшее время от «go»?", a: "went" }
  ],
  hard: [
    { q: "Слово «responsibility» переводится как?", a: "ответственность" },
    { q: "Переведи: «предприниматель»", a: "entrepreneur" },
    { q: "Синоним к слову «important»?", a: "significant" }
  ]
};

// ——— Выбор уровня и запуск викторины ———
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (['Easy', 'Medium', 'Hard'].includes(text)) {
    const level = text.toLowerCase();
    const questions = quiz[level];
    let score = 0;
    let index = 0;

    const ask = () => {
      if (index < questions.length) {
        bot.sendMessage(chatId, questions[index].q);
      } else {
        bot.sendMessage(chatId, `🏁 Тест завершён. Ты набрал ${score}/${questions.length} баллов.`);
        // 💡 Рекомендация
        if (score <= 1) {
          bot.sendMessage(chatId, "Рекомендуем начать с уровня A1. Повтори базовые слова в разделе 📘 Словарь.");
        } else if (score === questions.length) {
          bot.sendMessage(chatId, "Отлично! 💪 Можешь попробовать уровень выше или перейти к 🗣 практике.");
        }
      }
    };

    bot.once('message', function handler(answerMsg) {
      const answer = answerMsg.text.trim().toLowerCase();
      if (answer === questions[index].a.toLowerCase()) {
        bot.sendMessage(chatId, "✅ Правильно!");
        score++;
      } else {
        bot.sendMessage(chatId, `❌ Неправильно. Правильный ответ: ${questions[index].a}`);
      }
      index++;
      ask();
      if (index < questions.length) bot.once('message', handler);
    });

    ask();
  }
});