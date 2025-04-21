require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

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
