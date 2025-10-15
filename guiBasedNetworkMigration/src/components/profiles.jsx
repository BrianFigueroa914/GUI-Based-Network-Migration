import React, { useEffect, useMemo, useState } from "react";

const LOCAL_KEY = "nm_profiles_simple_v2";

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
  return p.every(q => /^\d+$/.test(q) && +q >= 0 && +q <= 255);
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
      const all = p.dns.split(",").map(s => s.trim()).filter(Boolean);
      if (!all.every(ipv4)) e.dns = "Bad DNS (comma-separated)";
    }
  }
  return e;
}

function download(text, filename) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a);
  a.click(); a.remove(); URL.revokeObjectURL(url);
}

export default function Profiles() {
  const [profiles, setProfiles] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]"); }
    catch { return []; }
  });
  const [sel, setSel] = useState(-1);
  const [draft, setDraft] = useState(empty());
  const errs = useMemo(() => validate(draft), [draft]);
  const ok = Object.keys(errs).length === 0;

  const [toast, setToast] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    if (sel >= 0 && profiles[sel]) setDraft(profiles[sel]);
    else setDraft(empty());
    // eslint-disable-next-line
  }, [sel]);

  function notify(msg){
    setToast(msg);
    setTimeout(()=>setToast(""), 1800);
  }

  function addNew() {
    setSel(-1);
    setDraft(empty());
  }

  function save() {
    if (!ok) return;
    if (sel >= 0) {
      const next = [...profiles];
      next[sel] = draft;
      setProfiles(next);
      notify("Changes saved");
    } else {
      setProfiles([...profiles, draft]);
      setSel(profiles.length);
      notify("Profile added");
    }
  }

  function askDelete(){
    if (sel < 0) return;
    setConfirmOpen(true);
  }
  function confirmDelete(){
    setConfirmOpen(false);
    if (sel < 0) return;
    const next = profiles.filter((_, i) => i !== sel);
    setProfiles(next);
    setSel(-1);
    notify("Profile deleted");
  }

  function exportJSON(){
    const data = JSON.stringify(profiles, null, 2);
    download(data, "profiles.json");
    notify("Exported profiles");
  }

  function importJSON(e){
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(String(r.result));
        if (!Array.isArray(data)) throw new Error();
        setProfiles(data);
        setSel(-1);
        notify("Import complete");
      } catch {
        alert("Invalid JSON file.");
      }
    };
    r.readAsText(f);
    e.target.value = "";
  }

  return (
    <>
      <div className="grid">
        {/* Left column: list & toolbar */}
        <div>
          <h2>Profiles</h2>

          {profiles.length === 0 ? (
            <div className="empty">
              No profiles yet. Click <strong>+ New</strong> to create one.
            </div>
          ) : (
            <ul className="list">
              {profiles.map((p, i) => (
                <li key={i} className={i===sel ? "sel" : ""} onClick={() => setSel(i)}
                    title={`${p.mode} on ${p.interface || "interface"}`}>
                  <strong>{p.name}</strong>
                  <div className="muted">{p.mode} • {p.interface || "—"}</div>
                </li>
              ))}
            </ul>
          )}

          <div className="toolbar">
            <button className="btn" onClick={addNew}>+ New</button>
            <button className="btn secondary" onClick={exportJSON} disabled={profiles.length===0}>Export</button>
            <label className="btn secondary filebtn">
              Import
              <input type="file" accept="application/json" onChange={importJSON}/>
            </label>
            <button className="btn danger" onClick={askDelete} disabled={sel<0}>Delete</button>
          </div>
        </div>

        {/* Right column: form */}
        <div>
          <h2>{sel>=0 ? "Edit profile" : "Create profile"}</h2>
          <div className="form" aria-live="polite">
            <label>
              <span>Name</span>
              <input className="input" value={draft.name}
                     onChange={e=>setDraft({...draft, name:e.target.value})}
                     placeholder="Client Office" />
              {errs.name && <em>{errs.name}</em>}
            </label>

            <label>
              <span>Interface</span>
              <input className="input" value={draft.interface}
                     onChange={e=>setDraft({...draft, interface:e.target.value})}
                     placeholder='e.g., "Ethernet" or "eth0"' />
              {errs.interface && <em>{errs.interface}</em>}
            </label>

            <label>
              <span>Mode</span>
              <select className="input" value={draft.mode}
                      onChange={e=>setDraft({...draft, mode:e.target.value})}>
                <option>DHCP</option>
                <option>Static</option>
              </select>
            </label>

            {draft.mode==="Static" && (
              <>
                <label>
                  <span>IPv4</span>
                  <input className="input" value={draft.ip}
                         onChange={e=>setDraft({...draft, ip:e.target.value})}
                         placeholder="192.168.1.10" />
                  {errs.ip && <em>{errs.ip}</em>}
                </label>

                <label>
                  <span>Subnet</span>
                  <input className="input" value={draft.subnet}
                         onChange={e=>setDraft({...draft, subnet:e.target.value})}
                         placeholder="255.255.255.0" />
                  {errs.subnet && <em>{errs.subnet}</em>}
                </label>

                <label>
                  <span>Gateway</span>
                  <input className="input" value={draft.gateway}
                         onChange={e=>setDraft({...draft, gateway:e.target.value})}
                         placeholder="192.168.1.1" />
                  {errs.gateway && <em>{errs.gateway}</em>}
                </label>

                <label>
                  <span>DNS (optional)</span>
                  <input className="input" value={draft.dns}
                         onChange={e=>setDraft({...draft, dns:e.target.value})}
                         placeholder="8.8.8.8, 1.1.1.1" />
                  {errs.dns && <em>{errs.dns}</em>}
                </label>
              </>
            )}

            <div className="row">
              <button className="btn" onClick={save} disabled={!ok}>
                {sel>=0 ? "Save changes" : "Add profile"}
              </button>
              <button className="btn secondary" onClick={()=>{ setSel(-1); setDraft(empty()); }}>
                Reset
              </button>
            </div>

            <p className="help">
              Prototype note: This demo stores data in your browser only (no real network changes).
            </p>
          </div>
        </div>
      </div>

      {/* toast */}
      {toast && <div className="toast">{toast}</div>}

      {/* delete confirm */}
      {confirmOpen && (
        <div className="modal-backdrop" onClick={()=>setConfirmOpen(false)}>
          <div className="modal" onClick={(e)=>e.stopPropagation()}>
            <h3>Delete profile?</h3>
            <p className="muted">This removes the selected profile from this device.</p>
            <div className="row" style={{marginTop:10}}>
              <button className="btn danger" onClick={confirmDelete}>Delete</button>
              <button className="btn secondary" onClick={()=>setConfirmOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
