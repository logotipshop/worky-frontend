import axios from 'axios';
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

// Butun O'zbekiston hududlar tuzilmasi
const UZBEKISTAN_REGIONS = {
  "Barchasi": ["Barchasi"],
  "Farg'ona": ["Barchasi", "Qo'qon shahar", "Farg'ona shahar", "Marg'ilon shahar", "Beshariq", "Uchko'prik", "Rishton", "Oltiariq", "Bag'dod"],
  "Toshkent shahar": ["Barchasi", "Yunusobod", "Chilonzor", "Mirzo Ulug'bek", "Yashnobod", "Sergeli", "Yakkasaroy"],
  "Toshkent viloyati": ["Barchasi", "Chirchiq", "Angren", "Olmaliq", "Bekobod", "Qibray", "Zangiota"],
  "Samarqand": ["Barchasi", "Samarqand shahar", "Kattaqo'rg'on", "Urgut", "Bulung'ur", "Ishtixon"],
  "Andijon": ["Barchasi", "Andijon shahar", "Asaka", "Shahrixon", "Xonobod", "Xo'jaobod"],
  "Namangan": ["Barchasi", "Namangan shahar", "Chust", "Kosonsoy", "Uychi", "Pop"],
  "Buxoro": ["Barchasi", "Buxoro shahar", "Gijduvon", "Kogon", "Qorako'l"],
  "Xorazm": ["Barchasi", "Urganch shahar", "Xiva", "Gurlan", "Shovot"],
  "Qashqadaryo": ["Barchasi", "Karshi shahar", "Shahrisabz", "Kitob", "Koson"],
  "Surxondaryo": ["Barchasi", "Termiz shahar", "Denov", "Sherobod", "Jarqo'rg'on"],
  "Navoiy": ["Barchasi", "Navoiy shahar", "Zarafshon", "Uchquduq", "Karmana"],
  "Jizzax": ["Barchasi", "Jizzax shahar", "Zomin", "G'allaorol", "Do'stlik"],
  "Sirdaryo": ["Barchasi", "Guliston shahar", "Shirin", "Yangiyer", "Boyovut"],
  "Qoraqalpog'iston": ["Barchasi", "Nukus shahar", "Xo'jayli", "Qo'ng'irot", "Beruniy"]
};

const CATEGORIES = ["Barchasi", "Restoran", "IT", "Qurilish", "Logistika", "Dizayn", "Ta'lim", "Boshqa"];

