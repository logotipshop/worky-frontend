import { Telegraf, Scenes, session, Markup } from 'telegraf';
import axios from 'axios';

const BOT_TOKEN = process.env.BOT_TOKEN;
const API_URL = "https://worky-backend-ubwp.onrender.com";

const bot = new Telegraf(BOT_TOKEN);

// O'zbekistonning barcha viloyat, tuman va shaharlari to'liq ro'yxati
const UZBEKISTAN_REGIONS = {
    "Farg'ona": ["Qo'qon shahar", "Farg'ona shahar", "Marg'ilon shahar", "Quvasoy shahar", "Beshariq", "Uchko'prik", "Rishton", "Oltiariq", "Bag'dod", "O'zbekiston", "Buvaida", "Dang'ara", "Farg'ona tumani", "Furqat", "Quva", "Toshloq", "Yozyovon", "So'x"],
    "Toshkent shahar": ["Yunusobod", "Chilonzor", "Mirzo Ulug'bek", "Yashnobod", "Sergeli", "Yakkasaroy", "Mirobod", "Shayxontohur", "Olmazor", "Uchtepa", "Bektemir", "Yangihayot"],
    "Toshkent viloyati": ["Chirchiq shahar", "Angren shahar", "Olmaliq shahar", "Bekobod shahar", "Nurafshon shahar", "Ohangaron shahar", "Yangiyo'l shahar", "Zangiota", "Qibray", "Chinoz", "Bo'stonliq", "Do'stobod", "Keles", "Oqqurgan", "Parkent", "Piskent", "Quyi Chirchiq", "O'rtashirchiq", "Yuqori Chirchiq", "Toshkent tumani"],
    "Samarqand": ["Samarqand shahar", "Kattaqo'rg'on shahar", "Urgut", "Bulung'ur", "Ishtixon", "Jomboy", "Kattaqo'rg'on tumani", "Narpay", "Nurobod", "Oqdaryo", "Payariq", "Pastdarg'om", "Paxtachi", "Samarqand tumani", "Toyloq"],
    "Andijon": ["Andijon shahar", "Asaka shahar", "Xonobod shahar", "Shahrixon shahar", "Andijon tumani", "Asaka tumani", "Baliqchi", "Bo'ston", "Buloqboshi", "Izboskan", "Jalaquduq", "Marhamat", "Oltinkul", "Paxtaobod", "Ulug'nor", "Xo'jaobod", "Shahrixon tumani"],
    "Namangan": ["Namangan shahar", "Chust", "Kosonsoy", "Uychi", "Pop", "Mingbuloq", "Namangan tumani", "Naryn", "Norin", "To'raqo'rg'on", "Uychi", "Yangiqo'rg'on", "Chortoq", "Davlatobod", "Yangi Namangan"],
    "Buxoro": ["Buxoro shahar", "Kogon shahar", "Gijduvon", "Kogon tumani", "Qorako'l", "Buxoro tumani", "Vobkent", "Jondor", "Karakul", "Olot", "Peshku", "Romitan", "Shofirkon", "Qorovulbozor"],
    "Xorazm": ["Urganch shahar", "Xiva shahar", "Gurlan", "Shovot", "Urganch tumani", "Xiva tumani", "Bog'ot", "Yangiariq", "Yangibozor", "Qo'shko'pir", "Xazorasp", "Tuproqqal'a"],
    "Qashqadaryo": ["Karshi shahar", "Shahrisabz shahar", "Kitob", "Koson", "Karshi tumani", "Chiroqchi", "Dehqonobod", "Kamashi", "Mirishkor", "Muborak", "Nishan", "Nishon", "Kasbi", "Shahrisabz tumani", "Yakkabog'", "Ko'kdala"],
    "Surxondaryo": ["Termiz shahar", "Denov", "Sherobod", "Jarqo'rg'on", "Angor", "Boysun", "Qiziriq", "Qumqo'rg'on", "Muzrabot", "Oltinsoy", "Sariosiyo", "Termiz tumani", "Uzun", "Sho'rchi"],
    "Navoiy": ["Navoiy shahar", "Zarafshon shahar", "Uchquduq shahar", "Karmana", "Kanimex", "Navbahor", "Nurota", "Tomdi", "Xatirchi", "Qiziltepa"],
    "Jizzax": ["Jizzax shahar", "Zomin", "G'allaorol", "Do'stlik", "Arnasoy", "Baxmal", "Zafarobod", "Zarbdor", "Mirzacho'l", "Paxtakor", "Forish", "Sharof Rashidov"],
    "Sirdaryo": ["Guliston shahar", "Shirin shahar", "Yangiyer shahar", "Boyovut", "Guliston tumani", "Mirzaobod", "Oqoltin", "Sayhunobod", "Sardoba", "Sirdaryo tumani"],
    "Qoraqalpog'iston": ["Nukus shahar", "Xo'jayli", "Qo'ng'irot", "Beruniy", "Amudaryo", "Chimboy", "Ellikqal'a", "Kegeyli", "Mo'ynoq", "Nukus tumani", "Qonliko'l", "Qorauzyak", "Taxtako'pir", "To'rtko'l", "Shumanay", "Bo'zatov"]
};

