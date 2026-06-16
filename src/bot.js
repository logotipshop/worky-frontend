import logging
import requests
from aiogram import Bot, Dispatcher, types
from aiogram.contrib.fsm_storage.memory import MemoryStorage
from aiogram.dispatcher import FSMContext
from aiogram.dispatcher.filters.state import State, StatesGroup
from aiogram.utils import executor

# Backend API va Bot Tokeni
API_URL = "https://worky-backend-ubwp.onrender.com"
BOT_TOKEN = "8774789236:AAEiyfMt8rJ0QTmNMLX4A3DMx1ALJo0au-8"  #

logging.basicConfig(level=logging.INFO)
bot = Bot(token=BOT_TOKEN)
storage = MemoryStorage()
dp = Dispatcher(bot, storage=storage)

# Butun O'zbekiston hududlar tuzilmasi
UZBEKISTAN_REGIONS = {
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
}

# Ro'yxatdan o'tish holatlari (FSM)
class RegisterState(StatesGroup):
    name = State()
    phone = State()
    region = State()
    district = State()
    rules = State()

# 1. /START BUYRUG'I
@dp.message_handler(commands=['start'], state="*")
async def start_cmd(message: types.Message, state: FSMContext):
    await state.finish()
    await message.answer(
        "👋 **Worky platformasiga xush kelibsiz!**\n\n"
        "Kunlik va smenali ishlarni topish hamda ishchilarni yollash tizimi.\n"
        "Ro'yxatdan o'tishni boshlash uchun iltimos, **Ism va Familiyangizni** kiriting:"
    )
    await RegisterState.name.set()

# 2. ISM QABUL QILISH
@dp.message_handler(state=RegisterState.name)
async def process_name(message: types.Message, state: FSMContext):
    await state.update_data(name=message.text)

    # Telefon yuborish tugmasi
    keyboard = types.ReplyKeyboardMarkup(row_width=1, resize_keyboard=True, one_time_keyboard=True)
    keyboard.add(types.KeyboardButton(text="📱 Telefon raqamni yuborish", request_contact=True))

    await message.answer(
        f"Rahmat, {message.text}! Endi quyidagi tugmani bosib telefon raqamingizni tasdiqlang:",
        reply_markup=keyboard
    )
    await RegisterState.phone.set()

# 3. TELEFON RAQAM QABUL QILISH
@dp.message_handler(content_types=['contact', 'text'], state=RegisterState.phone)
async def process_phone(message: types.Message, state: FSMContext):
    phone_number = ""
    if message.contact:
        phone_number = message.contact.phone_number
    else:
        phone_number = message.text
        if not phone_number.startswith("+") and not phone_number.isdigit():
            await message.answer("Iltimos, pastdagi tugmani bosing yoki raqamni to'g'ri formatda yuboring!")
            return

    await state.update_data(phone=phone_number)

    # Viloyatlar inline tugmalari
    keyboard = types.InlineKeyboardMarkup(row_width=2)
    buttons = [types.InlineKeyboardButton(text=r, callback_data=f"region:{r}") for r in UZBEKISTAN_REGIONS.keys()]
    keyboard.add(*buttons)

    # Eski reply tugmani yo'qotish
    remove_kb = types.ReplyKeyboardRemove()
    await message.answer("Telefon tasdiqlandi. Rahmat!", reply_markup=remove_kb)

    await message.answer("O'zingiz faoliyat olib boradigan **Viloyatni** tanlang:", reply_markup=keyboard)
    await RegisterState.region.set()

# 4. VILOYAT TANLASH (CALLBACK)
@dp.callback_query_handler(lambda c: c.data.startswith('region:'), state=RegisterState.region)
async def process_region(callback_query: types.CallbackQuery, state: FSMContext):
    selected_region = callback_query.data.split(":")[1]
    await state.update_data(region=selected_region)

    # Tumanlar inline tugmalari
    keyboard = types.InlineKeyboardMarkup(row_width=2)
    districts = UZBEKISTAN_REGIONS[selected_region]
    buttons = [types.InlineKeyboardButton(text=d, callback_data=f"district:{d}") for d in districts]
    keyboard.add(*buttons)

    await bot.answer_callback_query(callback_query.id)
    await bot.edit_message_text(
        text=f"Viloyat: {selected_region}\n\nEndi tegishli **Tuman yoki Shaharni** tanlang:",
        chat_id=callback_query.message.chat_id,
        message_id=callback_query.message.message_id,
        reply_markup=keyboard
    )
    await RegisterState.district.set()

