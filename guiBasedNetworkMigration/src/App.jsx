import Profiles from "./components/profiles.jsx";
import ThemeCustomizer from "./components/ThemeCustomizer.jsx";

export default function App() {
  return (
    <div className="app-shell">
      <header className="header" role="banner">
        <div className="brand">
          <h1>Network Migration Menu</h1>
          <small>Manage and store network profiles</small>
        </div>
      </header>

      <ThemeCustomizer />

      <div className="card">
        <Profiles />
      </div>
    </div>
  );
}
