import { Telegraf, Scenes, session, Markup } from 'telegraf';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get } from "firebase/database";
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);

const bot = new Telegraf(process.env.BOT_TOKEN);

const regionsData = {
  tashkent_sh: {
    name: "Toshkent sh.",
    districts: ["Bektemir", "Chilonzor", "Yashnobod", "Yunusobod", "Yakkasaroy", "Sergeli", "Mirzo Ulug'bek", "Mirobod", "Shayxontohur", "Olmavor", "Uchtepa", "Yangihayot"]
  },
  tashkent_v: {
    name: "Toshkent vil.",
    districts: ["Olmaliq sh.", "Angren sh.", "Chirchiq sh.", "Bekobod sh.", "Oqqurgan", "Olmaliq", "Angren", "Bekobod", "Bo'stonliq", "Bo'ka", "Chinoz", "Qibray", "Parkent", "Piskent", "Quyi Chirchiq", "O'rta Chirchiq", "Yuqori Chirchiq", "Zangiota", "Toshkent tum."]
  },
  fergana: {
    name: "Farg'ona",
    districts: ["Farg'ona sh.", "Marg'ilon sh.", "Qo'qon sh.", "Quvasoy sh.", "Oltiariq", "Bag'dod", "Beshariq", "Buvayda", "Dang'ara", "Farg'ona tum.", "Furqat", "Qo'shtepa", "Quva", "Rishton", "So'x", "Toshloq", "O'zbekiston", "Yozyovon"]
  },
  andijan: {
    name: "Andijon",
    districts: ["Andijon sh.", "Xonabod sh.", "Andijon tum.", "Asaka", "Baliqchi", "Bo'ston", "Buloqboshi", "Izboskan", "Jalolquduq", "Marhamat", "Oltinko'l", "Paxtaobod", "Qorasuv", "Shahrixon", "Xo'jaobod", "Ulug'nor"]
  },
  namangan: {
    name: "Namangan",
    districts: ["Namangan sh.", "Chartaq", "Chust", "Kosonsoy", "Mingbuloq", "Namangan tum.", "Naryn", "Pap", "To'raqo'rg'on", "Uychi", "Uchqo'rg'on", "Yangiqo'rg'on"]
  },
  samarkand: {
    name: "Samarqand",
    districts: ["Samarqand sh.", "Kattaqo'rg'on sh.", "Oqdaryo", "Bulung'ur", "Ishtixon", "Jomboy", "Kattaqo'rg'on tum.", "Narpay", "Nurobod", "Oqdaryo", "Payariq", "Pastdarg'om", "Paxtachi", "Samarqand tum.", "Toyloq", "Urgut"]
  },
  bukhara: {
    name: "Buxoro",
    districts: ["Buxoro sh.", "Kogon sh.", "Olot", "Buxoro tum.", "Gijduvon", "Jondor", "Kogon tum.", "Qorako'l", "Qorovulbozor", "Peshku", "Romitan", "Shofirkon", "Vobkent"]
  },
  khorezm: {
    name: "Xorazm",
    districts: ["Urganch sh.", "Xiva sh.", "Bog'ot", "Gurlan", "Xonqa", "Xiva tum.", "Qo'shko'pir", "Shovot", "To'proqqala", "Urganch tum.", "Yangiariq", "Yangibozor"]
  },
  navoiy: {
    name: "Navoiy",
    districts: ["Navoiy sh.", "Zarafshon sh.", "Karmana", "Konimex", "Qiziltepa", "Xatirchi", "Navbahor", "Nurota", "Tomdi", "Uchquduq"]
  },
  kashkadarya: {
    name: "Qashqadaryo",
    districts: ["Karshi sh.", "Shahrisabz sh.", "Dehqonobod", "Kasbi", "Kitob", "Koson", "Ko'kdala", "Mirishkor", "Muborak", "Nishon", "Qamashi", "Karshi tum.", "Shahrisabz tum.", "Yakkabog'", "Chiroqchi"]
  },
  surkhandarya: {
    name: "Surxondaryo",
    districts: ["Termiz sh.", "Angor", "Bandixon", "Boysun", "Denov", "Jarqo'rg'on", "Qiziriq", "Qumqo'rg'on", "Muzrabot", "Oltinsoy", "Sariosiyo", "Sherobod", "Termiz tum.", "Uzun", "Xovos"]
  },
  jizzakh: {
    name: "Jizzax",
    districts: ["Jizzax sh.", "Arnasoy", "Baxmal", "Do'stlik", "Forish", "G'allaorol", "Sharof Rashidov", "Mirzacho'l", "Paxtakor", "Yangiobod", "Zafarobod", "Zarbdor", "Zomin"]
  },
  syrdarya: {
    name: "Sirdaryo",
    districts: ["Guliston sh.", "Shirin sh.", "Yangiyer sh.", "Boyovut", "Guliston tum.", "Iftixor", "Mirzaobod", "Oqoltin", "Sardoba", "Sayxunobod", "Sirdaryo tum."]
  },
  karakalpakstan: {
    name: "Qoraqalpog'iston",
    districts: ["Nukus sh.", "Amudaryo", "Beruniy", "Chimboy", "Ellikqal'a", "Kegeyli", "Mo'ynoq", "Nukus tum.", "Qonlikol", "Qo'ng'irot", "Qorauzaq", "Shumanay", "Taxtako'pir", "To'rtko'l", "Xo'jayli", "Taxiatosh", "Bo'zatov"]
  }
};

