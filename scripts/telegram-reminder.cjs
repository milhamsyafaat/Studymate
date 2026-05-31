const https = require("https");

const TOKEN = process.env.TG_BOT_TOKEN;
const CHAT_ID = process.env.TG_CHAT_ID;

if (!TOKEN || !CHAT_ID) {
  console.error("Missing TG_BOT_TOKEN or TG_CHAT_ID");
  process.exit(1);
}

const today = new Date().toLocaleDateString("id-ID", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

const msg = `☀️ *Selamat pagi!* — ${today}

Jangan lupa cek tugas hari ini di StudyMate:
https://milhamsyafaat.github.io/Studymate/

⚡ Gas belajar!`;

const data = JSON.stringify({
  chat_id: CHAT_ID,
  text: msg,
  parse_mode: "Markdown",
});

const req = https.request(
  `https://api.telegram.org/bot${TOKEN}/sendMessage`,
  { method: "POST", headers: { "Content-Type": "application/json", "Content-Length": data.length } },
  (res) => {
    let body = "";
    res.on("data", (c) => (body += c));
    res.on("end", () => {
      const ok = JSON.parse(body).ok;
      console.log(ok ? "✅ Reminder sent" : "❌ Failed: " + body);
      process.exit(ok ? 0 : 1);
    });
  }
);
req.on("error", (e) => { console.error(e); process.exit(1); });
req.write(data);
req.end();
