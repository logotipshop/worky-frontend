import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";

// Firebase konfiguratsiyasi
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

// 100% TO'LIQ O'ZBEKISTON HUDUDLARI (XATOSIZ)
const UZBEKISTAN_REGIONS = {
  "Barchasi": ["Barchasi"],
  "Farg'ona": ["Barchasi", "Qo'qon shahar", "Farg'ona shahar", "Marg'ilon shahar", "Quvasoy shahar", "Beshariq", "Uchko'prik", "Rishton", "Oltiariq", "Bag'dod", "O'zbekiston", "Buvaida", "Dang'ara", "Farg'ona tumani", "Furqat", "Quva", "Toshloq", "Yozyovon", "So'x"],
  "Toshkent shahar": ["Barchasi", "Yunusobod", "Chilonzor", "Mirzo Ulug'bek", "Yashnobod", "Sergeli", "Yakkasaroy", "Mirobod", "Shayxontohur", "Olmazor", "Uchtepa", "Bektemir", "Yangihayot"],
  "Toshkent viloyati": ["Barchasi", "Chirchiq shahar", "Angren shahar", "Olmaliq shahar", "Bekobod shahar", "Nurafshon shahar", "Ohangaron shahar", "Yangiyo'l shahar", "Zangiota", "Qibray", "Chinoz", "Bo'stonliq", "Do'stobod", "Keles", "Oqqurgan", "Parkent", "Piskent", "Quyi Chirchiq", "O'rtashirchiq", "Yuqori Chirchiq", "Toshkent tumani"],
  "Samarqand": ["Barchasi", "Samarqand shahar", "Kattaqo'rg'on shahar", "Urgut", "Bulung'ur", "Ishtixon", "Jomboy", "Kattaqo'rg'on tumani", "Narpay", "Nurobod", "Oqdaryo", "Payariq", "Pastdarg'om", "Paxtachi", "Samarqand tumani", "Toyloq"],
  "Andijon": ["Barchasi", "Andijon shahar", "Asaka shahar", "Xonobod shahar", "Shahrixon shahar", "Andijon tumani", "Asaka tumani", "Baliqchi", "Bo'ston", "Buloqboshi", "Izboskan", "Jalaquduq", "Marhamat", "Oltinkul", "Paxtaobod", "Ulug'nor", "Xo'jaobod", "Shahrixon tumani"],
  "Namangan": ["Barchasi", "Namangan shahar", "Chust", "Kosonsoy", "Uychi", "Pop", "Mingbuloq", "Namangan tumani", "Naryn", "Norin", "To'raqo'rg'on", "Uychi", "Yangiqo'rg'on", "Chortoq", "Davlatobod", "Yangi Namangan"],
  "Buxoro": ["Barchasi", "Buxoro shahar", "Kogon shahar", "Gijduvon", "Kogon tumani", "Qorako'l", "Buxoro tumani", "Vobkent", "Jondor", "Karakul", "Olot", "Peshku", "Romitan", "Shofirkon", "Qorovulbozor"],
  "Xorazm": ["Barchasi", "Urganch shahar", "Xiva shahar", "Gurlan", "Shovot", "Urganch tumani", "Xiva tumani", "Bog'ot", "Yangiariq", "Yangibozor", "Qo'shko'pir", "Xazorasp", "Tuproqqal'a"],
  "Qashqadaryo": ["Barchasi", "Karshi shahar", "Shahrisabz shahar", "Kitob", "Koson", "Karshi tumani", "Chiroqchi", "Dehqonobod", "Kamashi", "Mirishkor", "Muborak", "Nishan", "Nishon", "Kasbi", "Shahrisabz tumani", "Yakkabog'", "Ko'kdala"],
  "Surxondaryo": ["Barchasi", "Termiz shahar", "Denov", "Sherobod", "Jarqo'rg'on", "Angor", "Boysun", "Qiziriq", "Qumqo'rg'on", "Muzrabot", "Oltinsoy", "Sariosiyo", "Termiz tumani", "Uzun", "Sho'rchi"],
  "Navoiy": ["Barchasi", "Navoiy shahar", "Zarafshon shahar", "Uchquduq shahar", "Karmana", "Kanimex", "Navbahor", "Nurota", "Tomdi", "Xatirchi", "Qiziltepa"],
  "Jizzax": ["Barchasi", "Jizzax shahar", "Zomin", "G'allaorol", "Do'stlik", "Arnasoy", "Baxmal", "Zafarobod", "Zarbdor", "Mirzacho'l", "Paxtakor", "Forish", "Sharof Rashidov"],
  "Sirdaryo": ["Barchasi", "Guliston shahar", "Shirin shahar", "Yangiyer shahar", "Boyovut", "Guliston tumani", "Mirzaobod", "Oqoltin", "Sayhunobod", "Sardoba", "Sirdaryo tumani"],
  "Qoraqalpog'iston": ["Barchasi", "Nukus shahar", "Xo'jayli", "Qo'ng'irot", "Beruniy", "Amudaryo", "Chimboy", "Ellikqal'a", "Kegeyli", "Mo'ynoq", "Nukus tumani", "Qonliko'l", "Qorauzyak", "Taxtako'pir", "To'rtko'l", "Shumanay", "Bo'zatov"]
};