const registerWizard = new Scenes.WizardScene(
  'REGISTER_SCENE',
  async (ctx) => {
    await ctx.reply("👋 Worky platformasiga xush kelibsiz!\n\nRo'yxatdan o'tish uchun Ism va Familiyangizni kiriting:");
    return ctx.wizard.next();
  },
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
  async (ctx) => {
    if (!ctx.callbackQuery) {
      await ctx.reply("⚠️ Iltimos, yozma matn yubormang! Pastdagi tugmalardan birini bosing:");
      return;
    }
    ctx.wizard.state.role = ctx.callbackQuery.data.split(':')[1];
    await ctx.answerCbQuery();
    await ctx.reply(
      "Rahmat! Telefon raqamingizni pastdagi tugma orqali yuboring:",
      Markup.keyboard([[Markup.button.contactRequest("📱 Telefon raqamni yuborish")]]).resize().oneTime()
    );
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!ctx.message || (!ctx.message.contact && !ctx.message.text)) {
      await ctx.reply("Iltimos, telefon raqamni yuborish tugmasini bosing:");
      return;
    }
    ctx.wizard.state.phone = ctx.message.contact ? ctx.message.contact.phone_number : ctx.message.text;

    const rulesText =
      "⚠️ Worky Platformasi Foydalanish Qoidalari:\n\n" +
      "1️⃣ Halollik: Ish beruvchi va ishchi kelishilgan vaqtda va narxda majburiyatlarini bajarishi shart.\n" +
      "2️⃣ Fake taqiqi: Platformada yolg'on e'lonlar, feyk hisoblar yoki firibgarlik qat'iyan taqiqlanadi.\n" +
      "3️⃣ Odob-axloq: Haqoratli so'zlar ishlatish akkauntning umrbod bloklanishiga olib keladi.\n" +
      "4️⃣ Xavfsizlik: To'lov kelishuvlarini faqat tasdiqlangan shaxslar bilan amalga oshiring.\n\n" +
      "Davom etish uchun shartlarni qabul qiling:";

    await ctx.reply(rulesText, Markup.inlineKeyboard([
      [Markup.button.callback("✅ Qabul qilaman", "rules:accept")],
      [Markup.button.callback("❌ Rad etaman", "rules:decline")]
    ]));
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!ctx.callbackQuery) {
      await ctx.reply("⚠️ Iltimos, qoidalarni tugma orqali qabul qiling yoki rad eting:");
      return;
    }
    const status = ctx.callbackQuery.data.split(':')[1];
    await ctx.answerCbQuery();

    if (status === 'decline') {
      await ctx.reply("Afsus, shartlarni rad etdingiz. Qayta boshlash: /start");
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
  async (ctx) => {
    if (!ctx.callbackQuery) {
      await ctx.reply("⚠️ Iltimos, viloyatingizni tugmani bosib tanlang:");
      return;
    }
    const regionKey = ctx.callbackQuery.data.split(':')[1];
    const selectedRegion = regionsData[regionKey];
    if (!selectedRegion) return ctx.reply("Xatolik yuz berdi. Qaytadan urining: /start");

    ctx.wizard.state.region = selectedRegion.name;
    await ctx.answerCbQuery();

    const districtButtons = [];
    for (let i = 0; i < selectedRegion.districts.length; i += 2) {
      const row = [Markup.button.callback(selectedRegion.districts[i], `dist:${selectedRegion.districts[i]}`)];
      if (selectedRegion.districts[i + 1]) {
        row.push(Markup.button.callback(selectedRegion.districts[i + 1], `dist:${selectedRegion.districts[i + 1]}`));
      }
      districtButtons.push(row);
    }

    await ctx.reply("Tumaningizni tanlang:", Markup.inlineKeyboard(districtButtons));
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!ctx.callbackQuery) {
      await ctx.reply("⚠️ Iltimos, tumaningizni tugmani bosib tanlang:");
      return;
    }
    const districtName = ctx.callbackQuery.data.split(':')[1];
    await ctx.answerCbQuery();

    const telegramId = String(ctx.from.id);
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
        `🆔 Sizning Worky ID: ${telegramId}\n\n` +
        "🌐 Quyidagi tugma orqali saytga o'tib ID raqamingizni kiriting va ish boshlang:",
        Markup.inlineKeyboard([[Markup.button.url("🌐 Worky Saytiga Kirish", "https://worky-0g13.onrender.com/")]])
      );
    } catch (e) {
      await ctx.reply("Ma'lumotlarni saqlashda xatolik. Qayta urining: /start");
    }
    return ctx.scene.leave();
  }
);

const stage = new Scenes.Stage([registerWizard]);
bot.use(session());
bot.use(stage.middleware());

bot.start(async (ctx) => {
  const telegramId = String(ctx.from.id);
  try {
    const snapshot = await get(ref(db, `users/${telegramId}`));
    if (snapshot.exists()) {
      const userData = snapshot.val();
      const proStatus = userData.isPro ? "✅ Faol" : "❌ Faol emas (Oddiy)";

      await ctx.reply(
        `👤 Worky Profilingiz:\n\n` +
        `🆔 Worky ID: ${telegramId}\n` +
        `📝 Ism: ${userData.name}\n` +
        `💼 Rol: ${userData.role === 'worker' ? 'Ishchi' : 'Ish beruvchi'}\n` +
        `📍 Hudud: ${userData.region}, ${userData.district}\n` +
        `👑 PRO Holati: ${proStatus}\n\n` +
        `PRO sotib olish uchun saytga kiring va PRO tugmasini bosing!`,
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

bot.catch((err, ctx) => {
  console.error(`Global Xato:`, err);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));