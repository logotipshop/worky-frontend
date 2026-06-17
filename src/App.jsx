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

  useEffect(() => {
    onValue(ref(db, 'settings/theme'), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        if (data.primaryColor) document.documentElement.style.setProperty('--main-color', data.primaryColor);
        if (data.backgroundColor) document.documentElement.style.setProperty('--bg-color', data.backgroundColor);

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
      <link id="google-font-link" rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700&display=swap" />
      <div style={styles.loginCard}>
        <h2 style={{ color: 'var(--main-color, #007bff)', marginBottom: '10px' }}>Worky Platformasi</h2>
        <form onSubmit={handleLogin} style={styles.formContainer}>
          <input type="text" placeholder="Worky ID raqamingiz..." value={userId} onChange={(e) => setUserId(e.target.value)} style={styles.input} />
          {loginError && <p style={styles.errorText}>{loginError}</p>}
          <button type="submit" style={styles.button}>Tizimga kirish</button>
        </form>
      </div>
    </div>
  );
}

// === CENTRAL DASHBOARD PANELI (ISHCHI VA ISH BERUVCHI) ===
function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('main');
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  const [reportText, setReportText] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [allWorkers, setAllWorkers] = useState([]);
  const [myApplications, setMyApplications] = useState([]); // Ishchiga kelgan arizalar
  const [sentApplications, setSentApplications] = useState([]); // Ish beruvchi yuborgan arizalar
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // 1. Ishchilar ro'yxatini yuklash
    onValue(ref(db, 'users'), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const workers = Object.keys(data)
          .map(key => ({ id: key, ...data[key] }))
          .filter(u => u.role === 'worker');
        setAllWorkers(workers);
      }
    });

    // 2. Arizalarni jonli (real-time) kuzatish
    onValue(ref(db, 'job_applications'), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        // Ishchiga kelgan arizalar
        setMyApplications(list.filter(app => app.workerId === user.telegramId));
        // Ish beruvchi yuborgan arizalar
        setSentApplications(list.filter(app => app.employerId === user.telegramId));
      } else {
        setMyApplications([]);
        setSentApplications([]);
      }
    });
  }, [user.telegramId]);

  // Ish beruvchi tomonidan ariza (taklif) yuborish
  const handleSendApplication = async (worker) => {
    if (user.role !== 'employer') return alert('Faqat ish beruvchilar ariza yubora oladi!');

    // Takroriy yuborishni tekshirish
    const exist = sentApplications.find(app => app.workerId === worker.telegramId);
    if (exist) return alert('Bu ishchiga allaqachon ariza yuborgansiz!');

    await set(push(ref(db, 'job_applications')), {
      employerId: user.telegramId,
      employerName: user.name,
      employerPhone: user.phone,
      workerId: worker.telegramId,
      workerName: worker.name,
      status: 'pending', // pending, accepted, declined
      createdAt: new Date().toISOString()
    });
    alert(`${worker.name}ga ish taklifi muvaffaqiyatli yuborildi!`);
  };

  // Ishchi arizani qabul qilishi
  const handleAcceptApp = async (appId) => {
    await set(ref(db, `job_applications/${appId}/status`), 'accepted');
    alert('Taklifni qabul qildingiz! Endi ish beruvchi siz bilan bog\'lana oladi.');
  };

  // Ishchi arizani rad etishi
  const handleDeclineApp = async (appId) => {
    await set(ref(db, `job_applications/${appId}/status`), 'declined');
    alert('Taklif rad etildi.');
  };

  // Shikoyat yuborish (Siz xohlagan eski oyna)
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportText || !targetUserId) return alert('Hamma maydonlarni toʻldiring!');
    await set(push(ref(db, 'reports')), {
      reporterName: user.name,
      reporterId: user.telegramId,
      accusedId: targetUserId,
      reason: reportText,
      createdAt: new Date().toISOString()
    });
    alert('Shikoyat adminga yuborildi!');
    setReportText(''); setTargetUserId('');
  };

  const filteredWorkers = allWorkers.filter(w => w.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div style={styles.dashboardContainer}>
      {/* SideBar */}
      <div style={styles.sidebar}>
        <div style={{textAlign: 'center', marginBottom: '20px'}}>
          <h3 style={{ color: '#fff', margin: '0' }}>Worky Menu</h3>
          <span style={styles.proBadge}>{user.role === 'worker' ? '👷 Ishchi' : '💼 Ish Beruvchi'}</span>
        </div>
        <button onClick={() => setActiveTab('main')} style={styles.menuBtn}>🏠 Asosiy Panel</button>
        {user.role === 'employer' && <button onClick={() => setActiveTab('find_workers')} style={styles.menuBtn}>👷 Ishchilar Ro'yxati</button>}
        {user.role === 'worker' && <button onClick={() => setActiveTab('my_requests')} style={styles.menuBtn}>📩 Kelgan Takliflar ({myApplications.filter(a=>a.status==='pending').length})</button>}
        {user.role === 'employer' && <button onClick={() => setActiveTab('sent_requests')} style={styles.menuBtn}>📤 Yuborilgan Arizalar</button>}
        <button onClick={() => setActiveTab('report')} style={styles.menuBtn}>🚨 Shikoyat Berish</button>
        <button onClick={onLogout} style={styles.logoutBtn}>Chiqish</button>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {activeTab === 'main' && (
          <div>
            <h1 style={{ color: 'var(--main-color, #007bff)' }}>Xush kelibsiz, {user.name}!</h1>
            <p>Sizning Worky ID: <b>{user.telegramId}</b></p>
            <p>Telefon raqamingiz: <b>{user.phone}</b></p>
          </div>
        )}

        {/* ISH BERUVCHI UCHUN: ISHCHILAR RO'YXATI */}
        {activeTab === 'find_workers' && user.role === 'employer' && (
          <div>
            <h2>👷 Platformadagi faol ishchilar</h2>
            <input type="text" placeholder="Ism bo'yicha qidirish..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={styles.filterInput} />
            <div style={styles.workersGrid}>
              {filteredWorkers.map(w => {
                const application = sentApplications.find(app => app.workerId === w.telegramId);
                return (
                  <div key={w.id} style={styles.workerCard}>
                    <h3>{w.name}</h3>
                    <p>📍 <b>Hudud:</b> {w.region}, {w.district}</p>

                    {/* STATUSLAR VA BOG'LANISH MANTIQI */}
                    {!application && (
                      <button onClick={() => handleSendApplication(w)} style={{ ...styles.actionButton, backgroundColor: 'var(--main-color)', width: '100%', padding: '10px', marginTop: '10px' }}>
                        🚀 Ishga taklif qilish (Ariza berish)
                      </button>
                    )}
                    {application && application.status === 'pending' && (
                      <button style={{ ...styles.actionButton, backgroundColor: '#f39c12', width: '100%', padding: '10px', marginTop: '10px', cursor: 'not-allowed' }} disabled>
                        ⏳ Kutilmoqda...
                      </button>
                    )}
                    {application && application.status === 'declined' && (
                      <button style={{ ...styles.actionButton, backgroundColor: '#e74c3c', width: '100%', padding: '10px', marginTop: '10px', cursor: 'not-allowed' }} disabled>
                        ❌ Ishchi rad etdi
                      </button>
                    )}
                    {application && application.status === 'accepted' && (
                      <div style={{marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px'}}>
                        <p style={{color: '#2ecc71', fontWeight: 'bold', fontSize: '13px', margin: '5px 0'}}>✅ Ishchi qabul qildi!</p>
                        <div style={{display: 'flex', gap: '5px'}}>
                          <button onClick={() => window.open(`https://t.me/user?id=${w.telegramId}`, '_blank')} style={{ ...styles.actionButton, backgroundColor: '#2ab21e', flex: 1, padding: '8px', fontSize: '12px' }}>
                            💬 Telegram
                          </button>
                          <button onClick={() => window.open(`tel:${w.phone}`)} style={{ ...styles.actionButton, backgroundColor: '#34495e', flex: 1, padding: '8px', fontSize: '12px' }}>
                            📞 Tel: {w.phone}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ISHCHI UCHUN: KELGAN ARIZALARNI QABUL QILISH/RAD ETISH */}
        {activeTab === 'my_requests' && user.role === 'worker' && (
          <div>
            <h2>📩 Sizga kelgan ish takliflari</h2>
            {myApplications.length === 0 ? <p>Hozircha sizga takliflar kelmagan.</p> : (
              <div style={styles.workersGrid}>
                {myApplications.map(app => (
                  <div key={app.id} style={{...styles.workerCard, borderTop: '4px solid #9b59b6'}}>
                    <h3>{app.employerName}</h3>
                    <p>🆔 **Ish beruvchi ID:** {app.employerId}</p>
                    <p>📊 **Holati:** {app.status === 'pending' ? 'Kutilmoqda' : app.status === 'accepted' ? 'Qabul qilingan' : 'Rad etilgan'}</p>

                    {app.status === 'pending' && (
                      <div style={{display: 'flex', gap: '8px', marginTop: '15px'}}>
                        <button onClick={() => handleAcceptApp(app.id)} style={{...styles.actionButton, backgroundColor: '#2ecc71', flex: 1, padding: '10px'}}>✅ Qabul qilish</button>
                        <button onClick={() => handleDeclineApp(app.id)} style={{...styles.actionButton, backgroundColor: '#e74c3c', flex: 1, padding: '10px'}}>❌ Rad etish</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ISH BERUVCHI UCHUN: YUBORILGAN ARIZALAR JADVALI */}
        {activeTab === 'sent_requests' && user.role === 'employer' && (
          <div>
            <h2>📤 Yuborgan arizalaringiz holati</h2>
            {sentApplications.length === 0 ? <p>Hozircha hech kimga ariza yubormagansiz.</p> : (
              <div style={styles.workersGrid}>
                {sentApplications.map(app => (
                  <div key={app.id} style={styles.workerCard}>
                    <h3>{app.workerName}</h3>
                    <p>🆔 **Ishchi ID:** {app.workerId}</p>
                    <p>📈 **Holat:** <b style={{color: app.status === 'accepted' ? '#2ecc71' : app.status === 'declined' ? '#e74c3c' : '#f39c12'}}>{app.status.toUpperCase()}</b></p>

                    {app.status === 'accepted' && (
                      <div style={{display: 'flex', gap: '5px', marginTop: '10px'}}>
                        <button onClick={() => window.open(`https://t.me/user?id=${app.workerId}`, '_blank')} style={{...styles.actionButton, backgroundColor: '#2ab21e', flex: 1, padding: '8px'}}>💬 Telegram</button>
                        <button onClick={() => window.open(`tel:${app.employerPhone}`)} style={{...styles.actionButton, backgroundColor: '#34495e', flex: 1, padding: '8px'}}>📞 Qo'ng'iroq</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SHIKOYAT OYNASI (ESKI JOYIDA TURIBDI) */}
        {activeTab === 'report' && (
          <div>
            <h2>🚨 Shikoyat ariza berish</h2>
            <form onSubmit={handleReportSubmit} style={styles.dashboardForm}>
              <input type="text" placeholder="Qoidabuzar Worky ID raqami" value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)} style={styles.inputField} />
              <textarea placeholder="Shikoyat sababini batafsil yozing..." value={reportText} onChange={(e) => setReportText(e.target.value)} style={styles.textareaField}></textarea>
              <button type="submit" style={{ ...styles.actionButton, backgroundColor: '#dc3545' }}>Adminga ariza yuborish</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

// === CENTRAL ADMIN PANEL KOMPONENTI ===
function AdminPanel({ onLogout }) {
  const [primaryColor, setPrimaryColor] = useState('#007bff');
  const [backgroundColor, setBackgroundColor] = useState('#f4f6f9');
  const [selectedFont, setSelectedFont] = useState('Inter');
  const [reports, setReports] = useState([]);

  useEffect(() => {
    onValue(ref(db, 'reports'), (snapshot) => {
      const data = snapshot.val();
      if (data) setReports(Object.keys(data).map(key => ({ id: key, ...data[key] })));
      else setReports([]);
    });
  }, []);

  const handleThemeSave = async (e) => {
    e.preventDefault();
    await set(ref(db, 'settings/theme'), { primaryColor, backgroundColor, fontFamily: selectedFont });
    alert('Dizayn saqlandi!');
  };

  return (
    <div style={styles.adminContainer}>
      <div style={styles.adminHeader}>
        <h2>👨‍💻 Worky Markaziy Admin</h2>
        <button onClick={onLogout} style={styles.adminLogoutBtn}>Chiqish</button>
      </div>
      <div style={styles.adminGrid}>
        <div style={{...styles.adminCard, borderTop: '5px solid #e74c3c'}}>
          <h3>🚨 Kelgan Shikoyatlar</h3>
          {reports.map(rep => (
            <div key={rep.id} style={styles.reportCard}>
              <p><b>Kimdan:</b> {rep.reporterName}</p>
              <p><b>Kim ustidan:</b> {rep.accusedId}</p>
              <p><b>Sabab:</b> {rep.reason}</p>
              <button onClick={async () => { await remove(ref(db, `reports/${rep.id}`)); alert('O\'chirildi'); }} style={{backgroundColor: '#e74c3c', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', marginTop: '5px'}}>O'chirish</button>
            </div>
          ))}
        </div>
        <div style={styles.adminCard}>
          <h3>🎨 Stil Sozlamalari</h3>
          <form onSubmit={handleThemeSave} style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
            <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} style={styles.colorInput} />
            <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} style={styles.colorInput} />
            <select value={selectedFont} onChange={(e) => setSelectedFont(e.target.value)} style={styles.inputField}>
              <option value="Inter">Inter</option>
              <option value="Poppins">Poppins</option>
            </select>
            <button type="submit" style={styles.saveStyleBtn}>Saqlash</button>
          </form>
        </div>
      </div>
    </div>
  );
}

// Universal Styles Object
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
  actionButton: { border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 'bold', cursor: 'pointer' },
  proBadge: { display: 'inline-block', padding: '4px 10px', backgroundColor: '#f1c40f', color: '#000', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', marginTop: '5px' },
  filterInput: { width: '100%', maxWidth: '400px', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '15px', marginBottom: '20px' },
  workersGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  workerCard: { backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderTop: '4px solid var(--main-color)' },
  dashboardForm: { backgroundColor: '#fff', padding: '20px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '500px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  inputField: { padding: '11px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '15px' },
  textareaField: { padding: '11px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '15px', height: '100px', resize: 'none' },
  adminContainer: { padding: '30px', backgroundColor: '#f4f6f9', minHeight: '100vh' },
  adminHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ddd', paddingBottom: '15px' },
  adminLogoutBtn: { border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', color: '#fff', backgroundColor: '#e74c3c', padding: '8px 15px' },
  adminGrid: { display: 'flex', gap: '25px', marginTop: '20px', flexWrap: 'wrap' },
  adminCard: { flex: 1, minWidth: '350px', backgroundColor: '#fff', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' },
  colorInput: { width: '100%', height: '40px', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', padding: '0' },
  saveStyleBtn: { padding: '12px', backgroundColor: '#2ecc71', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },
  reportCard: { padding: '15px', backgroundColor: '#fff5f5', borderRadius: '6px', marginTop: '10px', borderLeft: '5px solid #e74c3c' }
};