function RatingStars({ rating = 0 }) {
  return (
    <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} style={{ fontSize: 14, color: star <= rating ? "#FFB800" : "#D1D5DB" }}>
          ★
        </span>
      ))}
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("home");
  const [selectedRegion, setSelectedRegion] = useState("Barchasi");
  const [selectedDistrict, setSelectedDistrict] = useState("Barchasi");
  const [category, setCategory] = useState("Barchasi");
  const [showProModal, setShowProModal] = useState(false);
  const [currentEffectClass, setCurrentEffectClass] = useState("");

  // Bayram vaqtlarini avtomat aniqlash
  useEffect(() => {
    const bugun = new Date();
    const oy = bugun.getMonth() + 1;
    const kun = bugun.getDate();

    if (oy === 3 && kun >= 19 && kun <= 22) {
      setCurrentEffectClass("effect-ramadan_eid");
    } else if (oy === 5 && kun >= 26 && kun <= 29) {
      setCurrentEffectClass("effect-qurban_eid");
    } else if (oy === 6) {
      setCurrentEffectClass("effect-football");
    } else {
      setCurrentEffectClass("");
    }
  }, []);

  const handleRegionChange = (e) => {
    setSelectedRegion(e.target.value);
    setSelectedDistrict("Barchasi");
  };

  // Namunaviy ma'lumotlar tuzilmasi (Viloyat va tumanlar bilan)
  const [jobs] = useState([
    { id: 1, title: "Usta yordamchisi", place: "Xususiy xonadon", wage: 120000, category: "Qurilish", region: "Farg'ona", district: "Qo'qon shahar", emoji: "🏗️", bg: "#FAECE7" },
    { id: 2, title: "Fast-food oshpazi", place: "Evos Qo'qon", wage: 150000, category: "Restoran", region: "Farg'ona", district: "Qo'qon shahar", emoji: "🍽️", bg: "#E8F8F2" },
    { id: 3, title: "Python dasturchi", place: "IT Akademiyasi", wage: 300000, category: "IT", region: "Toshkent shahar", district: "Yunusobod", emoji: "💻", bg: "#EBF3FF" }
  ]);

  const [workers] = useState([
    { id: 101, name: "Sardorbek Olimov", jobTitle: "Professional Ofitsiant", rating: 5, region: "Farg'ona", district: "Qo'qon shahar", comment: "Ishga juda mas'uliyatli yondashadi, rahmat!", avatarLetter: "S" },
    { id: 102, name: "Dostonbek Aliyev", jobTitle: "Gipsokarton ustasi", rating: 4, region: "Farg'ona", district: "Beshariq", comment: "Yaxshi usta, ishni vaqtida topshirdi.", avatarLetter: "D" },
    { id: 103, name: "Asadbek Karimov", jobTitle: "UI/UX Dizayner", rating: 5, region: "Toshkent shahar", district: "Chilonzor", comment: "Ajoyib va tezkor dizayner ekan.", avatarLetter: "A" }
  ]);

  const [applications, setApplications] = useState([
    { id: 201, jobTitle: "Fast-food oshpazi", workerName: "Sardorbek Olimov", region: "Farg'ona", district: "Qo'qon shahar", status: "pending" }
  ]);

  const handleAcceptApplication = (id, workerName) => {
    setApplications(prev =>
      prev.map(app => app.id === id ? { ...app, status: "accepted" } : app)
    );
    alert(`${workerName}ning arizasi qabul qilindi! Muloqotni boshlashingiz mumkin.`);
    window.open("https://t.me/logotipshop10", "_blank"); // Sening to'g'ri akking
  };

  const handleRejectApplication = (id) => {
    setApplications(prev => prev.filter(app => app.id !== id));
    alert("Ariza rad etildi va ro'yxatdan o'chirildi.");
  };

  // Butun O'zbekiston bo'yicha ishlarni filtrlash
  const filteredJobs = jobs.filter(j => {
    const matchesRegion = selectedRegion === "Barchasi" || j.region === selectedRegion;
    const matchesDistrict = selectedDistrict === "Barchasi" || j.district === selectedDistrict;
    const matchesCategory = category === "Barchasi" || j.category === category;
    return matchesRegion && matchesDistrict && matchesCategory;
  });

  // Butun O'zbekiston bo'yicha ishchilarni reyting va hududga ko'ra saralash
  const filteredWorkers = workers
    .filter(w => {
      const matchesRegion = selectedRegion === "Barchasi" || w.region === selectedRegion;
      const matchesDistrict = selectedDistrict === "Barchasi" || w.district === selectedDistrict;
      return matchesRegion && matchesDistrict;
    })
    .sort((a, b) => b.rating - a.rating);

  return (
    <div className={`app-container ${currentEffectClass}`} style={{ fontFamily: "sans-serif", backgroundColor: "#f5f5f7", minHeight: "100vh", paddingBottom: "80px" }}>

      {/* Yuqori panel va DUAL HUDUD FILTRI */}
      <header className="main-header" style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "16px 20px", backgroundColor: "#fff", borderBottom: "1px solid #d2d2d7" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <h1 className="worky-logo" style={{ margin: 0, fontSize: "26px", fontWeight: "900", color: "#007aff" }}>
            Work<span style={{ color: "#34c759" }}>y</span>
          </h1>
          <span style={{ fontSize: "11px", fontWeight: "700", color: "#86868b", backgroundColor: "#f5f5f7", padding: "4px 8px", borderRadius: "6px" }}>🇺🇿 O'ZBEKISTON</span>
        </div>

        {/* Hududlar tanlovi */}
        <div style={{ display: "flex", gap: "8px", width: "100%" }}>
          <select value={selectedRegion} onChange={handleRegionChange} style={{ flex: 1, padding: "8px 10px", borderRadius: "10px", border: "1px solid #d2d2d7", fontSize: "13px", backgroundColor: "#f5f5f7", fontWeight: "500" }}>
            {Object.keys(UZBEKISTAN_REGIONS).map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          <select value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} style={{ flex: 1, padding: "8px 10px", borderRadius: "10px", border: "1px solid #d2d2d7", fontSize: "13px", backgroundColor: "#f5f5f7", fontWeight: "500" }} disabled={selectedRegion === "Barchasi"}>
            {UZBEKISTAN_REGIONS[selectedRegion].map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </header>

      {/* 1. BOSH SAHIFA (Ish e'lonlari) */}
      {page === "home" && (
        <main style={{ padding: "20px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "15px" }}>Bo'sh ish o'rinlari</h2>

          <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "12px", marginBottom: "15px" }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)} style={{ padding: "6px 14px", borderRadius: "20px", border: "none", backgroundColor: category === cat ? "#007aff" : "#e8e8ed", color: category === cat ? "#fff" : "#1d1d1f", fontSize: "12px", fontWeight: "500", cursor: "pointer", whiteSpace: "nowrap" }}>
                {cat}
              </button>
            ))}
          </div>

          {filteredJobs.map(job => (
            <div key={job.id} style={{ backgroundColor: "#fff", padding: "16px", borderRadius: "16px", marginBottom: "12px", border: "1px solid #e8e8ed" }}>
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "12px", backgroundColor: job.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>{job.emoji}</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>{job.title}</h3>
                  <p style={{ margin: "4px 0", fontSize: "13px", color: "#86868b" }}>{job.place} • <b style={{ color: "#007aff" }}>{job.region}, {job.district}</b></p>
                  <span style={{ fontSize: "14px", fontWeight: "700", color: "#34c759" }}>{job.wage.toLocaleString()} so'm / kunlik</span>
                </div>
              </div>

              <div style={{ background: "#FFF7ED", border: "1px solid #FFEDD5", borderRadius: "10px", padding: "8px 12px", marginTop: "12px", fontSize: "11px", color: "#9A3412" }}>
                ⚠️ <b>Xavfsizlik qoidasi:</b> Ishni boshlashdan oldin pasport nusxangizni bermang va hech qachon zalog yoki yo'lkira uchun oldindan pul o'tkazmang!
              </div>

              <button onClick={() => alert("Ariza yuborildi!")} style={{ width: "100%", marginTop: "12px", padding: "10px", borderRadius: "12px", border: "none", backgroundColor: "#007aff", color: "#fff", fontWeight: "600", cursor: "pointer" }}>
                Ariza berish
              </button>
            </div>
          ))}
        </main>
      )}

      {/* 2. ISHCHILAR SAHIFASI (Reyting va Izohlar bilan) */}
      {page === "workers" && (
        <main style={{ padding: "20px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "15px" }}>Reytingli ishchilar</h2>

          {filteredWorkers.map(worker => (
            <div key={worker.id} style={{ backgroundColor: "#fff", padding: "16px", borderRadius: "16px", marginBottom: "12px", border: "1px solid #e8e8ed" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "50%", backgroundColor: "#34c759", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "18px" }}>
                  {worker.avatarLetter}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700" }}>{worker.name}</h3>
                    <span style={{ fontSize: "10px", padding: "2px 6px", background: "#f5f5f7", borderRadius: "4px", color: "#86868b", fontWeight: "600" }}>{worker.district}</span>
                  </div>
                  <p style={{ margin: "2px 0 6px", fontSize: "13px", fontWeight: "600", color: "#86868b" }}>{worker.jobTitle}</p>
                  <RatingStars rating={worker.rating} />
                  <div style={{ backgroundColor: "#f5f5f7", padding: "8px 12px", borderRadius: "8px", marginTop: "8px", fontSize: "12px", fontStyle: "italic", color: "#1d1d1f" }}>
                    "{worker.comment}"
                  </div>
                </div>
              </div>
            </div>
          ))}
        </main>
      )}

      {/* 3. ARIZALAR SAHIFASI (Qabul / Rad) */}
      {page === "apply" && (
        <main style={{ padding: "20px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "15px" }}>Kelgan arizalar</h2>

          {applications.length === 0 ? (
            <p style={{ textAlign: "center", color: "#86868b" }}>Arizalar mavjud emas.</p>
          ) : (
            applications.map(app => (
              <div key={app.id} style={{ backgroundColor: "#fff", padding: "16px", borderRadius: "16px", marginBottom: "12px", border: "1px solid #e8e8ed" }}>
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700" }}>{app.workerName}</h3>
                <p style={{ margin: "4px 0 12px", fontSize: "13px", color: "#86868b" }}>Lavozim: <b>{app.jobTitle}</b> ({app.district})</p>

                {app.status === "pending" ? (
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={() => handleAcceptApplication(app.id, app.workerName)} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", backgroundColor: "#34c759", color: "#fff", fontWeight: "600", cursor: "pointer" }}>
                      Qabul qilish
                    </button>
                    <button onClick={() => handleRejectApplication(app.id)} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", backgroundColor: "#ff3b30", color: "#fff", fontWeight: "600", cursor: "pointer" }}>
                      Rad etish
                    </button>
                  </div>
                ) : (
                  <div style={{ backgroundColor: "#e8f8f2", color: "#0e6245", padding: "10px", borderRadius: "10px", textAlign: "center", fontWeight: "600", fontSize: "13px" }}>
                    ✓ Qabul qilindi
                  </div>
                )}
              </div>
            ))
          )}
        </main>
      )}

      {/* 4. PROFIL SAHIFASI */}
      {page === "profile" && (
        <main style={{ padding: "20px", textAlign: "center" }}>
          <div style={{ backgroundColor: "#fff", padding: "24px", borderRadius: "20px", border: "1px solid #e8e8ed" }}>
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "#007aff", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", fontWeight: "700", margin: "0 auto 12px" }}>T</div>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>Temurbek Yoqubov</h3>
            <p style={{ margin: "4px 0 15px", fontSize: "14px", color: "#86868b" }}>+998 90 123 45 67</p>

            <button onClick={() => setShowProModal(true)} style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "none", backgroundColor: "#ff9500", color: "#fff", fontWeight: "700", cursor: "pointer" }}>
              ⭐ PRO Tarifni faollashtirish
            </button>
          </div>
        </main>
      )}

      {/* PRO TARIF MODAL OYNASI */}
      {showProModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
          <div style={{ backgroundColor: "#fff", borderRadius: "20px", padding: "20px", width: "100%", maxWidth: "360px", position: "relative" }}>
            <button onClick={() => setShowProModal(false)} style={{ position: "absolute", top: "12px", right: "14px", background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#86868b" }}>✕</button>

            <div style={{ textAlign: "center", marginBottom: "15px" }}>
              <span style={{ fontSize: "36px" }}>⭐</span>
              <h3 style={{ margin: "6px 0 2px", fontSize: "18px", fontWeight: "700" }}>PRO Obuna tizimi</h3>
            </div>

            <div style={{ backgroundColor: "#f5f5f7", borderRadius: "12px", padding: "12px", fontSize: "12px", lineHeight: "1.5", border: "1px solid #e8e8ed", marginBottom: "15px" }}>
              <b style={{ color: "#ff9500" }}>1. To'lov qiling:</b><br/>
              💳 Karta: <b>8600 0000 0000 0000</b>
              <div style={{ margin: "6px 0", height: "1px", backgroundColor: "#e8e8ed" }} />
              <b style={{ color: "#007aff" }}>2. Tasdiq chekini yuboring:</b><br/>
              To'lov cheki va shaxsiy ID raqamingizni nusxalab Telegramga yuboring.
            </div>

            <div style={{ backgroundColor: "#e8f8f2", borderRadius: "12px", padding: "10px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "15px" }}>
              <div>
                <div style={{ fontSize: "9px", color: "#86868b" }}>SHAXSIY ID:</div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#0e6245" }}>WRK99812</div>
              </div>
              <button onClick={() => { navigator.clipboard.writeText("WRK99812"); alert("ID nusxalandi!"); }} style={{ backgroundColor: "#fff", border: "1px solid #34c759", color: "#34c759", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
                Nusxalash
              </button>
            </div>

            <a href="https://t.me/logotipshop10" target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
              <button style={{ width: "100%", padding: "12px 0", borderRadius: "12px", border: "none", backgroundColor: "#24A1DE", color: "#fff", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>
                ✈️ Telegramga chekni yuborish
              </button>
            </a>
          </div>
        </div>
      )}

      {/* BOTTOM NAVIGATION BAR */}
      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: "64px", backgroundColor: "#fff", borderTop: "1px solid #d2d2d7", display: "flex", justifyContent: "space-around", alignItems: "center", zIndex: 900 }}>
        <button onClick={() => setPage("home")} style={{ border: "none", background: "none", color: page === "home" ? "#007aff" : "#86868b", fontSize: "11px", cursor: "pointer" }}>
          <span style={{ fontSize: "20px", display: "block" }}>🏠</span>Ishlar
        </button>
        <button onClick={() => setPage("workers")} style={{ border: "none", background: "none", color: page === "workers" ? "#007aff" : "#86868b", fontSize: "11px", cursor: "pointer" }}>
          <span style={{ fontSize: "20px", display: "block" }}>👷</span>Ishchilar
        </button>
        <button onClick={() => setPage("apply")} style={{ border: "none", background: "none", color: page === "apply" ? "#007aff" : "#86868b", fontSize: "11px", cursor: "pointer" }}>
          <span style={{ fontSize: "20px", display: "block" }}>📋</span>Arizalar
        </button>
        <button onClick={() => setPage("profile")} style={{ border: "none", background: "none", color: page === "profile" ? "#007aff" : "#86868b", fontSize: "11px", cursor: "pointer" }}>
          <span style={{ fontSize: "20px", display: "block" }}>👤</span>Profil
        </button>
      </nav>

    </div>
  );
}