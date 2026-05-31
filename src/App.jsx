import { useState, useEffect, useRef } from "react";
import { getDaysLeft, load, save, fmt2 } from "./utils.js";

const TASKS_KEY = "sm_tasks_v2";
const STATS_KEY = "sm_stats_v2";
const POMO_KEY = "sm_pomo_v2";
const SUBJECTS_KEY = "sm_subjects_v2";

const DEFAULT_SUBJECTS = [
  "Matematika", "Fisika", "Kimia", "Pemrograman", "Basis Data",
  "Jaringan", "Statistika", "Bahasa Inggris", "Algoritma", "Kalkulus", "Lainnya",
];

const PRIORITIES = ["Tinggi", "Sedang", "Rendah"];

const PBadge = ({ p }) => {
  const c = { Tinggi: "#ff5a5a", Sedang: "#ffb347", Rendah: "#6ddb8e" }[p];
  return (
    <span
      style={{
        background: c + "20",
        color: c,
        border: `1px solid ${c}40`,
        borderRadius: 3,
        padding: "1px 7px",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
      }}
    >
      {p}
    </span>
  );
};

const DBadge = ({ deadline }) => {
  const d = getDaysLeft(deadline);
  const [c, lbl] =
    d < 0
      ? ["#a090b8", "Terlambat"]
      : d === 0
        ? ["#ff5a5a", "Hari ini!"]
        : d <= 2
          ? ["#ff5a5a", `${d}h lagi`]
          : d <= 5
            ? ["#ffb347", `${d}h lagi`]
            : ["#6ddb8e", `${d}h lagi`];
  return (
    <span style={{ color: c, fontSize: 11, fontWeight: 600 }}>
      ⏰ {lbl}
    </span>
  );
};

