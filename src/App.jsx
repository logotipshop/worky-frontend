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

// === ASOSIY APP KOMPONENTI ===
export default function App() {
  const [userId, setUserId] = useState('');
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Bazadan rang va shriftni o'qib, saytga qo'llash
  useEffect(() => {
    onValue(ref(db, 'settings/theme'), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        if (data.primaryColor) document.documentElement.style.setProperty('--main-color', data.primaryColor);
        if (data.backgroundColor) document.documentElement.style.setProperty('--bg-color', data.backgroundColor);

        // Agar bazada shrift bo'lsa, uni yuklash va butun sayt body qismiga berish
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

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!userId) return;

    if (userId === 'ADMIN777') {
      setIsAdmin(true);
      return;
    }

    try {
      const userRef = ref(db, `users/${userId}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const userData = snapshot.val();

        if (userData.isPro && userData.proExpireAt) {
          const now = new Date().getTime();
          const expireTime = new Date(userData.proExpireAt).getTime();

          if (now > expireTime) {
            userData.isPro = false;
            await set(ref(db, `users/${userId}/isPro`), false);
            alert("Sizning 1 oylik PRO tarifingiz muddati tugadi!");
          }
        }

        setUser(userData);
        setLoginError('');
      } else {
        setLoginError('Bunday Worky ID topilmadi! Avval botdan roʻyxatdan oʻting.');
      }
    } catch (error) {
      setLoginError('Ulanishda xatolik yuz berdi.');
    }
  };

  if (isAdmin) return <AdminPanel onLogout={() => setIsAdmin(false)} />;
  if (user) return <Dashboard user={user} onLogout={() => setUser(null)} />;

  return (
    <div style={styles.loginContainer}>
      {/* Google Fonts uchun dinamik havola */}
      <link id="google-font-link" rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700&display=swap" />

      <div style={styles.loginCard}>
        <h2 style={{ color: 'var(--main-color, #007bff)', marginBottom: '10px' }}>Worky Platformasi</h2>
        <p style={{ fontSize: '14px', color: '#666' }}>Telegram botdan olgan Worky ID raqamingizni kiriting:</p>

        <form onSubmit={handleLogin} style={styles.formContainer}>
          <input
            type="text"
            placeholder="Masalan: 877478923"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            style={styles.input}
          />
          {loginError && <p style={styles.errorText}>{loginError}</p>}
          <button type="submit" style={styles.button}>Tizimga kirish</button>
        </form>
      </div>
    </div>
  );
}

// === FOYDALANUVChI DASHBOARD PANELI ===
function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('main');
  const [showProModal, setShowProModal] = useState(false);
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  const [reportText, setReportText] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [allReviews, setAllReviews] = useState([]);
  const [allWorkers, setAllWorkers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRegion, setFilterRegion] = useState('');

  useEffect(() => {
    onValue(ref(db, 'reviews'), (snapshot) => {
      const data = snapshot.val();
      if (data) setAllReviews(Object.keys(data).map(key => ({ id: key, ...data[key] })));
    });

    onValue(ref(db, 'users'), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const workers = Object.keys(data)
          .map(key => ({ id: key, ...data[key] }))
          .filter(u => u.role === 'worker');
        setAllWorkers(workers);
      }
    });
  }, []);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user.isPro) return setShowProModal(true);
    if (!comment || !targetUserId) return alert('Hamma maydonlarni toʻldiring!');
    await set(push(ref(db, 'reviews')), {
      fromName: user.name, fromId: user.telegramId, toId: targetUserId, rating: Number(rating), text: comment, createdAt: new Date().toISOString()
    });
    alert('Sharh qoʻshildi!');
    setComment(''); setTargetUserId('');
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!user.isPro) return setShowProModal(true);
    if (!reportText || !targetUserId) return alert('Hamma maydonlarni toʻldiring!');
    await set(push(ref(db, 'reports')), {
      reporterName: user.name, reporterId: user.telegramId, accusedId: targetUserId, reason: reportText, status: 'pending', createdAt: new Date().toISOString()
    });
    alert('Shikoyat adminga yuborildi!');
    setReportText(''); setTargetUserId('');
  };

  const filteredWorkers = allWorkers.filter(w => {
    const matchesSearch = w.name.toLowerCase().includes(searchQuery.toLowerCase()) || w.district.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = filterRegion === '' || w.region === filterRegion;
    return matchesSearch && matchesRegion;
  });

  const openTelegramPro = () => {
    const text = encodeURIComponent(`Salom Temur, men Worky saytida PRO sotib olmoqchiman. Mening Worky ID raqamim: ${user.telegramId}`);
    window.open(`https://t.me/logotipshop10?text=${text}`, '_blank');
  };

  return (
    <div style={styles.dashboardContainer}>
      <div style={styles.sidebar}>
        <div style={{textAlign: 'center', marginBottom: '20px'}}>
          <h3 style={{ color: '#fff', margin: '0' }}>Worky Menu</h3>
          {user.isPro ? <span style={styles.proBadge}>👑 PRO FAOL</span> : <span style={styles.freeBadge}>Oddiy Akkaunt</span>}
        </div>
        <button onClick={() => setActiveTab('main')} style={styles.menuBtn}>🏠 Asosiy Panel</button>
        <button onClick={() => { if(user.isPro) { setActiveTab('find_workers') } else { setShowProModal(true) } }} style={styles.menuBtn}>👷 Ishchi Qidirish {!user.isPro && '🔒'}</button>
        <button onClick={() => setActiveTab('reviews')} style={styles.menuBtn}>⭐ Sharh & Reyting</button>
        <button onClick={() => setActiveTab('report')} style={styles.menuBtn}>🚨 Shikoyat Berish</button>
        {!user.isPro && <button onClick={() => setShowProModal(true)} style={{...styles.menuBtn, backgroundColor: '#f1c40f', color: '#000', fontWeight: 'bold'}}>👑 PRO SOTIB OLISH</button>}
        <button onClick={onLogout} style={styles.logoutBtn}>Chiqish</button>
      </div>

      <div style={styles.mainContent}>
        {activeTab === 'main' && (
          <div>
            <h1 style={{ color: 'var(--main-color, #007bff)' }}>Xush kelibsiz, {user.name}!</h1>
            <p>Sizning Worky ID: <b>{user.telegramId}</b></p>
            <p>Profil holati: {user.isPro ? <b style={{color: '#2ecc71'}}>Faol PRO</b> : <b style={{color: '#e74c3c'}}>Cheklangan</b>}</p>
            <hr style={{ margin: '20px 0', border: '0.5px solid #ddd' }} />

            {!user.isPro && (
              <div style={{...styles.roleCard, borderLeft: '5px solid #f1c40f', backgroundColor: '#fffdf0'}}>
                <h2>🔒 Hamma funksiyalar bloklangan!</h2>
                <p>Saytdagi barcha xodimlarni koʻrish va Telegram orqali bogʻlanish uchun PRO kerak.</p>
                <button onClick={() => setShowProModal(true)} style={{...styles.actionButton, backgroundColor: '#f1c40f', color: '#000'}}>👑 PRO Tarifni Ko'rish</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'find_workers' && user.isPro && (
          <div>
            <h2>👷 Platformadagi barcha faol ishchilar</h2>
            <div style={styles.filterBar}>
              <input type="text" placeholder="Qidirish..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={styles.filterInput} />
            </div>
            <div style={styles.workersGrid}>
              {filteredWorkers.map(w => (
                <div key={w.id} style={styles.workerCard}>
                  <h3>{w.name}</h3>
                  <p>📍 <b>Hudud:</b> {w.region}, {w.district}</p>
                  <p>📱 <b>Tel:</b> <a href={`tel:${w.phone}`} style={{color: 'var(--main-color)'}}>{w.phone}</a></p>

                  <div style={{display: 'flex', gap: '8px', marginTop: '12px'}}>
                    <button onClick={() => window.open(`https://t.me/user?id=${w.telegramId}`, '_blank')} style={{ ...styles.actionButton, backgroundColor: '#2ab21e', flex: 1, padding: '8px', fontSize: '13px' }}>
                      💬 Telegramda bog'lanish
                    </button>
                    <button onClick={() => { setTargetUserId(w.telegramId); setActiveTab('reviews'); }} style={{ ...styles.actionButton, flex: 1, padding: '8px', fontSize: '13px' }}>
                      Sharh
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div>
            <h2>Sharhlar va Reyting tizimi</h2>
            <form onSubmit={handleReviewSubmit} style={styles.dashboardForm}>
              <input type="text" placeholder="Worky ID raqami" value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)} style={styles.inputField} disabled={!user.isPro} />
              <select value={rating} onChange={(e) => setRating(e.target.value)} style={styles.inputField} disabled={!user.isPro}>
                <option value="5">⭐⭐⭐⭐⭐ (5 - Alo)</option>
                <option value="4">⭐⭐⭐⭐ (4 - Yaxshi)</option>
              </select>
              <textarea placeholder="Fikr-mulohazangizni yozing..." value={comment} onChange={(e) => setComment(e.target.value)} style={styles.textareaField} disabled={!user.isPro}></textarea>
              <button type="submit" style={styles.actionButton} disabled={!user.isPro}>Sharh qoldirish</button>
            </form>
          </div>
        )}

        {activeTab === 'report' && (
          <div>
            <h2>🚨 Shikoyat ariza berish</h2>
            <form onSubmit={handleReportSubmit} style={styles.dashboardForm}>
              <input type="text" placeholder="Qoidabuzar Worky ID raqami" value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)} style={styles.inputField} disabled={!user.isPro} />
              <textarea placeholder="Shikoyat sababini batafsil yozing..." value={reportText} onChange={(e) => setReportText(e.target.value)} style={styles.textareaField} disabled={!user.isPro}></textarea>
              <button type="submit" style={{ ...styles.actionButton, backgroundColor: '#dc3545' }} disabled={!user.isPro}>Adminga ariza yuborish</button>
            </form>
          </div>
        )}
      </div>

      {showProModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h2 style={{color: '#f1c40f'}}>👑 Worky PRO Akkaunt</h2>
            <div style={styles.rulesBox}>
              <p>1. PRO status 1 oy davomida amal qiladi.</p>
              <p>2. Xodimlarning telefonlarini va Telegram profillarini ochadi.</p>
              <p style={{color: '#ffbd00'}}><b>💰 Narxi: 1 oyga 25,000 so'm</b></p>
            </div>
            <div style={{display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '15px'}}>
              <button onClick={openTelegramPro} style={{...styles.actionButton, backgroundColor: '#2ecc71'}}>💬 Adminga yuborish</button>
              <button onClick={() => setShowProModal(false)} style={{...styles.actionButton, backgroundColor: '#7f8c8d'}}>Yopish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// === CENTRAL ADMIN PANEL KOMPONENTI ===
function AdminPanel({ onLogout }) {
  const [primaryColor, setPrimaryColor] = useState('#007bff');
  const [backgroundColor, setBackgroundColor] = useState('#f4f6f9');
  const [selectedFont, setSelectedFont] = useState('Inter'); // Default shrift
  const [reports, setReports] = useState([]);
  const [proUserId, setProUserId] = useState('');

  useEffect(() => {
    onValue(ref(db, 'reports'), (snapshot) => {
      const data = snapshot.val();
      if (data) setReports(Object.keys(data).map(key => ({ id: key, ...data[key] })));
      else setReports([]);
    });

    // Avval saqlangan dizayn qiymatlarini admin paneldagi inputlarga o'rnatish
    get(ref(db, 'settings/theme')).then((snapshot) => {
      if(snapshot.exists()) {
        const val = snapshot.val();
        if(val.primaryColor) setPrimaryColor(val.primaryColor);
        if(val.backgroundColor) setBackgroundColor(val.backgroundColor);
        if(val.fontFamily) setSelectedFont(val.fontFamily);
      }
    });
  }, []);

  // DIZAYN VA SHRIFTNI BAZAGA SAQLASH
  const handleThemeSave = async (e) => {
    e.preventDefault();
    await set(ref(db, 'settings/theme'), {
      primaryColor,
      backgroundColor,
      fontFamily: selectedFont // Tanlangan shriftni saqlaymiz
    });
    alert('Dizayn va Shrift muvaffaqiyatli saqlandi!');
  };

  const handleActivatePro = async (e) => {
    e.preventDefault();
    if (!proUserId) return alert("ID kiriting!");
    try {
      const userRef = ref(db, `users/${proUserId}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const expireDate = new Date(new Date().getTime() + (30 * 24 * 60 * 60 * 1000));
        await set(ref(db, `users/${proUserId}/isPro`), true);
        await set(ref(db, `users/${proUserId}/proExpireAt`), expireDate.toISOString().split('T')[0]);
        alert("PRO faollashdi!");
        setProUserId('');
      } else { alert("ID topilmadi!"); }
    } catch (e) { alert("Xato!"); }
  };

  const handleAcceptReport = async (reportId) => {
    if (window.confirm("Arizani o'chirmoqchimisiz?")) {
      await remove(ref(db, `reports/${reportId}`));
      alert("Ariza o'chirildi!");
    }
  };

  return (
    <div style={styles.adminContainer}>
      <div style={styles.adminHeader}>
        <h2>👨‍💻 Worky Markaziy Admin</h2>
        <button onClick={onLogout} style={styles.adminLogoutBtn}>Chiqish</button>
      </div>

      <div style={styles.adminGrid}>
        <div style={{...styles.adminCard, borderTop: '5px solid #2ecc71'}}>
          <h3>👑 PRO Aktivlashtirish</h3>
          <form onSubmit={handleActivatePro} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input type="text" placeholder="Worky ID..." value={proUserId} onChange={(e) => setProUserId(e.target.value)} style={styles.inputField} />
            <button type="submit" style={styles.saveStyleBtn}>✅ PRO Berish (30 kun)</button>
          </form>
        </div>

        <div style={{...styles.adminCard, borderTop: '5px solid #e74c3c'}}>
          <h3>🚨 Kelgan Shikoyat arizalari</h3>
          {reports.length === 0 ? <p>Hozircha shikoyatlar yo'q.</p> : (
            reports.map(rep => (
              <div key={rep.id} style={styles.reportCard}>
                <p><b>Kimdan:</b> {rep.reporterName} (ID: {rep.reporterId})</p>
                <p><b>Qoidabuzar:</b> <span style={{ color: 'red', fontWeight: 'bold' }}>{rep.accusedId}</span></p>
                <p><b>Sababi:</b> {rep.reason}</p>
                <button onClick={() => handleAcceptReport(rep.id)} style={{...styles.adminLogoutBtn, backgroundColor: '#2ecc71', padding: '5px 10px', fontSize: '12px', marginTop: '10px', width: '100%'}}>
                  ✅ Arizani Qabul Qilish (O'chirish)
                </button>
              </div>
            ))
          )}
        </div>

        {/* === YaNGILANGAN DIZAYN VA SHRIFT PANELI === */}
        <div style={styles.adminCard}>
          <h3>🎨 Dizayn va Shrift sozlamalari</h3>
          <form onSubmit={handleThemeSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{fontSize: '14px', fontWeight: '500'}}>Asosiy Rang:</label>
              <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} style={styles.colorInput} />
            </div>

            <div>
              <label style={{fontSize: '14px', fontWeight: '500'}}>Orqa Fon Rangi:</label>
              <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} style={styles.colorInput} />
            </div>

            {/* === SHRIFT TANLASH DROPDOWN MENUSI === */}
            <div>
              <label style={{fontSize: '14px', fontWeight: '500'}}>Sayt Shrifti (Font Family):</label>
              <select value={selectedFont} onChange={(e) => setSelectedFont(e.target.value)} style={{...styles.inputField, width: '100%', marginTop: '5px'}}>
                <option value="Inter">Inter (Zamonaviy & Minimal)</option>
                <option value="Poppins">Poppins (Chiroyli & Dumaloq)</option>
                <option value="Roboto">Roboto (Klassik & Oddiy)</option>
                <option value="Montserrat">Montserrat (Geometrik & Qalin)</option>
              </select>
            </div>

            <button type="submit" style={styles.saveStyleBtn}>Uslub & Shriftni Saqlash</button>
          </form>
        </div>
      </div>
    </div>
  );
}

// Universal Styles
const styles = {
  loginContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-color, #f4f6f9)' },
  loginCard: { backgroundColor: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', textAlign: 'center' },
  formContainer: { marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' },
  input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px', boxSizing: 'border-box' },
  button: { width: '100%', padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--main-color, #007bff)', color: '#fff', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' },
  errorText: { color: 'red', fontSize: '13px', margin: '0' },
  dashboardContainer: { display: 'flex', height: '100vh', backgroundColor: 'var(--bg-color, #f4f6f9)' },
  sidebar: { width: '260px', backgroundColor: '#2c3e50', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' },
  menuBtn: { width: '100%', padding: '12px', border: 'none', borderRadius: '6px', backgroundColor: '#34495e', color: '#fff', cursor: 'pointer', textAlign: 'left', fontSize: '15px' },
  logoutBtn: { width: '100%', padding: '12px', border: 'none', borderRadius: '6px', backgroundColor: '#e74c3c', color: '#fff', cursor: 'pointer', marginTop: 'auto', fontWeight: 'bold' },
  mainContent: { flex: 1, padding: '35px', overflowY: 'auto' },
  roleCard: { backgroundColor: '#fff', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginTop: '20px' },
  actionButton: { border: 'none', borderRadius: '6px', backgroundColor: 'var(--main-color, #007bff)', color: '#fff', fontWeight: 'bold', cursor: 'pointer' },
  proBadge: { display: 'inline-block', padding: '4px 10px', backgroundColor: '#f1c40f', color: '#000', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', marginTop: '5px' },
  freeBadge: { display: 'inline-block', padding: '4px 10px', backgroundColor: '#7f8c8d', color: '#fff', borderRadius: '20px', fontSize: '12px', marginTop: '5px' },
  filterBar: { display: 'flex', gap: '15px', marginBottom: '20px', marginTop: '15px' },
  filterInput: { flex: 2, padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '15px' },
  workersGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '15px' },
  workerCard: { backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderTop: '4px solid var(--main-color)' },
  dashboardForm: { backgroundColor: '#fff', padding: '20px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '500px', marginTop: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  inputField: { padding: '11px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '15px' },
  textareaField: { padding: '11px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '15px', height: '100px', resize: 'none' },
  adminContainer: { padding: '30px', backgroundColor: '#f4f6f9', minHeight: '100vh' },
  adminHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ddd', paddingBottom: '15px' },
  adminLogoutBtn: { border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', color: '#fff' },
  adminGrid: { display: 'flex', gap: '25px', marginTop: '20px', flexWrap: 'wrap' },
  adminCard: { flex: 1, minWidth: '350px', backgroundColor: '#fff', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' },
  colorInput: { width: '100%', height: '40px', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', padding: '0' },
  saveStyleBtn: { padding: '12px', backgroundColor: '#2ecc71', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },
  reportCard: { padding: '15px', backgroundColor: '#fff5f5', borderRadius: '6px', marginTop: '10px', borderLeft: '5px solid #e74c3c' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalCard: { backgroundColor: '#fff', padding: '30px', borderRadius: '12px', maxWidth: '500px', width: '100%', textAlign: 'center', boxShadow: '0 5px 25px rgba(0,0,0,0.2)' },
  rulesBox: { backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', textAlign: 'left', marginTop: '15px', border: '1px solid #eee' }
};