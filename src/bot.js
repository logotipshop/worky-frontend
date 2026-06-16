import { Telegraf, Scenes, session, Markup } from 'telegraf';
import axios from 'axios';

const BOT_TOKEN = process.env.BOT_TOKEN;
const API_URL = "https://worky-backend-ubwp.onrender.com";

const bot = new Telegraf(BOT_TOKEN);

const UZBEKISTAN_REGIONS = {
    "Farg'ona": ["Qo'qon shahar", "Farg'ona shahar", "Marg'ilon shahar", "Beshariq", "Uchko'prik", "Rishton", "Oltiariq", "Bag'dod"],
    "Toshkent shahar": ["Yunusobod", "Chilonzor", "Mirzo Ulug'bek", "Yashnobod", "Sergeli", "Yakkasaroy"],
    "Toshkent viloyati": ["Chirchiq", "Angren", "Olmaliq", "Bekobod", "Qibray", "Zangiota"],
    "Samarqand": ["Samarqand shahar", "Kattaqo'rg'on", "Urgut", "Bulung'ur", "Ishtixon"],
    "Andijon": ["Andijon shahar", "Asaka", "Shahrixon", "Xonobod", "Xo'jaobod"],
    "Namangan": ["Namangan shahar", "Chust", "Kosonsoy", "Uychi", "Pop"],
    "Buxoro": ["Buxoro shahar", "Gijduvon", "Kogon", "Qorako'l"],
    "Xorazm": ["Urganch shahar", "Xiva", "Gurlan", "Shovot"],
    "Qashqadaryo": ["Karshi shahar", "Shahrisabz", "Kitob", "Koson"],
    "Surxondaryo": ["Termiz shahar", "Denov", "Sherobod", "Jarqo'rg'on"],
    "Navoiy": ["Navoiy shahar", "Zarafshon", "Uchquduq", "Karmana"],
    "Jizzax": ["Jizzax shahar", "Zomin", "G'allaorol", "Do'stlik"],
    "Sirdaryo": ["Guliston shahar", "Shirin", "Yangiyer", "Boyovut"],
    "Qoraqalpog'iston": ["Nukus shahar", "Xo'jayli", "Qo'ng'irot", "Beruniy"]
};

