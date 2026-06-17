import { Telegraf, Scenes, session, Markup } from 'telegraf';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get } from "firebase/database";
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

// Firebase Konfiguratsiyasi
const firebaseConfig = {
  apiKey: "AIzaSyAjssn3vbS0l_GJoJeV-HrGg1NTUKLou6U",
  authDomain: "worky-2d426.firebaseapp.com",
  databaseURL: "https://worky-2d426-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "worky-2d426",
  storageBucket: "worky-2d426.firebasestorage.app",
  messagingSenderId: "523843560168",
  appId: "1:523843560168:web:d0235e2c3e5abf46c91f5d",
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);

// Botni yaratish
const bot = new Telegraf("8774789236:AAE0ED0DMAaaKMmFHYt69eAPHbw5yFj6Bdc");

const regionsData = {
  tashkent_sh: { name: "Toshkent sh.", districts: ["Yunusobod", "Chilonzor", "Mirzo Ulug'bek", "Yashnobod", "Sergeli", "Boshqa"] },
  tashkent_v: { name: "Toshkent vil.", districts: ["Chirchiq", "Angren", "Olmaliq", "Bekabad", "Qibray", "Boshqa"] },
  fergana: { name: "Farg'ona", districts: ["Farg'ona sh.", "Marg'ilon", "Qo'qon", "Beshariq", "Quva", "Oltiariq", "Boshqa"] },
  andijan: { name: "Andijon", districts: ["Andijon sh.", "Asaka", "Shahrixon", "Xonabod", "Izboskan", "Boshqa"] },
  namangan: { name: "Namangan", districts: ["Namangan sh.", "Chust", "Kosonsoy", "Uychi", "Pop", "Boshqa"] },
  samarkand: { name: "Samarqand", districts: ["Samarqand sh.", "Kattaqo'rg'on", "Urgut", "Bulung'ur", "Boshqa"] },
  bukhara: { name: "Buxoro", districts: ["Buxoro sh.", "Gijduvon", "Kogon", "Qorako'l", "Boshqa"] },
  khorezm: { name: "Xorazm", districts: ["Urganch sh.", "Xiva", "Gurlan", "Shovot", "Boshqa"] },
  navoiy: { name: "Navoiy", districts: ["Navoiy sh.", "Zarafshon", "Nurota", "Karmana", "Boshqa"] },
  kashkadarya: { name: "Qashqadaryo", districts: ["Karshi sh.", "Shahrisabz", "Kitob", "Guzor", "Boshqa"] },
  surkhandarya: { name: "Surxondaryo", districts: ["Termiz sh.", "Denov", "Sherobod", "Jarqo'rg'on", "Boshqa"] },
  jizzakh: { name: "Jizzax", districts: ["Jizzax sh.", "Zomin", "G'allaorol", "Do'stlik", "Boshqa"] },
  syrdarya: { name: "Sirdaryo", districts: ["Guliston sh.", "Shirin", "Yangiyer", "Boyovut", "Boshqa"] },
  karakalpakstan: { name: "Qoraqalpog'iston", districts: ["Nukus sh.", "Xo'jayli", "Qo'ng'irot", "Beruniy", "Boshqa"] }
};