const CATEGORIES = ["Barchasi", "Restoran", "IT", "Qurilish", "Logistika", "Dizayn", "Ta'lim", "Boshqa"];

export default function App() {
  const [userRole, setUserRole] = useState("worker");
  const [page, setPage] = useState("home");
  const [selectedRegion, setSelectedRegion] = useState("Barchasi");
  const [selectedDistrict, setSelectedDistrict] = useState("Barchasi");
  const [category, setCategory] = useState("Barchasi");
  const [showProModal, setShowProModal] = useState(false);

  // Sening profiling
  const currentUser = {
    name: "Temurbek Yoqubov",
    phone: "+998 50 755 89 31",
    id: "WRK99812",
    isAdmin: true
  };

  const [jobs, setJobs] = useState([
    { id: 1, title: "Usta yordamchisi", place: "Xususiy xonadon", wage: 120000, category: "Qurilish", region: "Farg'ona", district: "Qo'qon shahar", emoji: "🏗️", bg: "#FAECE7" },
    { id: 2, title: "Fast-food oshpazi", place: "Evos", wage: 150000, category: "Restoran", region: "Farg'ona", district: "Qo'qon shahar", emoji: "🍽️", bg: "#E8F8F2" }
  ]);

  const [workers, setWorkers] = useState([
    { id: 101, name: "Sardorbek Olimov", jobTitle: "Professional Ofitsiant", rating: 5, region: "Farg'ona", district: "Qo'qon shahar", comment: "Mas'uliyatli usta", avatarLetter: "S", banned: false, isPro: false, proUntil: null },
    { id: 102, name: "Dostonbek Aliyev", jobTitle: "Gipsokarton ustasi", rating: 4, region: "Farg'ona", district: "Beshariq", comment: "Yaxshi usta", avatarLetter: "D", banned: false, isPro: true, proUntil: "2026-07-20" }
  ]);

  // Avtomat PRO muddati tugashini tekshirish
  useEffect(() => {
    const bugun = new Date().toISOString().split('T')[0];
    setWorkers(prev => prev.map(w => {
      if (w.isPro && w.proUntil && w.proUntil < bugun) {
        return { ...w, isPro: false, proUntil: null };
      }
      return w;
    }));
  }, [page]);

  // API Funksiyalar (Swagger Docs simulyatsiyasi)
  const activateProUser = (id) => {
    const kelajakSana = new Date();
    kelajakSana.setDate(kelajakSana.getDate() + 30);
    const proTugashSanasi = kelajakSana.toISOString().split('T')[0];
    setWorkers(prev => prev.map(w => w.id === id ? { ...w, isPro: true, proUntil: proTugashSanasi } : w));
    alert(`Muvaffaqiyatli: 30 kunlik PRO faollashtirildi! (${proTugashSanasi})`);
  };

  const deactivateProUser = (id) => {
    setWorkers(prev => prev.map(w => w.id === id ? { ...w, isPro: false, proUntil: null } : w));
    alert("Muvaffaqiyatli: PRO status o'chirildi (Noactiv)!");
  };

  const deleteJob = (id) => {
    setJobs(prev => prev.filter(j => j.id !== id));
    alert("Muvaffaqiyatli: E'lon o'chirildi!");
  };

  const toggleBanWorker = (id) => {
    setWorkers(prev => prev.map(w => w.id === id ? { ...w, banned: !w.banned } : w));
    alert("Muvaffaqiyatli: Foydalanuvchi holati yangilandi!");
  };

  const handleRegionChange = (e) => {
    setSelectedRegion(e.target.value);
    setSelectedDistrict("Barchasi");
  };

  const filteredJobs = jobs.filter(j => (selectedRegion === "Barchasi" || j.region === selectedRegion) && (category === "Barchasi" || j.category === category));
  const filteredWorkers = workers.filter(w => !w.banned);

  return (
    <div className="app-container" style={{ fontFamily: "sans-serif", backgroundColor: "#f5f5f7", minHeight: "100vh", paddingBottom: "80px" }}>

      {/* HEADER */}
      {page !== "admin" && (
        <header style={{ padding: "16px 20px", backgroundColor: "#fff", borderBottom: "1px solid #d2d2d7" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "900", color: "#007aff" }}>Work<span style={{ color: "#34c759" }}>y</span></h1>
            <div style={{ display: "flex", background: "#e8e8ed", padding: "2px", borderRadius: "8px" }}>
              <button onClick={() => { setUserRole("worker"); setPage("home"); }} style={{ border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", backgroundColor: userRole === "worker" ? "#fff" : "transparent", color: userRole === "worker" ? "#007aff" : "#86868b" }}>👷 Ishchiman</button>
              <button onClick={() => { setUserRole("employer"); setPage("home"); }} style={{ border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", backgroundColor: userRole === "employer" ? "#fff" : "transparent", color: userRole === "employer" ? "#34c759" : "#86868b" }}>💼 Ish beruvchiman</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <select value={selectedRegion} onChange={handleRegionChange} style={{ flex: 1, padding: "8px", borderRadius: "10px", border: "1px solid #d2d2d7", backgroundColor: "#f5f5f7", fontSize: "13px" }}>
              {Object.keys(UZBEKISTAN_REGIONS).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} style={{ flex: 1, padding: "8px", borderRadius: "10px", border: "1px solid #d2d2d7", backgroundColor: "#f5f5f7", fontSize: "13px" }} disabled={selectedRegion === "Barchasi"}>
              {UZBEKISTAN_REGIONS[selectedRegion].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </header>
      )}

      {/* HOME PAGE */}
      {page === "home" && (
        <main style={{ padding: "20px" }}>
          {userRole === "worker" ? (
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: "700" }}>Bo'sh ish o'rinlari</h2>
              {filteredJobs.map(job => (
                <div key={job.id} style={{ backgroundColor: "#fff", padding: "16px", borderRadius: "16px", marginBottom: "12px", border: "1px solid #e8e8ed" }}>
                  <h3>{job.title}</h3>
                  <p>{job.place} • {job.region}, {job.district}</p>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: "700" }}>Reytingli ishchilar</h2>
              {filteredWorkers.map(worker => (
                <div key={worker.id} style={{ backgroundColor: "#fff", padding: "16px", borderRadius: "16px", marginBottom: "12px", border: "1px solid #e8e8ed" }}>
                  <h3>{worker.name} {worker.isPro && <span style={{ color: "#ff9500" }}>⭐ PRO</span>}</h3>
                  <p>{worker.jobTitle} • {worker.region}, {worker.district}</p>
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {/* PROFIL PAGE */}
      {page === "profile" && (
        <main style={{ padding: "20px", textAlign: "center" }}>
          <div style={{ backgroundColor: "#fff", padding: "24px", borderRadius: "20px", border: "1px solid #e8e8ed" }}>
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "#007aff", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", margin: "0 auto 12px" }}>T</div>
            <h3>{currentUser.name}</h3>
            <p>{currentUser.phone}</p>
            {currentUser.isAdmin && (
              <button onClick={() => setPage("admin")} style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "2px dashed #ff3b30", backgroundColor: "#fff", color: "#ff3b30", fontWeight: "700", cursor: "pointer", marginTop: "15px" }}>
                🎛️ Open Swagger Admin Panel
              </button>
            )}
          </div>
        </main>
      )}

      {/* SWAGGER API DOCS STYLE ADMIN PANEL */}
      {page === "admin" && currentUser.isAdmin && (
        <main style={{ backgroundColor: "#fafafa", minHeight: "100vh", padding: "20px", color: "#3b4151" }}>

          {/* Swagger Top Bar */}
          <div style={{ backgroundColor: "#1b1b1b", padding: "14px 20px", margin: "-20px -20px 20px -20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ backgroundColor: "#62a03f", color: "#fff", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold" }}>SWAGGER</span>
              <h2 style={{ color: "#fff", fontSize: "16px", margin: 0, fontWeight: "600" }}>Worky Backend API Admin Control</h2>
            </div>
            <button onClick={() => setPage("profile")} style={{ backgroundColor: "#788194", color: "#fff", border: "none", padding: "6px 14px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>Close Docs</button>
          </div>

          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <h2 style={{ fontSize: "24px", margin: "0 0 5px 0", fontWeight: "600" }}>Worky Core System Base API</h2>
            <div style={{ fontSize: "12px", color: "#7f7f7f", marginBottom: "20px" }}>[ Base URL: <code style={{ background: "#f0f0f0", padding: "2px 4px" }}>https://worky-backend-1.onrender.com/api</code> ]</div>

            <div style={{ fontSize: "18px", borderBottom: "1px solid #ccc", paddingBottom: "5px", marginBottom: "15px", fontWeight: "bold" }}>Users PRO & Subscriptions Management</div>

            {/* SWAGGER POST BLOK: ACTIVATE PRO */}
            <div style={{ border: "1px solid #49cc90", backgroundColor: "rgba(73,204,144,.1)", borderRadius: "4px", marginBottom: "15px", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", padding: "10px", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ backgroundColor: "#49cc90", color: "#fff", minWidth: "80px", textAlign: "center", padding: "6px", borderRadius: "3px", fontSize: "12px", fontWeight: "bold" }}>POST</span>
                  <code style={{ fontWeight: "bold", fontSize: "14px" }}>/v1/admin/pro/activate</code>
                  <span style={{ color: "#666", fontSize: "12px" }}>Faollashtirish (30 kunlik avtomat taymer start)</span>
                </div>
              </div>
              <div style={{ backgroundColor: "#fff", padding: "15px", borderTop: "1px solid #49cc90" }}>
                {workers.filter(w => !w.isPro).map(w => (
                  <div key={w.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #eee" }}>
                    <span style={{ fontSize: "13px" }}>ID: <b>{w.id}</b> | {w.name} ({w.district})</span>
                    <button onClick={() => activateProUser(w.id)} style={{ backgroundColor: "#49cc90", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}>Execute (PRO Berish)</button>
                  </div>
                ))}
              </div>
            </div>

            {/* SWAGGER DELETE BLOK: DEACTIVATE PRO */}
            <div style={{ border: "1px solid #f93e3e", backgroundColor: "rgba(249,62,62,.1)", borderRadius: "4px", marginBottom: "15px", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", padding: "10px", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ backgroundColor: "#f93e3e", color: "#fff", minWidth: "80px", textAlign: "center", padding: "6px", borderRadius: "3px", fontSize: "12px", fontWeight: "bold" }}>DELETE</span>
                  <code style={{ fontWeight: "bold", fontSize: "14px" }}>/v1/admin/pro/deactivate</code>
                  <span style={{ color: "#666", fontSize: "12px" }}>Muddatidan oldin o'chirish (Noactiv qilish)</span>
                </div>
              </div>
              <div style={{ backgroundColor: "#fff", padding: "15px", borderTop: "1px solid #f93e3e" }}>
                {workers.filter(w => w.isPro).map(w => (
                  <div key={w.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #eee" }}>
                    <span style={{ fontSize: "13px" }}>ID: <b>{w.id}</b> | {w.name} <span style={{ color: "#f93e3e" }}>[Aktiv gacha: {w.proUntil}]</span></span>
                    <button onClick={() => deactivateProUser(w.id)} style={{ backgroundColor: "#f93e3e", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}>Execute (Noactiv)</button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ fontSize: "18px", borderBottom: "1px solid #ccc", paddingBottom: "5px", margin: "25px 0 15px 0", fontWeight: "bold" }}>Jobs & Content Moderation</div>

            {/* SWAGGER DELETE BLOK: DELETE JOB */}
            <div style={{ border: "1px solid #f93e3e", backgroundColor: "rgba(249,62,62,.1)", borderRadius: "4px", marginBottom: "15px", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", padding: "10px", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ backgroundColor: "#f93e3e", color: "#fff", minWidth: "80px", textAlign: "center", padding: "6px", borderRadius: "3px", fontSize: "12px", fontWeight: "bold" }}>DELETE</span>
                  <code style={{ fontWeight: "bold", fontSize: "14px" }}>/v1/admin/jobs/{"{id}"}</code>
                  <span style={{ color: "#666", fontSize: "12px" }}>Shubhali yoki fake e'lonlarni butunlay o'chirish</span>
                </div>
              </div>
              <div style={{ backgroundColor: "#fff", padding: "15px", borderTop: "1px solid #f93e3e" }}>
                {jobs.map(job => (
                  <div key={job.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #eee" }}>
                    <span style={{ fontSize: "13px" }}>📦 {job.title} — <i>{job.place} ({job.district})</i></span>
                    <button onClick={() => deleteJob(job.id)} style={{ backgroundColor: "#f93e3e", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}>Delete</button>
                  </div>
                ))}
              </div>
            </div>

            {/* SWAGGER PUT BLOK: BAN USER */}
            <div style={{ border: "1px solid #fca130", backgroundColor: "rgba(252,161,48,.1)", borderRadius: "4px", marginBottom: "15px", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", padding: "10px", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ backgroundColor: "#fca130", color: "#fff", minWidth: "80px", textAlign: "center", padding: "6px", borderRadius: "3px", fontSize: "12px", fontWeight: "bold" }}>PUT</span>
                  <code style={{ fontWeight: "bold", fontSize: "14px" }}>/v1/admin/users/ban</code>
                  <span style={{ color: "#666", fontSize: "12px" }}>Qoidalarni buzganlarni bloklash (Ban)</span>
                </div>
              </div>
              <div style={{ backgroundColor: "#fff", padding: "15px", borderTop: "1px solid #fca130" }}>
                {workers.map(w => (
                  <div key={w.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #eee" }}>
                    <span style={{ fontSize: "13px", color: w.banned ? "red" : "inherit" }}>👤 {w.name} {w.banned && "<b>(BLOKLANGAN)</b>"}</span>
                    <button onClick={() => toggleBanWorker(w.id)} style={{ backgroundColor: "#fca130", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}>
                      {w.banned ? "Unban" : "Ban User"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </main>
      )}

      {/* BOTTOM NAV */}
      {page !== "admin" && (
        <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: "64px", backgroundColor: "#fff", borderTop: "1px solid #d2d2d7", display: "flex", justifyContent: "space-around", alignItems: "center", zIndex: 900 }}>
          <button onClick={() => setPage("home")} style={{ border: "none", background: "none", color: page === "home" ? "#007aff" : "#86868b" }}>🏠 Ishlar</button>
          <button onClick={() => setPage("profile")} style={{ border: "none", background: "none", color: page === "profile" ? "#007aff" : "#86868b" }}>👤 Profil</button>
        </nav>
      )}

    </div>
  );
}