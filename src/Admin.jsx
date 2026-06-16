import React, { useState } from "react";

// Sening backend manziling
const API_URL = "https://worky-backend-ubwp.onrender.com";

export default function AdminPanel() {
  const [userId, setUserId] = useState("");
  const [message, setMessage] = useState("");

  // PROni yoqish (Aktivlashtirish)
  const handleActivatePro = async () => {
    if (!userId) return alert("Foydalanuvchi ID raqamini kiriting!");
    try {
      const res = await fetch(`${API_URL}/users/${userId}/pro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_pro: true })
      });
      if (res.ok) {
        setMessage(`ID: ${userId} muvaffaqiyatli PRO qilindi!`);
      } else {
        setMessage("Xatolik yuz berdi, ID to'g'riligini tekshiring.");
      }
    } catch (e) {
      setMessage("Server bilan bog'lanishda xatolik.");
    }
  };

  // PROni o'chirish (Faolsizlantirish)
  const handleDeactivatePro = async () => {
    if (!userId) return alert("Foydalanuvchi ID raqamini kiriting!");
    try {
      const res = await fetch(`${API_URL}/users/${userId}/pro`, {
        method: "POST", // Backend talabiga qarab PUT yoki DELETE bo'lishi ham mumkin
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_pro: false })
      });
      if (res.ok) {
        setMessage(`ID: ${userId} foydalanuvchidan PRO statusi olib tashlandi!`);
      } else {
        setMessage("Xatolik yuz berdi.");
      }
    } catch (e) {
      setMessage("Server bilan bog'lanishda xatolik.");
    }
  };

  return (
    <div style={{ fontFamily: "sans-serif", padding: "30px", maxWidth: "400px", margin: "50px auto", backgroundColor: "#fff", borderRadius: "16px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>
      <h2 style={{ margin: "0 0 20px 0", textAlign: "center", color: "#1e293b" }}>Worky Admin Panel</h2>

      {message && <div style={{ padding: "10px", backgroundColor: "#f1f5f9", borderRadius: "8px", marginBottom: "15px", fontSize: "13px", fontWeight: "600", color: "#0f172a", textAlign: "center" }}>{message}</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <input
          type="text"
          placeholder="Foydalanuvchi ID sini kiriting"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          style={{ padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
        />

        <button onClick={handleActivatePro} style={{ padding: "12px", backgroundColor: "#eab308", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}>
          🌟 PRO Aktivlashtirish
        </button>

        <button onClick={handleDeactivatePro} style={{ padding: "12px", backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}>
          ❌ PROni Faolsizlantirish
        </button>
      </div>
    </div>
  );
}