const registerScene = new Scenes.WizardScene(
    'REGISTER_SCENE',
    (ctx) => {
        ctx.reply("👋 Worky platformasiga xush kelibsiz!\n\nKunlik va smenali ishlarni topish hamda ishchilarni yollash tizimi.\n\nRo'yxatdan o'tishni boshlash uchun iltimos, Ism va Familiyangizni kiriting:");
        return ctx.wizard.next();
    },
    (ctx) => {
        ctx.wizard.state.name = ctx.message.text;
        ctx.reply(`Rahmat, ${ctx.message.text}! Endi quyidagi tugmani bosib telefon raqamingizni tasdiqlang:`, Markup.keyboard([
            Markup.button.contactRequest('📱 Telefon raqamni yuborish')
        ]).oneTime().resize());
        return ctx.wizard.next();
    },
    async (ctx) => {
        ctx.wizard.state.phone = ctx.message.contact ? ctx.message.contact.phone_number : ctx.message.text;
        const buttons = Object.keys(UZBEKISTAN_REGIONS).map(r => Markup.button.callback(r, `region:${r}`));

        // Eski reply tugmani o'chirish uchun
        await ctx.reply("Telefon tasdiqlandi. Rahmat!", Markup.removeKeyboard());

        ctx.reply("O'zingiz faoliyat olib boradigan Viloyatni tanlang:", Markup.inlineKeyboard(buttons, { columns: 2 }));
        return ctx.wizard.next();
    },
    async (ctx) => {
        const region = ctx.callbackQuery.data.split(":")[1];
        ctx.wizard.state.region = region;
        const districts = UZBEKISTAN_REGIONS[region].map(d => Markup.button.callback(d, `district:${d}`));
        ctx.editMessageText(`Viloyat: ${region}\n\nEndi tegishli Tuman yoki Shaharni tanlang:`, Markup.inlineKeyboard(districts, { columns: 2 }));
        return ctx.wizard.next();
    },
    async (ctx) => {
        ctx.wizard.state.district = ctx.callbackQuery.data.split(":")[1];

        const qoidalarMatni =
            "📜 *Worky Platformasi Tartib-Intizom Qoidalari:*\n\n" +
            "*1. Ilovadan Foydalanish Umumiy Qoidalari*\n" +
            "• *Haqiqiy maʼlumotlar majburiyati:* Har bir foydalanuvchi botdan roʻyxatdan oʻtayotganda oʻzining haqiqiy ism-sharifi va faol telefon raqamini kiritishi shart. Fake (yolgʻon) profillar aniqlansa, ogohlantirishsiz bloklanadi.\n" +
            "• *Xavfsizlik eslatmasi:* Ishchilar ish boshlashdan oldin hech kimga pasport nusxalarini bermasliklari, ish beruvchilar esa zalog (garov) yoki yoʻlkira uchun oldindan pul oʻtkazmasliklari shart.\n" +
            "• *Suhbat madaniyati:* Ariza qabul qilingandan keyin Telegram orqali bogʻlanilganda oʻzaro haqorat, behayo soʻzlar ishlatish yoki firgarlik qilish qatʼiyan taqiqlanadi.\n\n" +
            "*2. Ish Beruvchilar va Eʼlon Joylashtirish Qoidalari*\n" +
            "• *Aniq va toʻgʻri maʼlumot:* Eʼlondagi kunlik ish haqi (wage), ish joyi (place) va hudud (region/district) toʻliq va aniq koʻrsatilishi kerak. Keyinchalik ish joyida narxni asossiz kamaytirish taqiqlanadi.\n" +
            "• *Taqiqlangan eʼlonlar:* Qonunga xilof, tarmoqli marketing (setevoy), yolgʻon onlayn daromad va foydalanuvchilarni chalgʻituvchi shubhali eʼlonlarni joylashtirish taqiqlanadi.\n\n" +
            "*3. PRO Tarifni Berish va Undan Mahrum Qilish Qoidalari*\n" +
            "• *Tasdiqlash tartibi:* Foydalanuvchi ilovadagi karta raqamiga toʻlov qilib, chek va shaxsiy ID raqamini @logotipshop10 profiliga yuborganidan keyin unga PRO statusi beriladi.\n" +
            "• *Olib qo'yish shartlari:* Muddat tugashi (30 kun), ishchilarni aldash (haqini bermaslik) yoki foydalanuvchilardan 3 marta asosli shikoyat (Report) tushsa, PRO statusi zudlik bilan olib tashlanadi.\n\n" +
            "Ilovadan foydalanish uchun barcha qoidalarni qabul qilasizmi?";

        ctx.editMessageText(qoidalarMatni, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                Markup.button.callback("✅ Qoidalarni qabul qilaman va roziman", "rules:accept"),
                Markup.button.callback("❌ Rad etish", "rules:reject")
            ])
        });
        return ctx.wizard.next();
    },
    async (ctx) => {
        const decision = ctx.callbackQuery.data.split(":")[1];

        if (decision === 'reject') {
            ctx.editMessageText("❌ Siz qoidalarni rad etdingiz. Worky platformasidan ro'yxatdan o'tmasdan foydalana olmaysiz. Qayta boshlash uchun /start yozing.");
            return ctx.scene.leave();
        }

        const data = ctx.wizard.state;
        const generatedId = `WRK${ctx.from.id.toString().slice(-5)}`;

        try {
            await axios.post(`${API_URL}/users`, {
                id: generatedId,
                telegram_id: ctx.from.id,
                name: data.name,
                phone: data.phone,
                region: data.region,
                district: data.district,
                is_pro: false,
                banned: false
            }, { timeout: 10000 });

            ctx.editMessageText(
                `🎉 *Ro'yxatdan o'tish muvaffaqiyatli yakunlandi!*\n\n` +
                `👤 Ism: ${data.name}\n` +
                `📍 Hudud: ${data.region}, ${data.district}\n` +
                `🆔 *Sizning Shaxsiy ID raqamingiz:* \`${generatedId}\`\n\n` +
                `Ushbu ID raqamni ilovaga kirishda yoki PRO tarifni sotib olayotganda ishlating. Tizimdan to'liq foydalanishingiz mumkin!`,
                { parse_mode: 'Markdown' }
            );
        } catch (e) {
            // Backend vaqtinchalik o'chiq bo'lsa ham lokal ID beradi
            ctx.editMessageText(
                `🎉 *Profilingiz yaratildi (Lokal)!*\n\n` +
                `🆔 *Sizning Shaxsiy ID raqamingiz:* \`${generatedId}\`\n\n` +
                `Hozirda backend server yangilanayotgan bo'lishi mumkin. ID raqamingizni saqlab qo'ying!`,
                { parse_mode: 'Markdown' }
            );
        }
        return ctx.scene.leave();
    }
);

const stage = new Scenes.Stage([registerScene]);
bot.use(session());
bot.use(stage.middleware());

bot.start((ctx) => ctx.scene.enter('REGISTER_SCENE'));
bot.action(/region:.+/, (ctx) => ctx.wizard.steps[3](ctx));
bot.action(/district:.+/, (ctx) => ctx.wizard.steps[4](ctx));
bot.action(/rules:.+/, (ctx) => ctx.wizard.steps[5](ctx));

bot.launch().then(() => {
    console.log('Worky Telegram Bot muvaffaqiyatli yonib turibdi!');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));