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


