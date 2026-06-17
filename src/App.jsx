import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, get, set, push } from 'firebase/database';

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

  // Admin o'rnatgan dinamik CSS ranglarini yuklash
  useEffect(() => {
    onValue(ref(db, 'settings/theme'), (snapshot) => {
      const data = snapshot.val();
      if (data && data.primaryColor) {
        document.documentElement.style.setProperty('--main-color', data.primaryColor);
        document.documentElement.style.setProperty('--bg-color', data.backgroundColor || '#f4f6f9');
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

        // --- 1 OYLIK PRO MUDDATINI TEKSHIRISH MANTIG'I ---
        if (userData.isPro && userData.proExpireAt) {
          const now = new Date().getTime();
          const expireTime = new Date(userData.proExpireAt).getTime();

          if (now > expireTime) {
            // Agar 1 oy o'tib ketgan bo'lsa, avtomatik PROni o'chiramiz
            userData.isPro = false;
            await set(ref(db, `users/${userId}/isPro`), false);
            alert("Sizning 1 oylik PRO tarifingiz muddati tugadi! Iltimos, qayta faollashtiring.");
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
    if (!user.isPro) return setShowProModal(true); // Blokirovka
    if (!comment || !targetUserId) return alert('Hamma maydonlarni toʻldiring!');
    await set(push(ref(db, 'reviews')), {
      fromName: user.name, fromId: user.telegramId, toId: targetUserId, rating: Number(rating), text: comment, createdAt: new Date().toISOString()
    });
    alert('Sharh qoʻshildi!');
    setComment(''); setTargetUserId('');
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!user.isPro) return setShowProModal(true); // Blokirovka
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

  // Telegram lichkangga yo'naltirish havolasi
  const openTelegramPro = () => {
    const text = encodeURIComponent(`Salom Temur, men Worky saytida PRO sotib olmoqchiman. Mening Worky ID raqamim: ${user.telegramId}`);
    window.open(`https://t.me/logotipshop10?text=${text}`, '_blank');
  };

  return (
    <div style={styles.dashboardContainer}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={{textAlign: 'center', marginBottom: '20px'}}>
          <h3 style={{ color: '#fff', margin: '0' }}>Worky Menu</h3>
          {user.isPro ? (
            <span style={styles.proBadge}>👑 PRO FOOL</span>
          ) : (
            <span style={styles.freeBadge}>Oddiy Akkaunt</span>
          )}
        </div>
        <button onClick={() => setActiveTab('main')} style={styles.menuBtn}>🏠 Asosiy Panel</button>
        <button onClick={() => { if(user.isPro) { setActiveTab('find_workers') } else { setShowProModal(true) } }} style={styles.menuBtn}>👷 Ishchi Qidirish {!user.isPro && '🔒'}</button>
        <button onClick={() => setActiveTab('reviews')} style={styles.menuBtn}>⭐ Sharh & Reyting</button>
        <button onClick={() => setActiveTab('report')} style={styles.menuBtn}>🚨 Shikoyat Berish</button>
        {!user.isPro && <button onClick={() => setShowProModal(true)} style={{...styles.menuBtn, backgroundColor: '#f1c40f', color: '#000', fontWeight: 'bold'}}>👑 PRO SATIN OLISH</button>}
        <button onClick={onLogout} style={styles.logoutBtn}>Chiqish</button>
      </div>

      {/* Content */}
      <div style={styles.mainContent}>
        {activeTab === 'main' && (
          <div>
            <h1 style={{ color: 'var(--main-color, #007bff)' }}>Xush kelibsiz, {user.name}!</h1>
            <p>Sizning Worky ID: <b>{user.telegramId}</b></p>
            <p>Xizmat turi: {user.role === 'worker' ? '👷 Ishchi' : '💼 Ish beruvchi'}</p>
            <p>Profil holati: {user.isPro ? <b style={{color: '#2ecc71'}}>Faol PRO (Muddati: {user.proExpireAt})</b> : <b style={{color: '#e74c3c'}}>Cheklangan (PRO emas)</b>}</p>
            <hr style={{ margin: '20px 0', border: '0.5px solid #ddd' }} />

            {!user.isPro ? (
              <div style={{...styles.roleCard, borderLeft: '5px solid #f1c40f', backgroundColor: '#fffdf0'}}>
                <h2>🔒 Hamma funksiyalar bloklangan!</h2>
                <p>Saytdagi barcha xodimlarni koʻrish, telefon raqamlarini olish, e'lon joylashtirish va sharh yozish funksiyalaridan toʻliq foydalanish uchun PRO akkaunt sotib olishingiz shart.</p>
                <button onClick={() => setShowProModal(true)} style={{...styles.actionButton, backgroundColor: '#f1c40f', color: '#000'}}>👑 PRO Tarifni Ko'rish</button>
              </div>
            ) : (
              <div style={styles.roleCard}>
                <h2>🎉 Barcha Premium imkoniyatlar ochiq!</h2>
                <p>Siz PRO foydalanuvchisiz. Endi cheksiz ravishda xodimlarni qidirishingiz, telefon raqamlarini koʻrishingiz va tizim bilan cheksiz ishlashingiz mumkin.</p>
              </div>
            )}
          </div>
        )}

        {/* Ishchi qidirish */}
        {activeTab === 'find_workers' && user.isPro && (
          <div>
            <h2>👷 Platformadagi barcha faol ishchilar</h2>
            <div style={styles.filterBar}>
              <input type="text" placeholder="Ism yoki tuman bo'yicha qidirish..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={styles.filterInput} />
              <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)} style={styles.filterSelect}>
                <option value="">Hamma viloyatlar</option>
                <option value="Toshkent sh.">Toshkent sh.</option><option value="Toshkent vil.">Toshkent vil.</option><option value="Farg'ona">Farg'ona</option><option value="Andijon">Andijon</option><option value="Namangan">Namangan</option><option value="Samarqand">Samarqand</option><option value="Buxoro">Buxoro</option><option value="Xorazm">Xorazm</option><option value="Navoiy">Navoiy</option><option value="Qashqadaryo">Qashqadaryo</option><option value="Surxondaryo">Surxondaryo</option><option value="Jizzax">Jizzax</option><option value="Sirdaryo">Sirdaryo</option><option value="Qoraqalpog'iston">Qoraqalpog'iston</option>
              </select>
            </div>
            <div style={styles.workersGrid}>
              {filteredWorkers.map(worker => (
                <div key={worker.id} style={styles.workerCard}>
                  <h3>{worker.name}</h3>
                  <p>📍 <b>Hudud:</b> {worker.region}, {worker.district}</p>
                  <p>📱 <b>Tel:</b> <a href={`tel:${worker.phone}`} style={{color: 'var(--main-color)'}}>{worker.phone}</a></p>
                  <button onClick={() => { setTargetUserId(worker.telegramId); setActiveTab('reviews'); }} style={{ ...styles.actionButton, marginTop: '10px', padding: '6px 12px', fontSize: '13px' }}>Sharh yozish</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sharh yozish (Faqat PRO uchun) */}
        {activeTab === 'reviews' && (
          <div>
            <h2>Sharhlar va Reyting tizimi</h2>
            {!user.isPro && <p style={{color: 'red'}}>⚠️ Diqqat! Sharh qoldirish funksiyasi faqat PRO foydalanuvchilar uchun faol.</p>}
            <form onSubmit={handleReviewSubmit} style={styles.dashboardForm}>
              <input type="text" placeholder="Foydalanuvchi Worky ID raqami" value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)} style={styles.inputField} disabled={!user.isPro} />
              <select value={rating} onChange={(e) => setRating(e.target.value)} style={styles.inputField} disabled={!user.isPro}>
                <option value="5">⭐⭐⭐⭐⭐ (5 - Alo)</option>
                <option value="4">⭐⭐⭐⭐ (4 - Yaxshi)</option>
              </select>
              <textarea placeholder="Fikr-mulohazangizni yozing..." value={comment} onChange={(e) => setComment(e.target.value)} style={styles.textareaField} disabled={!user.isPro}></textarea>
              <button type="submit" style={styles.actionButton}>Sharh qoldirish</button>
            </form>
            <h3 style={{ marginTop: '30px' }}>Tizimdagi sharhlar:</h3>
            {allReviews.map(r => (
              <div key={r.id} style={styles.itemCard}>
                <h4>{r.fromName} ➡️ (ID: {r.toId} ga) — {r.rating} ⭐</h4>
                <p>{r.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Shikoyat berish (Faqat PRO uchun) */}
        {activeTab === 'report' && (
          <div>
            <h2>🚨 Shikoyat ariza berish</h2>
            {!user.isPro && <p style={{color: 'red'}}>⚠️ Diqqat! Shikoyat berish funksiyasi faqat PRO foydalanuvchilar uchun faol.</p>}
            <form onSubmit={handleReportSubmit} style={styles.dashboardForm}>
              <input type="text" placeholder="Qoidabuzar Worky ID raqami" value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)} style={styles.inputField} disabled={!user.isPro} />
              <textarea placeholder="Shikoyat sababini batafsil yozing..." value={reportText} onChange={(e) => setReportText(e.target.value)} style={styles.textareaField} disabled={!user.isPro}></textarea>
              <button type="submit" style={{ ...styles.actionButton, backgroundColor: '#dc3545' }}>Adminga ariza yuborish</button>
            </form>
          </div>
        )}
      </div>

      {/* === PRO SOTIB OLISH MODAL OYNASI (QOIDALAR BILAN) === */}
      {showProModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h2 style={{color: '#f1c40f'}}>👑 Worky PRO Akkaunt Sotib Olish</h2>
            <div style={styles.rulesBox}>
              <h4>📋 PRO Akkaunt Qoidalari va Shartlari:</h4>
              <p>1. PRO status sotib olingan kundan boshlab roppa-rosa <b>1 oy (30 kun)</b> davomida amal qiladi.</p>
              <p>2. PRO akkaunt orqali siz barcha foydalanuvchilarning telefon raqamlarini cheksiz koʻra olasiz.</p>
              <p>3. Tizimda firibgarlik yoki qoidabuzarlik qilinsa, PRO status qaytarib berilmasdan profil bloklanadi.</p>
              <p>4. To'lov mutlaqo xavfsiz va shaxsan admin orqali amalga oshiriladi.</p>
              <p style={{marginTop: '10px', color: '#ffbd00'}}><b>💰 Narxi: 1 oyga 25,000 so'm</b></p>
            </div>
            <p style={{fontSize: '14px', margin: '15px 0'}}>Sizning Worky ID raqamingiz: <b>{user.telegramId}</b></p>
            <div style={{display: 'flex', gap: '10px', justifyContent: 'center'}}>
              <button onClick={openTelegramPro} style={{...styles.actionButton, backgroundColor: '#2ecc71'}}>💬 Adminga ID yuborish va Karta olish</button>
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
  const [reports, setReports] = useState([]);

  // PRO faollashtirish holati
  const [proUserId, setProUserId] = useState('');

  useEffect(() => {
    onValue(ref(db, 'reports'), (snapshot) => {
      const data = snapshot.val();
      if (data) setReports(Object.keys(data).map(key => ({ id: key, ...data[key] })));
    });
  }, []);

  const handleThemeSave = async (e) => {
    e.preventDefault();
    await set(ref(db, 'settings/theme'), { primaryColor, backgroundColor });
    alert('Sayt stili yangilandi!');
  };

  // --- ADMIN TOMONIDAN 1 OYLIK PRO AKTIV QILISH MANTIG'I ---
  const handleActivatePro = async (e) => {
    e.preventDefault();
    if (!proUserId) return alert("Foydalanuvchi ID sini kiriting!");

    try {
      const userRef = ref(db, `users/${proUserId}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const today = new Date();
        // 30 kun qo'shish (1 oy)
        const expireDate = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));

        await set(ref(db, `users/${proUserId}/isPro`), true);
        await set(ref(db, `users/${proUserId}/proExpireAt`), expireDate.toISOString().split('T')[0]); // YYYY-MM-DD ko'rinishida saqlash

        alert(`Foydalanuvchi (ID: ${proUserId}) uchun 1 oylik PRO muvaffaqiyatli yoqildi! Tugash muddati: ${expireDate.toISOString().split('T')[0]}`);
        setProUserId('');
      } else {
        alert("Bunday Worky ID topilmadi! Foydalanuvchi botdan o'tganini tekshiring.");
      }
    } catch (error) {
      alert("Xatolik yuz berdi.");
    }
  };

  return (
    <div style={styles.adminContainer}>
      <div style={styles.adminHeader}>
        <h2>👨‍💻 Worky Markaziy Admin boshqaruvi</h2>
        <button onClick={onLogout} style={styles.adminLogoutBtn}>Chiqish</button>
      </div>

      <div style={styles.adminGrid}>
        {/* PRO FAOL QILISh TIZIMI */}
        <div style={{...styles.adminCard, borderTop: '5px solid #2ecc71'}}>
          <h3>👑 PRO Akkaunt Aktivlashtirish (1 Oylik)</h3>
          <p style={{fontSize: '13px', color: '#666'}}>Plastikka pul tashlagan xaridorning Worky ID sini yozing. Tizim unga avtomat 30 kunlik muddat belgilaydi:</p>
          <form onSubmit={handleActivatePro} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
            <input
              type="text"
              placeholder="Foydalanuvchi Worky ID raqami..."
              value={proUserId}
              onChange={(e) => setProUserId(e.target.value)}
              style={styles.inputField}
            />
            <button type="submit" style={{...styles.saveStyleBtn, backgroundColor: '#2ecc71'}}>✅ PRO Status Berish (30 kun)</button>
          </form>
        </div>

        {/* Dizayn sozlamalari */}
        <div style={styles.adminCard}>
          <h3>🎨 Sayt Dizaynini boshqarish</h3>
          <form onSubmit={handleThemeSave} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
            <label>Elementlar rangi:</label>
            <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} style={styles.colorInput} />
            <label>Fon rangi:</label>
            <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} style={styles.colorInput} />
            <button type="submit" style={styles.saveStyleBtn}>Uslubni qo'llash</button>
          </form>
        </div>

        {/* Arizalar */}
        <div style={styles.adminCard}>
          <h3>🚨 Kelgan Shikoyat arizalari</h3>
          {reports.length === 0 ? <p>Arizalar mavjud emas.</p> : (
            reports.map(rep => (
              <div key={rep.id} style={styles.reportCard}>
                <p><b>Kimdan:</b> {rep.reporterName} (ID: {rep.reporterId})</p>
                <p><b>Qoidabuzar ID:</b> <span style={{ color: 'red', fontWeight: 'bold' }}>{rep.accusedId}</span></p>
                <p><b>Sababi:</b> {rep.reason}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// === CSS STIL JADVALLARI ===
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
  actionButton: { padding: '12px 25px', border: 'none', borderRadius: '6px', backgroundColor: 'var(--main-color, #007bff)', color: '#fff', fontWeight: 'bold', cursor: 'pointer' },

  proBadge: { display: 'inline-block', padding: '4px 10px', backgroundColor: '#f1c40f', color: '#000', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', marginTop: '5px' },
  freeBadge: { display: 'inline-block', padding: '4px 10px', backgroundColor: '#7f8c8d', color: '#fff', borderRadius: '20px', fontSize: '12px', marginTop: '5px' },

  filterBar: { display: 'flex', gap: '15px', marginBottom: '20px', marginTop: '15px' },
  filterInput: { flex: 2, padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '15px' },
  filterSelect: { flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '15px' },
  workersGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '15px' },
  workerCard: { backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderTop: '4px solid var(--main-color)' },

  dashboardForm: { backgroundColor: '#fff', padding: '20px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '500px', marginTop: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  inputField: { padding: '11px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '15px' },
  textareaField: { padding: '11px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '15px', height: '100px', resize: 'none' },
  itemCard: { backgroundColor: '#fff', padding: '15px', borderRadius: '6px', marginTop: '10px', borderLeft: '5px solid var(--main-color)' },

  adminContainer: { padding: '30px', backgroundColor: '#f4f6f9', minHeight: '100vh' },
  adminHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ddd', paddingBottom: '15px' },
  adminLogoutBtn: { padding: '10px 20px', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  adminGrid: { display: 'flex', gap: '25px', marginTop: '20px', flexWrap: 'wrap' },
  adminCard: { flex: 1, minWidth: '350px', backgroundColor: '#fff', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' },
  colorInput: { width: '100%', height: '40px', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' },
  saveStyleBtn: { padding: '12px', backgroundColor: '#2ecc71', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },
  reportCard: { padding: '15px', backgroundColor: '#fff5f5', borderRadius: '6px', marginTop: '10px', borderLeft: '5px solid #e74c3c' },

  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalCard: { backgroundColor: '#fff', padding: '30px', borderRadius: '12px', maxWidth: '500px', width: '100%', textAlign: 'center', boxShadow: '0 5px 25px rgba(0,0,0,0.2)' },
  rulesBox: { backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', textAlign: 'left', marginTop: '15px', border: '1px solid #eee' }
};