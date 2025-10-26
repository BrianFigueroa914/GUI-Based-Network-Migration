import { useEffect, useState } from "react";
import { auth, db } from "/src/firebase.js";
import { doc, getDoc, setDoc } from "firebase/firestore";

// Default dark theme
const defaultTheme = {
  "--bg": "#0b0f19",
  "--panel": "#121a2a",
  "--accent": "#6cb1ff",
  "--text": "#e9eefc",
  "--muted": "#9aa6bd",
  "--danger": "#ff7a7a",
};

// Validate Firestore data
function isValidTheme(obj) {
  return (
    obj &&
    typeof obj === "object" &&
    Object.keys(obj).every((k) => k.startsWith("--"))
  );
}

export default function ThemeCustomizer() {
  const [theme, setTheme] = useState(defaultTheme);

  // Apply CSS variables to the page
  function applyTheme(t) {
    for (const key in t) {
      document.documentElement.style.setProperty(key, t[key]);
    }
  }

  // Save theme to Firestore
  async function saveTheme(t) {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const ref = doc(db, "users", uid, "settings", "ui");
    await setDoc(ref, { theme: t }, { merge: true });
  }

  // Reset to defaults
  function resetTheme() {
    setTheme(defaultTheme);
    applyTheme(defaultTheme);
    saveTheme(defaultTheme);
  }

  // Handle color changes
  function handleChange(key, value) {
    const updated = { ...theme, [key]: value };
    setTheme(updated);
    applyTheme(updated);
    saveTheme(updated);
  }

  // Load user theme on mount
  useEffect(() => {
    applyTheme(defaultTheme);
    setTheme(defaultTheme);

    async function loadTheme() {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const ref = doc(db, "users", uid, "settings", "ui");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const saved = snap.data().theme;
        if (isValidTheme(saved)) {
          setTheme(saved);
          applyTheme(saved);
        }
      }
    }
    loadTheme();
  }, []);

  return (
    <div
      className="theme-editor"
      style={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        background: "var(--panel)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "12px 16px",
        marginBottom: "1rem",
        gap: "14px",
      }}
    >
      <h3 style={{ margin: 0, color: "var(--text)", fontSize: "16px" }}>
        Customize Theme:
      </h3>
      {/*Styles */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "14px",
          flexGrow: 1,
        }}
      >
        {Object.entries(theme).map(([key, val]) => (
          <div
            key={key}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
            }}
          >
            <input
              type="color"
              value={val}
              onChange={(e) => handleChange(key, e.target.value)}
              title={key.replace("--", "")}
              style={{
                width: 36,
                height: 36,
                border: "1px solid var(--border)",
                borderRadius: "6px",
                cursor: "pointer",
                background: val,
              }}
            />
            <label
              style={{
                fontSize: "11px",
                color: "var(--muted)",
                textTransform: "capitalize",
              }}
            >
              {key.replace("--", "")}
            </label>
          </div>
        ))}
      </div>
      {/* Reset Button */}
      <button
        className="btn secondary"
        onClick={resetTheme}
        style={{ whiteSpace: "nowrap", fontSize: "13px", padding: "8px 10px" }}
      >
        Reset
      </button>
    </div>
  );
}
