import React, { useState, useEffect } from "react";
import { addProfile, updateProfile, deleteProfile, subscribeProfiles } from '../firebase'

function Profiles() {
  const [profiles, setProfiles] = useState([
    { name: "Default", ip: "0.0.0.0" },
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [name, setName] = useState("");
  const [ip, setIp] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Sync selected profile fields from profiles list
    const p = profiles[selectedIndex];
    setName(p ? p.name : "");
    setIp(p ? p.ip : "");
    setError("");
  }, [selectedIndex, profiles]);

  // Subscribe to Firestore profiles on mount
  useEffect(() => {
    const unsubscribe = subscribeProfiles((items) => {
      // Map stored profiles to expected shape (name, ip). Keep createdAt for sorting.
      const simplified = items.map((it) => ({ id: it.id, name: it.name || '', ip: it.ip || '' }))
      if (simplified.length > 0) {
        setProfiles(simplified)
        // ensure selectedIndex stays in range
        setSelectedIndex((idx) => Math.max(0, Math.min(idx, simplified.length - 1)))
      } else {
        setProfiles([])
        setSelectedIndex(-1)
      }
    })

    return () => unsubscribe()
  }, [])

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
    // Prevent creating a profile with a duplicate name (case-insensitive)
    const newNameLower = name.trim().toLowerCase()
    const exists = profiles.some((p) => (p.name || '').toLowerCase() === newNameLower)
    if (exists) {
      setError('Profile name already exists.')
      return
    }
    // Persist to Firestore
    addProfile({ name: name.trim(), ip: ip.trim() })
      .then((id) => {
        setError('')
        // Firestore subscription will update local state; set selected index to last item once added
      })
      .catch((err) => {
        console.error('Failed to add profile', err)
        setError('Failed to save profile')
      })
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
    const target = profiles[selectedIndex]
    if (!target || !target.id) {
      setError('Cannot update: missing profile id')
      return
    }
    updateProfile(target.id, { name: name.trim(), ip: ip.trim() })
      .then(() => setError(''))
      .catch((err) => {
        console.error('Update failed', err)
        setError('Failed to update profile')
      })
  }

  function handleDelete() {
    if (profiles.length === 0) return;
    const target = profiles[selectedIndex]
    if (!target || !target.id) {
      setError('Cannot delete: missing profile id')
      return
    }
    deleteProfile(target.id)
      .then(() => setError(''))
      .catch((err) => {
        console.error('Delete failed', err)
        setError('Failed to delete profile')
      })
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
