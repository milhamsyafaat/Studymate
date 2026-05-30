# StudyMate — AI Study Assistant (Mobile PWA)

React + Vite PWA untuk manajemen tugas, Pomodoro, dan AI chat belajar.

## Stack

- **Framework:** React 18 (no router, no TypeScript)
- **Build:** Vite 6
- **Mobile:** PWA (manifest.json + service worker `public/sw.js`) — installable via browser, gratis tanpa app store
- **Persistence:** localStorage (5 keys: `sm_tasks_v2`, `sm_chat_v2`, `sm_stats_v2`, `sm_pomo_v2`, `sm_subjects_v2`)
- **AI Chat:** Anthropic Claude API (langsung dari browser — API key di env)

## Commands

| Usage | Command |
|---|---|
| Dev server | `npm run dev` |
| Production build | `npm run build` |
| Preview build | `npm run preview` |

Tidak ada lint/typecheck/test — ini pure SPA tanpa toolchain tambahan.

## Project structure

```
src/
  main.jsx     Entry point + service worker register
  App.jsx      Semua komponen UI + state dalam satu file SPA (5 tab)
  utils.js     Helpers: load/save localStorage, fmtMsg, getDaysLeft
public/
  manifest.json  PWA manifest (display: standalone)
  sw.js          Service worker cache-first
  favicon.svg
```

## Key quirks

- **Custom subjects** — daftar mata kuliah bisa diatur lewat tombol "Atur Matkul" di dashboard, tersimpan di localStorage. Default 11 matkul.
- **AI Chat** — butuh `VITE_ANTHROPIC_API_KEY` di `.env`. Copy dari `.env.example`. Tanpa key, chat akan nampilin pesan error bantuan.
- **No API proxy** — fetch langsung dari browser ke api.anthropic.com. Pastikan CORS gak diblokir (Claude API allows browser requests).
- **PWA** — pas build, file `dist/` siap di-deploy ke static host (Netlify, Vercel, dll). Begitu dibuka di Chrome Android, otomatis bisa "Add to Home Screen".
- **No router** — pake state `view` untuk navigasi 5 tab: dashboard, tasks, pomodoro, stats, chat.
- **No CSS framework** — semua styling inline di objek `S`.
- **Lockfile** — `node_modules/` dan `dist/` di-gitignore.

## Workspace

Project ini ada di dalam [Laragon web root](../AGENTS.md). Untuk local dev, akses `http://AI Agent.test/` (Laragon auto-vhost).
