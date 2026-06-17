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

// Viloyatlar va ularga tegishli tumanlar ma'lumotlar bazasi
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

  // 2-Qadam: Ismni saqlash va Rol tanlash
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

  // 4-Qadam: Telefonni qabul qilish va FOYDALANISH QOIDALARINI ko'rsatish
  async (ctx) => {
    if (!ctx.message || (!ctx.message.contact && !ctx.message.text)) {
      await ctx.reply("Iltimos, raqamni yuborish tugmasini bosing yoki raqamingizni yozing:");
      return;
    }
    const phone = ctx.message.contact ? ctx.message.contact.phone_number : ctx.message.text;
    ctx.wizard.state.phone = phone;

    // Worky platformasining foydalanish qoidalari matni
    const rulesText =
      "⚠️ **Worky platformasidan foydalanish qoidalari:**\n\n" +
      "1. Kelishilgan ish vaqtida va joyida vaqtida hozir bo'lish majburiy.\n" +
      "2. Ish beruvchi va ishchi o'rtasidagi kelishuvlar halol va shaffof bo'lishi shart.\n" +
      "3. Platformada yolg'on e'lon berish yoki haqoratli so'zlardan foydalanish qat'iyan man etiladi.\n" +
      "4. To'lovlar tizim qoidalariga muvofiq o'z vaqtida amalga oshirilishi lozim.\n\n" +
      "Davom etish uchun shartlarni qabul qilishingiz kerak.";

    await ctx.reply(
      rulesText,
      Markup.inlineKeyboard([
        [Markup.button.callback("✅ Shartlarni qabul qilaman", "rules:accept")],
        [Markup.button.callback("❌ Rad etish", "rules:decline")]
      ])
    );
    return ctx.wizard.next();
  },

  // 5-Qadam: Qoidalarni tekshirish va BARCHA VILOYATLARNI ko'rsatish
  async (ctx) => {
    if (!ctx.callbackQuery) {
      await ctx.reply("Iltimos, pastdagi tugma orqali shartlarni qabul qiling:");
      return;
    }
    const rulesStatus = ctx.callbackQuery.data.split(':')[1];
    await ctx.answerCbQuery();

    if (rulesStatus === 'decline') {
      await ctx.reply("Siz shartlarni rad etdingiz. Platformadan foydalanish uchun ro'yxatdan qayta o'ting va shartlarni qabul qiling. /start");
      return ctx.scene.leave();
    }

    // O'zbekistonning barcha hududlari tugmalari
    const regionButtons = [
      [Markup.button.callback("Toshkent sh.", "reg:tashkent_sh"), Markup.button.callback("Toshkent vil.", "reg:tashkent_v")],
      [Markup.button.callback("Farg'ona", "reg:fergana"), Markup.button.callback("Andijon", "reg:andijan")],
      [Markup.button.callback("Namangan", "reg:namangan"), Markup.button.callback("Samarqand", "reg:samarkand")],
      [Markup.button.callback("Buxoro", "reg:bukhara"), Markup.button.callback("Xorazm", "reg:khorezm")],
      [Markup.button.callback("Navoiy", "reg:navoiy"), Markup.button.callback("Qashqadaryo", "reg:kashkadarya")],
      [Markup.button.callback("Surxondaryo", "reg:surkhandarya"), Markup.button.callback("Jizzax", "reg:jizzakh")],
      [Markup.button.callback("Sirdaryo", "reg:syrdarya"), Markup.button.callback("Qoraqalpog'iston", "reg:karakalpakstan")]
    ];

    await ctx.reply("Rahmat! Endi viloyatingizni tanlang:", Markup.inlineKeyboard(regionButtons));
    return ctx.wizard.next();
  },

  // 6-Qadam: Viloyatni qabul qilib, unga mos TUMANLARNI ko'rsatish
  async (ctx) => {
    if (!ctx.callbackQuery) {
      await ctx.reply("Iltimos, viloyatni tugma orqali tanlang:");
      return;
    }
    const regionKey = ctx.callbackQuery.data.split(':')[1];
    const selectedRegion = regionsData[regionKey];

    if (!selectedRegion) {
      await ctx.reply("Xatolik yuz berdi. Qaytadan viloyatni tanlang:");
      return;
    }

    ctx.wizard.state.region = selectedRegion.name;
    await ctx.answerCbQuery();

    // Tanlangan viloyatning tumanlaridan tugmalar yasash
    const districtButtons = [];
    for (let i = 0; i < selectedRegion.districts.length; i += 2) {
      const row = [Markup.button.callback(selectedRegion.districts[i], `dist:${selectedRegion.districts[i]}`)];
      if (selectedRegion.districts[i + 1]) {
        row.push(Markup.button.callback(selectedRegion.districts[i + 1], `dist:${selectedRegion.districts[i + 1]}`));
      }
      districtButtons.push(row);
    }

    await ctx.reply(`${selectedRegion.name} viloyati tanlandi. Endi tumaningizni tanlang:`, Markup.inlineKeyboard(districtButtons));
    return ctx.wizard.next();
  },

  // 7-Qadam: Tumanni qabul qilish, Firebase'ga yozish va ID bilan yakunlash
  async (ctx) => {
    if (!ctx.callbackQuery) {
      await ctx.reply("Iltimos, tumaningizni tugma orqali tanlang:");
      return;
    }
    const districtName = ctx.callbackQuery.data.split(':')[1];
    ctx.wizard.state.district = districtName;
    await ctx.answerCbQuery();

    const telegramId = ctx.from.id;

    const userData = {
      telegramId: telegramId,
      name: ctx.wizard.state.name,
      role: ctx.wizard.state.role,
      phone: ctx.wizard.state.phone,
      region: ctx.wizard.state.region,
      district: ctx.wizard.state.district,
      createdAt: new Date().toISOString()
    };

    try {
      // Firebase Realtime Database'ga saqlash
      await set(ref(db, 'users/' + telegramId), userData);

      // Muvaffaqiyatli yakunlash xabari va Worky ID taqdim etish
      await ctx.reply(
        "🎉 Tabriklayman, ro'yxatdan muvaffaqiyatli o'tdingiz!\n\n" +
        `🆔 Sizning Worky ID: ${telegramId}\n` +
        `👤 Ism: ${userData.name}\n` +
        `💼 Rol: ${userData.role === 'worker' ? 'Ishchi' : 'Ish beruvchi'}\n` +
        `📍 Hudud: ${userData.region}, ${userData.district}\n` +
        `📱 Tel: ${userData.phone}\n\n` +
        "🌐 Endi Worky saytiga kirib, yuqoridagi ID raqamingiz orqali profilingizni ochishingiz va ishlardan foydalanishni boshlashingiz mumkin!",
        Markup.removeKeyboard()
      );
    } catch (error) {
      await ctx.reply("Ma'lumotlarni saqlashda xatolik yuz berdi. Qayta urinib ko'ring.");
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

// 6. Express Web Server yo'laklari (Render port xatosini yo'qotish uchun)
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