export default function App() {
  const [tasks, setTasks] = useState(() => load(TASKS_KEY, []));
  const [stats, setStats] = useState(() =>
    load(STATS_KEY, { pomoTotal: 0, tasksDone: 0 })
  );
  const [subjects, setSubjects] = useState(() =>
    load(SUBJECTS_KEY, DEFAULT_SUBJECTS)
  );
  const [view, setView] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("aktif");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    title: "",
    subject: "Lainnya",
    deadline: "",
    priority: "Sedang",
    notes: "",
    subtasks: [],
  });
  const [newSub, setNewSub] = useState("");
  const [showManageSubjects, setShowManageSubjects] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");

  const [durasi, setDurasi] = useState(30);
  const [pomoSec, setPomoSec] = useState(30 * 60);
  const [pomoRun, setPomoRun] = useState(false);
  const [pomoCount, setPomoCount] = useState(() => load(POMO_KEY, 0));
  const [now, setNow] = useState(new Date());
  const timerRef = useRef(null);
  const formRef = useRef(null);
  const importRef = useRef(null);

  useEffect(() => { if (showForm) formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }, [showForm]);

  useEffect(() => save(TASKS_KEY, tasks), [tasks]);
  useEffect(() => save(STATS_KEY, stats), [stats]);
  useEffect(() => save(POMO_KEY, pomoCount), [pomoCount]);
  useEffect(() => save(SUBJECTS_KEY, subjects), [subjects]);

  useEffect(() => {
    if (!pomoRun) setPomoSec(durasi * 60);
  }, [durasi, pomoRun]);

  useEffect(() => {
    if (pomoRun) {
      timerRef.current = setInterval(() => {
        setPomoSec((s) => {
          if (s <= 1) {
            clearInterval(timerRef.current);
            setPomoRun(false);
            setPomoCount((c) => c + 1);
            setStats((st) => ({ ...st, pomoTotal: st.pomoTotal + 1 }));
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("StudyMate", { body: "Sesi fokus selesai! 🎉", icon: "./icon-192.png" });
            }
            try { new AudioContext().close(); } catch {}
            try {
              const ctx = new AudioContext();
              const o = ctx.createOscillator();
              o.type = "sine";
              o.frequency.value = 880;
              o.connect(ctx.destination);
              o.start();
              o.stop(ctx.currentTime + 0.5);
            } catch {}
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [pomoRun]);

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const pending = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);
  const urgent = pending.filter(
    (t) => getDaysLeft(t.deadline) <= 3 && getDaysLeft(t.deadline) >= 0
  );
  const overdue = pending.filter((t) => getDaysLeft(t.deadline) < 0);

  const filtered = tasks
    .filter((t) => {
      const ms = search.toLowerCase();
      const matchSearch =
        !ms ||
        t.title.toLowerCase().includes(ms) ||
        t.subject.toLowerCase().includes(ms);
      const matchFilter =
        filter === "semua"
          ? true
          : filter === "aktif"
            ? !t.done
            : filter === "mingguini"
              ? !t.done && getDaysLeft(t.deadline) >= 0 && getDaysLeft(t.deadline) <= 7
              : filter === "mendesak"
                ? !t.done &&
                  getDaysLeft(t.deadline) <= 3 &&
                  getDaysLeft(t.deadline) >= 0
                : filter === "terlambat"
                  ? !t.done && getDaysLeft(t.deadline) < 0
                  : filter === "selesai"
                    ? t.done
                    : true;
      return matchSearch && matchFilter;
    })
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  const saveTask = () => {
    if (!form.title.trim() || !form.deadline) return;
    if (editId) {
      setTasks((t) => t.map((x) => (x.id === editId ? { ...x, ...form } : x)));
      setEditId(null);
    } else {
      setTasks((t) => [
        ...t,
        {
          ...form,
          id: Date.now(),
          done: false,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
    setForm({
      title: "",
      subject: "Lainnya",
      deadline: "",
      priority: "Sedang",
      notes: "",
      subtasks: [],
    });
    setNewSub("");
    setShowForm(false);
  };

  const toggleTask = (id) => {
    setTasks((t) =>
      t.map((x) => {
        if (x.id !== id) return x;
        const nowDone = !x.done;
        if (nowDone)
          setStats((s) => ({ ...s, tasksDone: s.tasksDone + 1 }));
        return { ...x, done: nowDone };
      })
    );
  };

  const toggleSub = (taskId, subIdx) => {
    setTasks((t) =>
      t.map((x) => {
        if (x.id !== taskId) return x;
        const subs = x.subtasks.map((s, i) =>
          i === subIdx ? { ...s, done: !s.done } : s
        );
        return { ...x, subtasks: subs };
      })
    );
  };

  const deleteTask = (id) => setTasks((t) => t.filter((x) => x.id !== id));

  const editTask = (task) => {
    setForm({
      title: task.title,
      subject: task.subject,
      deadline: task.deadline,
      priority: task.priority,
      notes: task.notes || "",
      subtasks: task.subtasks || [],
    });
    setEditId(task.id);
    setShowForm(true);
    setView("tasks");
  };

  const addSubtask = () => {
    if (!newSub.trim()) return;
    setForm((f) => ({
      ...f,
      subtasks: [...f.subtasks, { text: newSub.trim(), done: false }],
    }));
    setNewSub("");
  };

  const removeSubtask = (i) =>
    setForm((f) => ({
      ...f,
      subtasks: f.subtasks.filter((_, idx) => idx !== i),
    }));

  const addSubject = () => {
    const name = newSubjectName.trim();
    if (!name || subjects.includes(name)) return;
    setSubjects((s) => [...s, name]);
    setNewSubjectName("");
  };

  const removeSubject = (name) => {
    if (subjects.length <= 1) return;
    setSubjects((s) => s.filter((x) => x !== name));
    if (form.subject === name) setForm((f) => ({ ...f, subject: subjects[0] }));
  };

  const exportTasks = () => {
    const pendingTasks = tasks.filter((t) => !t.done).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    if (pendingTasks.length === 0) { alert("Gak ada tugas pending buat di-share ✅"); return; }
    const lines = pendingTasks.map((t) => {
      const d = getDaysLeft(t.deadline);
      const lbl = d < 0 ? "🔴 Terlambat" : d === 0 ? "⚠️ Hari ini!" : `📅 ${d}h lagi`;
      const subs = (t.subtasks || []).filter((s) => !s.done).map((s) => `  · ${s.text}`).join("\n");
      return `${t.title} (${t.subject}) — ${lbl}${subs ? "\n" + subs : ""}`;
    });
    const text = `📋 *TUGAS SAYA*\n${lines.join("\n\n")}`;
    navigator.clipboard?.writeText(text).then(() => alert("Tugas udah di-copy! Tinggal paste ke chat ✅")).catch(() => {});
  };

  const importTasks = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.tasks) setTasks(data.tasks);
        if (data.stats) setStats(data.stats);
        if (data.subjects) setSubjects(data.subjects);
        if (typeof data.pomoCount === "number") setPomoCount(data.pomoCount);
        alert("Data berhasil diimport ✅");
      } catch {
        alert("File tidak valid ❌");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const pomoProgress = 1 - pomoSec / (durasi * 60);
  const cx = 54, cy = 54, r = 46;
  const circ = 2 * Math.PI * r;
  const dash = circ * pomoProgress;

  const subjectStats = subjects
    .map((s) => ({
      name: s,
      total: tasks.filter((t) => t.subject === s).length,
      done: tasks.filter((t) => t.subject === s && t.done).length,
    }))
    .filter((s) => s.total > 0);

  const S = {
    app: {
      minHeight: "100vh",
      background: "#0d0d1e",
      color: "#ddd6f3",
      fontFamily: "'IBM Plex Mono',monospace",
      display: "flex",
      flexDirection: "column",
      maxWidth: 480,
      margin: "0 auto",
    },
    hdr: {
      padding: "14px 20px",
      borderBottom: "1px solid #2a2a40",
      background: "#12122a",
      display: "flex",
      alignItems: "center",
      gap: 10,
      position: "sticky",
      top: 0,
      zIndex: 100,
    },
    nav: {
      display: "flex",
      borderBottom: "1px solid #2a2a40",
      background: "#12122a",
      position: "sticky",
      top: 55,
      zIndex: 99,
    },
    nb: (a) => ({
      flex: 1,
      padding: "10px 4px",
      background: "none",
      border: "none",
      borderBottom: `2px solid ${a ? "#a78bfa" : "transparent"}`,
      color: a ? "#a78bfa" : "#6a5a88",
      cursor: "pointer",
      fontSize: 11,
      fontFamily: "'IBM Plex Mono',monospace",
      fontWeight: 700,
      letterSpacing: "0.06em",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 1,
    }),
    main: { flex: 1, overflowY: "auto", padding: "16px 14px", paddingBottom: 80 },
    card: {
      background: "#16162a",
      border: "1px solid #2a2a40",
      borderRadius: 10,
      padding: "14px",
      marginBottom: 10,
    },
    lbl: {
      fontSize: 10,
      color: "#a898c8",
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      marginBottom: 4,
      fontWeight: 700,
    },
    inp: {
      background: "#0d0d1e",
      border: "1px solid #2a2a40",
      borderRadius: 6,
      color: "#ddd6f3",
      padding: "9px 11px",
      fontSize: 13,
      fontFamily: "'IBM Plex Mono',monospace",
      width: "100%",
      outline: "none",
      boxSizing: "border-box",
    },
    sel: {
      background: "#0d0d1e",
      border: "1px solid #2a2a40",
      borderRadius: 6,
      color: "#ddd6f3",
      padding: "9px 11px",
      fontSize: 13,
      fontFamily: "'IBM Plex Mono',monospace",
      width: "100%",
      outline: "none",
    },
    btn: (c = "#a78bfa", sz = 13) => ({
      background: c + "18",
      border: `1px solid ${c}40`,
      color: c,
      borderRadius: 6,
      padding: "8px 13px",
      cursor: "pointer",
      fontSize: sz,
      fontFamily: "'IBM Plex Mono',monospace",
      fontWeight: 600,
    }),
    big: { fontSize: 28, fontWeight: 800, lineHeight: 1.1 },
  };

  const TABS = [
    { id: "dashboard", icon: "⬡", label: "Home" },
    { id: "tasks", icon: "✦", label: "Tugas" },
    { id: "pomodoro", icon: "⚡", label: "Fokus" },
    { id: "stats", icon: "▦", label: "Statistik" },
  ];

  return (
    <div style={S.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700;800&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        body { background:#0d0d1e; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:#0d0d1e; }
        ::-webkit-scrollbar-thumb { background:#2a2a40; border-radius:2px; }
        input[type=date]::-webkit-calendar-picker-indicator { filter:invert(0.4); }
        @keyframes blink { 0%,80%,100%{transform:scale(1);opacity:.5} 40%{transform:scale(1.3);opacity:1} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .msg-in { animation: fadeIn .25s ease; }
        .task-card:hover { border-color:#3a3a55 !important; }
        button:hover { filter:brightness(1.15); }
      `}</style>

      <div style={S.hdr}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#a78bfa", letterSpacing: "-0.02em" }}>
            ◈ STUDYMATE
          </div>
          <div style={{ fontSize: 9, color: "#6a5a88", letterSpacing: "0.12em" }}>
            TASK TRACKER
          </div>
        </div>
        {(urgent.length > 0 || overdue.length > 0) && (
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            {urgent.length > 0 && (
              <div
                style={{
                  background: "#ff5a5a18",
                  border: "1px solid #ff5a5a40",
                  borderRadius: 5,
                  padding: "4px 10px",
                  fontSize: 10,
                  color: "#ff5a5a",
                  fontWeight: 700,
                }}
              >
                ⚠ {urgent.length} MENDESAK
              </div>
            )}
            {overdue.length > 0 && (
              <div
                style={{
                  background: "#a090b818",
                  border: "1px solid #a090b840",
                  borderRadius: 5,
                  padding: "4px 10px",
                  fontSize: 10,
                  color: "#a090b8",
                  fontWeight: 700,
                }}
              >
                ✕ {overdue.length} TELAT
              </div>
            )}
          </div>
        )}
      </div>

      <div style={S.nav}>
        {TABS.map((t) => (
          <button
            key={t.id}
            style={S.nb(view === t.id)}
            onClick={() => setView(t.id)}
          >
            <span style={{ fontSize: 14 }}>{t.icon}</span>
            <span style={{ fontSize: 9 }}>{t.label}</span>
          </button>
        ))}
      </div>

      <div style={S.main}>
        {view === "dashboard" && (
          <div>
            <div
              style={{
                fontSize: 10,
                color: "#6a5a88",
                letterSpacing: "0.14em",
                marginBottom: 14,
              }}
            >
              {new Date()
                .toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
                .toUpperCase()}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 8,
                marginBottom: 14,
              }}
            >
              {[
                { label: "Pending", val: pending.length, c: "#ff5a5a" },
                { label: "Selesai", val: done.length, c: "#6ddb8e" },
                { label: "Sesi Fokus", val: stats.pomoTotal, c: "#ff8c42" },
              ].map((x) => (
                <div
                  key={x.label}
                  style={{
                    ...S.card,
                    padding: "12px 10px",
                    borderColor: x.c + "30",
                    textAlign: "center",
                  }}
                >
                  <div style={{ ...S.big, color: x.c, fontSize: 26 }}>
                    {x.val}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      color: "#a898c8",
                      letterSpacing: "0.1em",
                      marginTop: 2,
                      textTransform: "uppercase",
                    }}
                  >
                    {x.label}
                  </div>
                </div>
              ))}
            </div>
            {overdue.length > 0 && (
              <div
                style={{ ...S.card, borderColor: "#a090b830", marginBottom: 14 }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: "#a090b8",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    marginBottom: 10,
                  }}
                >
                  ✕ TERLAMBAT — SEGERA SELESAIKAN
                </div>
                {overdue.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 0",
                      borderBottom: "1px solid #2a2a40",
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#a090b8" }}>
                      {t.title}
                    </div>
                    <div style={{ fontSize: 11, color: "#c8c0e0" }}>
                      {t.subject}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {urgent.length > 0 && (
              <div
                style={{
                  ...S.card,
                  borderColor: "#ff5a5a30",
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: "#ff5a5a",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    marginBottom: 10,
                  }}
                >
                  ⚠ DEADLINE MENDESAK (≤3 HARI)
                </div>
                {urgent.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 0",
                      borderBottom: "1px solid #2a2a40",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          marginBottom: 3,
                        }}
                      >
                        {t.title}
                      </div>
                      <div style={{ fontSize: 11, color: "#c8c0e0" }}>
                        {t.subject}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: 4,
                      }}
                    >
                      <DBadge deadline={t.deadline} />
                      <PBadge p={t.priority} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={S.card}>
              <div
                style={{
                  fontSize: 10,
                  color: "#a898c8",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  marginBottom: 12,
                }}
              >
                📋 TUGAS AKTIF TERDEKAT
              </div>
              {pending.length === 0 ? (
                <div
                  style={{
                    color: "#8a7fa0",
                    fontSize: 13,
                    textAlign: "center",
                    padding: "20px 0",
                  }}
                >
                  Semua beres! 🎉
                </div>
              ) : (
                pending
                  .sort(
                    (a, b) => new Date(a.deadline) - new Date(b.deadline)
                  )
                  .slice(0, 5)
                  .map((t) => (
                    <div
                      key={t.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "9px 0",
                        borderBottom: "1px solid #2a2a40",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            marginBottom: 3,
                          }}
                        >
                          {t.title}
                        </div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <span style={{ fontSize: 10, color: "#c8c0e0" }}>
                            {t.subject}
                          </span>
                          <PBadge p={t.priority} />
                        </div>
                      </div>
                      <DBadge deadline={t.deadline} />
                    </div>
                  ))
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
              <button
                style={{ ...S.btn("#a78bfa"), textAlign: "left" }}
                onClick={() => {
                  setView("tasks");
                  setShowForm(true);
                }}
              >
                ＋ Tambah Tugas
              </button>
              <button
                style={{ ...S.btn("#ff8c42"), textAlign: "left" }}
                onClick={() => setView("pomodoro")}
              >
                ⚡ Mode Fokus
              </button>
              <button
                style={{ ...S.btn("#6ddb8e"), textAlign: "left" }}
                onClick={() => setView("stats")}
              >
                ▦ Lihat Statistik
              </button>
              <button
                style={{ ...S.btn("#a78bfa"), textAlign: "left" }}
                onClick={() => setShowManageSubjects(true)}
              >
                ⚙ Atur Matkul
              </button>
            </div>
          </div>
        )}
        {view === "tasks" && (
          <div>
            {showForm && (
              <div
                ref={formRef}
                style={{
                  ...S.card,
                  borderColor: "#a78bfa30",
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: "#a78bfa",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    marginBottom: 14,
                  }}
                >
                  {editId ? "✎ EDIT TUGAS" : "＋ TUGAS BARU"}
                </div>

                <div style={{ marginBottom: 10 }}>
                  <div style={S.lbl}>Nama Tugas *</div>
                  <input
                    style={S.inp}
                    placeholder="Misal: UAS Kalkulus Bab Integral"
                    value={form.title}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, title: e.target.value }))
                    }
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  <div>
                    <div style={S.lbl}>Mata Kuliah</div>
                    <select
                      style={S.sel}
                      value={form.subject}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "__add__") {
                          setShowManageSubjects(true);
                        } else {
                          setForm((f) => ({ ...f, subject: v }));
                        }
                      }}
                    >
                      {subjects.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                      <option value="__add__">➕ Tambah Baru...</option>
                    </select>
                  </div>
                  <div>
                    <div style={S.lbl}>Prioritas</div>
                    <select
                      style={S.sel}
                      value={form.priority}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, priority: e.target.value }))
                      }
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <div style={S.lbl}>Deadline *</div>
                  <input
                    type="date"
                    style={S.inp}
                    value={form.deadline}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, deadline: e.target.value }))
                    }
                  />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={S.lbl}>Catatan</div>
                  <input
                    style={S.inp}
                    placeholder="Detail tugas, referensi, dll..."
                    value={form.notes}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, notes: e.target.value }))
                    }
                  />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={S.lbl}>Sub-Tugas / Checklist</div>
                  {form.subtasks.map((s, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 5,
                      }}
                    >
                      <span style={{ fontSize: 12, color: "#c8c0e0", flex: 1 }}>
                        • {s.text}
                      </span>
                      <button
                        onClick={() => removeSubtask(i)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#a898c8",
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      style={{ ...S.inp, flex: 1 }}
                      placeholder="Tambah sub-tugas..."
                      value={newSub}
                      onChange={(e) => setNewSub(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addSubtask()}
                    />
                    <button
                      style={{ ...S.btn("#a78bfa"), flexShrink: 0 }}
                      onClick={addSubtask}
                    >
                      ＋
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    style={{ ...S.btn("#a78bfa"), flex: 1 }}
                    onClick={saveTask}
                  >
                    {editId ? "Simpan Perubahan" : "Simpan Tugas"}
                  </button>
                  <button
                    style={{ ...S.btn("#6a5a88") }}
                    onClick={() => {
                      setShowForm(false);
                      setEditId(null);
                      setForm({
                        title: "",
                        subject: "Lainnya",
                        deadline: "",
                        priority: "Sedang",
                        notes: "",
                        subtasks: [],
                      });
                      setNewSub("");
                    }}
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            <div style={{ marginBottom: 10 }}>
              <input
                style={{ ...S.inp, marginBottom: 8 }}
                placeholder={"🔍 Cari tugas..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  overflowX: "auto",
                  paddingBottom: 4,
                }}
              >
                {["aktif", "mingguini", "mendesak", "terlambat", "selesai", "semua"].map(
                  (f) => (
                    <button
                      key={f}
                      style={{
                        ...S.btn(filter === f ? "#a78bfa" : "#6a5a88", 10),
                        flexShrink: 0,
                        background:
                          filter === f ? "#a78bfa20" : "transparent",
                        padding: "5px 10px",
                      }}
                      onClick={() => setFilter(f)}
                    >
                      {f.toUpperCase()}
                    </button>
                  )
                )}
                {!showForm && (
                  <button
                    style={{
                      ...S.btn("#a78bfa", 10),
                      marginLeft: "auto",
                      flexShrink: 0,
                      padding: "5px 10px",
                    }}
                    onClick={() => setShowForm(true)}
                  >
                    ＋ BARU
                  </button>
                )}
              </div>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                <button
                  style={{ ...S.btn("#6a5a88", 10), flex: 1, padding: "5px 10px", fontSize: 10 }}
                  onClick={exportTasks}
                >
                  📋 Share Tugas
                </button>
                <button
                  style={{ ...S.btn("#6a5a88", 10), flex: 1, padding: "5px 10px", fontSize: 10 }}
                  onClick={() => {
                    const data = { tasks, stats, pomoCount, subjects, exportedAt: new Date().toISOString() };
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `studymate-backup-${new Date().toISOString().slice(0, 10)}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  💾 Backup
                </button>
                <button
                  style={{ ...S.btn("#6a5a88", 10), flex: 1, padding: "5px 10px", fontSize: 10 }}
                  onClick={() => importRef.current?.click()}
                >
                  📂 Import
                </button>
                <input
                  ref={importRef}
                  type="file"
                  accept=".json"
                  style={{ display: "none" }}
                  onChange={importTasks}
                />
              </div>
            </div>
            {filtered.length === 0 ? (
              <div
                style={{
                  ...S.card,
                  textAlign: "center",
                  color: "#8a7fa0",
                  padding: "30px 0",
                }}
              >
                <div style={{ fontSize: 20 }}>✦</div>
                <div style={{ fontSize: 12, marginTop: 8 }}>
                  Tidak ada tugas
                </div>
              </div>
            ) : (
              filtered.map((t) => {
                const subsTotal = (t.subtasks || []).length;
                const subsDone = (t.subtasks || []).filter((s) => s.done).length;
                const progPct = subsTotal > 0 ? (subsDone / subsTotal) * 100 : 0;
                return (
                  <div
                    key={t.id}
                    className="task-card"
                    style={{
                      ...S.card,
                      borderColor: t.done
                        ? "#2a2a40"
                        : getDaysLeft(t.deadline) < 0
                          ? "#a090b830"
                          : getDaysLeft(t.deadline) <= 2
                            ? "#ff5a5a25"
                            : "#2a2a40",
                      opacity: t.done ? 0.5 : 1,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                      }}
                    >
                      <button
                        onClick={() => toggleTask(t.id)}
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 5,
                          border: `1.5px solid ${t.done ? "#6ddb8e" : "#3a3a55"}`,
                          background: t.done ? "#6ddb8e20" : "transparent",
                          cursor: "pointer",
                          color: "#6ddb8e",
                          fontSize: 12,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      >
                        {t.done && "✓"}
                      </button>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            marginBottom: 5,
                            textDecoration: t.done ? "line-through" : "none",
                            wordBreak: "break-word",
                          }}
                        >
                          {t.title}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 6,
                            marginBottom: subsTotal > 0 ? 8 : 0,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 10,
                              color: "#c8c0e0",
                              background: "#1e1e34",
                              padding: "2px 7px",
                              borderRadius: 3,
                            }}
                          >
                            {t.subject}
                          </span>
                          <PBadge p={t.priority} />
                          {!t.done && <DBadge deadline={t.deadline} />}
                        </div>
                        {t.notes && (
                          <div
                            style={{
                              fontSize: 11,
                              color: "#c8c0e0",
                              marginBottom: subsTotal > 0 ? 8 : 0,
                            }}
                          >
                            {t.notes}
                          </div>
                        )}

                        {subsTotal > 0 && (
                          <div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                marginBottom: 6,
                              }}
                            >
                              <div
                                style={{
                                  flex: 1,
                                  height: 4,
                                  background: "#1e1e34",
                                  borderRadius: 2,
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    width: `${progPct}%`,
                                    height: "100%",
                                    background: "#a78bfa",
                                    borderRadius: 2,
                                  }}
                                />
                              </div>
                              <span style={{ fontSize: 10, color: "#c8c0e0" }}>
                                {subsDone}/{subsTotal}
                              </span>
                            </div>
                            {(t.subtasks || []).map((s, i) => (
                              <div
                                key={i}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 7,
                                  marginBottom: 4,
                                }}
                              >
                                <button
                                  onClick={() => toggleSub(t.id, i)}
                                  style={{
                                    width: 16,
                                    height: 16,
                                    borderRadius: 3,
                                    border: `1.5px solid ${s.done ? "#6ddb8e" : "#3a3a55"}`,
                                    background: s.done
                                      ? "#6ddb8e20"
                                      : "transparent",
                                    cursor: "pointer",
                                    color: "#6ddb8e",
                                    fontSize: 9,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                  }}
                                >
                                  {s.done && "✓"}
                                </button>
                                <span
                                  style={{
                                    fontSize: 11,
                                    color: s.done ? "#a898c8" : "#c8c0e0",
                                    textDecoration: s.done
                                      ? "line-through"
                                      : "none",
                                  }}
                                >
                                  {s.text}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                        <button
                          onClick={() => editTask(t)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#a898c8",
                            cursor: "pointer",
                            fontSize: 13,
                          }}
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => deleteTask(t.id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#a898c8",
                            cursor: "pointer",
                            fontSize: 13,
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
        {view === "pomodoro" && (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 10,
                color: "#a898c8",
                letterSpacing: "0.14em",
                marginBottom: 6,
              }}
            >
              ⚡ MODE FOKUS — GAS BELAJAR!
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: "#a898c8",
                marginBottom: 20,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {fmt2(now.getHours())}:{fmt2(now.getMinutes())}:{fmt2(now.getSeconds())}
            </div>

            <div
              style={{
                ...S.card,
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 16,
              }}
            >
              <span style={{ ...S.lbl, marginBottom: 0 }}>Durasi</span>
              <input
                type="number"
                min={1}
                max={180}
                value={durasi}
                onChange={(e) => {
                  const v = parseInt(e.target.value) || 1;
                  setDurasi(Math.min(Math.max(v, 1), 180));
                }}
                style={{
                  ...S.inp,
                  width: 70,
                  textAlign: "center",
                  fontSize: 16,
                  fontWeight: 700,
                }}
                disabled={pomoRun}
              />
              <span style={{ fontSize: 12, color: "#c8c0e0" }}>menit</span>
            </div>

            <div
              style={{
                position: "relative",
                display: "inline-block",
                marginBottom: 20,
              }}
            >
              <svg width={108} height={108}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke="#2a2a40"
                  strokeWidth={8}
                />
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke="#ff8c42"
                  strokeWidth={8}
                  strokeDasharray={`${dash} ${circ}`}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${cx} ${cy})`}
                  style={{ transition: "stroke-dasharray .5s" }}
                />
              </svg>
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%,-50%)",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: "#ff8c42",
                  }}
                >
                  {fmt2(Math.floor(pomoSec / 60))}:{fmt2(pomoSec % 60)}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    color: "#a898c8",
                    letterSpacing: "0.1em",
                  }}
                >
                  {pomoRun ? "FOKUS!" : "SIAP"}
                </div>
              </div>
            </div>

            <div style={{ fontSize: 12, color: "#c8c0e0", marginBottom: 20 }}>
              Sesi selesai hari ini:{" "}
              <strong style={{ color: "#ff8c42" }}>{pomoCount}</strong>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 10,
                marginBottom: 20,
              }}
            >
              <button
                style={{
                  ...S.btn("#ff8c42", 14),
                  padding: "12px 24px",
                  fontSize: 14,
                }}
                onClick={() => setPomoRun((r) => !r)}
              >
                {pomoRun ? "⏸ Pause" : "▶ Mulai"}
              </button>
              <button
                style={{ ...S.btn("#6a5a88") }}
                onClick={() => {
                  setPomoRun(false);
                  setPomoSec(durasi * 60);
                }}
              >
                ↺
              </button>
            </div>

            <div style={{ ...S.card, textAlign: "left" }}>
              <div
                style={{
                  fontSize: 10,
                  color: "#a898c8",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  marginBottom: 10,
                }}
              >
                💡 TIPS FOKUS
              </div>
              {[
                "Matikan notifikasi HP & laptop selama sesi",
                "Satu sesi, satu tugas — jangan multitasking",
                "Pasang musik instrumental atau white noise",
                "Target kecil: 1 sesi selesaikan 1 soal",
                "Konsisten lebih penting dari durasi",
              ].map((t, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 12,
                    color: "#c8c0e0",
                    marginBottom: 6,
                    paddingLeft: 10,
                    borderLeft: "2px solid #2a2a40",
                  }}
                >
                  {t}
                </div>
              ))}
            </div>
          </div>
        )}
        {view === "stats" && (
          <div>
            <div
              style={{
                fontSize: 10,
                color: "#a898c8",
                letterSpacing: "0.14em",
                marginBottom: 16,
              }}
            >
              RINGKASAN BELAJAR LO
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                marginBottom: 14,
              }}
            >
              {[
                { label: "Total Tugas", val: tasks.length, c: "#a78bfa" },
                { label: "Selesai", val: done.length, c: "#6ddb8e" },
                { label: "Pending", val: pending.length, c: "#ff5a5a" },
                {
                  label: "Sesi Fokus",
                  val: stats.pomoTotal,
                  c: "#ff8c42",
                },
              ].map((x) => (
                <div
                  key={x.label}
                  style={{ ...S.card, borderColor: x.c + "30" }}
                >
                  <div style={{ ...S.big, color: x.c }}>{x.val}</div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "#a898c8",
                      marginTop: 4,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    {x.label}
                  </div>
                </div>
              ))}
            </div>

            {tasks.length > 0 && (
              <div style={{ ...S.card, marginBottom: 14 }}>
                <div
                  style={{
                    fontSize: 10,
                    color: "#a898c8",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    marginBottom: 10,
                  }}
                >
                  COMPLETION RATE
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      flex: 1,
                      height: 8,
                      background: "#1e1e34",
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${(done.length / tasks.length) * 100}%`,
                        height: "100%",
                        background: "linear-gradient(90deg,#a78bfa,#6ddb8e)",
                        borderRadius: 4,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: "#a78bfa",
                    }}
                  >
                    {Math.round((done.length / tasks.length) * 100)}%
                  </span>
                </div>
              </div>
            )}

            {subjectStats.length > 0 && (
              <div style={S.card}>
                <div
                  style={{
                    fontSize: 10,
                    color: "#a898c8",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    marginBottom: 12,
                  }}
                >
                  PROGRESS PER MATKUL
                </div>
                {subjectStats.map((s) => (
                  <div key={s.name} style={{ marginBottom: 12 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 4,
                      }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 600 }}>
                        {s.name}
                      </span>
                      <span style={{ fontSize: 11, color: "#c8c0e0" }}>
                        {s.done}/{s.total}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 5,
                        background: "#1e1e34",
                        borderRadius: 3,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${s.total > 0 ? (s.done / s.total) * 100 : 0}%`,
                          height: "100%",
                          background: "#a78bfa",
                          borderRadius: 3,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tasks.length === 0 && (
              <div
                style={{
                  ...S.card,
                  textAlign: "center",
                  color: "#8a7fa0",
                  padding: "30px 0",
                }}
              >
                <div style={{ fontSize: 20 }}>▦</div>
                <div style={{ fontSize: 12, marginTop: 8 }}>
                  Belum ada data. Tambah tugas dulu!
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Manage Subjects Modal */}
      {showManageSubjects && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: 20,
          }}
          onClick={() => setShowManageSubjects(false)}
        >
          <div
            style={{
              ...S.card,
              width: "100%",
              maxWidth: 400,
              borderColor: "#a78bfa40",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                fontSize: 10,
                color: "#a78bfa",
                fontWeight: 700,
                letterSpacing: "0.12em",
                marginBottom: 14,
              }}
            >
              ⚙ ATUR MATA KULIAH
            </div>

            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              <input
                style={{ ...S.inp, flex: 1 }}
                placeholder="Nama matkul baru..."
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSubject()}
              />
              <button
                style={{ ...S.btn("#6ddb8e"), flexShrink: 0 }}
                onClick={addSubject}
              >
                ＋
              </button>
            </div>

            <div style={{ maxHeight: 300, overflowY: "auto" }}>
              {subjects.map((s) => (
                <div
                  key={s}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 0",
                    borderBottom: "1px solid #2a2a40",
                  }}
                >
                  <span style={{ fontSize: 13 }}>{s}</span>
                  <button
                    onClick={() => removeSubject(s)}
                    style={{
                      background: "none",
                      border: "none",
                      color: subjects.length <= 1 ? "#2a2a40" : "#ff5a5a",
                      cursor: subjects.length <= 1 ? "not-allowed" : "pointer",
                      fontSize: 13,
                    }}
                    disabled={subjects.length <= 1}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button
              style={{ ...S.btn("#6a5a88"), width: "100%", marginTop: 12 }}
              onClick={() => setShowManageSubjects(false)}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