// WIZARD SCENE (Faqat biz yozgan xabarlar chiqadi, begona havola bo'lishi imkonsiz)
const registerWizard = new Scenes.WizardScene(
  'REGISTER_SCENE',

  // 1-Qadam
  async (ctx) => {
    await ctx.reply("👋 Worky platformasiga xush kelibsiz!\n\nRo'yxatdan o'tish uchun Ism va Familiyangizni kiriting:");
    return ctx.wizard.next();
  },

  // 2-Qadam
  async (ctx) => {
    if (!ctx.message || !ctx.message.text) {
      await ctx.reply("Iltimos, ismingizni matn ko'rinishida yozing:");
      return;
    }
    ctx.wizard.state.name = ctx.message.text;
    await ctx.reply(
      "Rahmat! Rolingizni tanlang:",
      Markup.inlineKeyboard([
        [Markup.button.callback("👷 Ishchiman", "role:worker")],
        [Markup.button.callback("💼 Ish beruvchiman", "role:employer")]
      ])
    );
    return ctx.wizard.next();
  },

  // 3-Qadam
  async (ctx) => {
    if (!ctx.callbackQuery) {
      await ctx.reply("Tugmalardan birini tanlang:");
      return;
    }
    ctx.wizard.state.role = ctx.callbackQuery.data.split(':')[1];
    await ctx.answerCbQuery();
    await ctx.reply(
      "Telefon raqamingizni pastdagi tugma orqali yuboring:",
      Markup.keyboard([[Markup.button.contactRequest("📱 Telefon raqamni yuborish")]]).resize().oneTime()
    );
    return ctx.wizard.next();
  },

  // 4-Qadam
  async (ctx) => {
    if (!ctx.message || (!ctx.message.contact && !ctx.message.text)) {
      await ctx.reply("Iltimos, telefon raqamni yuborish tugmasini bosing:");
      return;
    }
    ctx.wizard.state.phone = ctx.message.contact ? ctx.message.contact.phone_number : ctx.message.text;

    const rulesText = "⚠️ **Worky qoidalari:**\n\n1. Halol va o'z vaqtida ishlash shart.\n2. Yolg'on e'lonlar taqiqlanadi.\n\nDavom etish uchun shartlarni qabul qiling:";
    await ctx.reply(rulesText, Markup.inlineKeyboard([
      [Markup.button.callback("✅ Qabul qilaman", "rules:accept")],
      [Markup.button.callback("❌ Rad etaman", "rules:decline")]
    ]));
    return ctx.wizard.next();
  },

  // 5-Qadam
  async (ctx) => {
    if (!ctx.callbackQuery) {
      await ctx.reply("Shartlarni tugma orqali qabul qiling:");
      return;
    }
    const status = ctx.callbackQuery.data.split(':')[1];
    await ctx.answerCbQuery();

    if (status === 'decline') {
      await ctx.reply("Shartlar rad etildi. Qayta ro'yxatdan o'tish: /start");
      return ctx.scene.leave();
    }

    const regionButtons = [
      [Markup.button.callback("Toshkent sh.", "reg:tashkent_sh"), Markup.button.callback("Toshkent vil.", "reg:tashkent_v")],
      [Markup.button.callback("Farg'ona", "reg:fergana"), Markup.button.callback("Andijon", "reg:andijan")],
      [Markup.button.callback("Namangan", "reg:namangan"), Markup.button.callback("Samarqand", "reg:samarkand")],
      [Markup.button.callback("Buxoro", "reg:bukhara"), Markup.button.callback("Xorazm", "reg:khorezm")],
      [Markup.button.callback("Navoiy", "reg:navoiy"), Markup.button.callback("Qashqadaryo", "reg:kashkadarya")],
      [Markup.button.callback("Surxondaryo", "reg:surkhandarya"), Markup.button.callback("Jizzax", "reg:jizzakh")],
      [Markup.button.callback("Sirdaryo", "reg:syrdarya"), Markup.button.callback("Qoraqalpog'iston", "reg:karakalpakstan")]
    ];
    await ctx.reply("Viloyatingizni tanlang:", Markup.inlineKeyboard(regionButtons));
    return ctx.wizard.next();
  },

  // 6-Qadam
  async (ctx) => {
    if (!ctx.callbackQuery) {
      await ctx.reply("Viloyatni tanlang:");
      return;
    }
    const regionKey = ctx.callbackQuery.data.split(':')[1];
    const selectedRegion = regionsData[regionKey];
    if (!selectedRegion) return ctx.reply("Xatolik. Qaytadan urining: /start");

    ctx.wizard.state.region = selectedRegion.name;
    await ctx.answerCbQuery();

    const districtButtons = [];
    for (let i = 0; i < selectedRegion.districts.length; i += 2) {
      const row = [Markup.button.callback(selectedRegion.districts[i], `dist:${selectedRegion.districts[i]}`)];
      if (selectedRegion.districts[i + 1]) row.push(Markup.button.callback(selectedRegion.districts[i + 1], `dist:${selectedRegion.districts[i + 1]}`));
      districtButtons.push(row);
    }
    await ctx.reply("Tumaningizni tanlang:", Markup.inlineKeyboard(districtButtons));
    return ctx.wizard.next();
  },

  // 7-Qadam
  async (ctx) => {
    if (!ctx.callbackQuery) {
      await ctx.reply("Tumanni tanlang:");
      return;
    }
    const districtName = ctx.callbackQuery.data.split(':')[1];
    await ctx.answerCbQuery();

    const telegramId = ctx.from.id;
    const userData = {
      telegramId: telegramId,
      name: ctx.wizard.state.name,
      role: ctx.wizard.state.role,
      phone: ctx.wizard.state.phone,
      region: ctx.wizard.state.region,
      district: districtName,
      isPro: false,
      proExpireAt: "",
      createdAt: new Date().toISOString()
    };

    try {
      await set(ref(db, 'users/' + telegramId), userData);
      await ctx.reply(
        "🎉 Ro'yxatdan muvaffaqiyatli o'tdingiz!\n\n" +
        `🆔 Worky ID: ${telegramId}\n\n` +
        "🌐 Quyidagi tugma orqali saytga o'tib ID raqamingizni kiriting:",
        Markup.inlineKeyboard([[Markup.button.url("🌐 Worky Saytiga Kirish", "https://worky-0g13.onrender.com/")]])
      );
    } catch (e) {
      await ctx.reply("Xatolik yuz berdi. Qayta urining: /start");
    }
    return ctx.scene.leave();
  }
);

