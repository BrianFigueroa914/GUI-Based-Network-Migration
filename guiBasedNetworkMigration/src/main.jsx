import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ensureAnon } from './firebase.js'

async function bootstrap() {
  try {
    await ensureAnon();                 // <-- silent anonymous login
  } catch (e) {
    console.error('Firebase auth failed:', e);
  } finally {
    createRoot(document.getElementById('root')).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  }
}

bootstrap();