# 5. TUMAN TANLASH (CALLBACK)
@dp.callback_query_handler(lambda c: c.data.startswith('district:'), state=RegisterState.district)
async def process_district(callback_query: types.CallbackQuery, state: FSMContext):
    selected_district = callback_query.data.split(":")[1]
    await state.update_data(district=selected_district)

    # Qoidalar tugmalari
    keyboard = types.InlineKeyboardMarkup(row_width=1)
    keyboard.add(
        types.InlineKeyboardButton(text="✅ Qoidalarni qabul qilaman va roziman", callback_data="rules:accept"),
        types.InlineKeyboardButton(text="❌ Rad etish", callback_data="rules:reject")
    )

    await bot.answer_callback_query(callback_query.id)
    await bot.edit_message_text(
        text=(
            "📜 **Worky Platformasi Tartib-Intizom Qoidalari:**\n\n"
            "1. **Haqiqiy ma'lumot:** Fake profillar va yolg'on ismlar ogohlantirishsiz bloklanadi.\n"
            "2. **Xavfsizlik:** Ish boshlashdan oldin hech kimga pasport nusxangizni bermang va oldindan pul o'tkazmang!\n"
            "3. **Suhbat madaniyati:** Aloqaga chiqilganda haqorat yoki firgarlik qilish qat'iyan taqiqlanadi.\n"
            "4. **E'lon qoidasi:** Yolg'on narxlar, setevoy marketing yoki chalg'ituvchi e'lonlar admin tomonidan o'chiriladi.\n\n"
            "Ilovadan foydalanish uchun qoidalarni qabul qilasizmi?"
        ),
        chat_id=callback_query.message.chat_id,
        message_id=callback_query.message.message_id,
        reply_markup=keyboard
    )
    await RegisterState.rules.set()

# 6. QOIDALARNI TASDIQLASH VA BAZAGA YUBORISH
@dp.callback_query_handler(lambda c: c.data.startswith('rules:'), state=RegisterState.rules)
async def process_rules(callback_query: types.CallbackQuery, state: FSMContext):
    decision = callback_query.data.split(":")[1]
    await bot.answer_callback_query(callback_query.id)

    if decision == "reject":
        await state.finish()
        await bot.edit_message_text(
            text="❌ Siz qoidalarni rad etdingiz. Worky platformasidan ro'yxatdan o'tmasdan foydalana olmaysiz. Qayta boshlash uchun /start yozing.",
            chat_id=callback_query.message.chat_id,
            message_id=callback_query.message.message_id
        )
        return

    # Ma'lumotlarni yig'ish
    user_data = await state.get_data()
    telegram_id = callback_query.from_user.id

    # Shaxsiy ID generatsiya qilish (Masalan: WRK + Oxirgi 5 raqam)
    generated_id = f"WRK{str(telegram_id)[-5:]}"

    # Backend'ga yuboriladigan tayyor ma'lumotlar tuzilmasi
    payload = {
        "id": generated_id,
        "telegram_id": telegram_id,
        "name": user_data['name'],
        "phone": user_data['phone'],
        "region": user_data['region'],
        "district": user_data['district'],
        "is_pro": False,
        "banned": False
    }

    # Backend'ga yozish (API so'rovi)
    try:
        response = requests.post(f"{API_URL}/users", json=payload, timeout=10)
        if response.status_code in [200, 201]:
            await bot.edit_message_text(
                text=(
                    f"🎉 **Ro'yxatdan o'tish muvaffaqiyatli yakunlandi!**\n\n"
                    f"👤 Ism: {payload['name']}\n"
                    f"📍 Hudud: {payload['region']}, {payload['district']}\n"
                    f"🆔 **Sizning Shaxsiy ID raqamingiz:** `{generated_id}`\n\n"
                    f"Ushbu ID raqamni ilovaga kirishda yoki PRO tarifni sotib olayotganda ishlating. "
                    f"Ilovaga qaytib, tizimdan to'liq foydalanishingiz mumkin!"
                ),
                chat_id=callback_query.message.chat_id,
                message_id=callback_query.message.message_id,
                parse_mode="Markdown"
            )
        else:
            await bot.edit_message_text(
                text="⚠️ Backend bazaga ulanishda xatolik yuz berdi, lekin profilingiz tayyor. Birozdan so'ng /start buyrug'ini qayta yuboring.",
                chat_id=callback_query.message.chat_id,
                message_id=callback_query.message.message_id
            )
    except Exception as e:
        # Agar backend o'chiq bo'lsa ham foydalanuvchiga ID ko'rsatiladi
        await bot.edit_message_text(
            text=(
                f"🎉 **Profilingiz yaratildi (Lokal)!**\n\n"
                f"🆔 **Sizning Shaxsiy ID raqamingiz:** `{generated_id}`\n\n"
                f"Hozirda backend server yangilanayotgan bo'lishi mumkin. ID raqamingizni saqlab qo'ying!"
            ),
            chat_id=callback_query.message.chat_id,
            message_id=callback_query.message.message_id,
            parse_mode="Markdown"
        )

    await state.finish()

if __name__ == '__main__':
    executor.start_polling(dp, skip_updates=True)