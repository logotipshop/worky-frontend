const { Telegraf, Markup } = require('telegraf');

const BOT_TOKEN = '8774789236:AAGlZSy7dvEOdV3nhKci3k4XF7zxdQvnI44';
const bot = new Telegraf(BOT_TOKEN);
const WEB_APP_URL = 'https://worky-kappa.vercel.app';

const userSteps = {};

// 1. Start buyrug'i
bot.start(async (ctx) => {
  const userId = ctx.from.id;
  userSteps[userId] = { step: 'READ_RULES' };

  const rulesText = `👋 **"Worky" platformasiga xush kelibsiz!**\n\n` +
    `📜 **Asosiy qoidalar:**\n` +
    `1. Haqiqiy ism va familiyangizni kiriting.\n` +
    `2. "Bogʻlanish" tugmasi orqali toʻgʻridan-toʻgʻri Telegram'ga oʻtiladi.\n` +
    `3. PRO tarifi narxi: 50,000 soʻm.\n\n` +
    `⚠️ *Davom etish orqali qoidalarga rozilik bildirasiz.*`;

  await ctx.reply(rulesText, Markup.keyboard([['✅ Qoidalarga roziman va Davom etaman']]).oneTime().resize());
});

// 2. Har qanday matnli xabarni qayta ishlash (Matn mos kelmaslik xatosini yo'qotamiz)
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const text = ctx.message.text.trim();

  if (!userSteps[userId]) return;

  // Qoidalarga rozilik
  if (userSteps[userId].step === 'READ_RULES' && text === '✅ Qoidalarga roziman va Davom etaman') {
    userSteps[userId].step = 'ASK_NAME';
    return ctx.reply("Ajoyib! Iltimos, ismingizni kiriting:", Markup.removeKeyboard());
  }

  // Ism kiritilganda
  if (userSteps[userId].step === 'ASK_NAME') {
    userSteps[userId].firstName = text;
    userSteps[userId].step = 'ASK_LASTNAME';
    return ctx.reply("Rahmat! Endi familiyangizni kiriting:");
  }

  // Familiya kiritilganda (Rol so'rash)
  if (userSteps[userId].step === 'ASK_LASTNAME') {
    userSteps[userId].lastName = text;
    userSteps[userId].step = 'ASK_ROLE';
    return ctx.reply("Platformadagi rolingizni tanlang:", Markup.keyboard([['👷 Ishchi', '💼 Ish beruvchi']]).oneTime().resize());
  }

  // ENGI MUHIM JOYI: Rol tugmasi bosilganda (Yoki har qanday matn yozilganda)
  if (userSteps[userId].step === 'ASK_ROLE') {
    delete userSteps[userId];

    // Pastdagi tugmalarni tozalash
    await ctx.reply("Rahmat! Ma'lumotlar saqlandi.", Markup.removeKeyboard());

    // Shundoq xabar tagidan yopishgan daxshatli tugmani yuborish
    return ctx.reply(
      "🎉 Roʻyxatdan oʻtish muvaffaqiyatli yakunlandi!\n\nPastdagi tugmani bosib Worky platformasiga kiring 👇",
      Markup.inlineKeyboard([
        [Markup.button.webApp('🚀 Worky-ni ochish', WEB_APP_URL)]
      ])
    );
  }
});

bot.launch().then(() => console.log('🔥 Muammosiz super versiya ishga tushdi!'));