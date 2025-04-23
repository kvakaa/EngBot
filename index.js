const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const token = process.env.BOT_TOKEN;

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
  const id = msg.chat.id;
  bot.sendMessage(id, 'Привет! Выбери, что ты хочешь сделать:', {
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

const translate = require('@vitalets/google-translate-api');

bot.onText(/🌐 Переводчик/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Введите слово или фразу для перевода (рус/англ):');
  bot.once('message', async (msg) => {
    const text = msg.text;

    try {
      const res = await translate(text, { to: detectLanguage(text) });
      bot.sendMessage(chatId, `Перевод: ${res.text}`);
    } catch (err) {
      bot.sendMessage(chatId, 'Ошибка перевода. Попробуйте позже.');
    }
  });
});

function detectLanguage(text) {
  // Очень простая проверка: если латиница — переводим на русский, иначе — на английский
  return /^[a-zA-Z]/.test(text) ? 'ru' : 'en';
}

bot.onText(/🗣 Практика разговора/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "🗣 Давай попрактикуемся в разговоре на английском! Я начну:\n\nHello! How are you today?");
  startConversation(chatId);
});

function startConversation(chatId) {
  const prompts = [
    "What's your name?",
    "Where are you from?",
    "What do you like to do in your free time?",
    "Do you like learning English?",
    "What's your favorite food?"
  ];

  let step = 0;

  const askNext = () => {
    if (step < prompts.length) {
      bot.sendMessage(chatId, prompts[step]);
      step++;
    } else {
      bot.sendMessage(chatId, "Thanks for chatting with me! 🧠 Want to try another section?");
    }
  };

  bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
  
    if (text === 'A1') {
      bot.sendMessage(chatId, `📗 Уровень A1:\n\n${vocabulary.A1.join('\n')}`);
    } else if (text === 'A2') {
      bot.sendMessage(chatId, `📘 Уровень A2:\n\n${vocabulary.A2.join('\n')}`);
    } else if (text === 'Сленг') {
      bot.sendMessage(chatId, `📙 Американский сленг:\n\n${vocabulary.slang.join('\n')}`);
    } else if (text === '🔙 Назад') {
      bot.sendMessage(chatId, 'Вы вернулись в главное меню. Нажмите /start');
    }
  });
  
  const listener = (msg) => {
    if (msg.chat.id === chatId) {
      askNext();
    }
  };

  bot.on('message', listener);

  askNext();
}

const vocabulary = {
  A1: ["book – книга", "apple – яблоко", "dog – собака", "go – идти", "house – дом"],
  A2: ["travel – путешествовать", "yesterday – вчера", "often – часто", "because – потому что", "important – важный"],
  slang: [
    "cool – круто",
    "bro – братан",
    "YOLO – живём один раз",
    "lit – офигенно, классно",
    "ghost – игнорировать, пропасть без объяснений",
    "no cap – честно, без вранья",
    "sus – подозрительный (от слова suspicious)",
    "salty – обиженный, раздражённый",
    "flex – хвастаться",
    "lowkey – немного, по-тихому",
    "highkey – явно, открыто",
    "vibe – атмосфера, настрой",
    "cringe – неловко, стыдно",
    "savage – жёстко, дерзко (в хорошем смысле)",
    "slay – блистать, делать круто",
    "ship – шипперить, хотеть пару из двух людей"
  ]
};

const questions = {
  easy: [
    { q: "Переведи: 'кошка'", a: "cat" },
    { q: "Переведи: 'собака'", a: "dog" },
    { q: "Переведи: 'яблоко'", a: "apple" }
  ],
  medium: [
    { q: "Переведи: 'путешествовать'", a: "travel" },
    { q: "Переведи: 'вчера'", a: "yesterday" },
    { q: "Прошедшее время от 'go'?", a: "went" }
  ],
  hard: [
    { q: "Слово 'responsibility' переводится как?", a: "ответственность" },
    { q: "Переведи: 'предприниматель'", a: "entrepreneur" },
    { q: "Синоним к слову 'important'?", a: "significant" }
  ]
};

const userState = {};

bot.onText(/\/start/, (msg) => {
  const id = msg.chat.id;
  userState[id] = { step: 0, score: 0, level: null };
  bot.sendMessage(id, `Привет, ${msg.from.first_name}! 👋 Я помогу тебе тренировать английский язык.\n\nВыбери уровень сложности:`, {
    reply_markup: {
      keyboard: [['Easy'], ['Medium'], ['Hard']],
      one_time_keyboard: true,
      resize_keyboard: true
    }
  });
});

bot.on('message', (msg) => {
  const id = msg.chat.id;
  const text = msg.text.toLowerCase();

  if (!userState[id]) return;

  const state = userState[id];

  if (!state.level && ['easy', 'medium', 'hard'].includes(text)) {
    state.level = text;
    state.step = 0;
    state.score = 0;
    bot.sendMessage(id, `🔍 Уровень установлен: ${text.toUpperCase()}. Начинаем викторину!`);
    sendQuestion(id);
    return;
  }

  if (state.level && state.step < 3) {
    const current = questions[state.level][state.step];
    if (text === current.a.toLowerCase()) {
      bot.sendMessage(id, '✅ Верно!');
      state.score++;
    } else {
      bot.sendMessage(id, `❌ Неправильно. Правильный ответ: ${current.a}`);
    }

    state.step++;

    if (state.step < 3) {
      sendQuestion(id);
    } else {
      finishQuiz(id);
    }
  }
});

function sendQuestion(id) {
  const state = userState[id];
  const current = questions[state.level][state.step];
  bot.sendMessage(id, `❓ Вопрос ${state.step + 1}: ${current.q}`);
}

function finishQuiz(id) {
  const state = userState[id];
  const score = state.score;
  let recommendation = '';

  if (score <= 1) {
    recommendation = "📘 Рекомендую начать с блока '100 базовых слов' и глаголов. Тебе подойдёт уровень EASY.";
  } else if (score === 2) {
    recommendation = "📗 У тебя есть основа! Продолжай практиковать этот уровень или переходи к простым диалогам.";
  } else {
    recommendation = "📕 Отлично! Ты готов к следующему уровню или практическим заданиям с текстами.";
  }

  bot.sendMessage(id, `🏁 Викторина завершена! Ты набрал: ${score}/3\n\n${recommendation}`);

  bot.sendMessage(id, `Хочешь попробовать другой уровень?`, {
    reply_markup: {
      keyboard: [['Easy'], ['Medium'], ['Hard']],
      one_time_keyboard: true,
      resize_keyboard: true
    }
  });

  // Обнуляем состояние для нового выбора
  userState[id] = { step: 0, score: 0, level: null };
}
