import { useEffect, useMemo, useState } from "react";
import { auth, db } from "/src/firebase.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

const empty = () => ({
  name: "",
  interface: "",
  mode: "DHCP", // "DHCP" | "Static"
  ip: "",
  subnet: "",
  gateway: "",
  dns: "",
});

function ipv4(x) {
  if (!x) return false;
  const p = x.trim().split(".");
  if (p.length !== 4) return false;
  return p.every((q) => /^\d+$/.test(q) && +q >= 0 && +q <= 255);
}

function validate(p) {
  const e = {};
  if (!p.name.trim()) e.name = "Required";
  if (!p.interface.trim()) e.interface = "Required";
  if (p.mode === "Static") {
    if (!ipv4(p.ip)) e.ip = "Invalid IPv4";
    if (!ipv4(p.subnet)) e.subnet = "Invalid subnet";
    if (!ipv4(p.gateway)) e.gateway = "Invalid gateway";
    if (p.dns) {
      const all = p.dns
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (!all.every(ipv4)) e.dns = "Bad DNS (comma-separated)";
    }
  }
  return e;
}

function download(text, filename) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function Profiles() {
  // Firestore-backed profiles: [{id, name, interface, ...}]
  const [profiles, setProfiles] = useState([]);
  const [sel, setSel] = useState(-1);
  const [draft, setDraft] = useState(empty());
  const [q, setQ] = useState("");
  const errs = useMemo(() => validate(draft), [draft]);
  const ok = Object.keys(errs).length === 0;

  // ---- Realtime Firestore listener ----
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const col = collection(db, "users", uid, "profiles");
    const qy = query(col, orderBy("createdAt"));
    const off = onSnapshot(qy, (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProfiles(rows);
      // keep draft synced with current selection
      if (sel >= 0 && rows[sel]) setDraft(rows[sel]);
      else if (sel >= 0 && !rows[sel]) {
        setSel(-1);
        setDraft(empty());
      }
    });
    return off;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When user clicks list items, update draft
  useEffect(() => {
    if (sel >= 0 && profiles[sel]) setDraft(profiles[sel]);
    else setDraft(empty());
    // eslint-disable-next-line
  }, [sel]);

  // Filter for search
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return profiles;
    return profiles.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(t) ||
        (p.interface || "").toLowerCase().includes(t) ||
        (p.mode || "").toLowerCase().includes(t)
    );
  }, [q, profiles]);

  function addNew() {
    setSel(-1);
    setDraft(empty());
  }

  async function save() {
    if (!ok) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const col = collection(db, "users", uid, "profiles");

    // sanitize payload
    const payload = {
      name: String(draft.name || "").trim(),
      interface: String(draft.interface || "").trim(),
      mode: draft.mode === "Static" ? "Static" : "DHCP",
      ip: String(draft.ip || "").trim(),
      subnet: String(draft.subnet || "").trim(),
      gateway: String(draft.gateway || "").trim(),
      dns: String(draft.dns || "").trim(),
      updatedAt: serverTimestamp(),
    };

    if (sel >= 0 && profiles[sel]) {
      // update existing doc
      const id = profiles[sel].id;
      await setDoc(
        doc(db, "users", uid, "profiles", id),
        {
          ...payload,
          createdAt: profiles[sel].createdAt || serverTimestamp(),
        },
        { merge: true }
      );
    } else {
      // create new doc
      await addDoc(col, { ...payload, createdAt: serverTimestamp() });
    }
    setSel(-1);
    setDraft(empty());
  }

  async function remove() {
    if (sel < 0 || !profiles[sel]) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await deleteDoc(doc(db, "users", uid, "profiles", profiles[sel].id));
    setSel(-1);
    setDraft(empty());
  }

  function exportJSON() {
    // export without Firestore-specific fields like id/timestamps
    const data = profiles.map(({ id, createdAt, updatedAt, ...rest }) => rest);
    download(JSON.stringify(data, null, 2), "profiles.json");
  }

  function importJSON(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = async () => {
      try {
        const data = JSON.parse(String(r.result));
        if (!Array.isArray(data)) throw new Error("Invalid file");
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        const col = collection(db, "users", uid, "profiles");
        for (const p of data) {
          const payload = {
            ...empty(),
            ...p,
            name: String(p.name || "").trim(),
            interface: String(p.interface || "").trim(),
            mode: p.mode === "Static" ? "Static" : "DHCP",
            ip: String(p.ip || "").trim(),
            subnet: String(p.subnet || "").trim(),
            gateway: String(p.gateway || "").trim(),
            dns: String(p.dns || "").trim(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await addDoc(col, payload);
        }
        setSel(-1);
      } catch {
        alert("Invalid JSON file.");
      }
    };
    r.readAsText(f);
    e.target.value = "";
  }

  const title = sel >= 0 ? "Edit profile" : "Create profile";

  return (
    <div className="grid" role="main" aria-label="Network profiles manager">
      {/* Left: list + actions */}
      <div>
        <div className="meta" style={{ marginBottom: 6 }}>
          <strong>Profiles</strong>
          <span>•</span>
          <span>
            {filtered.length} of {profiles.length}
          </span>
        </div>

        <input
          className="search"
          placeholder="Search by name, interface, or mode…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search profiles"
        />

        {filtered.length === 0 ? (
          <div className="empty" role="status">
            {profiles.length === 0 ? (
              <>
                No profiles yet. Click <strong>+ New</strong> to create one.
              </>
            ) : (
              <>No matches for “{q}”.</>
            )}
          </div>
        ) : (
          <ul className="list" role="listbox" aria-label="Saved profiles">
            {filtered.map((p) => {
              const idx = profiles.findIndex((row) => row.id === p.id); // ensure index maps to full list
              const isSel = idx === sel;
              return (
                <li
                  key={p.id}
                  className={isSel ? "sel" : ""}
                  onClick={() => setSel(idx)}
                  role="option"
                  aria-selected={isSel}
                  title={`${p.mode} on ${p.interface || "interface"}`}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <strong>{p.name}</strong>
                      <div className="muted" style={{ marginTop: 2 }}>
                        <span
                          className={`badge ${
                            p.mode === "DHCP" ? "success" : "warn"
                          }`}
                          style={{ marginRight: 6 }}
                        >
                          {p.mode}
                        </span>
                        <span className="badge">{p.interface || "—"}</span>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="toolbar" role="toolbar" aria-label="Profile actions">
          <button className="btn" onClick={addNew}>
            + New
          </button>
          <button
            className="btn secondary"
            onClick={exportJSON}
            disabled={profiles.length === 0}
          >
            Export
          </button>
          <label className="btn secondary filebtn" aria-label="Import JSON">
            Import
            <input
              type="file"
              accept="application/json"
              onChange={importJSON}
            />
          </label>
          <button className="btn danger" onClick={remove} disabled={sel < 0}>
            Delete
          </button>
        </div>
      </div>

      {/* Right: form */}
      <div>
        <div className="meta" style={{ marginBottom: 6 }}>
          <strong>{title}</strong>
        </div>

        <div className="form" aria-live="polite">
          {/* Identification section */}
          <label>
            <span>Name</span>
            <input
              className="input"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Client Office"
            />
            {errs.name && <em>{errs.name}</em>}
          </label>

          <label>
            <span>Interface</span>
            <input
              className="input"
              value={draft.interface}
              onChange={(e) =>
                setDraft({ ...draft, interface: e.target.value })
              }
              placeholder='e.g., "Ethernet" (Windows) or "eth0" (Linux)'
            />
            <div className="hint">Use the OS name of the adapter.</div>
            {errs.interface && <em>{errs.interface}</em>}
          </label>

          <label>
            <span>Mode</span>
            <select
              className="input"
              value={draft.mode}
              onChange={(e) => setDraft({ ...draft, mode: e.target.value })}
              aria-label="IP assignment mode"
            >
              <option>DHCP</option>
              <option>Static</option>
            </select>
            <div className="hint">
              DHCP receives IP automatically; Static requires manual values
              below.
            </div>
          </label>

          {/* IP settings section (only for Static) */}
          {draft.mode === "Static" && (
            <>
              <div className="section" style={{ gridColumn: "1 / -1" }} />

              <label>
                <span>IPv4 address</span>
                <input
                  className="input"
                  value={draft.ip}
                  onChange={(e) => setDraft({ ...draft, ip: e.target.value })}
                  placeholder="192.168.1.10"
                />
                <div className="hint">Format: a.b.c.d (0–255)</div>
                {errs.ip && <em>{errs.ip}</em>}
              </label>

              <label>
                <span>Subnet mask</span>
                <input
                  className="input"
                  value={draft.subnet}
                  onChange={(e) =>
                    setDraft({ ...draft, subnet: e.target.value })
                  }
                  placeholder="255.255.255.0"
                />
                {errs.subnet && <em>{errs.subnet}</em>}
              </label>

              <label>
                <span>Gateway</span>
                <input
                  className="input"
                  value={draft.gateway}
                  onChange={(e) =>
                    setDraft({ ...draft, gateway: e.target.value })
                  }
                  placeholder="192.168.1.1"
                />
                {errs.gateway && <em>{errs.gateway}</em>}
              </label>

              <label>
                <span>DNS servers (optional)</span>
                <input
                  className="input"
                  value={draft.dns}
                  onChange={(e) => setDraft({ ...draft, dns: e.target.value })}
                  placeholder="8.8.8.8, 1.1.1.1"
                />
                <div className="hint">Comma-separated list.</div>
                {errs.dns && <em>{errs.dns}</em>}
              </label>
            </>
          )}

          <div className="actions" style={{ gridColumn: "1 / -1" }}>
            <button className="btn" onClick={save} disabled={!ok}>
              {sel >= 0 ? "Save changes" : "Add profile"}
            </button>
            <button
              className="btn secondary"
              onClick={() => {
                setSel(-1);
                setDraft(empty());
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
