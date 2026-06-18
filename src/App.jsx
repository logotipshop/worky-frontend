import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, get, set, push, remove } from 'firebase/database';

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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// KATEGORIYALAR RO'YXATI
const CATEGORIES = ["Qurilish & Ta'mirlash", "IT & Dasturlash", "Restoran & Kafe", "Yuk tashish", "Gullar & Sovg'alar", "Uy xizmatlari", "Boshqa"];

// === ASOSIY APP KOMPONENTI ===
export default function App() {
  const [telegramId, setTelegramId] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [currentHoliday, setCurrentHoliday] = useState('oddiy');
  const [logoText, setLogoText] = useState('Worky');

  useEffect(() => {
    // Jonli ravishda Admin tomondan o'rnatilgan dizayn va bayram sozlamalarini yuklash
    onValue(ref(db, 'settings/theme'), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        if (data.primaryColor) document.documentElement.style.setProperty('--main-color', data.primaryColor);
        if (data.backgroundColor) document.documentElement.style.setProperty('--bg-color', data.backgroundColor);
        if (data.holiday) setCurrentHoliday(data.holiday);
        if (data.logoText) setLogoText(data.logoText);

        if (data.fontFamily) {
          const fontLink = document.getElementById('google-font-link');
          if (fontLink) {
            fontLink.href = `https://fonts.googleapis.com/css2?family=${data.fontFamily.replace(/ /g, '+')}:wght@300;400;500;700&display=swap`;
          }
          document.body.style.fontFamily = `'${data.fontFamily}', sans-serif`;
        }
      }
    });
  }, []);

  // PRO Obunani vaqt bo'yicha tekshirish (Real-time xavfsizlik)
  useEffect(() => {
    if (user && user.isPro && user.proExpireAt) {
      if (Date.now() > user.proExpireAt) {
        // Muddat tugagan bo'lsa avtomatik oddiy holatga qaytarish
        set(ref(db, `users/${user.telegramId}/isPro`), false);
        set(ref(db, `users/${user.telegramId}/proExpireAt`), "");
        setUser(prev => ({ ...prev, isPro: false, proExpireAt: "" }));
        alert("Sizning PRO obunangiz muddati tugadi. Iltimos, yangilang!");
      }
    }
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!telegramId || !password) return alert('Hamma maydonlarni kiriting!');

    if (telegramId === 'ADMIN777' && password === 'ADMIN777') {
      setIsAdmin(true);
      return;
    }

    try {
      const userRef = ref(db, `users/${telegramId}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const userData = snapshot.val();

        // PAROL XAVFSIZLIGI LOGIKASI
        if (!userData.password || userData.password === "") {
          // Birinchi marta kirganda parolni o'rnatish
          await set(ref(db, `users/${telegramId}/password`), password);
          userData.password = password;
          setUser(userData);
          setLoginError('');
          alert("Profilingiz uchun maxfiy parol muvaffaqiyatli o'rnatildi!");
        } else if (userData.password === password) {
          setUser(userData);
          setLoginError('');
        } else {
          setLoginError('Xato maxfiy parol! Iltimos, qayta urining.');
        }
      } else {
        setLoginError('Bunday Telegram ID topilmadi! Avval botdan roʻyxatdan oʻting.');
      }
    } catch (error) {
      setLoginError('Ulanishda xatolik yuz berdi.');
    }
  };

  // Bayramona bezaklar va emojilar mantiqi
  const getHolidayDecoration = () => {
    if (currentHoliday === 'yangi_yil') return { emoji: "❄️", banner: "🎉 Yangi Yilingiz Muborak! 🎄" };
    if (currentHoliday === 'navruz') return { emoji: "🌱", banner: "🌸 Navro'z Ayomi Muborak! 🌾" };
    if (currentHoliday === 'ramazon') return { emoji: "🌙", banner: "🕌 Ramazon Oyi Muborak! ✨" };
    return { emoji: "💼", banner: "" };
  };

  const dec = getHolidayDecoration();

  if (isAdmin) return <AdminPanel onLogout={() => setIsAdmin(false)} currentHoliday={currentHoliday} logoText={logoText} />;
  if (user) return <Dashboard user={user} setUser={setUser} onLogout={() => setUser(null)} dec={dec} logoText={logoText} />;

  return (
    <div style={styles.loginContainer}>
      <link id="google-font-link" rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700&display=swap" />
      <div style={styles.loginCard}>
        <div style={styles.logoRow}>
          <span style={{fontSize: '24px'}}>{dec.emoji}</span>
          <h2 style={{ color: 'var(--main-color, #1D9E75)', margin: '0 0 0 8px' }}>{logoText}</h2>
        </div>
        {dec.banner && <div style={styles.holidayBanner}>{dec.banner}</div>}
        <form onSubmit={handleLogin} style={styles.formContainer}>
          <input type="number" placeholder="Telegram ID raqamingiz..." value={telegramId} onChange={(e) => setTelegramId(e.target.value)} style={styles.input} />
          <input type="password" placeholder="Maxfiy parolingiz..." value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} />

          {/* SIZ XOHLAGAN TUShUNARLI OGOHLANTIRISH */}
          <div style={styles.loginNote}>
            🚨 <b>MUHIM ESLATMA:</b> Saytga birinchi marta kirayotganingizda oʻzingiz unutilmaydigan mustahkam parol oʻylab topib kiriting! Bu parol sizning profilingizni himoya qilish uchun saqlab qolinadi. Worky ID raqamingiz boshqa foydalanuvchilarga koʻrinib turadi, shuning uchun parolingizni mutlaqo hech kimga aytmang va unutmang! Parol — profilingiz kalitidir.
          </div>

          {loginError && <p style={styles.errorText}>{loginError}</p>}
          <button type="submit" style={styles.button}>Tizimga kirish</button>
        </form>
      </div>
    </div>
  );
}

// === CENTRAL DASHBOARD PANELI ===
function Dashboard({ user, setUser, onLogout, dec, logoText }) {
  const [activeTab, setActiveTab] = useState('main');
  const [allWorkers, setAllWorkers] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [myApplications, setMyApplications] = useState([]); // Kelgan takliflar
  const [sentApplications, setSentApplications] = useState([]); // Yuborilgan takliflar
  const [showProModal, setShowProModal] = useState(false);

  // Profil tahrirlash state'lari
  const [profileName, setProfileName] = useState(user.name || '');
  const [profilePhone, setProfilePhone] = useState(user.phone || '');
  const [profileLink, setProfileLink] = useState(user.telegramLink || '');
  const [profileImg, setProfileImg] = useState(user.avatar || '');

  // E'lon berish state'lari (Ish beruvchi uchun)
  const [jobTitle, setJobTitle] = useState('');
  const [jobCategory, setJobCategory] = useState(CATEGORIES[0]);
  const [jobFormat, setJobFormat] = useState('offline'); // offline yoki online
  const [jobSalary, setJobSalary] = useState('');
  const [jobHours, setJobHours] = useState('');
  const [jobDesc, setJobDesc] = useState('');

  // Filtrlash va Reyting
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedFormat, setSelectedFormat] = useState('All');
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [activeReviewWorkerId, setActiveReviewWorkerId] = useState(null);

  // Shikoyat state'lari
  const [targetId, setTargetId] = useState('');
  const [reportReason, setReportReason] = useState('');

  useEffect(() => {
    // Bazadan foydalanuvchilarni olish
    onValue(ref(db, 'users'), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const workers = Object.keys(data).map(key => ({ id: key, ...data[key] })).filter(u => u.role === 'worker');
        setAllWorkers(workers);
      }
    });

    // Bazadan barcha ish e'lonlarini olish
    onValue(ref(db, 'jobs'), (snapshot) => {
      const data = snapshot.val();
      if (data) setAllJobs(Object.keys(data).map(key => ({ id: key, ...data[key] })));
      else setAllJobs([]);
    });

    // Arizalarni kuzatish
    onValue(ref(db, 'job_applications'), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setMyApplications(list.filter(app => app.workerId === user.telegramId));
        setSentApplications(list.filter(app => app.employerId === user.telegramId));
      } else {
        setMyApplications([]);
        setSentApplications([]);
      }
    });
  }, [user.telegramId]);

  // Profil rasmini rasm yuklash orqali Base64 formatga o'tkazish
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfileImg(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Profilni saqlash
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profilePhone || !profileLink) return alert('Telefon va Telegram havola majburiy!');
    const updated = { ...user, name: profileName, phone: profilePhone, telegramLink: profileLink, avatar: profileImg };
    await set(ref(db, `users/${user.telegramId}`), updated);
    setUser(updated);
    alert('Profil yangilandi!');
  };

  // Ish Beruvchi yangi e'lon qo'shishi
  const handleAddJob = async (e) => {
    e.preventDefault();
    if (!jobTitle || !jobSalary || !jobHours || !jobDesc) return alert('Barcha maydonlarni to\'ldiring!');

    await set(push(ref(db, 'jobs')), {
      employerId: user.telegramId,
      employerName: user.name,
      employerPhone: user.phone,
      employerLink: user.telegramLink || '',
      title: jobTitle,
      category: jobCategory,
      format: jobFormat,
      salary: jobSalary,
      hours: jobHours,
      desc: jobDesc,
      region: user.region || 'Toshkent',
      district: user.district || 'Yunusobod',
      createdAt: new Date().toISOString()
    });

    alert('Ish e\'loni muvaffaqiyatli joylandi!');
    setJobTitle(''); setJobSalary(''); setJobHours(''); setJobDesc('');
    setActiveTab('my_jobs');
  };

  // Ish beruvchi e'lonni o'chirishi
  const handleDeleteJob = async (jobId) => {
    if (window.confirm("Bu e'lonni o'chirmoqchimisiz?")) {
      await remove(ref(db, `jobs/${jobId}`));
      alert("E'lon o'chirildi.");
    }
  };

  // Ish beruvchi ishchiga taklif yuborishi
  const handleSendApplication = async (worker) => {
    const exist = sentApplications.find(app => app.workerId === worker.telegramId);
    if (exist) return alert('Bu ishchiga allaqachon ariza yuborilgan!');

    await set(push(ref(db, 'job_applications')), {
      employerId: user.telegramId,
      employerName: user.name,
      employerPhone: user.phone,
      employerLink: user.telegramLink || '',
      workerId: worker.telegramId,
      workerName: worker.name,
      workerPhone: worker.phone || '',
      workerLink: worker.telegramLink || '',
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    alert('Taklif yuborildi!');
  };

  const handleAcceptApp = async (appId) => {
    await set(ref(db, `job_applications/${appId}/status`), 'accepted');
  };

  const handleDeclineApp = async (appId) => {
    await set(ref(db, `job_applications/${appId}/status`), 'declined');
  };

  // Ishchiga sharh va reyting qoldirish mantiqi
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewText) return alert('Sharh matnini yozing!');

    const workerRef = ref(db, `users/${activeReviewWorkerId}`);
    const snapshot = await get(workerRef);
    if (snapshot.exists()) {
      const wData = snapshot.val();
      const currentReviews = wData.reviews ? Object.values(wData.reviews) : [];
      const newReview = { rating: Number(reviewRating), text: reviewText, from: user.name };

      // Yangi reyting o'rtachasini hisoblash
      const allRatings = [...currentReviews.map(r => r.rating), Number(reviewRating)];
      const avgRating = allRatings.reduce((a, b) => a + b, 0) / allRatings.length;

      await set(push(ref(db, `users/${activeReviewWorkerId}/reviews`)), newReview);
      await set(ref(db, `users/${activeReviewWorkerId}/rating`), avgRating.toFixed(1));

      alert('Baho va sharhingiz saqlandi!');
      setReviewText('');
      setActiveReviewWorkerId(null);
    }
  };

  // Mukammal xavfsiz shikoyat yuborish tizimi (Ikkala tomonning link va raqamlari bilan)
  const handleSendReport = async (e) => {
    e.preventDefault();
    if (!targetId || !reportReason) return alert('Hamma maydonlarni to\'ldiring!');

    // Qoidabuzar ma'lumotlarini qidirish
    const targetSnapshot = await get(ref(db, `users/${targetId}`));
    let targetName = "Noma'lum";
    let targetPhone = "Kiritilmagan";
    let targetLink = "";

    if (targetSnapshot.exists()) {
      const tData = targetSnapshot.val();
      targetName = tData.name;
      targetPhone = tData.phone || "Kiritilmagan";
      targetLink = tData.telegramLink || "";
    }

    await set(push(ref(db, 'reports')), {
      reporterId: user.telegramId,
      reporterName: user.name,
      reporterPhone: user.phone || 'Noma\'lum',
      reporterLink: user.telegramLink || '',
      accusedId: targetId,
      accusedName: targetName,
      accusedPhone: targetPhone,
      accusedLink: targetLink,
      reason: reportReason,
      createdAt: new Date().toISOString()
    });

    alert('Shikoyat adminga to\'liq ma\'lumotlar bilan muvaffaqiyatli yetkazildi!');
    setTargetId(''); setReportReason('');
  };

  // YaQIN ATROF VA REYTING BO'YICHA FILTRLASh (Ish beruvchi qidiruvi)
  const getFilteredWorkers = () => {
    let list = [...allWorkers];
    if (searchQuery) list = list.filter(w => w.name.toLowerCase().includes(searchQuery.toLowerCase()));

    // Agar format online bo'lsa manzil o'chadi, reyting eng kottalari tepaga chiqadi
    if (selectedFormat === 'online') {
      return list.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    } else {
      // Offline bo'lsa yaqin atrofdan tuman bo'yicha filter va saralash
      return list.filter(w => w.district === user.district);
    }
  };

  // Ishchi uchun kelgan mos e'lonlar filteri
  const getFilteredJobs = () => {
    let list = [...allJobs];
    if (selectedCategory !== 'All') list = list.filter(j => j.category === selectedCategory);
    if (selectedFormat !== 'All') list = list.filter(j => j.format === selectedFormat);
    return list;
  };

  // Telegram avtomatik avto-xabar ssilkasi generatori
  const proTelegramText = encodeURIComponent(`Salom Temur, men Worky saytida PRO sotib olmoqchiman. Mening Worky ID raqamim: ${user.telegramId}`);

  return (
    <div style={styles.dashboardContainer}>
      {/* SideBar */}
      <div style={styles.sidebar}>
        <div style={{ textAlign: 'center', marginBottom: '15px' }}>
          <div style={styles.logoRowSidebar}>
            <span style={{fontSize: '20px'}}>{dec.emoji}</span>
            <h3 style={{ color: '#fff', margin: '0 0 0 5px' }}>{logoText}</h3>
          </div>
          <div style={{marginTop: '5px'}}>
            {user.avatar ? <img src={user.avatar} alt="avatar" style={styles.sideAvatar} /> : <div style={styles.sideNoAvatar}>{user.name[0]}</div>}
          </div>
          <span style={styles.roleBadge}>{user.role === 'worker' ? '👷 Ishchi' : '💼 Ish Beruvchi'}</span>
          {user.isPro ? <span style={styles.proActiveBadge}>👑 PRO FAOL</span> : <button onClick={() => setShowProModal(true)} style={styles.getProBtn}>👑 PRO OLISh</button>}
        </div>

        <button onClick={() => setActiveTab('main')} style={{...styles.menuBtn, backgroundColor: activeTab === 'main' ? 'var(--main-color)' : '#34495e'}}>🏠 Bosh sahifa</button>
        <button onClick={() => setActiveTab('profile')} style={{...styles.menuBtn, backgroundColor: activeTab === 'profile' ? 'var(--main-color)' : '#34495e'}}>👤 Profil sozlamalari</button>

        {user.role === 'employer' && <button onClick={() => setActiveTab('add_job')} style={{...styles.menuBtn, backgroundColor: activeTab === 'add_job' ? 'var(--main-color)' : '#34495e'}}>➕ Yangi Ish Qo'shish</button>}
        {user.role === 'employer' && <button onClick={() => setActiveTab('my_jobs')} style={{...styles.menuBtn, backgroundColor: activeTab === 'my_jobs' ? 'var(--main-color)' : '#34495e'}}>📋 Mening E'lonlarim</button>}
        {user.role === 'employer' && <button onClick={() => setActiveTab('find_workers')} style={{...styles.menuBtn, backgroundColor: activeTab === 'find_workers' ? 'var(--main-color)' : '#34495e'}}>🔍 Ishchi Qidirish</button>}

        {user.role === 'worker' && <button onClick={() => setActiveTab('job_feed')} style={{...styles.menuBtn, backgroundColor: activeTab === 'job_feed' ? 'var(--main-color)' : '#34495e'}}>🗂️ Ish E'lonlari Tasmasi</button>}
        {user.role === 'worker' && <button onClick={() => setActiveTab('my_requests')} style={{...styles.menuBtn, backgroundColor: activeTab === 'my_requests' ? 'var(--main-color)' : '#34495e'}}>📩 Kelgan Takliflar ({myApplications.filter(a=>a.status==='pending').length})</button>}

        <button onClick={() => setActiveTab('report')} style={{...styles.menuBtn, backgroundColor: activeTab === 'report' ? 'var(--main-color)' : '#34495e'}}>🚨 Shikoyat Berish</button>
        <button onClick={onLogout} style={styles.logoutBtn}>Chiqish</button>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {activeTab === 'main' && (
          <div style={styles.welcomeCard}>
            <h1 style={{ color: 'var(--main-color, #1D9E75)', margin: '0 0 10px 0' }}>Xush kelibsiz, {user.name}!</h1>
            <p>🆔 Sizning unikal Worky ID: <b>{user.telegramId}</b> (Buni shikoyatlarda ishlating)</p>
            <p>📍 Sizning hududingiz: <b>{user.region}, {user.district}</b></p>
            <p>📊 Status: {user.isPro ? <b style={{color: '#f1c40f'}}>👑 PRO Premium Foydalanuvchi</b> : <b>Oddiy rejim</b>}</p>
          </div>
        )}

        {/* PROFIL TAHRIRLASh OYNASI */}
        {activeTab === 'profile' && (
          <div style={styles.cardContainer}>
            <h2>👤 Profilni tahrirlash</h2>
            <form onSubmit={handleSaveProfile} style={styles.dashboardForm}>
              <label style={styles.label}>Foydalanuvchi ismi va familiyasi:</label>
              <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} style={styles.inputField} />

              <label style={styles.label}>Telefon raqamingiz (Majburiy):</label>
              <input type="text" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} style={styles.inputField} placeholder="+998901234567" />

              <label style={styles.label}>Telegram Profil Linki (Majburiy):</label>
              <input type="text" value={profileLink} onChange={(e) => setProfileLink(e.target.value)} style={styles.inputField} placeholder="https://t.me/username" />

              <label style={styles.label}>Profil rasmi (Avatar):</label>
              <input type="file" accept="image/*" onChange={handleImageChange} style={styles.fileInput} />
              {profileImg && <img src={profileImg} alt="Preview" style={styles.avatarPreview} />}

              <button type="submit" style={styles.saveProfileBtn}>O'zgarishlarni saqlash</button>
            </form>
          </div>
        )}

        {/* ISH BERUVCHI: ISH QO'SHISh */}
        {activeTab === 'add_job' && user.role === 'employer' && (
          <div style={styles.cardContainer}>
            <h2>➕ Yangi ish e'loni yaratish</h2>
            <form onSubmit={handleAddJob} style={styles.dashboardForm}>
              <input type="text" placeholder="Ish nomi (Masalan: Mebel ustasi kerak)" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} style={styles.inputField} />
              <select value={jobCategory} onChange={(e) => setJobCategory(e.target.value)} style={styles.inputField}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={jobFormat} onChange={(e) => setJobFormat(e.target.value)} style={styles.inputField}>
                <option value="offline">Offline (Tuman bo'yicha usta)</option>
                <option value="online">Online (Masofaviy ish)</option>
              </select>
              <input type="text" placeholder="To'lov maoshi (Masalan: 300,000 so'm / kunlik)" value={jobSalary} onChange={(e) => setJobSalary(e.target.value)} style={styles.inputField} />
              <input type="text" placeholder="Ish vaqti / soati (Masalan: Kuniga 6 soat)" value={jobHours} onChange={(e) => setJobHours(e.target.value)} style={styles.inputField} />
              <textarea placeholder="Ish sharoitlari va talablar haqida batafsil ma'lumot..." value={jobDesc} onChange={(e) => setJobDesc(e.target.value)} style={styles.textareaField}></textarea>
              <button type="submit" style={{...styles.actionButton, backgroundColor: 'var(--main-color)', padding: '12px'}}>E'lonni nashr qilish</button>
            </form>
          </div>
        )}

        {/* ISH BERUVCHI: MENING E'LONLARIM */}
        {activeTab === 'my_jobs' && user.role === 'employer' && (
          <div>
            <h2>📋 Siz joylagan ish e'lonlari</h2>
            <div style={styles.workersGrid}>
              {allJobs.filter(j => j.employerId === user.telegramId).map(job => (
                <div key={job.id} style={styles.workerCard}>
                  <h3>{job.title}</h3>
                  <p>📁 <b>Kategoriya:</b> {job.category}</p>
                  <p>🌐 <b>Format:</b> {job.format.toUpperCase()}</p>
                  <p>💰 <b>Maosh:</b> {job.salary}</p>
                  <p>⏱️ <b>Vaqt:</b> {job.hours}</p>
                  <p>📝 <b>Izoh:</b> {job.desc}</p>
                  <button onClick={() => handleDeleteJob(job.id)} style={{...styles.actionButton, backgroundColor: '#e74c3c', width: '100%', padding: '8px', marginTop: '10px'}}>E'lonni o'chirish</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ISH BERUVCHI: ISHChILARI QIDIRISh (YaQIN ATROF VA REYTING) */}
        {activeTab === 'find_workers' && user.role === 'employer' && (
          <div>
            <h2>🔍 Ishchilarni aqlli tizim orqali qidirish</h2>
            <div style={{display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap'}}>
              <input type="text" placeholder="Ism bo'yicha qidirish..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={styles.filterInput} />
              <select value={selectedFormat} onChange={(e) => setSelectedFormat(e.target.value)} style={styles.selectFilter}>
                <option value="offline">Offline (Faqat mening tumanim: {user.district})</option>
                <option value="online">Online (Butun Respublika - Reytingi eng balandlar)</option>
              </select>
            </div>
            <div style={styles.workersGrid}>
              {getFilteredWorkers().map(w => {
                const app = sentApplications.find(a => a.workerId === w.telegramId);
                return (
                  <div key={w.id} style={styles.workerCard}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                      {w.avatar ? <img src={w.avatar} alt="avatar" style={styles.cardAvatar} /> : <div style={styles.cardNoAvatar}>{w.name[0]}</div>}
                      <div>
                        <h3 style={{margin: '0'}}>{w.name} {w.isPro && "👑"}</h3>
                        <span style={styles.ratingStars}>⭐ {w.rating || "Baholanmagan"}</span>
                      </div>
                    </div>
                    <p style={{margin: '10px 0 5px'}}>📍 <b>Manzil:</b> {w.region}, {w.district}</p>

                    {/* Baholash tugmasi */}
                    <button onClick={() => setActiveReviewWorkerId(w.telegramId)} style={styles.reviewToggleBtn}>⭐ Sharh va Baho qoldirish</button>

                    {activeReviewWorkerId === w.telegramId && (
                      <form onSubmit={handleSubmitReview} style={styles.reviewForm}>
                        <select value={reviewRating} onChange={(e) => setReviewRating(e.target.value)} style={styles.inputField}>
                          <option value="5">⭐⭐⭐⭐⭐ (5)</option>
                          <option value="4">⭐⭐⭐⭐ (4)</option>
                          <option value="3">⭐⭐⭐ (3)</option>
                          <option value="2">⭐⭐ (2)</option>
                          <option value="1">⭐ (1)</option>
                        </select>
                        <input type="text" placeholder="Sharh yozing..." value={reviewText} onChange={(e) => setReviewText(e.target.value)} style={styles.inputField} />
                        <button type="submit" style={{...styles.actionButton, backgroundColor: '#2ecc71', padding: '5px'}}>Saqlash</button>
                      </form>
                    )}

                    {/* STATUSLAR VA ALOQA */}
                    {!app && (
                      <button onClick={() => handleSendApplication(w)} style={{...styles.actionButton, backgroundColor: 'var(--main-color)', width: '100%', padding: '10px', marginTop: '10px'}}>🚀 Ishga taklif qilish</button>
                    )}
                    {app && app.status === 'pending' && <button style={{...styles.actionButton, backgroundColor: '#f39c12', width: '100%', padding: '10px', marginTop: '10px', cursor: 'not-allowed'}} disabled>⏳ Kutilmoqda...</button>}
                    {app && app.status === 'declined' && <button style={{...styles.actionButton, backgroundColor: '#e74c3c', width: '100%', padding: '10px', marginTop: '10px', cursor: 'not-allowed'} } disabled>❌ Rad etdi</button>}
                    {app && app.status === 'accepted' && (
                      <div style={{marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px'}}>
                        <p style={{color: '#2ecc71', fontWeight: 'bold', margin: '5px 0', fontSize: '13px'}}>✅ Taklif qabul qilingan!</p>
                        <div style={{display: 'flex', gap: '5px'}}>
                          <button onClick={() => window.open(w.telegramLink || `https://t.me/user?id=${w.telegramId}`, '_blank')} style={{...styles.actionButton, backgroundColor: '#24A1DE', flex: 1, padding: '8px'}}>💬 Telegram</button>
                          <button onClick={() => window.open(`tel:${w.phone}`)} style={{...styles.actionButton, backgroundColor: '#34495e', flex: 1, padding: '8px'}}>📞 Tel</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ISHCHI: ISH E'LONLARI TASMASI (FEED) */}
        {activeTab === 'job_feed' && user.role === 'worker' && (
          <div>
            <h2>🗂️ Platformadagi barcha ish e'lonlari</h2>
            <div style={{display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap'}}>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={styles.selectFilter}>
                <option value="All">Barcha Kategoriyalar</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={selectedFormat} onChange={(e) => setSelectedFormat(e.target.value)} style={styles.selectFilter}>
                <option value="All">Hamma Formatlar</option>
                <option value="offline">Offline</option>
                <option value="online">Online</option>
              </select>
            </div>
            <div style={styles.workersGrid}>
              {getFilteredJobs().map(job => (
                <div key={job.id} style={{...styles.workerCard, borderTop: '4px solid #3498db'}}>
                  <h3>{job.title}</h3>
                  <p>📁 <b>Kategoriya:</b> {job.category}</p>
                  <p>🌐 <b>Format:</b> {job.format.toUpperCase()}</p>
                  <p>📍 <b>Manzil:</b> {job.region}, {job.district}</p>
                  <p>💰 <b>Maosh:</b> <span style={{color: '#2ecc71', fontWeight: 'bold'}}>{job.salary}</span></p>
                  <p>⏱️ <b>Ish soati:</b> {job.hours}</p>
                  <p>📝 <b>Ma'lumot:</b> {job.desc}</p>
                  <div style={{marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px'}}>
                    <p style={{fontSize: '12px', color: '#7f8c8d'}}>E'lon beruvchi: {job.employerName}</p>
                    <div style={{display: 'flex', gap: '5px'}}>
                      <button onClick={() => window.open(job.employerLink || '#', '_blank')} style={{...styles.actionButton, backgroundColor: '#24A1DE', flex: 1, padding: '8px'}}>💬 Telegram</button>
                      <button onClick={() => window.open(`tel:${job.employerPhone}`)} style={{...styles.actionButton, backgroundColor: '#34495e', flex: 1, padding: '8px'}}>📞 Tel</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ISHCHI: KELGAN ARIZALAR JADVALI */}
        {activeTab === 'my_requests' && user.role === 'worker' && (
          <div>
            <h2>📩 Sizga to'g'ridan-to'g'ri kelgan ish takliflari</h2>
            <div style={styles.workersGrid}>
              {myApplications.map(app => (
                <div key={app.id} style={styles.workerCard}>
                  <h3>{app.employerName}</h3>
                  <p>🆔 **Ish beruvchi ID:** {app.employerId}</p>
                  <p>📊 **Holat:** {app.status.toUpperCase()}</p>
                  {app.status === 'pending' && (
                    <div style={{display: 'flex', gap: '5px', marginTop: '10px'}}>
                      <button onClick={() => handleAcceptApp(app.id)} style={{...styles.actionButton, backgroundColor: '#2ecc71', flex: 1, padding: '10px'}}>✅ Qabul qilish</button>
                      <button onClick={() => handleDeclineApp(app.id)} style={{...styles.actionButton, backgroundColor: '#e74c3c', flex: 1, padding: '10px'}}>❌ Rad etish</button>
                    </div>
                  )}
                  {app.status === 'accepted' && (
                    <div style={{display: 'flex', gap: '5px', marginTop: '10px'}}>
                      <button onClick={() => window.open(app.employerLink || '#', '_blank')} style={{...styles.actionButton, backgroundColor: '#24A1DE', flex: 1, padding: '8px'}}>💬 Telegram</button>
                      <button onClick={() => window.open(`tel:${app.employerPhone}`)} style={{...styles.actionButton, backgroundColor: '#34495e', flex: 1, padding: '8px'}}>📞 Tel</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* JONLI MUFFASAL SHIKOYAT OYNASI */}
        {activeTab === 'report' && (
          <div style={styles.cardContainer}>
            <h2>🚨 Shikoyat arizasini topshirish</h2>
            <form onSubmit={handleSendReport} style={styles.dashboardForm}>
              <input type="number" placeholder="Qoidabuzarning Worky ID raqami..." value={targetId} onChange={(e) => setTargetId(e.target.value)} style={styles.inputField} />
              <textarea placeholder="Qoidabuzarlik sababini daxshat batafsil yozing (Admin ko'rib chiqadi)..." value={reportReason} onChange={(e) => setReportReason(e.target.value)} style={styles.textareaField}></textarea>
              <button type="submit" style={{ ...styles.actionButton, backgroundColor: '#e74c3c', padding: '12px' }}>Shikoyatni Adminga Yuborish</button>
            </form>
          </div>
        )}
      </div>

      {/* SIZ XOHLAGAN PRO MODAL OYNASI */}
      {showProModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2 style={{color: '#f1c40f', margin: '0 0 15px 0'}}>👑 Worky PRO Rejimga O'tish</h2>
            <p>PRO nishoniga ega bo'lish uchun to'lovni bajaring va adminga skrinshot tashlang:</p>
            <div style={styles.cardDetails}>
              💳 <b>Karta raqam:</b> <code style={{fontSize: '16px'}}>8600123456789012</code> (Temur)<br/>
              💰 <b>Narxi:</b> 50,000 so'm (1 oylik faol muddat)
            </div>
            <div style={{margin: '15px 0'}}>
              Sizning unikal Worky ID: <b>{user.telegramId}</b>
            </div>
            <div style={{display: 'flex', gap: '10px'}}>
              <button onClick={() => window.open(`https://t.me/logotipshop10?text=${proTelegramText}`, '_blank')} style={styles.modalTelegramBtn}>💬 Adminga Chek va ID Yuborish</button>
              <button onClick={() => setShowProModal(false)} style={styles.modalCloseBtn}>Yopish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// === CENTRAL ADMIN PANEL KOMPONENTI ===
function AdminPanel({ onLogout, currentHoliday, logoText }) {
  const [primaryColor, setPrimaryColor] = useState('#1D9E75');
  const [backgroundColor, setBackgroundColor] = useState('#F7F8FA');
  const [selectedFont, setSelectedFont] = useState('Inter');
  const [holiday, setHoliday] = useState(currentHoliday);
  const [logoInput, setLogoInput] = useState(logoText);

  const [reports, setReports] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [proUserId, setProUserId] = useState('');

  useEffect(() => {
    // Kelgan shikoyatlarni to'liq ma'lumotlar bilan real-time olish
    onValue(ref(db, 'reports'), (snapshot) => {
      const data = snapshot.val();
      if (data) setReports(Object.keys(data).map(key => ({ id: key, ...data[key] })));
      else setReports([]);
    });

    // Foydalanuvchilarni boshqarish uchun olish
    onValue(ref(db, 'users'), (snapshot) => {
      const data = snapshot.val();
      if (data) setUsersList(Object.keys(data).map(key => ({ id: key, ...data[key] })));
      else setUsersList([]);
    });
  }, []);

  const handleThemeSave = async (e) => {
    e.preventDefault();
    await set(ref(db, 'settings/theme'), { primaryColor, backgroundColor, fontFamily: selectedFont, holiday, logoText: logoInput });
    alert('Barcha stil, bayramona bezaklar va logotip sozlamalari butun sayt bo\'ylab muvaffaqiyatli saqlandi!');
  };

  // 1 OYLIK AVTOMATIK PRO TAYMER TIZIMI
  const handleActivatePro = async (targetId) => {
    const expireTime = Date.now() + 30 * 24 * 60 * 60 * 1000; // Roppa-rosa 30 kun keyingi vaqt millisekundda
    await set(ref(db, `users/${targetId}/isPro`), true);
    await set(ref(db, `users/${targetId}/proExpireAt`), expireTime);
    alert(`ID: ${targetId} foydalanuvchiga 1 oylik PRO muvaffaqiyatli berildi va avto-taymer ishga tushdi!`);
  };

  return (
    <div style={styles.adminContainer}>
      <div style={styles.adminHeader}>
        <h2>👨‍💻 Worky Boshqaruv Markazi (Admin Panel)</h2>
        <button onClick={onLogout} style={styles.adminLogoutBtn}>Chiqish</button>
      </div>
      <div style={styles.adminGrid}>

        {/* TO'LIQLIGICHA JONLI SHIKOYATLAR TUZILMASI */}
        <div style={{...styles.adminCard, borderTop: '5px solid #e74c3c'}}>
          <h3>🚨 Foydalanuvchilar Shikoyat Oynasi</h3>
          {reports.length === 0 ? <p>Hozircha shikoyatlar kelmagan.</p> : reports.map(rep => (
            <div key={rep.id} style={styles.reportCard}>
              <p style={{color: '#c0392b', fontWeight: 'bold'}}>⚠️ SABAB: {rep.reason}</p>
              <div style={{background: '#fff', padding: '10px', borderRadius: '6px', marginBottom: '5px', border: '1px solid #f5c6cb'}}>
                <b>🟢 Shikoyat Qilgan (Da'vogar):</b><br/>
                Ism: {rep.reporterName} (ID: {rep.reporterId})<br/>
                Tel: {rep.reporterPhone}<br/>
                Link: <a href={rep.reporterLink} target="_blank" rel="noreferrer">Telegram Profil</a>
              </div>
              <div style={{background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #f5c6cb'}}>
                <b>🔴 Shikoyat Qilingan (Qoidabuzar):</b><br/>
                Ism: {rep.accusedName} (ID: {rep.accusedId})<br/>
                Tel: {rep.accusedPhone}<br/>
                Link: <a href={rep.accusedLink} target="_blank" rel="noreferrer">Telegram Profil</a>
              </div>
              <div style={{display: 'flex', gap: '5px', marginTop: '10px'}}>
                <button onClick={() => window.open(`tel:${rep.accusedPhone}`)} style={{...styles.actionButton, backgroundColor: '#34495e', padding: '5px 10px', fontSize: '12px'}}>📞 Qoidabuzarga Tel Qilish</button>
                <button onClick={async () => { await remove(ref(db, `reports/${rep.id}`)); alert('Shikoyat o\'chirildi'); }} style={{backgroundColor: '#e74c3c', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'}}>❌ Shikoyatni O'chirish</button>
              </div>
            </div>
          ))}
        </div>

        {/* PRO FAOL QILISH PANELI */}
        <div style={{...styles.adminCard, borderTop: '5px solid #f1c40f'}}>
          <h3>👑 PRO Rejimni Faollashtirish (30 kunlik avto-taymer)</h3>
          <div style={{display: 'flex', gap: '5px', marginBottom: '15px'}}>
            <input type="number" placeholder="Foydalanuvchi Worky ID..." value={proUserId} onChange={(e) => setProUserId(e.target.value)} style={styles.inputField} />
            <button onClick={() => { handleActivatePro(proUserId); setProUserId(''); }} style={{backgroundColor: '#f1c40f', color: '#000', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer'}}>PRO Aktiv Qilish</button>
          </div>
          <h4>Hozirgi foydalanuvchilar:</h4>
          <div style={{maxHeight: '200px', overflowY: 'auto'}}>
            {usersList.map(u => (
              <div key={u.id} style={{display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #eee', fontSize: '13px'}}>
                <span>{u.name} (ID: {u.telegramId})</span>
                {u.isPro ? <span style={{color: '#2ecc71'}}>Active ✅</span> : <button onClick={() => handleActivatePro(u.telegramId)} style={{fontSize: '11px', backgroundColor: '#e67e22', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '3px'}}>PRO Berish</button>}
              </div>
            ))}
          </div>
        </div>

        {/* STIL, BAYRAMLAR VA LOGOTIPNI BOSHQARISh */}
        <div style={{...styles.adminCard, borderTop: '5px solid #2ecc71'}}>
          <h3>🎨 Stil & Dinamik Bayram Sozlamalari</h3>
          <form onSubmit={handleThemeSave} style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
            <label style={{fontSize: '13px', fontWeight: 'bold'}}>Asosiy Tizim Rangi:</label>
            <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} style={styles.colorInput} />
            <label style={{fontSize: '13px', fontWeight: 'bold'}}>Sayt Fon Rangi:</label>
            <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} style={styles.colorInput} />

            <label style={{fontSize: '13px', fontWeight: 'bold'}}>Yozuv Shrifti (Google Fonts):</label>
            <select value={selectedFont} onChange={(e) => setSelectedFont(e.target.value)} style={styles.inputField}>
              <option value="Inter">Inter</option>
              <option value="Poppins">Poppins</option>
              <option value="Montserrat">Montserrat</option>
              <option value="Roboto">Roboto</option>
            </select>

            <label style={{fontSize: '13px', fontWeight: 'bold'}}>O'zgaruvchan Logotip Matni:</label>
            <input type="text" value={logoInput} onChange={(e) => setLogoInput(e.target.value)} style={styles.inputField} />

            <label style={{fontSize: '13px', fontWeight: 'bold'}}>Bayramlar va Muhim Kunlar Rejimi:</label>
            <select value={holiday} onChange={(e) => setHoliday(e.target.value)} style={styles.inputField}>
              <option value="oddiy">Oddiy Rejim (Emojilar standart)</option>
              <option value="yangi_yil">❄️ Yangi yil rejim (Qor parchalari & Archa)</option>
              <option value="navruz">🌱 Navro'z bayrami rejim (Bahoriy stillar)</option>
              <option value="ramazon">🌙 Ramazon oyi muqaddas rejim</option>
            </select>

            <button type="submit" style={styles.saveStyleBtn}>Butun Saytga Qo'llash</button>
          </form>
        </div>
      </div>
    </div>
  );
}

// === PREMIUM UNIVERSAL STILLAR OBYEKTI ===
const styles = {
  loginContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-color, #F7F8FA)', padding: '15px' },
  loginCard: { backgroundColor: '#fff', padding: '30px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', width: '100%', maxWidth: '440px', textAlign: 'center' },
  logoRow: { display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '10px' },
  holidayBanner: { backgroundColor: 'var(--main-color)', color: '#fff', padding: '8px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', marginBottom: '15px' },
  formContainer: { display: 'flex', flexDirection: 'column', gap: '12px' },
  input: { width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '15px', boxSizing: 'border-box', outline: 'none' },
  loginNote: { background: '#fff9db', border: '1px solid #ffe066', borderRadius: '8px', padding: '12px', fontSize: '11px', textAlign: 'left', color: '#666', lineHeight: '1.5' },
  button: { width: '100%', padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--main-color, #1D9E75)', color: '#fff', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold', marginTop: '5px' },
  errorText: { color: '#e74c3c', fontSize: '13px', margin: '0' },

  dashboardContainer: { display: 'flex', height: '100vh', backgroundColor: 'var(--bg-color, #F7F8FA)' },
  sidebar: { width: '270px', backgroundColor: '#1e293b', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' },
  logoRowSidebar: { display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '10px' },
  sideAvatar: { width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--main-color)' },
  sideNoAvatar: { width: '70px', height: '70px', borderRadius: '50%', backgroundColor: 'var(--main-color)', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '28px', fontWeight: 'bold', margin: '0 auto' },
  roleBadge: { display: 'inline-block', padding: '4px 10px', backgroundColor: '#334155', color: '#e2e8f0', borderRadius: '20px', fontSize: '11px', fontWeight: '600', marginTop: '8px' },
  proActiveBadge: { display: 'block', padding: '6px', backgroundColor: '#f1c40f', color: '#000', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', marginTop: '8px' },
  getProBtn: { width: '100%', padding: '6px', border: 'none', borderRadius: '6px', backgroundColor: '#f1c40f', color: '#000', cursor: 'pointer', fontWeight: 'bold', marginTop: '8px', fontSize: '11px' },
  menuBtn: { width: '100%', padding: '11px 15px', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', textAlign: 'left', fontSize: '14px', fontWeight: '500', transition: 'all 0.2s' },
  logoutBtn: { width: '100%', padding: '11px', border: 'none', borderRadius: '8px', backgroundColor: '#ef4444', color: '#fff', cursor: 'pointer', marginTop: 'auto', fontWeight: 'bold' },

  mainContent: { flex: 1, padding: '30px', overflowY: 'auto' },
  welcomeCard: { backgroundColor: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' },
  cardContainer: { backgroundColor: '#fff', padding: '25px', borderRadius: '12px', maxWidth: '600px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' },
  dashboardForm: { display: 'flex', flexDirection: 'column', gap: '12px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '-4px' },
  inputField: { padding: '11px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' },
  textareaField: { padding: '11px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', height: '100px', resize: 'none', outline: 'none' },
  fileInput: { fontSize: '13px', color: '#64748b' },
  avatarPreview: { width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', marginTop: '10px' },
  saveProfileBtn: { padding: '12px', border: 'none', borderRadius: '8px', backgroundColor: '#2ecc71', color: '#fff', fontWeight: 'bold', cursor: 'pointer' },

  filterInput: { flex: 1, minWidth: '250px', padding: '11px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' },
  selectFilter: { padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', cursor: 'pointer' },
  workersGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '15px' },
  workerCard: { backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', borderTop: '4px solid var(--main-color)', display: 'flex', flexDirection: 'column', justifyBetween: 'space-between' },
  cardAvatar: { width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover' },
  cardNoAvatar: { width: '45px', height: '45px', borderRadius: '50%', backgroundColor: 'var(--main-color)', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px', fontWeight: 'bold' },
  ratingStars: { fontSize: '12px', fontWeight: 'bold', color: '#f1c40f', background: '#fef9e7', padding: '2px 6px', borderRadius: '4px' },
  reviewToggleBtn: { border: 'none', background: 'none', color: '#3498db', fontSize: '12px', cursor: 'pointer', textAlign: 'left', padding: '0', margin: '8px 0 0', fontWeight: '500' },
  reviewForm: { display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '8px', background: '#f8fafc', padding: '8px', borderRadius: '6px' },
  actionButton: { border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' },

  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px', zIndex: 9999 },
  modalContent: { backgroundColor: '#fff', padding: '30px', borderRadius: '16px', maxWidth: '480px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' },
  cardDetails: { background: '#f8fafc', padding: '15px', borderRadius: '8px', fontSize: '13px', borderLeft: '4px solid #f1c40f', lineHeight: '1.6', margin: '10px 0' },
  modalTelegramBtn: { flex: 2, padding: '12px', border: 'none', borderRadius: '8px', backgroundColor: '#24A1DE', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' },
  modalCloseBtn: { flex: 1, padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff', color: '#64748b', cursor: 'pointer', fontWeight: 'bold' },

  adminContainer: { padding: '30px', backgroundColor: '#f1f5f9', minHeight: '100vh' },
  adminHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px' },
  adminLogoutBtn: { border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#fff', backgroundColor: '#ef4444', padding: '8px 15px' },
  adminGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '25px', marginTop: '20px' },
  adminCard: { backgroundColor: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' },
  colorInput: { width: '100%', height: '40px', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', padding: '0', background: 'none' },
  saveStyleBtn: { padding: '12px', backgroundColor: '#2ecc71', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },
  reportCard: { padding: '15px', backgroundColor: '#fff5f5', borderRadius: '8px', marginTop: '12px', borderLeft: '5px solid #ef4444', display: 'flex', flexDirection: 'column', gap: '8px' }
};