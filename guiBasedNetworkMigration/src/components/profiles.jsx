import React, { useState, useEffect } from "react";

function Profiles() {
  const [profiles, setProfiles] = useState([
    { name: "Default", ip: "0.0.0.0" },
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [name, setName] = useState("");
  const [ip, setIp] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const p = profiles[selectedIndex];
    setName(p ? p.name : "");
    setIp(p ? p.ip : "");
    setError("");
  }, [selectedIndex, profiles]);

  function isValidIp(value) {
    const parts = value.split(".");
    if (parts.length !== 4) return false;
    return parts.every((p) => {
      if (!/^\d+$/.test(p)) return false;
      const n = Number(p);
      return n >= 0 && n <= 255;
    });
  }

  function handleAdd() {
    if (!name.trim()) {
      setError("Profile name required.");
      return;
    }
    if (!isValidIp(ip)) {
      setError("Invalid IP address.");
      return;
    }
    const newProfiles = [...profiles, { name: name.trim(), ip: ip.trim() }];
    setProfiles(newProfiles);
    setSelectedIndex(newProfiles.length - 1);
    setError("");
  }

  function handleUpdate() {
    if (selectedIndex == null || selectedIndex < 0 || selectedIndex >= profiles.length) return;
    if (!name.trim()) {
      setError("Profile name required.");
      return;
    }
    if (!isValidIp(ip)) {
      setError("Invalid IP address.");
      return;
    }
    const updated = profiles.map((p, i) => (i === selectedIndex ? { name: name.trim(), ip: ip.trim() } : p));
    setProfiles(updated);
    setError("");
  }

  function handleDelete() {
    if (profiles.length === 0) return;
    const next = profiles.filter((_, i) => i !== selectedIndex);
    const nextIndex = Math.max(0, Math.min(next.length - 1, selectedIndex - 1));
    setProfiles(next);
    setSelectedIndex(next.length ? nextIndex : -1);
    setError("");
  }

  return (
    <div style={{ padding: 12, maxWidth: 420 }}>
      <label>
        Select profile:
        <select
          value={selectedIndex}
          onChange={(e) => setSelectedIndex(Number(e.target.value))}
          style={{ display: "block", marginTop: 6, marginBottom: 12, width: "100%" }}
        >
          {profiles.map((p, i) => (
            <option key={i} value={i}>
              {p.name} — {p.ip}
            </option>
          ))}
          {profiles.length === 0 && <option value={-1}>No profiles</option>}
        </select>
      </label>

      <label>
        Profile name:
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Office Router"
          style={{ display: "block", marginTop: 6, marginBottom: 12, width: "100%" }}
        />
      </label>

      <label>
        IP address:
        <input
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          placeholder="e.g. 192.168.0.1"
          style={{ display: "block", marginTop: 6, marginBottom: 12, width: "100%" }}
        />
      </label>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleAdd}>Add</button>
        <button onClick={handleUpdate} disabled={selectedIndex < 0 || selectedIndex >= profiles.length}>
          Update
        </button>
        <button onClick={handleDelete} disabled={selectedIndex < 0 || profiles.length === 0}>
          Delete
        </button>
      </div>

      {error && <div style={{ color: "red", marginTop: 10 }}>{error}</div>}
      <div style={{ marginTop: 16, fontSize: 13, color: "#555" }}>
        Profiles count: {profiles.length}
      </div>
    </div>
  );
}
 
export default Profiles;
