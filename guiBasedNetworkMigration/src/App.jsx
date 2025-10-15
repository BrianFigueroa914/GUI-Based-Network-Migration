import Profiles from './components/profiles.jsx';

export default function App() {
  return (
    <div className="app-shell">
      <div className="header">
        <div className="brand">
          <h1>Network Migration Menu</h1>
          <small>HCI prototype</small>
        </div>
        <div className="right">
          <a className="btn ghost" href="#" onClick={(e)=>e.preventDefault()} title="No real network changes are made">
            Demo Mode
          </a>
        </div>
      </div>

      <div className="card">
        <Profiles />
      </div>
    </div>
  );
}
