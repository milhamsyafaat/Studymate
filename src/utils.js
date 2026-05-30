export const getDaysLeft = (d) =>
  Math.ceil((new Date(d) - new Date()) / 86400000);

export const load = (k, fb) => {
  try {
    return JSON.parse(localStorage.getItem(k)) ?? fb;
  } catch {
    return fb;
  }
};

export const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

export const fmt2 = (n) => String(n).padStart(2, "0");

export const fmtMsg = (txt) =>
  txt
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(
      /`([^`]+)`/g,
      `<code style="background:#161625;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:12px">$1</code>`
    )
    .replace(/\n/g, "<br/>");
