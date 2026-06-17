import { Telegraf, Scenes, session, Markup } from 'telegraf';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";
import express from 'express';

// Express server sozlamalari (Render Timed Out xatosini yo'qotish uchun)
const app = express();
const PORT = process.env.PORT || 3000;

// 1. Firebase Konfiguratsiyasi
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

// 2. Botni xavfsiz token bilan yaratish
const bot = new Telegraf("8774789236:AAE0ED0DMAaaKMmFHYt69eAPHbw5yFj6Bdc");

// 3. RO'YXATDAN O'TISH SAHNASI (WIZARD SCENE)
const registerWizard = new Scenes.WizardScene(
  'REGISTER_SCENE',

  // 1-Qadam: Ism so'rash
  async (ctx) => {
    await ctx.reply(
      "👋 Worky platformasiga xush kelibsiz!\n\n" +
      "Kunlik va smenali ishlarni topish hamda ishchilarni yollash tizimi.\n\n" +
      "Ro'yxatdan o'tishni boshlash uchun iltimos, Ism va Familiyangizni kiriting:"
    );
    return ctx.wizard.next();
  },

  // 2-Qadam: Ismni saqlash va Rol tanlash tugmalarini ko'rsatish
  async (ctx) => {
    if (!ctx.message || !ctx.message.text) {
      await ctx.reply("Iltimos, ism va familiyangizni matn ko'rinishida kiriting:");
      return;
    }
    ctx.wizard.state.name = ctx.message.text;

    await ctx.reply(
      "Rahmat! Endi platformadan foydalanish maqsadingizni (rolingizni) tanlang:",
      Markup.inlineKeyboard([
        [Markup.button.callback("👷 Men Ishchiman (Ish qidiraman)", "role:worker")],
        [Markup.button.callback("💼 Men Ish beruvchiman (Xodim qidiraman)", "role:employer")]
      ])
    );
    return ctx.wizard.next();
  },

  // 3-Qadam: Rolni qabul qilish va Telefon so'rash
  async (ctx) => {
    if (!ctx.callbackQuery) {
      await ctx.reply("Iltimos, pastdagi tugmalardan birini tanlang:");
      return;
    }
    const role = ctx.callbackQuery.data.split(':')[1];
    ctx.wizard.state.role = role;
    await ctx.answerCbQuery();

    await ctx.reply(
      "Ajoyib! Endi senga aloqaga chiqishlari uchun telefon raqamingni yubor:",
      Markup.keyboard([
        [Markup.button.contactRequest("📱 Telefon raqamni yuborish")]
      ]).resize().oneTime()
    );
    return ctx.wizard.next();
  },

  // 4-Qadam: Telefonni qabul qilish va Viloyat so'rash
  async (ctx) => {
    if (!ctx.message || (!ctx.message.contact && !ctx.message.text)) {
      await ctx.reply("Iltimos, raqamni yuborish tugmasini bosing yoki raqamingizni yozing:");
      return;
    }
    const phone = ctx.message.contact ? ctx.message.contact.phone_number : ctx.message.text;
    ctx.wizard.state.phone = phone;

    await ctx.reply(
      "Rahmat! Viloyatingizni tanlang:",
      Markup.inlineKeyboard([
        [Markup.button.callback("Farg'ona", "region:fergana")],
        [Markup.button.callback("Toshkent", "region:tashkent")]
      ])
    );
    return ctx.wizard.next();
  },

  // 5-Qadam: Viloyatni qabul qilish va saqlash (Yakunlash)
  async (ctx) => {
    if (!ctx.callbackQuery) {
      await ctx.reply("Iltimos, viloyatni tugma orqali tanlang:");
      return;
    }
    const region = ctx.callbackQuery.data.split(':')[1];
    ctx.wizard.state.region = region;
    await ctx.answerCbQuery();

    const userData = {
      telegramId: ctx.from.id,
      name: ctx.wizard.state.name,
      role: ctx.wizard.state.role,
      phone: ctx.wizard.state.phone,
      region: ctx.wizard.state.region,
      createdAt: new Date().toISOString()
    };

    // Firebase Realtime Database'ga yozish
    try {
      await set(ref(db, 'users/' + ctx.from.id), userData);
      await ctx.reply(
        "🎉 Tabriklayman! Ro'yxatdan muvaffaqiyatli o'tdingiz.\n\n" +
        `Ism: ${userData.name}\n` +
        `Rol: ${userData.role === 'worker' ? 'Ishchi' : 'Ish beruvchi'}\n` +
        `Tel: ${userData.phone}\n\n` +
        "Worky saytiga kirib profilingizni ko'rishingiz mumkin!",
        Markup.removeKeyboard()
      );
    } catch (error) {
      await ctx.reply("Xatolik yuz berdi. Qayta urinib ko'ring.");
    }

    return ctx.scene.leave();
  }
);

// 4. Stage va Session sozlamalari
const stage = new Scenes.Stage([registerWizard]);
bot.use(session());
bot.use(stage.middleware());

// 5. Bot Start komandasi
bot.start((ctx) => ctx.scene.enter('REGISTER_SCENE'));

// 6. Express Web Server yo'laklari (Render port qidirganda shu ishlaydi)
app.get('/', (req, res) => {
  res.send('Worky Bot is Running Successfully!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// 7. Botni ishga tushirish
bot.launch().then(() => {
  console.log("Worky Telegram Bot muvaffaqiyatli ishga tushdi!");
});

// Xatoliklarni tutish va logga chiqarish
bot.catch((err, ctx) => {
  console.log(`Xatolik yuz berdi: ${ctx.updateType}`, err);
});

// Tizim to'xtatilganda ulanishni xavfsiz yopish
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));