const stage = new Scenes.Stage([registerWizard]);
bot.use(session());
bot.use(stage.middleware());

// Bot Start komandasi - Reklamalardan TOZA, Sening sayt havolang bilan uzoqlashtirilgan
bot.start(async (ctx) => {
  const telegramId = ctx.from.id;
  try {
    const snapshot = await get(ref(db, `users/${telegramId}`));
    if (snapshot.exists()) {
      const userData = snapshot.val();
      const proStatus = userData.isPro ? `✅ Faol (Muddati: ${userData.proExpireAt})` : "❌ Faol emas (Oddiy)";

      const text =
        `👤 **Worky Profilingiz:**\n\n` +
        `🆔 Worky ID: \`${telegramId}\`\n` +
        `📝 Ism: ${userData.name}\n` +
        `💼 Rol: ${userData.role === 'worker' ? 'Ishchi' : 'Ish beruvchi'}\n` +
        `👑 PRO Holati: ${proStatus}\n\n` +
        `🌟 **PRO sotib olish:**\n` +
        `💳 Karta: \`8600123456789012\` (Temur)\n` +
        `💰 Narxi: 25,000 so'm\n\n` +
        `To'lov qilib, chekni va ID-ni @logotipshop10 ga tashlang!`;

      await ctx.replyWithMarkdownV2(
        text.replace(/\./g, '\\.').replace(/-/g, '\\-').replace(/\!/g, '\\!'),
        Markup.inlineKeyboard([[Markup.button.url("🌐 Worky Saytiga Kirish", "https://worky-0g13.onrender.com/")]])
      );
    } else {
      ctx.scene.enter('REGISTER_SCENE');
    }
  } catch (e) {
    ctx.scene.enter('REGISTER_SCENE');
  }
});

app.get('/', (req, res) => res.send('Worky Bot Active'));
app.listen(PORT, () => console.log(`Server port: ${PORT}`));

bot.launch().then(() => console.log("Worky Bot muvaffaqiyatli yurdi!"));

// Faqat terminalga xato chiqarish, hech qanday kanal reklama havolasi yo'q!
bot.catch((err, ctx) => {
  console.error(`🚨 Xato:`, err);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));