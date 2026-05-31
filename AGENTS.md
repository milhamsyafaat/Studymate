# StudyMate — Task Tracker (Mobile PWA + Android)

React + Vite PWA with Capacitor for Android, a classic SPA for managing tasks, Pomodoro, and study stats.

## Stack

- **Framework:** React 18 (no router, no TypeScript)
- **Build:** Vite 6 with `base: './'` (relative paths — works for both PWA hosting and Capacitor WebView)
- **Mobile:** PWA (manifest.json + cache-first SW) and Capacitor Android native (`android/`)
- **Persistence:** localStorage (4 keys: `sm_tasks_v2`, `sm_stats_v2`, `sm_pomo_v2`, `sm_subjects_v2`)

## Commands

| Usage | Command |
|---|---|
| Dev server | `npm run dev` |
| Production build | `npm run build` |
| Preview build | `npm run preview` |
| Preview over LAN | `npx vite preview --host --port 4173` (or `start.bat`) |
| Sync Capacitor | `npx cap sync android` |
| Open Android Studio | `npx cap open android` |

## CI / Deploy

Push to `main` → GitHub Actions builds `dist/` and deploys to GitHub Pages via `peaceiris/actions-gh-pages`.

## Project structure

```
src/
  main.jsx     Entry point + service worker register
  App.jsx      Semua komponen UI + state dalam satu file (1580 baris, 4 tab)
  utils.js     Helpers: load/save localStorage, getDaysLeft, fmt2
  components/  (empty — belum dipakai)
public/
  manifest.json  PWA manifest (display: standalone, portrait)
  sw.js          Service worker cache-first (studymate-v1)
  favicon.svg + icon-{192,512}.png

android/         Capacitor Android project (fully configured)
.github/workflows/deploy.yml
```

## Quirks

- **Custom subjects** — "Atur Matkul" di dashboard, default 11 matkul.
- **No router** — navigasi via state `view` (4 tab: dashboard, tasks, pomodoro, stats).
- **No CSS framework** — semua styling inline di objek `S`.
- **Capacitor** — `capacitor.config.json` webDir point ke `dist/`. Files di `android/` sudah di-generate, tinggal `npx cap sync && npx cap open android`.
- **`base: './'`** di vite.config.js — penting agar asset path relatif. Tanpa ini, build gak bakal work di Capacitor WebView atau sub-Path deployment.
- **PWA paths** — `public/manifest.json` dan `public/sw.js` di-copy mentah ke `dist/`. Path di file-file itu HARUS relatif (`./`, bukan `/`), karena Vite gak transform isi file di `public/`. Hal yang sama berlaku untuk SW registration di `src/main.jsx`.
- **No lint/typecheck/test** — pure SPA tanpa toolchain tambahan.
- **`node_modules/`, `dist/`, `.env`, `*.local`** di-gitignore.

## Workspace

Project ada di dalam Laragon web root. Local dev via `http://AI Agent.test/` (Laragon auto-vhost). Untuk preview dari HP, jalankan `start.bat` atau `npx vite preview --host`.
