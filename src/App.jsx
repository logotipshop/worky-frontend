import React, { useState, useEffect } from 'react';
import './app.css';

function App() {
  // --- 1. STATE-LAR (TIZIM BOSHQARUVI) ---
  const [role, setRole] = useState('worker'); // 'worker' yoki 'employer'
  const [activeEffect, setActiveEffect] = useState('ramadan_eid'); // Effektlar: 'default', 'ramadan_eid', 'qurban_eid', 'football'

  // Modallar nazorati
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);

  // Arizalar uchun vaqtincha ma'lumotlar
  const [jobTitle, setJobTitle] = useState('');
  const [jobSalary, setJobSalary] = useState('');
  const [jobDesc, setJobDesc] = useState('');

  // Foydalanuvchilar va E'lonlar bazasi (Bular Firebase-ga ulanadi)
  const [users, setUsers] = useState([
    { id: 1, name: "Temurbek Yoqubov", role: "worker", specialty: "Graphic Designer & Bot Developer", rating: 5.0, username: "logotipshop10", isPro: true },
    { id: 2, name: "Sarvinoz", role: "employer", specialty: "Tadbirkor (Kelinoyim)", rating: 4.9, username: "sarvinoz_worky", isPro: false },
    { id: 3, name: "Eshmatov Toshmat", role: "worker", specialty: "Usta / Quruvchi", rating: 4.7, username: "eshmat_uz", isPro: false }
  ]);

  const [jobs, setJobs] = useState([
    { id: 1, title: "Kompaniya uchun Premium Logo va Brending", salary: "1,500,000 so'm", desc: "Logotipshop uslubida zamonaviy brending qilib beradigan grafik dizayner kerak.", username: "sarvinoz_worky" }
  ]);

  // --- 2. FUNKSIYALAR ---
  const handleConnect = (username) => {
    if (username && username !== 'no_username') {
      window.open(`https://t.me/${username}`, '_blank');
    } else {
      alert("Bu foydalanuvchining Telegram username-i mavjud emas!");
    }
  };

  const handleCreateJob = (e) => {
    e.preventDefault();
    if (!jobTitle || !jobSalary) return alert("Iltimos, asosiy maydonlarni to'ldiring!");

    const newJob = {
      id: jobs.length + 1,
      title: jobTitle,
      salary: jobSalary,
      desc: jobDesc,
      username: "logotipshop10" // Test uchun
    };

    setJobs([newJob, ...jobs]);
    setIsApplyModalOpen(false);
    // Formani tozalash
    setJobTitle('');
    setJobSalary('');
    setJobDesc('');
  };

  const handleBuyPro = (e) => {
    e.preventDefault();
    alert("To'lovingiz qabul qilindi! Worky PRO statusi 1 oyga faollashtirildi. E'lonlaringiz endi TOP-da turadi!");
    setIsProModalOpen(false);
  };

  return (
    <div className={`app-container effect-${activeEffect}`}>

      {/* --- EFFECT ANIMATSIYALARI (GOOGLE DOODLES USLUBIDA) --- */}
      {activeEffect === 'ramadan_eid' && <div className="eid-stars">🌙 ✨ 🕌 ✨ 🌙</div>}
      {activeEffect === 'qurban_eid' && <div className="eid-stars">🕋 ✨ 🌙 ✨ 🕋</div>}
      {activeEffect === 'football' && <div className="football-rain">⚽ 🏃‍♂️ 🏆 ⚽</div>}

      {/* --- HEADER QISMI --- */}
      <header className="main-header">
        <div className="logo-area">
          {/* Dinamik Effektli Logotip */}
          <h1 className={`worky-logo logo-effect-${activeEffect}`}>Worky</h1>
          <span className="badge-theme">
            {activeEffect === 'ramadan_eid' && "🌙 Iyd al-Fitr (Hayit)"}
            {activeEffect === 'qurban_eid' && "🕋 Iyd al-Adha (Hayit)"}
            {activeEffect === 'football' && "⚽ JCH 2026"}
            {activeEffect === 'default' && "Platforma"}
          </span>
        </div>

        <div className="role-switcher">
          <button className={role === 'worker' ? 'active-btn' : ''} onClick={() => setRole('worker')}>
            👷 Ishchi Paneli
          </button>
          <button className={role === 'employer' ? 'active-btn' : ''} onClick={() => setRole('employer')}>
            💼 Ish beruvchi Paneli
          </button>
        </div>
      </header>

      {/* --- ASOSIY KONTENT --- */}
      <main className="content-container">

        {/* Effektlarni test qilish paneli (Buni kelajakda Firebase avtomat boshqaradi) */}
        <div className="admin-test-panel">
          <span>⚙️ Effektni sinab ko'rish (Firebase nazorati):</span>
          <button onClick={() => setActiveEffect('ramadan_eid')}>🌙 Ramazon Hayiti</button>
          <button onClick={() => setActiveEffect('qurban_eid')}>🕋 Qurban Hayiti</button>
          <button onClick={() => setActiveEffect('football')}>⚽ Futbol JCH</button>
          <button onClick={() => setActiveEffect('default')}>Oddiy kun</button>
        </div>

        {role === 'worker' ? (
          <div className="panel animate-fade">
            <div className="panel-header">
              <h2>👷 Ishchi Paneli / Faol E'lonlar</h2>
            </div>
            <div className="cards-grid">
              {jobs.map(job => (
                <div key={job.id} className="job-card">
                  <div className="job-top">
                    <h3>{job.title}</h3>
                    <span className="job-price">{job.salary}</span>
                  </div>
                  <p className="job-text">{job.desc}</p>
                  <button className="connect-btn" onClick={() => handleConnect(job.username)}>
                    🔗 Bogʻlanish (Telegram)
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="panel animate-fade">
            <div className="panel-header">
              <h2>💼 Ish beruvchi Paneli / Mutaxassislar</h2>
              <button className="add-job-btn" onClick={() => setIsApplyModalOpen(true)}>
                ➕ Yangi Ish Joylash (Ariza berish)
              </button>
            </div>
            <div className="cards-grid">
              {users.filter(u => u.role === 'worker').map(user => (
                <div key={user.id} className={`user-card ${user.isPro ? 'pro-user-card' : ''}`}>
                  {user.isPro && <span className="pro-badge">💎 PRO MUTAXASSIS</span>}
                  <h3>{user.name}</h3>
                  <p className="specialty">{user.specialty}</p>
                  <div className="card-footer">
                    <span className="rating">⭐ {user.rating.toFixed(1)}</span>
                    <button className="connect-btn" onClick={() => handleConnect(user.username)}>
                      🔗 Bogʻlanish
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* --- PRO TARIF REKLAMA BANNERI --- */}
      <section className="pro-section">
        <div className="pro-box">
          <h3>💎 Worky PRO Premium</h3>
          <p>Profilingizni yoki e'lonlaringizni TOP-ga chiqaring, ko'rinish darajasini 5 baravarga oshiring!</p>
          <span className="price">Narxi: 50,000 so'm / oy</span>
          <button className="pro-buy-btn" onClick={() => setIsProModalOpen(true)}>💎 PRO-ni Sotib Olish</button>
        </div>
      </section>

      {/* --- MODAL 1: YANGI ISH JOYLASh (ARIZA BERISH) --- */}
      {isApplyModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-pop">
            <h3>➕ Yangi Vakansiya Joylash (Ariza)</h3>
            <form onSubmit={handleCreateJob}>
              <label>Ish nomi / Sarlavha *</label>
              <input type="text" placeholder="Masalan: Grafik dizayner kerak..." value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} required />

              <label>Taklif qilinayotgan maosh *</label>
              <input type="text" placeholder="Masalan: 500,000 so'm / kunlik" value={jobSalary} onChange={(e) => setJobSalary(e.target.value)} required />

              <label>Ish haqida batafsil ma'lumot</label>
              <textarea rows="4" placeholder="Ish qoidalari, talablar va vaqti..." value={jobDesc} onChange={(e) => setJobDesc(e.target.value)}></textarea>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setIsApplyModalOpen(false)}>Bekor qilish</button>
                <button type="submit" className="submit-btn">E'lonni Chiqarish</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: PRO TARIF SOTIB OLISH --- */}
      {isProModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-pop">
            <h3>💎 Worky PRO-ni faollashtirish</h3>
            <p className="modal-info">To'lov xavfsiz Click / Payme tizimi orqali amalga oshiriladi (Simulyatsiya).</p>
            <form onSubmit={handleBuyPro}>
              <label>Karta raqami (8600 ...)</label>
              <input type="text" placeholder="7777 8888 9999 0000" maxLength="19" required />

              <div className="form-row">
                <div>
                  <label>Muddati</label>
                  <input type="text" placeholder="12/29" maxLength="5" required />
                </div>
                <div>
                  <label>Summa</label>
                  <input type="text" value="50,000 so'm" disabled className="disabled-input" />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setIsProModalOpen(false)}>Yopish</button>
                <button type="submit" className="pay-btn">Tasdiqlash va To'lash</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;