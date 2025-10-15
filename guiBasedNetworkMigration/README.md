# GUI-Based-Network-Migration

A small GUI tool to help a mobile IT worker manage and migrate between network profiles (name + IPv4 address). This repository contains a React-based UI (Vite) that provides profile selection, add/update/delete, and simple validation. Firestore integration is optional and documented below.

## Quick start (Windows)

Prerequisites
- Node.js 18+ and npm
- (Optional) Firebase project if using Firestore

Install and run locally (run in cmd.exe if PowerShell blocks npm scripts):
```cmd
npm install
npm run dev
```
Open http://localhost:5173

Build for production:
```cmd
npm run build
```

## Project structure (important files)
- src/ — React source files
  - src/components/profiles.jsx — Profile dropdown + inputs (name, IPv4) with validation (needs tweaking)
  - src/main.jsx, src/App.jsx — app entry and layout
- index.html — Vite entry
- package.json — scripts and dependencies

## Profile UI behavior
- Dropdown selects an existing profile.
- Inputs allow editing the profile name and IPv4 address.
- Buttons: Add, Update, Delete.
- IPv4 validation: a.b.c.d where each octet is 0–255.
- Profiles are stored in component state by default. Persist to a backend or Firestore if needed.

## Firestore (will work on integration)
To persist profiles to Firestore:
1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Firestore and configure security rules.
3. Add a Web app and copy the config object.
4. Create a .env file at project root with:
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
5. In your firebase/init file use `import { initializeApp } from "firebase/app"` and `import { getFirestore } from "firebase/firestore"`, reading config from `import.meta.env`.
6. Replace local state reads/writes with Firestore reads/writes and handle network errors.

Notes:
- Firestore access uses HTTPS (Firebase SDK) and follows Firebase security rules. Ensure authentication and rules match your use case.
- When testing on LAN, run Vite with host: `npm run dev -- --host` or update scripts.

## Network / data protocol
- UI expects IPv4 addresses only. Validation is client-side and should be repeated server-side if you persist profiles externally.
- If you add an API backend, prefer HTTPS and JSON payloads with a simple REST contract:
  - GET /profiles -> [{ id, name, ip }]
  - POST /profiles -> { name, ip }
  - PUT /profiles/:id -> { name, ip }
  - DELETE /profiles/:id

## Contributing
- Fork and open a PR. Keep changes small and document behavior.
- For Firestore or backend features, include tests and minimal setup docs.

## License
Add your preferred license here (e.g., MIT).  