const registerScene = new Scenes.WizardScene(
    'REGISTER_SCENE',
    // 1. Ism so'rash
    (ctx) => {
        ctx.reply("👋 Worky platformasiga xush kelibsiz!\n\nKunlik va smenali ishlarni topish hamda ishchilarni yollash tizimi.\n\nRo'yxatdan o'tishni boshlash uchun iltimos, Ism va Familiyangizni kiriting:");
        return ctx.wizard.next();
    },
    // 2. Rol tanlash
    (ctx) => {
        ctx.wizard.state.name = ctx.message.text;
        ctx.reply("Rahmat! Endi platformadan foydalanish maqsadingizni (rolingizni) tanlang:",
            Markup.inlineKeyboard([
                [Markup.button.callback("👷 Men Ishchiman (Ish qidiraman)", "role:worker")],
                [Markup.button.callback("💼 Men Ish beruvchiman (Xodim qidiraman)", "role:employer")]
            ])
        );
        return ctx.wizard.next();
    },
    // 3. Telefon raqam so'rash
    async (ctx) => {
        const role = ctx.callbackQuery.data.split(":")[1];
        ctx.wizard.state.role = role;

        await ctx.editMessageText(role === "worker" ? "👷 Rolingiz: Ishchi" : "💼 Rolingiz: Ish beruvchi");

        ctx.reply("Pastdagi tugmani bosib telefon raqamingizni yuboring:", Markup.keyboard([
            Markup.button.contactRequest('📱 Telefon raqamni yuborish')
        ]).oneTime().resize());
        return ctx.wizard.next();
    },
    // 4. Viloyat tanlash
    async (ctx) => {
        ctx.wizard.state.phone = ctx.message.contact ? ctx.message.contact.phone_number : ctx.message.text;
        const buttons = Object.keys(UZBEKISTAN_REGIONS).map(r => Markup.button.callback(r, `region:${r}`));

        await ctx.reply("Telefon tasdiqlandi. Rahmat!", Markup.removeKeyboard());
        ctx.reply("O'zingiz faoliyat olib boradigan Viloyatni tanlang:", Markup.inlineKeyboard(buttons, { columns: 2 }));
        return ctx.wizard.next();
    },
    // 5. Tuman tanlash
    async (ctx) => {
        const region = ctx.callbackQuery.data.split(":")[1];
        ctx.wizard.state.region = region;
        const districts = UZBEKISTAN_REGIONS[region].map(d => Markup.button.callback(d, `district:${d}`));
        ctx.editMessageText(`Viloyat: ${region}\n\nEndi tegishli Tuman yoki Shaharni tanlang:`, Markup.inlineKeyboard(districts, { columns: 2 }));
        return ctx.wizard.next();
    },
    // 6. Qoidalarni ko'rsatish
    async (ctx) => {
        ctx.wizard.state.district = ctx.callbackQuery.data.split(":")[1];

        const qoidalarMatni =
            "📜 *Worky Platformasi Tartib-Intizom Qoidalari:*\n\n" +
            "*1. Ilovadan Foydalanish Umumiy Qoidalari*\n" +
            "• *Haqiqiy maʼlumotlar majburiyati:* Har bir foydalanuvchi haqiqiy ism-sharifi va telefonini kiritishi shart. Fake profillar bloklanadi.\n" +
            "• *Xavfsizlik eslatmasi:* Ish boshlashdan oldin pasport nusxasini bermang va oldindan zalog yoki yo'lkira uchun pul o'tkazmasliklari shart.\n" +
            "• *Suhbat madaniyati:* Muloqotda haqorat va firgarlik qatʼiyan taqiqlanadi.\n\n" +
            "*2. Ish Beruvchilar va Eʼlon Joylashtirish Qoidalari*\n" +
            "• *Aniq va toʻgʻri maʼlumot:* Eʼlondagi kunlik ish haqi va hudud aniq boʻlishi shart. Narxni asossiz kamaytirish taqiqlanadi.\n" +
            "• *Taqiqlangan eʼlonlar:* Tarmoqli marketing (setevoy) va chalg'ituvchi e'lonlar admin tomonidan o'chiriladi.\n\n" +
            "*3. PRO Tarifni Berish va Undan Mahrum Qilish Qoidalari*\n" +
            "• *Tasdiqlash tartibi:* Karta raqamiga toʻlov qilib, chekni @logotipshop10 ga yuborganidan keyin PRO statusi beriladi.\n" +
            "• *Olib qo'yish shartlari:* Muddat tugashi, ishchini aldash yoki 3 marta asosli shikoyat (Report) tushsa, PRO statusi olib tashlanadi.\n\n" +
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
    // 7. Yakunlash va Bazaga yozish
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
                role: data.role,
                phone: data.phone,
                region: data.region,
                district: data.district,
                is_pro: false,
                banned: false
            }, { timeout: 10000 });

            ctx.editMessageText(
                `🎉 *Ro'yxatdan o'tish muvaffaqiyatli yakunlandi!*\n\n` +
                `👤 Ism: ${data.name}\n` +
                `💼 Rol: ${data.role === "worker" ? "Ishchi" : "Ish beruvchi"}\n` +
                `📍 Hudud: ${data.region}, ${data.district}\n` +
                `🆔 *Sizning Shaxsiy ID raqamingiz:* \`${generatedId}\`\n\n` +
                `Ushbu ID raqamni ilovaga kirishda ishlating. Tizimdan to'liq foydalanishingiz mumkin!`,
                { parse_mode: 'Markdown' }
            );
        } catch (e) {
            ctx.editMessageText(
                `🎉 *Profilingiz yaratildi!*\n\n` +
                `💼 Rol: ${data.role === "worker" ? "Ishchi" : "Ish beruvchi"}\n` +
                `🆔 *Sizning Shaxsiy ID raqamingiz:* \`${generatedId}\`\n\n` +
                `ID raqamingizni saqlab qo'ying!`,
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
bot.action(/role:.+/, (ctx) => ctx.wizard.steps[2](ctx));
bot.action(/region:.+/, (ctx) => ctx.wizard.steps[4](ctx));
bot.action(/district:.+/, (ctx) => ctx.wizard.steps[5](ctx));
bot.action(/rules:.+/, (ctx) => ctx.wizard.steps[6](ctx));

bot.launch().then(() => {
    console.log('Worky Telegram Bot barcha hududlar bilan muvaffaqiyatli yonib turibdi!');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));