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
  A1: [
    "book – книга", "apple – яблоко", "dog – собака", "cat – кошка", "pen – ручка",
    "milk – молоко", "sun – солнце", "car – машина", "tree – дерево", "water – вода",
    "house – дом", "table – стол", "chair – стул", "bird – птица", "fish – рыба",
    "bread – хлеб", "egg – яйцо", "phone – телефон", "bag – сумка", "window – окно",
    "door – дверь", "bed – кровать", "cup – чашка", "spoon – ложка", "fork – вилка",
    "plate – тарелка", "man – мужчина", "woman – женщина", "child – ребенок", "boy – мальчик",
    "girl – девочка", "hat – шляпа", "shoe – ботинок", "shirt – рубашка", "pants – брюки",
    "clock – часы", "school – школа", "teacher – учитель", "student – ученик", "friend – друг",
    "family – семья", "mother – мать", "father – отец", "sister – сестра", "brother – брат",
    "food – еда", "drink – напиток", "street – улица", "city – город", "shop – магазин"
]
,
  A2: [
    "airport – аэропорт", "angry – злой", "answer – ответ", "apartment – квартира", "autumn – осень",
    "basket – корзина", "beach – пляж", "beginning – начало", "boring – скучный", "bottle – бутылка",
    "bridge – мост", "bus stop – автобусная остановка", "butter – масло", "camera – камера", "center – центр",
    "clever – умный", "cloudy – облачно", "colorful – красочный", "corner – угол", "countryside – сельская местность",
    "dangerous – опасный", "dentist – стоматолог", "different – разный", "dirty – грязный", "driver – водитель",
    "early – рано", "engineer – инженер", "evening – вечер", "expensive – дорогой", "fast – быстрый",
    "floor – этаж", "forest – лес", "fridge – холодильник", "glasses – очки", "guitar – гитара",
    "hair – волосы", "holiday – отпуск", "hospital – больница", "hungry – голодный", "important – важный",
    "invitation – приглашение", "kitchen – кухня", "language – язык", "lucky – везучий", "mountain – гора",
    "museum – музей", "newspaper – газета", "painting – картина", "rainy – дождливо", "tired – уставший"
]
,
  slang: [
    "cool – круто", "chill – отдыхать", "dude – чувак", "babe – детка", "lit – отпадный",
    "sick – круто", "fam – братва", "goat – величайший", "hang out – тусоваться", "noob – новичок",
    "savage – жёсткий", "salty – злой", "cringe – стыдно", "slay – блистать", "flex – выпендриваться",
    "ghost – игнорить", "lowkey – по-тихому", "highkey – явно", "vibe – атмосфера", "yeet – бросить (резко)",
    "mood – настроение", "sus – подозрительный", "cap – враньё", "no cap – без вранья", "bet – окей, договорились",
    "ship – быть за пару", "extra – перебор", "fire – огонь", "tea – сплетни", "snatched – шикарный",
    "squad – команда", "bff – лучший друг", "shade – подкол", "basic – обычный", "swole – накачанный",
    "boomer – старомодный чел", "stan – фанатеть", "fomo – страх что-то упустить", "adulting – быть взрослым", "sksksk – (смех, неловкость)",
    "clap back – резко ответить", "woke – осознанный", "bussin – очень вкусно", "drag – раскритиковать", "main character – главный герой жизни",
    "hits different – ощущается иначе", "say less – понял, не говори", "dead – очень смешно", "periodt – точка, всё", "glow up – преображение"
]

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
  { url: "https://upload.wikimedia.org/wikipedia/commons/3/3a/Cat03.jpg", answer: "cat" },
  { url: "https://belarch.ru/wp-content/uploads/2020/05/%D0%BF%D1%80%D0%BE%D0%B5%D0%BA%D1%82-%D0%B4%D0%BE%D0%BC%D0%B0-%D0%B3%D0%BB%D0%B0%D0%B2%D0%BD%D1%8B%D0%B9-%D1%84%D0%B0%D1%81%D0%B0%D0%B4-1024x696.jpg", answer: "house" },
  { url: "https://media.istockphoto.com/id/1297706369/ru/%D0%B2%D0%B5%D0%BA%D1%82%D0%BE%D1%80%D0%BD%D0%B0%D1%8F/sun-paint-brush-strokes-%D0%BD%D0%B0-%D0%B1%D0%B5%D0%BB%D0%BE%D0%BC-%D1%84%D0%BE%D0%BD%D0%B5-%D0%B2%D0%B5%D0%BA%D1%82%D0%BE%D1%80%D0%BD%D0%B0%D1%8F-%D0%B8%D0%BB%D0%BB%D1%8E%D1%81%D1%82%D1%80%D0%B0%D1%86%D0%B8%D1%8F.jpg?s=612x612&w=0&k=20&c=ZwHjCpCxuCsJ4KuG7SyHN3u43rUtys-cpE0fowzJK4I=", answer: "cat" },
  

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
    { q: "Переведи: «яблоко»", a: "apple" },
    { q: "Переведи: «дом»", a: "house" },
    { q: "Переведи: «машина»", a: "car" }

  ],
  medium: [
    { q: "Прошедшее от «go»", a: "went" },
    { q: "Преимущество", a: "advantage" },
    { q: "Знание", a: "knowledge" },
    { q: "Синоним к «important»", a: "significant" }
  ],
  hard: [
    { q: "Переведи: «предприниматель»", a: "entrepreneur" },
    { q: "Переведи: «ubiquitous»", a: "вездесущий" },
    { q: "Переведи: «notwithstanding»", a: "несмотря на" },
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
