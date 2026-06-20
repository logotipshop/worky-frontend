import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, get, set, push, remove } from 'firebase/database';

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

const CATEGORIES = ["Qurilish & Ta'mirlash", "IT & Dasturlash", "Restoran & Kafe", "Yuk tashish", "Gullar & Sovg'alar", "Uy xizmatlari", "Boshqa"];

export default function App() {
  const [telegramId, setTelegramId] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [currentHoliday, setCurrentHoliday] = useState('oddiy');
  const [logoText, setLogoText] = useState('Worky');

  useEffect(() => {
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

  useEffect(() => {
    if (user && user.isPro && user.proExpireAt) {
      if (Date.now() > user.proExpireAt) {
        const myId = user.telegramId || user.id;
        set(ref(db, `users/${myId}/isPro`), false);
        set(ref(db, `users/${myId}/proExpireAt`), "");
        setUser(prev => ({ ...prev, isPro: false, proExpireAt: "" }));
        alert("Sizning PRO obunangiz muddati tugadi. Iltimos, yangilang!");
      }
    }
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!telegramId || !password) return alert('Hamma maydonlarni kiriting!');
    if (telegramId.trim() === 'ADMIN777' && password === 'ADMIN777') {
      setIsAdmin(true);
      return;
    }
    try {
      const userRef = ref(db, `users/${telegramId}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const userData = snapshot.val();
        if (!userData.password || userData.password === "") {
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

  const getHolidayDecoration = () => {
    if (currentHoliday === 'yangi_yil') return { emoji: "❄️", banner: "🎉 Yangi Yilingiz Muborak! 🎄", bg: "linear-gradient(135deg, #1a1a2e, #16213e)", accent: "#4fc3f7" };
    if (currentHoliday === 'navruz') return { emoji: "🌱", banner: "🌸 Navro'z Ayomi Muborak! 🌾", bg: "linear-gradient(135deg, #e8f5e9, #f1f8e9)", accent: "#4caf50" };
    if (currentHoliday === 'ramazon') return { emoji: "🌙", banner: "🕌 Ramazon Oyi Muborak! ✨", bg: "linear-gradient(135deg, #1a237e, #283593)", accent: "#ffd54f" };
    if (currentHoliday === 'mustaqillik') return { emoji: "🇺🇿", banner: "🎊 Mustaqillik Kunингиз Muborak! 🎊", bg: "linear-gradient(135deg, #e8f5e9, #e3f2fd)", accent: "#1565c0" };
    if (currentHoliday === 'xotin_qizlar') return { emoji: "🌹", banner: "💐 8-Mart Xotin-Qizlar Bayrami Muborak! 🌷", bg: "linear-gradient(135deg, #fce4ec, #f8bbd0)", accent: "#e91e63" };
    if (currentHoliday === 'yangi_yil_milodiy') return { emoji: "🎆", banner: "🥂 Milodiy Yangi Yil Muborak! 🎇", bg: "linear-gradient(135deg, #212121, #424242)", accent: "#ffd700" };
    if (currentHoliday === 'qurbon_hayit') return { emoji: "🐑", banner: "🤲 Qurbon Hayit Muborak! ✨", bg: "linear-gradient(135deg, #e8f5e9, #fff8e1)", accent: "#ff8f00" };
    if (currentHoliday === 'ruza_hayit') return { emoji: "🌙", banner: "🤲 Ro'za Hayit Muborak! ✨", bg: "linear-gradient(135deg, #e8eaf6, #ede7f6)", accent: "#7c4dff" };
    return { emoji: "💼", banner: "", bg: "", accent: "" };
  };

  const dec = getHolidayDecoration();

  if (isAdmin) return <AdminPanel onLogout={() => setIsAdmin(false)} currentHoliday={currentHoliday} logoText={logoText} />;
  if (user) return <Dashboard user={user} setUser={setUser} onLogout={() => setUser(null)} dec={dec} logoText={logoText} />;

  return (
    <div style={{...styles.loginContainer, background: dec.bg || 'var(--bg-color, #F7F8FA)'}}>
      <link id="google-font-link" rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700&display=swap" />
      <div style={styles.loginCard}>
        <div style={styles.logoRow}>
          <span style={{fontSize: '24px'}}>{dec.emoji}</span>
          <h2 style={{ color: 'var(--main-color, #1D9E75)', margin: '0 0 0 8px' }}>{logoText}</h2>
        </div>
        {dec.banner && <div style={{...styles.holidayBanner, backgroundColor: dec.accent || 'var(--main-color)'}}>{dec.banner}</div>}
        <form onSubmit={handleLogin} style={styles.formContainer}>
          <input type="text" placeholder="Telegram ID raqamingiz..." value={telegramId} onChange={(e) => setTelegramId(e.target.value)} style={styles.input} />
          <input type="password" placeholder="Maxfiy parolingiz..." value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} />
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

function Dashboard({ user, setUser, onLogout, dec, logoText }) {
  const [activeTab, setActiveTab] = useState('main');
  const [allWorkers, setAllWorkers] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [sentApplications, setSentApplications] = useState([]);
  const [showProModal, setShowProModal] = useState(false);

  const [profileName, setProfileName] = useState(user.name || '');
  const [profilePhone, setProfilePhone] = useState(user.phone || '');
  const [profileLink, setProfileLink] = useState(user.telegramLink || '');
  const [profileImg, setProfileImg] = useState(user.avatar || '');
  const [profileRegion, setProfileRegion] = useState(user.region || 'Toshkent');
  const [profileDistrict, setProfileDistrict] = useState(user.district || 'Yunusobod');

  const [jobTitle, setJobTitle] = useState('');
  const [jobCategory, setJobCategory] = useState(CATEGORIES[0]);
  const [jobFormat, setJobFormat] = useState('offline');
  const [jobSalary, setJobSalary] = useState('');
  const [jobHours, setJobHours] = useState('');
  const [jobDesc, setJobDesc] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedFormat, setSelectedFormat] = useState('offline');
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [activeReviewWorkerId, setActiveReviewWorkerId] = useState(null);

  const [targetId, setTargetId] = useState('');
  const [reportReason, setReportReason] = useState('');

  const currentUserId = user.telegramId || user.id;

  useEffect(() => {
    onValue(ref(db, 'users'), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const workers = Object.keys(data).map(key => ({ id: key, ...data[key] })).filter(u => u.role === 'worker');
        setAllWorkers(workers);
      }
    });
    onValue(ref(db, 'jobs'), (snapshot) => {
      const data = snapshot.val();
      if (data) setAllJobs(Object.keys(data).map(key => ({ id: key, ...data[key] })));
      else setAllJobs([]);
    });
    onValue(ref(db, 'job_applications'), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setMyApplications(list.filter(app => app.workerId === currentUserId));
        setSentApplications(list.filter(app => app.employerId === currentUserId));
      } else {
        setMyApplications([]);
        setSentApplications([]);
      }
    });
  }, [currentUserId]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfileImg(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profilePhone || !profileLink) return alert('Telefon va Telegram havola majburiy!');
    const updated = { ...user, name: profileName, phone: profilePhone, telegramLink: profileLink, avatar: profileImg, region: profileRegion, district: profileDistrict };
    await set(ref(db, `users/${currentUserId}`), updated);
    setUser(updated);
    alert('Profil muvaffaqiyatli yangilandi!');
  };

  const handleAddJob = async (e) => {
    e.preventDefault();
    if (!jobTitle || !jobSalary || !jobHours || !jobDesc) return alert('Barcha maydonlarni to\'ldiring!');
    try {
      await push(ref(db, 'jobs'), {
        employerId: currentUserId,
        employerName: user.name || "Noma'lum",
        employerPhone: user.phone || "Kiritilmagan",
        employerLink: user.telegramLink || '',
        title: jobTitle, category: jobCategory, format: jobFormat,
        salary: jobSalary, hours: jobHours, desc: jobDesc,
        region: user.region || 'Toshkent', district: user.district || 'Yunusobod',
        createdAt: new Date().toISOString()
      });
      alert('Ish e\'loni muvaffaqiyatli joylandi!');
      setJobTitle(''); setJobSalary(''); setJobHours(''); setJobDesc('');
      setActiveTab('my_jobs');
    } catch(err) { alert("Xatolik yuz berdi, qayta urining."); }
  };

  const handleDeleteJob = async (jobId) => {
    if (window.confirm("Bu e'lonni o'chirmoqchimisiz?")) {
      await remove(ref(db, `jobs/${jobId}`));
      alert("E'lon o'chirildi.");
    }
  };

  const handleSendApplication = async (worker) => {
    if (user.role !== 'employer') return alert('Faqat ish beruvchilar ariza yubora oladi!');
    const workerId = worker.telegramId || worker.id;
    if (!currentUserId || !workerId) return alert('Xatolik: ID raqamlar topilmadi!');
    const exist = sentApplications.find(app => app.workerId === workerId && app.employerId === currentUserId);
    if (exist) return alert('Bu ishchiga allaqachon ariza yuborilgan!');
    try {
      await push(ref(db, 'job_applications'), {
        employerId: currentUserId, employerName: user.name || "Noma'lum",
        employerPhone: user.phone || '', employerLink: user.telegramLink || '',
        workerId: workerId, workerName: worker.name || "Noma'lum",
        workerPhone: worker.phone || '', workerLink: worker.telegramLink || '',
        status: 'pending', createdAt: new Date().toISOString()
      });
      alert('Taklif muvaffaqiyatli yuborildi!');
    } catch(error) { alert('Xatolik: ' + error.message); }
  };

  const handleAcceptApp = async (appId) => {
    try { await set(ref(db, `job_applications/${appId}/status`), 'accepted'); alert('Taklifni qabul qildingiz!'); }
    catch (error) { alert('Xatolik: ' + error.message); }
  };

  const handleDeclineApp = async (appId) => {
    try { await set(ref(db, `job_applications/${appId}/status`), 'declined'); alert('Taklif rad etildi.'); }
    catch (error) { alert('Xatolik: ' + error.message); }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewText) return alert('Sharh matnini yozing!');
    const workerRef = ref(db, `users/${activeReviewWorkerId}`);
    const snapshot = await get(workerRef);
    if (snapshot.exists()) {
      const wData = snapshot.val();
      const currentReviews = wData.reviews ? Object.values(wData.reviews) : [];
      const allRatings = [...currentReviews.map(r => r.rating), Number(reviewRating)];
      const avgRating = allRatings.reduce((a, b) => a + b, 0) / allRatings.length;
      await push(ref(db, `users/${activeReviewWorkerId}/reviews`), { rating: Number(reviewRating), text: reviewText, from: user.name || "Anonim" });
      await set(ref(db, `users/${activeReviewWorkerId}/rating`), avgRating.toFixed(1));
      alert('Baho va sharhingiz saqlandi!');
      setReviewText(''); setActiveReviewWorkerId(null);
    }
  };

  const handleSendReport = async (e) => {
    e.preventDefault();
    if (!targetId || !reportReason) return alert('Hamma maydonlarni to\'ldiring!');
    const targetSnapshot = await get(ref(db, `users/${targetId}`));
    let targetName = "Noma'lum", targetPhone = "Kiritilmagan", targetLink = "";
    if (targetSnapshot.exists()) {
      const tData = targetSnapshot.val();
      targetName = tData.name || "Noma'lum"; targetPhone = tData.phone || "Kiritilmagan"; targetLink = tData.telegramLink || "";
    }
    await push(ref(db, 'reports'), {
      reporterId: currentUserId, reporterName: user.name || "Noma'lum",
      reporterPhone: user.phone || 'Kiritilmagan', reporterLink: user.telegramLink || '',
      accusedId: targetId, accusedName: targetName, accusedPhone: targetPhone, accusedLink: targetLink,
      reason: reportReason, createdAt: new Date().toISOString()
    });
    alert('Shikoyat adminga muvaffaqiyatli yetkazildi!');
    setTargetId(''); setReportReason('');
  };

  // TELEGRAM TUGMASI - XAVFSIZ
  const openTelegram = (link) => {
    if (!link) return alert('Bu foydalanuvchi Telegram linkini kiritilmagan! Profil sozlamalaridan kiriting.');
    window.open(link, '_blank');
  };

  // TELEFON TUGMASI - XAVFSIZ
  const openPhone = (phone) => {
    if (!phone) return alert('Bu foydalanuvchi telefon raqamini kiritilmagan!');
    window.open(`tel:${phone}`);
  };

  const getFilteredWorkers = () => {
    let list = [...allWorkers];
    if (searchQuery) list = list.filter(w => w.name && w.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (selectedFormat === 'online') return list.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    else return list.filter(w => w.district && w.district.toLowerCase() === (user.district || '').toLowerCase());
  };

  const getFilteredJobs = () => {
    let list = [...allJobs];
    if (selectedCategory !== 'All') list = list.filter(j => j.category === selectedCategory);
    if (selectedFormat !== 'All') list = list.filter(j => j.format === selectedFormat);
    return list;
  };

  const proTelegramText = encodeURIComponent(`Salom Temur, men Worky saytida PRO sotib olmoqchiman. Mening Worky ID raqamim: ${currentUserId}`);

  return (
    <div style={styles.dashboardContainer}>
      <div style={styles.sidebar}>
        <div style={{ textAlign: 'center', marginBottom: '15px' }}>
          <div style={styles.logoRowSidebar}>
            <span style={{fontSize: '20px'}}>{dec.emoji}</span>
            <h3 style={{ color: '#fff', margin: '0 0 0 5px' }}>{logoText}</h3>
          </div>
          <div style={{marginTop: '5px'}}>
            {user.avatar ? <img src={user.avatar} alt="avatar" style={styles.sideAvatar} /> : <div style={styles.sideNoAvatar}>{user.name ? user.name[0] : 'U'}</div>}
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

      <div style={styles.mainContent}>
        {activeTab === 'main' && (
          <div style={styles.welcomeCard}>
            <h1 style={{ color: 'var(--main-color, #1D9E75)', margin: '0 0 10px 0' }}>Xush kelibsiz, {user.name || 'Foydalanuvchi'}!</h1>
            <p>🆔 Sizning unikal Worky ID: <b>{currentUserId}</b></p>
            <p>📍 Sizning hududingiz: <b>{user.region || 'Kiritilmagan'}, {user.district || 'Kiritilmagan'}</b></p>
            <p>📊 Status: {user.isPro ? <b style={{color: '#f1c40f'}}>👑 PRO Premium Foydalanuvchi</b> : <b>Oddiy rejim</b>}</p>
          </div>
        )}

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
              <label style={styles.label}>Viloyat / Shahar:</label>
              <input type="text" value={profileRegion} onChange={(e) => setProfileRegion(e.target.value)} style={styles.inputField} placeholder="Masalan: Toshkent" />
              <label style={styles.label}>Tuman:</label>
              <input type="text" value={profileDistrict} onChange={(e) => setProfileDistrict(e.target.value)} style={styles.inputField} placeholder="Masalan: Yunusobod" />
              <label style={styles.label}>Profil rasmi (Avatar):</label>
              <input type="file" accept="image/*" onChange={handleImageChange} style={styles.fileInput} />
              {profileImg && <img src={profileImg} alt="Preview" style={styles.avatarPreview} />}
              <button type="submit" style={styles.saveProfileBtn}>O'zgarishlarni saqlash</button>
            </form>
          </div>
        )}

        {activeTab === 'add_job' && user.role === 'employer' && (
          <div style={styles.cardContainer}>
            <h2>➕ Yangi ish e'loni yaratish</h2>
            <form onSubmit={handleAddJob} style={styles.dashboardForm}>
              <input type="text" placeholder="Ish nomi (Masalan: Mebel ustasi kerak)" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} style={styles.inputField} />
              <select value={jobCategory} onChange={(e) => setJobCategory(e.target.value)} style={styles.inputField}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={jobFormat} onChange={(e) => setJobFormat(e.target.value)} style={styles.inputField}>
                <option value="offline">Offline (Tuman bo'yicha yaqin atrofdan qidirish)</option>
                <option value="online">Online (Masofaviy ish - Butun Respublika)</option>
              </select>
              <input type="text" placeholder="To'lov maoshi (Masalan: 300,000 so'm / kunlik)" value={jobSalary} onChange={(e) => setJobSalary(e.target.value)} style={styles.inputField} />
              <input type="text" placeholder="Ish vaqti / soati (Masalan: Kuniga 6 soat)" value={jobHours} onChange={(e) => setJobHours(e.target.value)} style={styles.inputField} />
              <textarea placeholder="Ish sharoitlari va talablar haqida batafsil ma'lumot..." value={jobDesc} onChange={(e) => setJobDesc(e.target.value)} style={styles.textareaField}></textarea>
              <button type="submit" style={{...styles.actionButton, backgroundColor: 'var(--main-color)', padding: '12px'}}>E'lonni nashr qilish</button>
            </form>
          </div>
        )}

        {activeTab === 'my_jobs' && user.role === 'employer' && (
          <div>
            <h2>📋 Siz joylagan ish e'lonlari</h2>
            <div style={styles.workersGrid}>
              {allJobs.filter(j => j.employerId === currentUserId).map(job => (
                <div key={job.id} style={styles.workerCard}>
                  <h3>{job.title}</h3>
                  <p>📁 <b>Kategoriya:</b> {job.category}</p>
                  <p>🌐 <b>Format:</b> {(job.format || '').toUpperCase()}</p>
                  <p>💰 <b>Maosh:</b> {job.salary}</p>
                  <p>⏱️ <b>Vaqt:</b> {job.hours}</p>
                  <p>📝 <b>Izoh:</b> {job.desc}</p>
                  <button onClick={() => handleDeleteJob(job.id)} style={{...styles.actionButton, backgroundColor: '#e74c3c', width: '100%', padding: '8px', marginTop: '10px'}}>E'lonni o'chirish</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'find_workers' && user.role === 'employer' && (
          <div>
            <h2>🔍 Ishchilarni tizim orqali qidirish</h2>
            <div style={{display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap'}}>
              <input type="text" placeholder="Ism bo'yicha qidirish..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={styles.filterInput} />
              <select value={selectedFormat} onChange={(e) => setSelectedFormat(e.target.value)} style={styles.selectFilter}>
                <option value="offline">Offline (Mening tumanimda: {user.district || 'Tanlanmagan'})</option>
                <option value="online">Online (Butun Respublika - Reytingi balandlar)</option>
              </select>
            </div>
            <div style={styles.workersGrid}>
              {getFilteredWorkers().map(w => {
                const workerIdentifier = w.telegramId || w.id;
                const app = sentApplications.find(a => a.workerId === workerIdentifier && a.employerId === currentUserId);
                return (
                  <div key={w.id} style={styles.workerCard}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                      {w.avatar ? <img src={w.avatar} alt="avatar" style={styles.cardAvatar} /> : <div style={styles.cardNoAvatar}>{w.name ? w.name[0] : 'U'}</div>}
                      <div>
                        <h3 style={{margin: '0'}}>{w.name} {w.isPro && "👑"}</h3>
                        <span style={styles.ratingStars}>⭐ {w.rating || "0.0"}</span>
                      </div>
                    </div>
                    <p style={{margin: '10px 0 5px'}}>📍 <b>Manzil:</b> {w.region || "Noma'lum"}, {w.district || "Noma'lum"}</p>
                    <button onClick={() => setActiveReviewWorkerId(workerIdentifier)} style={styles.reviewToggleBtn}>⭐ Sharh va Baho qoldirish</button>
                    {activeReviewWorkerId === workerIdentifier && (
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
                    {!app && <button onClick={() => handleSendApplication(w)} style={{...styles.actionButton, backgroundColor: 'var(--main-color)', width: '100%', padding: '10px', marginTop: '10px'}}>🚀 Ishga taklif qilish</button>}
                    {app && app.status === 'pending' && <button style={{...styles.actionButton, backgroundColor: '#f39c12', width: '100%', padding: '10px', marginTop: '10px', cursor: 'not-allowed'}} disabled>⏳ Kutilmoqda...</button>}
                    {app && app.status === 'declined' && <button style={{...styles.actionButton, backgroundColor: '#e74c3c', width: '100%', padding: '10px', marginTop: '10px', cursor: 'not-allowed'}} disabled>❌ Rad etdi</button>}
                    {app && app.status === 'accepted' && (
                      <div style={{marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px'}}>
                        <p style={{color: '#2ecc71', fontWeight: 'bold', margin: '5px 0', fontSize: '13px'}}>✅ Taklif qabul qilingan!</p>
                        <div style={{display: 'flex', gap: '5px'}}>
                          <button onClick={() => openTelegram(w.telegramLink)} style={{...styles.actionButton, backgroundColor: '#24A1DE', flex: 1, padding: '8px'}}>💬 Telegram</button>
                          <button onClick={() => openPhone(w.phone)} style={{...styles.actionButton, backgroundColor: '#34495e', flex: 1, padding: '8px'}}>📞 Tel</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
                  <p>🌐 <b>Format:</b> {(job.format || '').toUpperCase()}</p>
                  <p>📍 <b>Manzil:</b> {job.region}, {job.district}</p>
                  <p>💰 <b>Maosh:</b> <span style={{color: '#2ecc71', fontWeight: 'bold'}}>{job.salary}</span></p>
                  <p>⏱️ <b>Ish soati:</b> {job.hours}</p>
                  <p>📝 <b>Ma'lumot:</b> {job.desc}</p>
                  <div style={{marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px'}}>
                    <p style={{fontSize: '12px', color: '#7f8c8d'}}>E'lon beruvchi: {job.employerName}</p>
                    <div style={{display: 'flex', gap: '5px'}}>
                      <button onClick={() => openTelegram(job.employerLink)} style={{...styles.actionButton, backgroundColor: '#24A1DE', flex: 1, padding: '8px'}}>💬 Telegram</button>
                      <button onClick={() => openPhone(job.employerPhone)} style={{...styles.actionButton, backgroundColor: '#34495e', flex: 1, padding: '8px'}}>📞 Tel</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'my_requests' && user.role === 'worker' && (
          <div>
            <h2>📩 Sizga kelgan to'g'ridan-to'g'ri ish takliflari</h2>
            <div style={styles.workersGrid}>
              {myApplications.map(app => (
                <div key={app.id} style={styles.workerCard}>
                  <h3>{app.employerName}</h3>
                  <p>🆔 <b>Ish beruvchi ID:</b> {app.employerId}</p>
                  <p>📊 <b>Holat:</b> {(app.status || '').toUpperCase()}</p>
                  {app.status === 'pending' && (
                    <div style={{display: 'flex', gap: '5px', marginTop: '10px'}}>
                      <button onClick={() => handleAcceptApp(app.id)} style={{...styles.actionButton, backgroundColor: '#2ecc71', flex: 1, padding: '10px'}}>✅ Qabul qilish</button>
                      <button onClick={() => handleDeclineApp(app.id)} style={{...styles.actionButton, backgroundColor: '#e74c3c', flex: 1, padding: '10px'}}>❌ Rad etish</button>
                    </div>
                  )}
                  {app.status === 'accepted' && (
                    <div style={{display: 'flex', gap: '5px', marginTop: '10px'}}>
                      <button onClick={() => openTelegram(app.employerLink)} style={{...styles.actionButton, backgroundColor: '#24A1DE', flex: 1, padding: '8px'}}>💬 Telegram</button>
                      <button onClick={() => openPhone(app.employerPhone)} style={{...styles.actionButton, backgroundColor: '#34495e', flex: 1, padding: '8px'}}>📞 Tel</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'report' && (
          <div style={styles.cardContainer}>
            <h2>🚨 Shikoyat arizasini topshirish</h2>
            <form onSubmit={handleSendReport} style={styles.dashboardForm}>
              <input type="text" placeholder="Qoidabuzarning Worky ID raqami..." value={targetId} onChange={(e) => setTargetId(e.target.value)} style={styles.inputField} />
              <textarea placeholder="Qoidabuzarlik sababini batafsil yozing..." value={reportReason} onChange={(e) => setReportReason(e.target.value)} style={styles.textareaField}></textarea>
              <button type="submit" style={{ ...styles.actionButton, backgroundColor: '#e74c3c', padding: '12px' }}>Shikoyatni Yuborish</button>
            </form>
          </div>
        )}
      </div>

      {showProModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2 style={{color: '#f1c40f', margin: '0 0 15px 0'}}>👑 Worky PRO Rejimga O'tish</h2>
            <p>PRO nishoniga ega bo'lish uchun to'lovni bajaring va adminga skrinshot tashlang:</p>
            <div style={styles.cardDetails}>
              💳 <b>Karta raqam:</b> <code style={{fontSize: '16px'}}>8600123456789012</code><br/>
              💰 <b>Narxi:</b> 50,000 so'm (1 oylik faol muddat)
            </div>
            <div style={{margin: '15px 0'}}>Sizning unikal Worky ID: <b>{currentUserId}</b></div>
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
    onValue(ref(db, 'reports'), (snapshot) => {
      const data = snapshot.val();
      if (data) setReports(Object.keys(data).map(key => ({ id: key, ...data[key] })));
      else setReports([]);
    });
    onValue(ref(db, 'users'), (snapshot) => {
      const data = snapshot.val();
      if (data) setUsersList(Object.keys(data).map(key => ({ id: key, ...data[key] })));
      else setUsersList([]);
    });
  }, []);

  const handleThemeSave = async (e) => {
    e.preventDefault();
    await set(ref(db, 'settings/theme'), { primaryColor, backgroundColor, fontFamily: selectedFont, holiday, logoText: logoInput });
    alert('Barcha sozlamalar saqlandi!');
  };

  const handleActivatePro = async (targetId) => {
    if(!targetId) return alert("ID kiriting");
    const expireTime = Date.now() + 30 * 24 * 60 * 60 * 1000;
    await set(ref(db, `users/${targetId}/isPro`), true);
    await set(ref(db, `users/${targetId}/proExpireAt`), expireTime);
    alert(`ID: ${targetId} foydalanuvchiga 1 oylik PRO berildi!`);
  };

  return (
    <div style={styles.adminContainer}>
      <div style={styles.adminHeader}>
        <h2>👨‍💻 Worky Boshqaruv Markazi (Admin Panel)</h2>
        <button onClick={onLogout} style={styles.adminLogoutBtn}>Chiqish</button>
      </div>
      <div style={styles.adminGrid}>
        <div style={{...styles.adminCard, borderTop: '5px solid #e74c3c'}}>
          <h3>🚨 Shikoyatlar</h3>
          {reports.length === 0 ? <p>Hozircha shikoyatlar kelmagan.</p> : reports.map(rep => (
            <div key={rep.id} style={styles.reportCard}>
              <p style={{color: '#ef4444', fontWeight: 'bold'}}>⚠️ SABAB: {rep.reason}</p>
              <div style={{background: '#fff', padding: '10px', borderRadius: '6px', marginBottom: '5px', border: '1px solid #f5c6cb'}}>
                <b>🟢 Da'vogar:</b><br/>
                Ism: {rep.reporterName} (ID: {rep.reporterId})<br/>
                Tel: {rep.reporterPhone}<br/>
                Link: <a href={rep.reporterLink} target="_blank" rel="noreferrer">Telegram Profil</a>
              </div>
              <div style={{background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #f5c6cb'}}>
                <b>🔴 Qoidabuzar:</b><br/>
                Ism: {rep.accusedName} (ID: {rep.accusedId})<br/>
                Tel: {rep.accusedPhone}<br/>
                Link: <a href={rep.accusedLink} target="_blank" rel="noreferrer">Telegram Profil</a>
              </div>
              <div style={{display: 'flex', gap: '5px', marginTop: '10px'}}>
                <button onClick={() => window.open(`tel:${rep.accusedPhone}`)} style={{...styles.actionButton, backgroundColor: '#34495e', padding: '5px 10px', fontSize: '12px'}}>📞 Tel Qilish</button>
                <button onClick={async () => { await remove(ref(db, `reports/${rep.id}`)); alert('Shikoyat o\'chirildi'); }} style={{backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'}}>❌ O'chirish</button>
              </div>
            </div>
          ))}
        </div>

        <div style={{...styles.adminCard, borderTop: '5px solid #f1c40f'}}>
          <h3>👑 PRO Rejimni Faollashtirish (30 kunlik)</h3>
          <div style={{display: 'flex', gap: '5px', marginBottom: '15px'}}>
            <input type="text" placeholder="Foydalanuvchi Worky ID..." value={proUserId} onChange={(e) => setProUserId(e.target.value)} style={styles.inputField} />
            <button onClick={() => { handleActivatePro(proUserId); setProUserId(''); }} style={{backgroundColor: '#f1c40f', color: '#000', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer'}}>PRO Aktiv</button>
          </div>
          <h4>Foydalanuvchilar:</h4>
          <div style={{maxHeight: '200px', overflowY: 'auto'}}>
            {usersList.map(u => {
              const uId = u.telegramId || u.id;
              return (
                <div key={u.id} style={{display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #eee', fontSize: '13px'}}>
                  <span>{u.name || "Ismsiz"} (ID: {uId})</span>
                  {u.isPro ? <span style={{color: '#2ecc71'}}>Active ✅</span> : <button onClick={() => handleActivatePro(uId)} style={{fontSize: '11px', backgroundColor: '#e67e22', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '3px'}}>PRO Berish</button>}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{...styles.adminCard, borderTop: '5px solid #2ecc71'}}>
          <h3>🎨 Stil & Bayram Sozlamalari</h3>
          <form onSubmit={handleThemeSave} style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
            <label style={{fontSize: '13px', fontWeight: 'bold'}}>Asosiy Rang:</label>
            <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} style={styles.colorInput} />
            <label style={{fontSize: '13px', fontWeight: 'bold'}}>Fon Rangi:</label>
            <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} style={styles.colorInput} />
            <label style={{fontSize: '13px', fontWeight: 'bold'}}>Yozuv Shrifti:</label>
            <select value={selectedFont} onChange={(e) => setSelectedFont(e.target.value)} style={styles.inputField}>
              <option value="Inter">Inter</option>
              <option value="Poppins">Poppins</option>
              <option value="Montserrat">Montserrat</option>
              <option value="Roboto">Roboto</option>
            </select>
            <label style={{fontSize: '13px', fontWeight: 'bold'}}>Logotip Matni:</label>
            <input type="text" value={logoInput} onChange={(e) => setLogoInput(e.target.value)} style={styles.inputField} />
            <label style={{fontSize: '13px', fontWeight: 'bold'}}>Bayram Rejimi:</label>
            <select value={holiday} onChange={(e) => setHoliday(e.target.value)} style={styles.inputField}>
              <option value="oddiy">💼 Oddiy Rejim</option>
              <option value="yangi_yil">❄️ Yangi yil (1-yanvar)</option>
              <option value="yangi_yil_milodiy">🎆 Milodiy Yangi Yil (31-dekabr)</option>
              <option value="navruz">🌱 Navro'z bayrami (21-mart)</option>
              <option value="ramazon">🌙 Ramazon oyi</option>
              <option value="ruza_hayit">🤲 Ro'za Hayit</option>
              <option value="qurbon_hayit">🐑 Qurbon Hayit</option>
              <option value="mustaqillik">🇺🇿 Mustaqillik kuni (1-sentabr)</option>
              <option value="xotin_qizlar">🌹 8-Mart Bayrami</option>
            </select>
            <button type="submit" style={styles.saveStyleBtn}>Butun Saytga Qo'llash</button>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  loginContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-color, #F7F8FA)', padding: '15px' },
  loginCard: { backgroundColor: '#fff', padding: '30px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', width: '100%', maxWidth: '440px', textAlign: 'center' },
  logoRow: { display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '10px' },
  holidayBanner: { color: '#fff', padding: '8px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', marginBottom: '15px' },
  formContainer: { display: 'flex', flexDirection: 'column', gap: '12px' },
  input: { width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '15px', boxSizing: 'border-box', outline: 'none' },
  loginNote: { background: '#fff9db', border: '1px solid #ffe066', borderRadius: '8px', padding: '12px', fontSize: '11px', textAlign: 'left', color: '#666', lineHeight: '1.5' },
  button: { width: '100%', padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--main-color, #1D9E75)', color: '#fff', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold', marginTop: '5px' },
  errorText: { color: '#ef4444', fontSize: '13px', margin: '0' },
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
  workerCard: { backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', borderTop: '4px solid var(--main-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
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