/* ---------------------------------------------------------------------------
 * Meridian Clinic — accessibility, multilingual, voice/video and admin layer.
 * Patches the original App object instead of replacing it, so every existing
 * screen keeps working.
 *
 * PROTOTYPE NOTE: all data and sessions live in localStorage. That is fine for
 * a demo but is NOT production security — see admin-auth.js for what a real
 * deployment needs (server auth, hashing, HttpOnly cookies, RLS, signalling).
 * ------------------------------------------------------------------------- */
/* eslint-disable */
import { App, Store, Session, uid, esc, icon, todayStr, addDays, dayName, fmtDate, fmtDateShort, initials, avatarColor, money } from "./meridian.js";
import { I18n, LANGS, t } from "./i18n.js";
import { Speech, Tts, Recorder, fmtClock } from "./voice.js";
import { suggestSpecialization, isEmergencyText, hospitalsFor, NEARBY_HOSPITALS, SPEC_ICONS } from "./triage.js";
import { verifyAdminCredentials, adminEmailHint, syncSeedAdminUser } from "./admin-auth.js";

/* ----------------------------------------------------------- validation -- */
const EMAIL_RE = /^[A-Za-z0-9](?:[A-Za-z0-9._%+-]*[A-Za-z0-9])?@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;

export function normalizeEmail(v) {
  return String(v == null ? "" : v).trim().toLowerCase();
}
export function isValidEmail(v) {
  const e = normalizeEmail(v);
  if (!e || /\s/.test(e)) return false;
  if (e.includes("..")) return false;
  if (e.split("@").length !== 2) return false;
  return EMAIL_RE.test(e);
}

/* --------------------------------------------------------------- audit --- */
const Audit = {
  log(action, target, status) {
    const db = Store.data;
    if (!db.auditLog) db.auditLog = [];
    const u = App.currentUser();
    db.auditLog.unshift({
      id: uid("LOG"),
      ts: new Date().toISOString(),
      userId: u ? u.id : "—",
      user: u ? u.name : "Anonymous",
      role: u ? u.role : "guest",
      action,
      target: target || "—",
      status: status || "Success",
    });
    db.auditLog = db.auditLog.slice(0, 400);
    Store.save();
  },
};
App.audit = Audit;

/* ------------------------------------------------------------ migration -- */
const SESSION_MINUTES = 30;

function migrate() {
  const db = Store.data;
  if (!db) return;
  syncSeedAdminUser(db.users);
  db.doctors.forEach((d) => {
    if (!d.status) d.status = "Available"; // Available | Busy | On Leave | Offline
    if (!d.leaveDates) d.leaveDates = [];
    if (!d.consultationModes) d.consultationModes = ["In person", "Voice call", "Video call"];
    if (!d.maxPerDay) d.maxPerDay = 12;
    if (!d.breakStart) d.breakStart = "";
    if (!d.breakEnd) d.breakEnd = "";
  });
  db.appointments.forEach((a) => {
    if (!a.priority) a.priority = "Normal";
    if (!a.consultationType) a.consultationType = "In person";
    if (!("originalDoctorId" in a)) a.originalDoctorId = a.doctorId;
    if (!("reassignedDoctorId" in a)) a.reassignedDoctorId = null;
    if (!("reassignmentReason" in a)) a.reassignmentReason = null;
    if (!("reassignmentStatus" in a)) a.reassignmentStatus = null;
  });
  db.patients.forEach((p) => {
    if (!p.preferredLanguage) p.preferredLanguage = I18n.get() || "en";
  });
  if (!db.communication) db.communication = { voiceMessages: [], calls: [], videoConsultations: [] };
  if (!db.auditLog) db.auditLog = [];
  if (!db.hospital)
    db.hospital = {
      name: "Meridian Clinic",
      address: "Plot 44, Jubilee Hills, Hyderabad 500033",
      phone: "040 4455 0000",
      emergencyNumber: "108",
      emergencyDesk: "040 4455 0911",
    };
  Store.save();
}
App.migrate = migrate;

/* ------------------------------------------------------- session helpers - */
function touchSession() {
  const s = Session.get();
  if (!s) return;
  s.expires = Date.now() + SESSION_MINUTES * 60 * 1000;
  Session.set(s);
}
function sessionExpired() {
  const s = Session.get();
  return !!(s && s.expires && Date.now() > s.expires);
}

/* ---------------------------------------------------------- availability - */
function toMin(hhmm) {
  const [h, m] = String(hhmm).split(":").map(Number);
  return h * 60 + (m || 0);
}
function slotsFor(doctor, date) {
  const out = [];
  if (!doctor.days.includes(dayName(date))) return out;
  let mins = toMin(doctor.start);
  const end = toMin(doctor.end);
  const bs = doctor.breakStart ? toMin(doctor.breakStart) : null;
  const be = doctor.breakEnd ? toMin(doctor.breakEnd) : null;
  while (mins + doctor.slot <= end) {
    if (!(bs !== null && be !== null && mins >= bs && mins < be)) {
      out.push(String(Math.floor(mins / 60)).padStart(2, "0") + ":" + String(mins % 60).padStart(2, "0"));
    }
    mins += doctor.slot;
  }
  return out;
}
function bookedTimes(doctorId, date) {
  return Store.data.appointments.filter((a) => a.doctorId === doctorId && a.date === date && a.status !== "Cancelled").map((a) => a.time);
}
/** Returns { ok:true } or { ok:false, reason } */
function checkAvailability(doctor, date, time) {
  if (!doctor) return { ok: false, reason: "Doctor not found." };
  if (doctor.status === "On Leave" || doctor.status === "Offline")
    return { ok: false, reason: doctor.name + " is marked " + doctor.status.toLowerCase() + "." };
  if ((doctor.leaveDates || []).includes(date)) return { ok: false, reason: doctor.name + " is on leave on " + fmtDate(date) + "." };
  if (!doctor.days.includes(dayName(date))) return { ok: false, reason: doctor.name + " does not consult on " + dayName(date) + "." };
  if (!slotsFor(doctor, date).includes(time)) return { ok: false, reason: t("doctorUnavailable") };
  if (bookedTimes(doctor.id, date).includes(time)) return { ok: false, reason: "That slot is already booked." };
  const dayCount = Store.data.appointments.filter((a) => a.doctorId === doctor.id && a.date === date && a.status !== "Cancelled").length;
  if (dayCount >= (doctor.maxPerDay || 99)) return { ok: false, reason: doctor.name + " has reached the daily appointment limit." };
  return { ok: true };
}
/** Other doctors of the same specialization with a free slot on that date. */
function alternatives(spec, date, excludeId, preferredTime) {
  const out = [];
  Store.data.doctors
    .filter((d) => d.specialization === spec && d.id !== excludeId)
    .forEach((d) => {
      const free = slotsFor(d, date).filter((s) => !bookedTimes(d.id, date).includes(s));
      if (!free.length) return;
      free.sort((a, b) => Math.abs(toMin(a) - toMin(preferredTime || "10:00")) - Math.abs(toMin(b) - toMin(preferredTime || "10:00")));
      out.push({ doctor: d, times: free.slice(0, 3) });
    });
  return out;
}
App.checkAvailability = checkAvailability;
App.slotsFor = slotsFor;

/* ============================== VIEWS: language + auth =================== */
App.viewLanguage = function () {
  return `
  <div class="lang-screen">
    <div class="lang-card">
      <div style="font-size:40px;">🏥</div>
      <h1 class="font-display" style="font-size:24px;margin:8px 0 2px;">Meridian Clinic</h1>
      <p style="color:var(--muted);font-size:14px;margin-bottom:22px;">Choose your language · మీ భాషను ఎంచుకోండి · अपनी भाषा चुनें</p>
      ${LANGS.map(
        (l) => `<button class="btn btn-primary big-btn" onclick="App.chooseLanguage('${l.code}')">
          <span style="font-size:20px;">🌐</span><span>${esc(l.native)}</span>
        </button>`,
      ).join("")}
      <p style="color:var(--muted);font-size:12px;margin-top:18px;">Prototype build — demo data only.</p>
    </div>
  </div>`;
};

App.chooseLanguage = function (code) {
  I18n.set(code);
  const u = this.currentUser();
  if (u && u.role === "patient") {
    const p = this.patientById(u.linkedId);
    if (p) {
      p.preferredLanguage = code;
      Store.save();
    }
  }
  this.toast("Language: " + (LANGS.find((l) => l.code === code) || {}).native);
  this.render();
};

App.viewLogin = function () {
  return `
  <div style="min-height:100vh;display:flex;">
    <div class="desktop-only" style="flex:1;background:linear-gradient(160deg,var(--sidebar),#0A3D3A);color:#fff;padding:56px;display:flex;flex-direction:column;justify-content:space-between;">
      <div style="display:flex;align-items:center;gap:10px;"><span style="font-size:28px;">🏥</span><span class="font-display" style="font-weight:700;font-size:19px;">Meridian Clinic</span></div>
      <div style="max-width:420px;">
        <div class="font-display" style="font-size:34px;font-weight:700;line-height:1.25;margin-bottom:16px;">Care, coordinated — in your language, by voice if you prefer.</div>
        <p style="color:#B9D0CB;font-size:14.5px;line-height:1.6;">Bookings, consultations, records and billing for admins, doctors and patients.</p>
      </div>
      <div style="color:#7FA39C;font-size:12px;">Runtime Rabels — Hackathon build</div>
    </div>
    <div style="flex:1;display:flex;align-items:center;justify-content:center;padding:28px;">
      <div style="width:100%;max-width:390px;">
        <div style="display:flex;justify-content:flex-end;margin-bottom:10px;">
          <button class="btn btn-ghost btn-sm" onclick="App.openLanguagePicker()">🌐 ${esc(t("changeLanguage"))}</button>
        </div>
        <div class="mobile-only" style="text-align:center;margin-bottom:18px;"><span style="font-size:30px;">🏥</span><div class="font-display" style="font-weight:700;font-size:18px;">Meridian Clinic</div></div>
        <h1 class="font-display" style="font-size:22px;font-weight:700;margin-bottom:4px;">${esc(t("signIn"))}</h1>
        <p style="color:var(--muted);font-size:13.5px;margin-bottom:20px;">Patients and doctors sign in here.</p>
        <form onsubmit="return App.doLogin(event)" novalidate style="display:flex;flex-direction:column;gap:13px;">
          <div>
            <label class="field-label" for="loginEmail">${esc(t("email"))}</label>
            <input class="input" id="loginEmail" name="email" type="text" autocomplete="email" aria-describedby="loginEmailErr" placeholder="you@example.com">
            <div class="err" id="loginEmailErr" role="alert"></div>
          </div>
          <div>
            <label class="field-label" for="loginPass">${esc(t("password"))}</label>
            <input class="input" id="loginPass" name="password" type="password" autocomplete="current-password" aria-describedby="loginPassErr" placeholder="••••••••">
            <div class="err" id="loginPassErr" role="alert"></div>
          </div>
          <div class="err" id="loginFormErr" role="alert"></div>
          <button class="btn btn-primary" type="submit" style="width:100%;margin-top:4px;">${esc(t("signIn"))}</button>
        </form>
        <div style="display:flex;align-items:center;gap:10px;margin:18px 0;color:var(--muted);font-size:12px;">
          <div style="flex:1;height:1px;background:var(--border);"></div>OR<div style="flex:1;height:1px;background:var(--border);"></div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <button class="btn btn-ghost" style="justify-content:space-between;" onclick="App.quickLogin('doctor')"><span style="display:flex;align-items:center;gap:8px;">${icon("stethoscope", 16)}Continue as Doctor (demo)</span>${icon("chevronR", 15)}</button>
          <button class="btn btn-ghost" style="justify-content:space-between;" onclick="App.quickLogin('patient')"><span style="display:flex;align-items:center;gap:8px;">${icon("heart", 16)}Continue as Patient (demo)</span>${icon("chevronR", 15)}</button>
          <button class="btn btn-ghost" style="justify-content:space-between;" onclick="App.navigate('#/admin-login')"><span style="display:flex;align-items:center;gap:8px;">${icon("settings", 16)}Hospital Administration</span>${icon("chevronR", 15)}</button>
        </div>
        <p style="text-align:center;font-size:13px;color:var(--muted);margin-top:20px;">New patient? <a href="#/register" style="color:var(--primary);font-weight:600;">${esc(t("createAccount"))}</a></p>
      </div>
    </div>
  </div>`;
};

App.openLanguagePicker = function () {
  I18n.clear();
  this.render();
};

App.setFieldError = function (id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg || "";
};

App.doLogin = function (e) {
  e.preventDefault();
  const f = e.target;
  const email = normalizeEmail(f.email.value);
  const pass = f.password.value || "";
  this.setFieldError("loginEmailErr", "");
  this.setFieldError("loginPassErr", "");
  this.setFieldError("loginFormErr", "");

  if (!isValidEmail(email)) {
    this.setFieldError("loginEmailErr", t("invalidEmail"));
    Audit.log("Failed login (invalid email format)", email || "—", "Blocked");
    return false;
  }
  if (!pass.trim()) {
    this.setFieldError("loginPassErr", t("passwordRequired"));
    return false;
  }
  const u = Store.data.users.find((x) => normalizeEmail(x.email) === email && x.password === pass);
  if (!u) {
    this.setFieldError("loginFormErr", t("invalidCredentials"));
    Audit.log("Failed login", email, "Denied");
    return false;
  }
  if (u.role === "admin") {
    // Admins must use the dedicated administration entry point.
    this.setFieldError("loginFormErr", "Administrators must sign in through Hospital Administration.");
    return false;
  }
  Session.set({ userId: u.id, role: u.role, expires: Date.now() + SESSION_MINUTES * 60 * 1000 });
  Audit.log("Login", u.email, "Success");
  location.hash = "#/" + u.role + "/dashboard";
  this.render();
  return false;
};

App.quickLogin = function (role) {
  if (role === "admin") {
    location.hash = "#/admin-login";
    this.render();
    return;
  }
  const u = Store.data.users.find((x) => x.role === role);
  Session.set({ userId: u.id, role: u.role, expires: Date.now() + SESSION_MINUTES * 60 * 1000 });
  Audit.log("Login (demo account)", u.email, "Success");
  location.hash = "#/" + role + "/dashboard";
  this.render();
  this.toast("Signed in as " + u.name);
};

App.viewAdminLogin = function () {
  return `
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:linear-gradient(160deg,var(--sidebar),#0A3D3A);">
    <div class="card" style="width:100%;max-width:400px;padding:28px;">
      <div style="text-align:center;margin-bottom:18px;">
        <div style="font-size:26px;">🔐</div>
        <h1 class="font-display" style="font-size:19px;font-weight:700;margin-top:6px;">Hospital Administration</h1>
        <p style="color:var(--muted);font-size:13px;">Authorised staff only. This access is logged.</p>
      </div>
      <form onsubmit="return App.doAdminLogin(event)" novalidate style="display:flex;flex-direction:column;gap:12px;">
        <div><label class="field-label" for="admEmail">Admin email</label><input class="input" id="admEmail" name="email" type="text" autocomplete="username" placeholder="${esc(adminEmailHint())}"><div class="err" id="admEmailErr" role="alert"></div></div>
        <div><label class="field-label" for="admPass">Admin password</label><input class="input" id="admPass" name="password" type="password" autocomplete="current-password"><div class="err" id="admPassErr" role="alert"></div></div>
        <div><label class="field-label" for="admOtp">Verification code (optional, OTP-ready)</label><input class="input" id="admOtp" name="otp" inputmode="numeric" placeholder="Leave blank in demo"></div>
        <div class="err" id="admFormErr" role="alert"></div>
        <button class="btn btn-primary" type="submit">Sign in securely</button>
      </form>
      <button class="btn btn-ghost btn-sm" style="width:100%;margin-top:12px;" onclick="App.navigate('#/login')">${icon("chevronL", 14)} ${esc(t("back"))}</button>
      <p style="font-size:11.5px;color:var(--muted);margin-top:14px;line-height:1.5;">Prototype authentication runs in the browser. A real deployment must verify credentials on a server with hashed passwords.</p>
    </div>
  </div>`;
};

App.doAdminLogin = function (e) {
  e.preventDefault();
  const f = e.target;
  const email = normalizeEmail(f.email.value);
  const pass = f.password.value || "";
  this.setFieldError("admEmailErr", "");
  this.setFieldError("admPassErr", "");
  this.setFieldError("admFormErr", "");
  if (!isValidEmail(email)) {
    this.setFieldError("admEmailErr", t("invalidEmail"));
    return false;
  }
  if (!pass.trim()) {
    this.setFieldError("admPassErr", t("passwordRequired"));
    return false;
  }
  if (!verifyAdminCredentials(email, pass)) {
    this.setFieldError("admFormErr", t("adminDenied"));
    Audit.log("Failed admin login", email, "Denied");
    return false;
  }
  const u = Store.data.users.find((x) => x.role === "admin");
  Session.set({ userId: u.id, role: "admin", adminAuthed: true, expires: Date.now() + SESSION_MINUTES * 60 * 1000 });
  Audit.log("Admin login", email, "Success");
  location.hash = "#/admin/dashboard";
  this.render();
  return false;
};

App.logout = function () {
  const u = this.currentUser();
  if (u) Audit.log("Logout", u.email, "Success");
  Session.clear();
  Speech.stop();
  Tts.stop();
  this.stopVideo();
  location.hash = "#/login";
  this.render();
};

/* ================================ router ================================= */
const baseRender = App.render;
const baseRenderPatient = App.renderPatient;
const baseRenderAdmin = App.renderAdmin;
const baseRenderDoctor = App.renderDoctor;

App.init = function () {
  Store.load();
  migrate();
  window.addEventListener("hashchange", () => this.render());
  if (!location.hash) location.hash = "#/login";
  this.render();
};

App.render = function () {
  const app = document.getElementById("app");
  if (!app) return;
  if (!I18n.get()) {
    app.innerHTML = this.viewLanguage();
    return;
  }
  const hash = location.hash || "#/login";
  const user = this.currentUser();

  if (sessionExpired()) {
    Session.clear();
    this.toast("Session timed out. Please sign in again.");
    location.hash = "#/login";
    app.innerHTML = this.viewLogin();
    return;
  }
  if (!user) {
    if (hash.startsWith("#/admin-login")) {
      app.innerHTML = this.viewAdminLogin();
      return;
    }
    if (hash.startsWith("#/register")) {
      app.innerHTML = this.viewRegister();
      return;
    }
    app.innerHTML = this.viewLogin();
    return;
  }
  // Admin sessions must carry an authenticated admin flag.
  const s = Session.get();
  if (user.role === "admin" && !(s && s.adminAuthed)) {
    Session.clear();
    Audit.log("Blocked admin access without authentication", hash, "Denied");
    location.hash = "#/admin-login";
    app.innerHTML = this.viewAdminLogin();
    return;
  }
  if (hash.startsWith("#/admin-login")) {
    location.hash = "#/" + user.role + "/dashboard";
    return;
  }
  touchSession();
  this._mount = null;
  baseRender.call(this);
  if (this._mount) {
    const fn = this._mount;
    this._mount = null;
    try {
      fn.call(this);
    } catch (err) {
      console.error(err);
    }
  }
};

App.denied = function () {
  return `<div class="card" style="padding:28px;text-align:center;max-width:460px;margin:40px auto;">
    <div style="font-size:30px;">⛔</div>
    <div class="font-display" style="font-weight:700;font-size:17px;margin-top:6px;">${esc(t("accessDenied"))}</div>
    <p style="color:var(--muted);font-size:13px;margin-top:6px;">This area is restricted by role.</p>
  </div>`;
};

App.renderAdmin = function (parts, user) {
  const s = Session.get();
  if (user.role !== "admin" || !(s && s.adminAuthed)) {
    Audit.log("Unauthorised admin area access attempt", parts.join("/"), "Denied");
    return this.denied();
  }
  const page = parts[1] || "dashboard";
  if (page === "audit") return this.adminAudit();
  if (page === "availability") return this.adminAvailability();
  if (page === "referrals") return this.adminReferrals();
  if (page === "hospital") return this.adminHospital();
  return baseRenderAdmin.call(this, parts, user);
};

App.renderDoctor = function (parts, user) {
  if (user.role !== "doctor") return this.denied();
  const page = parts[1] || "dashboard";
  const doc = this.doctorById(user.linkedId);
  if (page === "video") return this.videoRoom(parts[2] || null, "doctor");
  if (page === "availability") return this.doctorAvailability(doc);
  return baseRenderDoctor.call(this, parts, user);
};

App.renderPatient = function (parts, user) {
  if (user.role !== "patient") return this.denied();
  const page = parts[1] || "dashboard";
  const p = this.patientById(user.linkedId);
  // Patients may only ever read their own linked record.
  if (parts[2] && ["records", "prescriptions", "bills", "profile"].includes(page) && parts[2] !== p.id) {
    Audit.log("Blocked cross-patient record access", parts[2], "Denied");
    return this.denied();
  }
  if (page === "assist") return this.symptomAssistant(p);
  if (page === "voice") return this.voiceAssistant(p);
  if (page === "video") return this.videoRoom(parts[2] || null, "patient");
  if (page === "call") return this.callScreen(parts[2] || null);
  if (page === "emergency") return this.emergencyPage();
  if (page === "referrals") return this.patientReferrals(parts[2] || "Cardiology");
  return baseRenderPatient.call(this, parts, user);
};

/* ------------------------------------------------------------- nav ------- */
App.navItemsFor = function (role) {
  if (role === "admin")
    return [
      ["dashboard", t("dashboard"), "dashboard"],
      ["patients", t("patients"), "patients"],
      ["doctors", t("doctors"), "doctors"],
      ["appointments", t("appointments"), "calendar"],
      ["availability", "Doctor availability", "clock"],
      ["referrals", "Referrals", "pin"],
      ["billing", t("billing"), "billing"],
      ["audit", "Audit log", "file"],
      ["hospital", "Hospital settings", "settings"],
    ];
  if (role === "doctor")
    return [
      ["dashboard", t("dashboard"), "dashboard"],
      ["appointments", t("appointments"), "calendar"],
      ["prescriptions", t("prescriptions"), "rx"],
      ["availability", "My availability", "clock"],
      ["video", t("videoConsult"), "eye"],
    ];
  return [
    ["dashboard", t("dashboard"), "dashboard"],
    ["assist", t("speakProblem"), "heart"],
    ["doctors", t("findDoctor"), "doctors"],
    ["appointments", t("myAppointments"), "calendar"],
    ["voice", t("voiceAssistant"), "phone"],
    ["video", t("videoConsult"), "eye"],
    ["records", t("records"), "records"],
    ["prescriptions", t("medicines"), "rx"],
    ["bills", t("bills"), "billing"],
    ["emergency", t("emergency"), "heart"],
    ["profile", t("profile"), "patients"],
  ];
};

const basePageTitle = App.pageTitle;
App.pageTitle = function (active, role) {
  const map = {
    assist: t("speakProblem"),
    voice: t("voiceAssistant"),
    video: t("videoConsult"),
    call: t("callDoctor"),
    emergency: t("emergency"),
    audit: "Audit log",
    availability: "Doctor availability",
    referrals: t("nearbyHospitals"),
    hospital: "Hospital settings",
  };
  return map[active] || basePageTitle.call(this, active, role);
};

/* ======================= patient: simple dashboard ======================= */
App.patientDashboard = function (p) {
  const db = Store.data;
  const today = todayStr();
  const upcoming = db.appointments
    .filter((a) => a.patientId === p.id && a.date >= today && a.status !== "Cancelled")
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))[0];
  const pendingReassign = db.appointments.filter((a) => a.patientId === p.id && a.reassignmentStatus === "Proposed");
  const d = upcoming ? this.doctorById(upcoming.doctorId) : null;
  const tiles = [
    ["🩺", t("findDoctor"), "#/patient/doctors"],
    ["📅", t("bookAppointment"), "#/patient/assist"],
    ["🎤", t("speakProblem"), "#/patient/assist"],
    ["🗣️", t("voiceAssistant"), "#/patient/voice"],
    ["📞", t("callDoctor"), "#/patient/call"],
    ["🎥", t("videoConsult"), "#/patient/video"],
    ["📋", t("records"), "#/patient/records"],
    ["💊", t("medicines"), "#/patient/prescriptions"],
    ["🚨", t("emergency"), "#/patient/emergency"],
  ];
  return `
  <div class="card" style="padding:20px;margin-bottom:16px;background:linear-gradient(120deg,var(--primary-light),transparent);">
    <div class="font-display" style="font-weight:700;font-size:20px;">${esc(t("welcome"))}, ${esc(p.name.split(" ")[0])}</div>
    <div style="font-size:13.5px;color:var(--muted);margin-top:2px;">${esc(t("chooseLanguageSub"))}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">
      ${LANGS.map((l) => `<button class="btn btn-ghost btn-sm" onclick="App.chooseLanguage('${l.code}')" ${I18n.get() === l.code ? 'style="border-color:var(--primary);color:var(--primary-dark);"' : ""}>${esc(l.native)}</button>`).join("")}
    </div>
  </div>

  ${
    pendingReassign
      .map((a) => {
        const od = this.doctorById(a.originalDoctorId || a.doctorId);
        const nd = this.doctorById(a.reassignedDoctorId);
        return `<div class="card alert-warn" style="padding:16px;margin-bottom:14px;">
        <div style="font-weight:700;">Your original doctor is unavailable.</div>
        <div style="font-size:13.5px;margin-top:4px;">${esc(od ? od.name : "—")} cannot see you on ${fmtDate(a.date)}. Would you like to continue with ${esc(nd ? nd.name : "another")} (${esc(nd ? nd.specialization : "")}) at ${esc(a.reassignProposedTime || a.time)}?</div>
        <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
          <button class="btn btn-primary btn-sm" onclick="App.acceptReassignment('${a.id}')">Accept new doctor</button>
          <button class="btn btn-ghost btn-sm" onclick="App.declineReassignment('${a.id}')">Keep looking</button>
        </div>
      </div>`;
      })
      .join("") || ""
  }

  <div class="card" style="padding:20px;margin-bottom:16px;">
    <div class="font-display" style="font-weight:700;font-size:15px;margin-bottom:10px;">${esc(t("upcoming"))}</div>
    ${
      upcoming && d
        ? `<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
        <div class="avatar" style="background:${avatarColor(d.name)};width:46px;height:46px;font-size:16px;">${initials(d.name)}</div>
        <div style="flex:1;min-width:150px;"><div style="font-weight:700;">${esc(d.name)}</div><div style="font-size:12.5px;color:var(--muted);">${esc(d.specialization)} · ${esc(upcoming.consultationType || "In person")}</div></div>
        <div style="text-align:right;"><div style="font-weight:700;">${fmtDateShort(upcoming.date)}</div><div style="font-size:12.5px;color:var(--muted);">${esc(upcoming.time)}</div></div>
      </div>
      <div style="margin-top:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">${this.statusBadge(upcoming.status)}${this.priorityBadge(upcoming.priority)}
        ${upcoming.consultationType === "Video call" ? `<button class="btn btn-primary btn-sm" onclick="App.navigate('#/patient/video/${upcoming.id}')">🎥 Join video consultation</button>` : ""}
        ${upcoming.consultationType === "Voice call" ? `<button class="btn btn-primary btn-sm" onclick="App.navigate('#/patient/call/${d.id}')">📞 ${esc(t("callDoctor"))}</button>` : ""}
        <button class="btn btn-ghost btn-sm" onclick="App.speakAppointment('${upcoming.id}')">🔊 Read aloud</button>
      </div>`
        : this.emptyState(t("none"), t("bookAppointment"))
    }
  </div>

  <div class="tile-grid">
    ${tiles
      .map(
        ([ic, label, href]) => `<button class="tile" onclick="App.navigate('${href}')">
        <span style="font-size:30px;">${ic}</span><span>${esc(label)}</span></button>`,
      )
      .join("")}
    <button class="tile" onclick="App.openLanguagePicker()"><span style="font-size:30px;">🌐</span><span>${esc(t("changeLanguage"))}</span></button>
  </div>`;
};

App.priorityBadge = function (pr) {
  const p = pr || "Normal";
  const cls = p === "Emergency" ? "badge-danger" : p === "Urgent" ? "badge-warning" : p === "Follow-up" ? "badge-muted" : "badge-muted";
  return `<span class="badge ${cls}">${esc(p)}</span>`;
};

App.speakAppointment = function (id) {
  const a = Store.data.appointments.find((x) => x.id === id);
  if (!a) return;
  const d = this.doctorById(a.doctorId);
  if (!Tts.supported()) {
    this.toast(t("noTts"));
    return;
  }
  Tts.speak(t("appointmentSpoken") + " " + (d ? d.name : "") + ", " + fmtDate(a.date) + ", " + a.time + ".");
};

/* ==================== patient: symptom assistant (booking step 1-2) ====== */
App.symptomAssistant = function (p) {
  return `
  <div class="card" style="padding:20px;max-width:760px;margin:0 auto;">
    <div class="step-head">${esc(t("step"))} 1 · ${esc(t("describeProblem"))}</div>
    <p style="color:var(--muted);font-size:13.5px;margin:6px 0 14px;">🎤 Tell us your problem — speak or type in your own words.</p>
    <textarea class="input" id="symptomText" rows="3" aria-label="${esc(t("describeProblem"))}" placeholder="${esc(t("speakProblem"))}"></textarea>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px;">
      <button class="btn btn-primary big-btn" id="micBtn" onclick="App.toggleSymptomMic()">🎤 <span id="micLabel">${esc(t("speak"))}</span></button>
      <button class="btn btn-ghost big-btn" onclick="App.analyzeSymptom()">${esc(t("continue"))} →</button>
    </div>
    <div id="micStatus" style="font-size:13px;color:var(--muted);margin-top:8px;" role="status" aria-live="polite"></div>
    <div id="assistResult" style="margin-top:18px;"></div>
  </div>`;
};

App.toggleSymptomMic = function () {
  const status = document.getElementById("micStatus");
  const label = document.getElementById("micLabel");
  const box = document.getElementById("symptomText");
  if (Speech.active) {
    Speech.stop();
    label.textContent = t("speak");
    status.textContent = "";
    return;
  }
  const ok = Speech.start({
    onResult: (text) => {
      box.value = text;
    },
    onError: (msg) => {
      status.textContent = msg;
      label.textContent = t("speak");
    },
    onEnd: () => {
      label.textContent = t("speak");
      if (status.textContent === t("listening")) status.textContent = "";
      if (box.value.trim()) this.analyzeSymptom();
    },
  });
  if (ok) {
    label.textContent = t("stop");
    status.textContent = t("listening");
  }
};

App.analyzeSymptom = function () {
  const box = document.getElementById("symptomText");
  const out = document.getElementById("assistResult");
  const text = (box.value || "").trim();
  if (!text) {
    out.innerHTML = `<div class="err">${esc(t("required"))}</div>`;
    return;
  }
  const emergency = isEmergencyText(text);
  const s = suggestSpecialization(text);
  const doctors = Store.data.doctors.filter((d) => d.specialization === s.spec);
  const hosp = hospitalsFor(s.spec);
  this.lastSymptom = { text, spec: s.spec, emergency };
  out.innerHTML = `
    ${
      emergency
        ? `<div class="card alert-danger" style="padding:16px;margin-bottom:14px;">
        <div class="font-display" style="font-weight:700;font-size:17px;">${esc(t("possibleEmergency"))}</div>
        <div style="font-size:14px;margin-top:4px;">${esc(t("emergencyMsg"))}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">
          <a class="btn btn-danger" href="tel:${esc(Store.data.hospital.emergencyNumber)}">🚑 ${esc(t("callEmergency"))} (${esc(Store.data.hospital.emergencyNumber)})</a>
          <a class="btn btn-ghost" href="tel:${esc(Store.data.hospital.emergencyDesk)}">🏥 ${esc(t("contactHospital"))}</a>
          <button class="btn btn-ghost" onclick="App.navigate('#/patient/emergency')">${esc(t("emergency"))}</button>
        </div>
      </div>`
        : ""
    }
    <div class="card" style="padding:16px;">
      <div class="step-head">${esc(t("step"))} 2 · ${esc(t("suggestedDept"))}</div>
      <div style="display:flex;align-items:center;gap:10px;margin-top:8px;">
        <span style="font-size:26px;">${SPEC_ICONS[s.spec] || "🩺"}</span>
        <div><div class="font-display" style="font-weight:700;font-size:17px;">${esc(s.spec)}</div>
        <div style="font-size:13px;color:var(--muted);">Based on the information entered, you may consider consulting a ${esc(s.spec)} specialist.</div></div>
      </div>
      <p class="disclaimer">${esc(t("suggestionNote"))}</p>
      <button class="btn btn-ghost btn-sm" style="margin-top:6px;" onclick="App.readAloud(${JSON.stringify(t("suggestedDept") + ": " + s.spec).replace(/"/g, "&quot;")})">🔊 Read aloud</button>
    </div>
    <div class="step-head" style="margin:18px 0 8px;">${esc(t("step"))} 3 · ${esc(t("doctors"))}</div>
    ${
      doctors.length
        ? `<div class="tile-grid">${doctors
            .map(
              (d) => `<button class="tile" style="align-items:flex-start;text-align:left;" onclick="App.navigate('#/patient/book/${d.id}')">
        <div class="avatar" style="background:${avatarColor(d.name)};">${initials(d.name)}</div>
        <div><div style="font-weight:700;">${esc(d.name)}</div>
        <div style="font-size:12.5px;color:var(--muted);">${esc(d.specialization)} · ${money(d.fee)}</div>
        <div style="font-size:12px;margin-top:4px;">${this.availabilityBadge(d)}</div></div>
      </button>`,
            )
            .join("")}</div>`
        : `<div class="card alert-warn" style="padding:16px;">
          <div style="font-weight:700;">${esc(t("noSpecialist"))}</div>
          <div style="font-size:13px;margin-top:4px;">${esc(t("nearbyHospitals"))}:</div>
          ${hosp.map((h) => this.hospitalCard(h)).join("")}
        </div>`
    }`;
  if (emergency) this.readAloud(t("emergencyMsg"));
};

App.readAloud = function (text) {
  if (!Tts.supported()) {
    this.toast(t("noTts"));
    return;
  }
  Tts.speak(text);
};

App.availabilityBadge = function (d) {
  const cls = d.status === "Available" ? "badge-success" : d.status === "Busy" ? "badge-warning" : "badge-danger";
  return `<span class="badge ${cls}">${esc(d.status)}</span>`;
};

App.hospitalCard = function (h) {
  return `<div class="card" style="padding:14px;margin-top:10px;">
    <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;">
      <div><div style="font-weight:700;">${esc(h.name)}</div>
      <div style="font-size:12.5px;color:var(--muted);">${esc(h.address)}</div>
      <div style="font-size:12.5px;color:var(--muted);">${esc(h.departments.join(", "))}</div>
      <div style="font-size:12.5px;margin-top:4px;">${esc(h.doctor)} · next slot ${esc(h.nextSlot)} ${h.emergency ? '· <span class="badge badge-danger">24×7 emergency</span>' : ""}</div></div>
      <div style="text-align:right;"><div style="font-weight:700;">${h.distanceKm} km</div><div style="font-size:11.5px;color:var(--muted);">approx. (demo data)</div></div>
    </div>
    <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
      <a class="btn btn-ghost btn-sm" href="tel:${esc(h.phone.replace(/\s/g, ""))}">📞 ${esc(t("contactHospital"))}</a>
      <a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.name + " " + h.address)}">🗺️ ${esc(t("getDirections"))}</a>
    </div>
  </div>`;
};

App.patientReferrals = function (spec) {
  const list = hospitalsFor(spec);
  return `<div style="max-width:760px;margin:0 auto;">
    <div class="card" style="padding:16px;margin-bottom:12px;">
      <div class="font-display" style="font-weight:700;font-size:16px;">${esc(t("nearbyHospitals"))} · ${esc(spec)}</div>
      <p style="font-size:12.5px;color:var(--muted);margin-top:4px;">Distances are demo values. Connect a maps/location API for real-time distance.</p>
    </div>
    ${list.length ? list.map((h) => this.hospitalCard(h)).join("") : this.emptyState("No referral hospital found")}
  </div>`;
};

/* ======================= patient: voice assistant ======================== */
App.voiceAssistant = function (p) {
  this._mount = function () {
    this.voiceLog = this.voiceLog || [];
    this.renderVoiceLog();
  };
  return `
  <div style="max-width:780px;margin:0 auto;display:grid;gap:14px;">
    <div class="card" style="padding:18px;">
      <div class="font-display" style="font-weight:700;font-size:16px;">🗣️ ${esc(t("voiceAssistant"))}</div>
      <p style="color:var(--muted);font-size:13px;margin-top:4px;">Speak in ${esc((LANGS.find((l) => l.code === I18n.get()) || {}).native || "English")}. This assistant helps you find the right department and book a visit. It does not give medical advice.</p>
      <div id="voiceLog" class="chat-log" aria-live="polite"></div>
      <div id="voiceStatus" style="font-size:13px;color:var(--muted);margin:8px 0;" role="status" aria-live="polite"></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-primary big-btn" id="vcBtn" onclick="App.toggleVoiceChat()">🎤 <span id="vcLabel">Start voice chat</span></button>
        <button class="btn btn-ghost" onclick="App.toggleMute()" id="muteBtn">🔈 ${Tts.muted ? "Unmute" : "Mute"}</button>
        <button class="btn btn-ghost" onclick="App.replayLast()">🔁 Replay</button>
        <button class="btn btn-ghost" onclick="App.clearVoiceChat()">🗑️ Clear</button>
      </div>
    </div>

    <div class="card" style="padding:18px;">
      <div class="font-display" style="font-weight:700;font-size:16px;">🎙️ ${esc(t("record"))}</div>
      <p style="color:var(--muted);font-size:13px;margin-top:4px;">Recorded in your browser only. Attaching it to a real doctor inbox needs a backend.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
        <button class="btn btn-danger big-btn" id="recBtn" onclick="App.toggleRecording()">🔴 <span id="recLabel">${esc(t("start"))}</span></button>
        <span id="recTimer" class="timer" role="status" aria-live="polite">00:00</span>
      </div>
      <div id="recStatus" style="font-size:13px;color:var(--muted);margin-top:8px;"></div>
      <div id="recPlayback" style="margin-top:10px;"></div>
    </div>
  </div>`;
};

App.voiceLog = [];
App.renderVoiceLog = function () {
  const el = document.getElementById("voiceLog");
  if (!el) return;
  el.innerHTML = this.voiceLog.length
    ? this.voiceLog.map((m) => `<div class="bubble ${m.who}">${esc(m.text)}</div>`).join("")
    : `<div style="color:var(--muted);font-size:13px;">Press “Start voice chat” and say something like “chest pain” or “child fever”.</div>`;
  el.scrollTop = el.scrollHeight;
};

App.assistantReply = function (text) {
  if (isEmergencyText(text)) {
    return t("possibleEmergency") + " " + t("emergencyMsg");
  }
  const s = suggestSpecialization(text);
  const doctors = Store.data.doctors.filter((d) => d.specialization === s.spec && d.status === "Available");
  if (!doctors.length) {
    const h = hospitalsFor(s.spec)[0];
    return t("noSpecialist") + (h ? " " + t("nearbyHospitals") + ": " + h.name + "." : "");
  }
  return t("suggestedDept") + ": " + s.spec + ". " + doctors[0].name + " " + t("bookAppointment") + ".";
};

App.toggleVoiceChat = function () {
  const status = document.getElementById("voiceStatus");
  const label = document.getElementById("vcLabel");
  if (Speech.active) {
    Speech.stop();
    label.textContent = "Start voice chat";
    status.textContent = "";
    return;
  }
  const ok = Speech.start({
    continuous: false,
    onResult: (text, isFinal) => {
      status.textContent = text;
      if (isFinal) {
        this.voiceLog.push({ who: "me", text });
        const reply = this.assistantReply(text);
        this.voiceLog.push({ who: "bot", text: reply });
        this.lastReply = reply;
        this.renderVoiceLog();
        Tts.speak(reply, () => {
          // keep the conversation going
          if (document.getElementById("vcLabel")) this.toggleVoiceChat();
        });
      }
    },
    onError: (msg) => {
      status.textContent = msg;
      label.textContent = "Start voice chat";
    },
    onEnd: () => {
      const l = document.getElementById("vcLabel");
      if (l) l.textContent = "Start voice chat";
    },
  });
  if (ok) {
    label.textContent = t("stop");
    status.textContent = t("listening");
  }
};
App.toggleMute = function () {
  Tts.muted = !Tts.muted;
  if (Tts.muted) Tts.stop();
  const b = document.getElementById("muteBtn");
  if (b) b.textContent = Tts.muted ? "🔇 Unmute" : "🔈 Mute";
};
App.replayLast = function () {
  if (!this.lastReply) {
    this.toast("Nothing to replay yet");
    return;
  }
  Tts.speak(this.lastReply);
};
App.clearVoiceChat = function () {
  this.voiceLog = [];
  this.lastReply = null;
  this.renderVoiceLog();
};

/* --------------------------------------------------------- recording ----- */
App.toggleRecording = async function () {
  const label = document.getElementById("recLabel");
  const timer = document.getElementById("recTimer");
  const status = document.getElementById("recStatus");
  if (Recorder.mediaRecorder) {
    const res = await Recorder.stop();
    label.textContent = t("start");
    status.textContent = "";
    if (res) {
      const el = document.getElementById("recPlayback");
      el.innerHTML = `<audio controls src="${res.url}" style="width:100%;"></audio>
        <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;">
          <button class="btn btn-ghost btn-sm" onclick="App.attachRecording(${res.seconds})">📎 Attach to my next appointment</button>
          <button class="btn btn-ghost btn-sm" onclick="App.deleteRecording()">🗑️ ${esc(t("deleteRec"))}</button>
        </div>`;
    }
    return;
  }
  status.textContent = "";
  const ok = await Recorder.start(
    (sec) => {
      if (timer) timer.textContent = fmtClock(sec);
    },
    (msg) => {
      status.textContent = msg;
    },
  );
  if (ok) {
    label.textContent = t("recording");
    timer.textContent = "00:00";
  }
};
App.deleteRecording = function () {
  Recorder.discard();
  const el = document.getElementById("recPlayback");
  if (el) el.innerHTML = "";
  const timer = document.getElementById("recTimer");
  if (timer) timer.textContent = "00:00";
  this.toast("Recording deleted");
};
App.attachRecording = function (seconds) {
  const u = this.currentUser();
  const db = Store.data;
  db.communication.voiceMessages.push({
    id: uid("VM"),
    patientId: u.linkedId,
    seconds,
    createdAt: new Date().toISOString(),
    delivered: false, // requires a backend to actually deliver
  });
  Store.save();
  Audit.log("Voice message attached", "patient " + u.linkedId, "Success");
  this.toast("Saved on this device. Delivery to the clinic needs a backend.");
};

/* ======================= video consultation (WebRTC demo) ================ */
App.videoState = { pc1: null, pc2: null, stream: null, timer: null, seconds: 0, cam: true, mic: true, chat: [] };

App.videoRoom = function (apptId, role) {
  const appt = apptId ? Store.data.appointments.find((a) => a.id === apptId) : null;
  const doctor = appt ? this.doctorById(appt.doctorId) : Store.data.doctors[0];
  this._mount = function () {
    this.videoState.chat = [];
    this.renderVideoChat();
  };
  return `
  <div style="max-width:960px;margin:0 auto;">
    <div class="card alert-warn" style="padding:12px 14px;margin-bottom:12px;font-size:13px;">
      ${esc(t("demoNotice"))} The doctor tile mirrors your own camera through a local WebRTC peer connection; real doctor-to-patient calls need a signalling server (see code comments).
    </div>
    <div class="video-grid">
      <div class="video-tile"><video id="localVideo" autoplay playsinline muted></video><span class="video-label">You</span></div>
      <div class="video-tile"><video id="remoteVideo" autoplay playsinline></video><span class="video-label">${esc(doctor ? doctor.name : "Doctor")} · ${esc(doctor ? doctor.specialization : "")} (demo)</span></div>
    </div>
    <div class="card" style="padding:14px;margin-top:12px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
      <button class="btn btn-primary big-btn" id="vidStartBtn" onclick="App.startVideo()">🎥 Start video consultation</button>
      <button class="btn btn-ghost" onclick="App.toggleCam()" id="camBtn">📷 Camera</button>
      <button class="btn btn-ghost" onclick="App.toggleMic()" id="micToggleBtn">🎙️ Microphone</button>
      <button class="btn btn-ghost" onclick="App.fullscreenVideo()">⛶ Full screen</button>
      <button class="btn btn-danger" onclick="App.stopVideo(true)">⛔ End call</button>
      <span class="timer" id="callTimer">00:00</span>
      <span class="badge badge-muted" id="connStatus">Not connected</span>
      <span class="badge badge-muted">🌐 ${esc((LANGS.find((l) => l.code === I18n.get()) || {}).native || "English")}</span>
    </div>
    <div id="vidStatus" class="err" role="alert" style="margin-top:8px;"></div>
    <div class="card" style="padding:14px;margin-top:12px;">
      <div class="font-display" style="font-weight:700;font-size:14.5px;margin-bottom:8px;">Consultation chat</div>
      <div id="videoChat" class="chat-log" aria-live="polite"></div>
      <form onsubmit="return App.sendVideoChat(event)" style="display:flex;gap:8px;margin-top:8px;">
        <input class="input" id="vidChatInput" placeholder="Type a message" aria-label="Chat message">
        <button class="btn btn-primary" type="submit">Send</button>
      </form>
    </div>
  </div>`;
};

App.renderVideoChat = function () {
  const el = document.getElementById("videoChat");
  if (!el) return;
  el.innerHTML = this.videoState.chat.length
    ? this.videoState.chat.map((m) => `<div class="bubble ${m.who}">${esc(m.text)}</div>`).join("")
    : `<div style="color:var(--muted);font-size:13px;">Messages stay on this device in demo mode.</div>`;
  el.scrollTop = el.scrollHeight;
};
App.sendVideoChat = function (e) {
  e.preventDefault();
  const input = document.getElementById("vidChatInput");
  const text = (input.value || "").trim();
  if (!text) return false;
  this.videoState.chat.push({ who: "me", text });
  this.videoState.chat.push({ who: "bot", text: "Demo response: the clinic desk has noted your message." });
  input.value = "";
  this.renderVideoChat();
  return false;
};

App.startVideo = async function () {
  const status = document.getElementById("vidStatus");
  const conn = document.getElementById("connStatus");
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    status.textContent = "This browser cannot access the camera.";
    return;
  }
  try {
    this.videoState.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  } catch (err) {
    status.textContent = err && err.name === "NotFoundError" ? "No camera or microphone found." : t("camDenied");
    return;
  }
  status.textContent = "";
  const local = document.getElementById("localVideo");
  local.srcObject = this.videoState.stream;

  /* Real WebRTC objects are used below. The two peer connections are wired to
     each other locally because no signalling server exists in this prototype.
     To go live: replace the manual offer/answer exchange with messages sent
     over a signalling channel (WebSocket) to the remote peer. */
  try {
    const pc1 = new RTCPeerConnection();
    const pc2 = new RTCPeerConnection();
    this.videoState.pc1 = pc1;
    this.videoState.pc2 = pc2;
    pc1.onicecandidate = (e) => e.candidate && pc2.addIceCandidate(e.candidate);
    pc2.onicecandidate = (e) => e.candidate && pc1.addIceCandidate(e.candidate);
    pc2.ontrack = (e) => {
      const remote = document.getElementById("remoteVideo");
      if (remote) remote.srcObject = e.streams[0];
    };
    pc1.onconnectionstatechange = () => {
      if (conn) {
        conn.textContent = pc1.connectionState === "connected" ? "Connected (demo)" : pc1.connectionState;
        conn.className = "badge " + (pc1.connectionState === "connected" ? "badge-success" : "badge-warning");
      }
    };
    this.videoState.stream.getTracks().forEach((tr) => pc1.addTrack(tr, this.videoState.stream));
    const offer = await pc1.createOffer();
    await pc1.setLocalDescription(offer);
    await pc2.setRemoteDescription(offer);
    const answer = await pc2.createAnswer();
    await pc2.setLocalDescription(answer);
    await pc1.setRemoteDescription(answer);
  } catch (err) {
    if (conn) conn.textContent = "Local preview only";
  }
  clearInterval(this.videoState.timer);
  this.videoState.seconds = 0;
  this.videoState.timer = setInterval(() => {
    this.videoState.seconds++;
    const el = document.getElementById("callTimer");
    if (el) el.textContent = fmtClock(this.videoState.seconds);
  }, 1000);
  const u = this.currentUser();
  Store.data.communication.videoConsultations.push({ id: uid("VC"), userId: u ? u.id : "—", startedAt: new Date().toISOString(), mode: "demo" });
  Store.save();
  Audit.log("Video consultation started (demo)", "—", "Success");
};

App.toggleCam = function () {
  const s = this.videoState.stream;
  if (!s) {
    this.toast("Start the consultation first");
    return;
  }
  this.videoState.cam = !this.videoState.cam;
  s.getVideoTracks().forEach((tr) => (tr.enabled = this.videoState.cam));
  const b = document.getElementById("camBtn");
  if (b) b.textContent = this.videoState.cam ? "📷 Camera" : "🚫 Camera off";
};
App.toggleMic = function () {
  const s = this.videoState.stream;
  if (!s) {
    this.toast("Start the consultation first");
    return;
  }
  this.videoState.mic = !this.videoState.mic;
  s.getAudioTracks().forEach((tr) => (tr.enabled = this.videoState.mic));
  const b = document.getElementById("micToggleBtn");
  if (b) b.textContent = this.videoState.mic ? "🎙️ Microphone" : "🔇 Muted";
};
App.fullscreenVideo = function () {
  const el = document.querySelector(".video-grid");
  if (el && el.requestFullscreen) el.requestFullscreen().catch(() => this.toast("Full screen not available"));
};
App.stopVideo = function (notify) {
  const st = this.videoState;
  clearInterval(st.timer);
  if (st.stream) {
    st.stream.getTracks().forEach((tr) => tr.stop());
    st.stream = null;
  }
  [st.pc1, st.pc2].forEach((pc) => {
    if (pc) {
      try {
        pc.close();
      } catch (e) {}
    }
  });
  st.pc1 = st.pc2 = null;
  const conn = document.getElementById("connStatus");
  if (conn) {
    conn.textContent = "Call ended";
    conn.className = "badge badge-muted";
  }
  if (notify) this.toast("Consultation ended");
};

/* ============================== voice call =============================== */
App.callState = { timer: null, seconds: 0, active: false };
App.callScreen = function (doctorId) {
  const doctors = Store.data.doctors;
  const d = doctorId ? this.doctorById(doctorId) : doctors[0];
  if (!d) return this.emptyState("No doctors available");
  return `
  <div style="max-width:560px;margin:0 auto;">
    <div class="card" style="padding:12px;margin-bottom:12px;display:flex;gap:8px;overflow-x:auto;">
      ${doctors.map((x) => `<button class="btn btn-ghost btn-sm" onclick="App.navigate('#/patient/call/${x.id}')" ${x.id === d.id ? 'style="border-color:var(--primary);color:var(--primary-dark);"' : ""}>${esc(x.name)}</button>`).join("")}
    </div>
    <div class="card call-card">
      <div class="avatar" style="background:${avatarColor(d.name)};width:84px;height:84px;font-size:28px;margin:0 auto;">${initials(d.name)}</div>
      <div class="font-display" style="font-weight:700;font-size:19px;margin-top:12px;">${esc(d.name)}</div>
      <div style="color:var(--muted);font-size:13.5px;">${esc(d.specialization)}</div>
      <div style="margin-top:8px;">${this.availabilityBadge(d)}</div>
      <div class="timer" id="voiceCallTimer" style="margin-top:14px;font-size:20px;">00:00</div>
      <div id="callStatus" class="badge badge-muted" role="status" aria-live="polite">Ready to call (demo)</div>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:16px;">
        <button class="btn btn-primary big-btn" id="callBtn" onclick="App.toggleCall('${d.id}')">📞 ${esc(t("start"))}</button>
        <a class="btn btn-ghost big-btn" href="tel:${esc(String(d.phone).replace(/\s/g, ""))}">☎️ Dial reception</a>
      </div>
      <p class="disclaimer">Demo call: audio is not routed to the doctor. A real call needs telephony or WebRTC signalling.</p>
    </div>
  </div>`;
};
App.toggleCall = function (doctorId) {
  const st = this.callState;
  const btn = document.getElementById("callBtn");
  const status = document.getElementById("callStatus");
  if (st.active) {
    clearInterval(st.timer);
    st.active = false;
    btn.innerHTML = "📞 " + t("start");
    status.textContent = "Call ended · " + fmtClock(st.seconds);
    Store.data.communication.calls.push({ id: uid("CL"), doctorId, seconds: st.seconds, at: new Date().toISOString(), mode: "demo" });
    Store.save();
    return;
  }
  st.active = true;
  st.seconds = 0;
  btn.innerHTML = "⛔ End call";
  status.textContent = "Connecting… (demo)";
  setTimeout(() => {
    if (st.active && document.getElementById("callStatus")) document.getElementById("callStatus").textContent = "In call (demo)";
  }, 1200);
  st.timer = setInterval(() => {
    st.seconds++;
    const el = document.getElementById("voiceCallTimer");
    if (el) el.textContent = fmtClock(st.seconds);
  }, 1000);
  Audit.log("Voice call started (demo)", doctorId, "Success");
};

/* ============================== emergency ================================ */
App.emergencyPage = function () {
  const h = Store.data.hospital;
  return `
  <div style="max-width:680px;margin:0 auto;">
    <div class="card alert-danger" style="padding:20px;text-align:center;">
      <div style="font-size:34px;">🚨</div>
      <div class="font-display" style="font-weight:700;font-size:20px;margin-top:6px;">${esc(t("possibleEmergency"))}</div>
      <p style="font-size:14.5px;margin-top:6px;">${esc(t("emergencyMsg"))}</p>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:14px;">
        <a class="btn btn-danger big-btn" href="tel:${esc(h.emergencyNumber)}">🚑 ${esc(t("callEmergency"))} · ${esc(h.emergencyNumber)}</a>
        <a class="btn btn-ghost big-btn" href="tel:${esc(String(h.emergencyDesk).replace(/\s/g, ""))}">🏥 ${esc(t("contactHospital"))}</a>
        <button class="btn btn-ghost big-btn" onclick="App.readAloud('${esc(t("emergencyMsg"))}')">🔊 Read aloud</button>
      </div>
      <p class="disclaimer">This app cannot diagnose an emergency. The hospital admin configures these numbers in Hospital settings.</p>
    </div>
    <div class="card" style="padding:16px;margin-top:14px;">
      <div class="font-display" style="font-weight:700;font-size:15px;">${esc(t("nearbyHospitals"))} · 24×7 emergency</div>
      ${NEARBY_HOSPITALS.filter((x) => x.emergency).map((x) => this.hospitalCard(x)).join("")}
    </div>
  </div>`;
};

/* ====================== booking flow (steps 4 - 8) ======================= */
const baseBookingFlow = App.bookingFlow;
App.bookingFlow = function (doctorId, p) {
  const d = this.doctorById(doctorId);
  if (!d) return this.emptyState("Doctor not found");
  const base = baseBookingFlow.call(this, doctorId, p);
  const extra = `
  <div class="card" style="max-width:640px;margin:14px auto 0;padding:20px;">
    <label class="field-label">${esc(t("consultationType"))}</label>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">
      ${(d.consultationModes || ["In person"])
        .map(
          (m, i) =>
            `<label class="chip"><input type="radio" name="ctype" value="${esc(m)}" ${i === 0 ? "checked" : ""}> ${esc(m === "In person" ? t("inPerson") : m === "Voice call" ? t("voiceCall") : t("video"))}</label>`,
        )
        .join("")}
    </div>
    <label class="field-label">${esc(t("priority"))}</label>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      ${[
        ["Normal", t("normal")],
        ["Urgent", t("urgent")],
        ["Follow-up", t("followUp")],
        ["Emergency", t("emergency")],
      ]
        .map(([v, label], i) => `<label class="chip"><input type="radio" name="prio" value="${v}" ${i === 0 ? "checked" : ""}> ${esc(label)}</label>`)
        .join("")}
    </div>
    <p class="disclaimer">Emergency bookings alert the front desk. For a life-threatening problem call ${esc(Store.data.hospital.emergencyNumber)} immediately.</p>
    <div class="badge ${d.status === "Available" ? "badge-success" : "badge-warning"}">${esc(d.status)}</div>
  </div>
  <div id="bookingAlt" style="max-width:640px;margin:14px auto 0;"></div>`;
  return base + extra;
};

App.confirmBooking = function (doctorId, patientId) {
  const d = this.doctorById(doctorId);
  const alt = document.getElementById("bookingAlt");
  if (!this.selectedDate || !this.selectedTime) {
    this.toast(t("chooseDate") + " / " + t("chooseTime"));
    return;
  }
  const ctype = (document.querySelector('input[name="ctype"]:checked') || {}).value || "In person";
  const prio = (document.querySelector('input[name="prio"]:checked') || {}).value || "Normal";
  const check = checkAvailability(d, this.selectedDate, this.selectedTime);
  if (!check.ok) {
    if (alt) alt.innerHTML = this.alternativesHtml(d, this.selectedDate, this.selectedTime, check.reason);
    this.toast(check.reason);
    Audit.log("Blocked double booking / unavailable slot", d.id + " " + this.selectedDate + " " + this.selectedTime, "Blocked");
    return;
  }
  const id = uid("APT");
  Store.data.appointments.push({
    id,
    patientId,
    doctorId,
    date: this.selectedDate,
    time: this.selectedTime,
    status: prio === "Emergency" ? "Pending" : "Confirmed",
    priority: prio,
    consultationType: ctype,
    originalDoctorId: doctorId,
    reassignedDoctorId: null,
    reassignmentReason: null,
    reassignmentStatus: null,
  });
  Store.data.notifications.unshift({ id: uid("n"), text: "Appointment " + id + " booked with " + d.name, read: false });
  Store.save();
  Audit.log("Appointment created", id, "Success");
  const date = this.selectedDate,
    time = this.selectedTime;
  this.selectedDate = null;
  this.selectedTime = null;
  document.getElementById("app").innerHTML = this.shell(
    `<div class="card" style="max-width:460px;margin:50px auto;padding:30px;text-align:center;">
      <div style="width:52px;height:52px;border-radius:50%;background:var(--success-light);color:var(--success);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;">${icon("check", 24)}</div>
      <div class="font-display" style="font-weight:700;font-size:18px;">${esc(t("confirmed"))}</div>
      <div style="color:var(--muted);font-size:13.5px;margin-top:6px;">${esc(d.name)} · ${esc(d.specialization)}</div>
      <div style="margin-top:12px;font-weight:700;">${fmtDate(date)} · ${esc(time)}</div>
      <div style="margin-top:8px;display:flex;gap:6px;justify-content:center;">${this.priorityBadge(prio)}<span class="badge badge-muted">${esc(ctype)}</span></div>
      <div style="font-size:12.5px;color:var(--muted);margin-top:6px;">ID: ${esc(id)}</div>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:18px;">
        <button class="btn btn-primary" onclick="App.navigate('#/patient/dashboard')">${esc(t("dashboard"))}</button>
        <button class="btn btn-ghost" onclick="App.speakAppointment('${id}')">🔊 Read aloud</button>
      </div>
    </div>`,
    this.currentUser(),
    "appointments",
  );
  Tts.speak(t("appointmentSpoken") + " " + d.name + ", " + fmtDate(date) + ", " + time + ".");
};

App.alternativesHtml = function (doctor, date, time, reason) {
  const alts = alternatives(doctor.specialization, date, doctor.id, time);
  const hosp = hospitalsFor(doctor.specialization);
  return `<div class="card alert-warn" style="padding:16px;">
    <div style="font-weight:700;">${esc(reason || t("doctorUnavailable"))}</div>
    ${
      alts.length
        ? `<div style="font-size:13.5px;margin-top:10px;font-weight:600;">${esc(t("sameSpecAvailable"))}</div>
      ${alts
        .map(
          (a) => `<div class="card" style="padding:12px;margin-top:8px;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center;">
        <div><div style="font-weight:700;">${esc(a.doctor.name)}</div><div style="font-size:12.5px;color:var(--muted);">${esc(a.doctor.specialization)} · ${money(a.doctor.fee)}</div></div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">${a.times.map((tm) => `<button class="btn btn-primary btn-sm" onclick="App.bookAlternative('${a.doctor.id}','${date}','${tm}')">${esc(tm)}</button>`).join("")}</div>
      </div>`,
        )
        .join("")}`
        : `<div style="margin-top:10px;font-weight:600;">${esc(t("noSpecialist"))}</div>
        <div style="font-size:13px;color:var(--muted);">${esc(t("nearbyHospitals"))}</div>
        ${hosp.map((h) => this.hospitalCard(h)).join("")}`
    }
  </div>`;
};

App.bookAlternative = function (doctorId, date, time) {
  const u = this.currentUser();
  if (!u || u.role !== "patient") {
    this.toast(t("accessDenied"));
    return;
  }
  this.selectedDate = date;
  this.selectedTime = time;
  this.confirmBooking(doctorId, u.linkedId);
};

/* ======================= reassignment workflow =========================== */
/** Proposes a same-specialization replacement. Never changes the doctor silently. */
App.proposeReassignment = function (apptId, reason) {
  const a = Store.data.appointments.find((x) => x.id === apptId);
  if (!a) return null;
  const d = this.doctorById(a.doctorId);
  const alts = alternatives(d.specialization, a.date, d.id, a.time);
  if (!alts.length) {
    a.reassignmentStatus = "No replacement";
    a.reassignmentReason = reason || "Doctor unavailable";
    Store.save();
    Audit.log("Reassignment failed — no same-specialization doctor", apptId, "Pending");
    return null;
  }
  a.reassignedDoctorId = alts[0].doctor.id;
  a.reassignProposedTime = alts[0].times[0];
  a.reassignmentReason = reason || "Doctor unavailable";
  a.reassignmentStatus = "Proposed";
  Store.data.notifications.unshift({ id: uid("n"), text: "Reassignment proposed for " + apptId + " → " + alts[0].doctor.name, read: false });
  Store.save();
  Audit.log("Reassignment proposed", apptId + " → " + alts[0].doctor.name, "Pending");
  return alts[0];
};

App.acceptReassignment = function (apptId) {
  const a = Store.data.appointments.find((x) => x.id === apptId);
  if (!a || !a.reassignedDoctorId) return;
  const u = this.currentUser();
  if (u.role === "patient" && a.patientId !== u.linkedId) {
    this.toast(t("accessDenied"));
    return;
  }
  const from = this.doctorById(a.doctorId);
  a.originalDoctorId = a.originalDoctorId || a.doctorId;
  a.doctorId = a.reassignedDoctorId;
  if (a.reassignProposedTime) a.time = a.reassignProposedTime;
  a.reassignmentStatus = "Accepted";
  a.status = "Confirmed";
  Store.save();
  const to = this.doctorById(a.doctorId);
  Audit.log("Appointment reassigned", a.id + " from " + (from ? from.name : "—") + " to " + (to ? to.name : "—"), "Success");
  this.toast("Appointment moved to " + (to ? to.name : "another doctor"));
  this.render();
};
App.declineReassignment = function (apptId) {
  const a = Store.data.appointments.find((x) => x.id === apptId);
  if (!a) return;
  a.reassignmentStatus = "Declined";
  Store.save();
  Audit.log("Reassignment declined", apptId, "Success");
  this.toast("We kept your original booking request. You can pick another slot or hospital.");
  this.render();
};

/* ===================== doctor: availability self-service ================= */
App.doctorAvailability = function (doc) {
  if (!doc) return this.emptyState("Doctor profile not found");
  return `
  <div class="card" style="max-width:620px;padding:20px;">
    <div class="font-display" style="font-weight:700;font-size:16px;">My availability</div>
    <p style="color:var(--muted);font-size:13px;margin-top:4px;">Admin keeps final control over scheduling and reassignment.</p>
    <label class="field-label" style="margin-top:14px;">Status</label>
    <select class="input" id="docStatus">
      ${["Available", "Busy", "On Leave", "Offline"].map((s) => `<option ${doc.status === s ? "selected" : ""}>${s}</option>`).join("")}
    </select>
    <label class="field-label" style="margin-top:12px;">Leave date (optional)</label>
    <input class="input" id="docLeave" type="date">
    <button class="btn btn-primary" style="margin-top:14px;" onclick="App.saveDoctorStatus('${doc.id}')">${esc(t("save"))}</button>
    <div style="margin-top:14px;font-size:13px;color:var(--muted);">Leave days: ${doc.leaveDates.length ? doc.leaveDates.map((x) => esc(x)).join(", ") : "none"}</div>
  </div>`;
};

App.saveDoctorStatus = function (doctorId) {
  const u = this.currentUser();
  const s = Session.get();
  const isAdmin = u.role === "admin" && s && s.adminAuthed;
  if (!isAdmin && !(u.role === "doctor" && u.linkedId === doctorId)) {
    this.toast(t("accessDenied"));
    return;
  }
  const d = this.doctorById(doctorId);
  d.status = document.getElementById("docStatus").value;
  const leave = document.getElementById("docLeave").value;
  if (leave && !d.leaveDates.includes(leave)) d.leaveDates.push(leave);
  Store.save();
  Audit.log("Doctor availability updated", d.name + " → " + d.status, "Success");
  // Offer reassignment for affected upcoming appointments.
  const today = todayStr();
  let proposed = 0;
  Store.data.appointments
    .filter((a) => a.doctorId === d.id && a.date >= today && a.status !== "Cancelled" && a.status !== "Completed")
    .forEach((a) => {
      if (!checkAvailability(d, a.date, a.time).ok || d.status === "On Leave" || d.status === "Offline" || d.leaveDates.includes(a.date)) {
        if (this.proposeReassignment(a.id, "Doctor marked " + d.status)) proposed++;
      }
    });
  this.toast(proposed ? proposed + " appointment(s) have a reassignment proposal" : "Availability saved");
  this.render();
};

/* ============================= admin screens ============================= */
const baseAdminDashboard = App.adminDashboard;
App.adminDashboard = function () {
  const db = Store.data;
  const today = todayStr();
  const available = db.doctors.filter((d) => d.status === "Available").length;
  const unavailable = db.doctors.length - available;
  const emergencies = db.appointments.filter((a) => a.priority === "Emergency" && a.status !== "Cancelled").length;
  const pendingReassign = db.appointments.filter((a) => a.reassignmentStatus === "Proposed").length;
  const head = `
  <div class="card alert-warn" style="padding:12px 14px;margin-bottom:14px;font-size:12.5px;">
    Prototype security: role checks run in the browser over localStorage data. A production deployment must move authentication and authorization to a server.
  </div>
  <div class="stat-row" style="margin-bottom:14px;">
    ${this.statCard("Available doctors", String(available), "stethoscope")}
    ${this.statCard("Unavailable doctors", String(unavailable), "clock")}
    ${this.statCard("Emergency cases", String(emergencies), "heart")}
    ${this.statCard("Pending reassignments", String(pendingReassign), "users")}
  </div>`;
  const tail = `
  <div class="card" style="padding:16px;margin-top:14px;">
    <div class="font-display" style="font-weight:700;font-size:15px;margin-bottom:8px;">Recent activity (admin only)</div>
    ${
      (db.auditLog || []).slice(0, 6).map((l) => `<div style="font-size:13px;padding:6px 0;border-bottom:1px solid var(--border);">${esc(new Date(l.ts).toLocaleString("en-IN"))} · <b>${esc(l.user)}</b> (${esc(l.role)}) — ${esc(l.action)} · ${esc(l.target)}</div>`).join("") ||
      `<div style="color:var(--muted);font-size:13px;">No activity yet.</div>`
    }
    <button class="btn btn-ghost btn-sm" style="margin-top:10px;" onclick="App.navigate('#/admin/audit')">Open audit log</button>
  </div>`;
  return head + baseAdminDashboard.call(this) + tail;
};

App.adminAudit = function () {
  const logs = Store.data.auditLog || [];
  return `<div class="card"><div class="scrollx"><table>
    <thead><tr><th>Timestamp</th><th>User</th><th>Role</th><th>Action</th><th>Record</th><th>Status</th></tr></thead>
    <tbody>${
      logs.length
        ? logs
            .map(
              (l) =>
                `<tr><td>${esc(new Date(l.ts).toLocaleString("en-IN"))}</td><td>${esc(l.user)}</td><td>${esc(l.role)}</td><td>${esc(l.action)}</td><td>${esc(l.target)}</td><td>${esc(l.status)}</td></tr>`,
            )
            .join("")
        : `<tr><td colspan="6">${this.emptyState("No audit entries yet")}</td></tr>`
    }</tbody>
  </table></div></div>`;
};

App.adminAvailability = function () {
  const db = Store.data;
  return `
  <div class="card" style="padding:16px;margin-bottom:12px;font-size:13px;color:var(--muted);">Set working days, hours, breaks, limits and leave. Marking a doctor unavailable proposes reassignment for their upcoming appointments — patients confirm before anything changes.</div>
  ${db.doctors
    .map(
      (d) => `<div class="card" style="padding:16px;margin-bottom:12px;">
    <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center;">
      <div><div style="font-weight:700;">${esc(d.name)}</div><div style="font-size:12.5px;color:var(--muted);">${esc(d.specialization)} · ${esc(d.days.join(", "))} · ${esc(d.start)}–${esc(d.end)} · ${d.slot} min slots</div></div>
      ${this.availabilityBadge(d)}
    </div>
    <div class="form-grid" style="margin-top:12px;">
      <div><label class="field-label">Status</label><select class="input" id="st_${d.id}">${["Available", "Busy", "On Leave", "Offline"].map((s) => `<option ${d.status === s ? "selected" : ""}>${s}</option>`).join("")}</select></div>
      <div><label class="field-label">Start</label><input class="input" id="s_${d.id}" type="time" value="${esc(d.start)}"></div>
      <div><label class="field-label">End</label><input class="input" id="e_${d.id}" type="time" value="${esc(d.end)}"></div>
      <div><label class="field-label">Break from</label><input class="input" id="bs_${d.id}" type="time" value="${esc(d.breakStart || "")}"></div>
      <div><label class="field-label">Break to</label><input class="input" id="be_${d.id}" type="time" value="${esc(d.breakEnd || "")}"></div>
      <div><label class="field-label">Slot (min)</label><input class="input" id="sl_${d.id}" type="number" min="5" step="5" value="${d.slot}"></div>
      <div><label class="field-label">Max per day</label><input class="input" id="mx_${d.id}" type="number" min="1" value="${d.maxPerDay}"></div>
      <div><label class="field-label">Leave date</label><input class="input" id="lv_${d.id}" type="date"></div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
      <button class="btn btn-primary btn-sm" onclick="App.adminSaveAvailability('${d.id}')">${esc(t("save"))}</button>
      <button class="btn btn-ghost btn-sm" onclick="App.adminMarkEmergencyLeave('${d.id}')">Mark emergency unavailable</button>
    </div>
    <div style="font-size:12.5px;color:var(--muted);margin-top:8px;">Leave: ${d.leaveDates.length ? d.leaveDates.join(", ") : "none"}</div>
  </div>`,
    )
    .join("")}`;
};

App.requireAdmin = function () {
  const u = this.currentUser();
  const s = Session.get();
  if (!u || u.role !== "admin" || !(s && s.adminAuthed)) {
    Audit.log("Unauthorised admin action blocked", location.hash, "Denied");
    this.toast(t("accessDenied"));
    return false;
  }
  return true;
};

App.adminSaveAvailability = function (id) {
  if (!this.requireAdmin()) return;
  const d = this.doctorById(id);
  const v = (x) => (document.getElementById(x + "_" + id) || {}).value;
  d.status = v("st");
  d.start = v("s") || d.start;
  d.end = v("e") || d.end;
  d.breakStart = v("bs") || "";
  d.breakEnd = v("be") || "";
  d.slot = Number(v("sl")) || d.slot;
  d.maxPerDay = Number(v("mx")) || d.maxPerDay;
  const lv = v("lv");
  if (lv && !d.leaveDates.includes(lv)) d.leaveDates.push(lv);
  Store.save();
  Audit.log("Doctor schedule updated", d.name, "Success");
  this.saveDoctorStatusEffects(d);
};

App.adminMarkEmergencyLeave = function (id) {
  if (!this.requireAdmin()) return;
  const d = this.doctorById(id);
  d.status = "On Leave";
  const today = todayStr();
  if (!d.leaveDates.includes(today)) d.leaveDates.push(today);
  Store.save();
  Audit.log("Doctor marked unavailable (emergency)", d.name, "Success");
  this.saveDoctorStatusEffects(d);
};

App.saveDoctorStatusEffects = function (d) {
  const today = todayStr();
  let proposed = 0;
  Store.data.appointments
    .filter((a) => a.doctorId === d.id && a.date >= today && a.status !== "Cancelled" && a.status !== "Completed")
    .forEach((a) => {
      if (d.status !== "Available" || d.leaveDates.includes(a.date) || !checkAvailability(d, a.date, a.time).ok) {
        if (this.proposeReassignment(a.id, "Doctor marked " + d.status)) proposed++;
      }
    });
  this.toast(proposed ? "Saved · " + proposed + " reassignment proposal(s) created" : "Saved");
  this.render();
};

App.adminReferrals = function () {
  const db = Store.data;
  const ourSpecs = [...new Set(db.doctors.filter((d) => d.status === "Available").map((d) => d.specialization))];
  const missing = [...new Set(NEARBY_HOSPITALS.flatMap((h) => h.departments))].filter((s) => !ourSpecs.includes(s));
  return `
  <div class="card" style="padding:16px;margin-bottom:12px;">
    <div class="font-display" style="font-weight:700;font-size:15px;">Hospital-to-hospital referrals</div>
    <p style="font-size:13px;color:var(--muted);margin-top:4px;">Departments not currently covered here: ${missing.length ? esc(missing.join(", ")) : "none — all departments are staffed."} Distances are demo data; connect a maps API for live values.</p>
  </div>
  ${NEARBY_HOSPITALS.map((h) => this.hospitalCard(h)).join("")}`;
};

App.adminHospital = function () {
  const h = Store.data.hospital;
  return `
  <div class="card" style="padding:20px;max-width:620px;">
    <div class="font-display" style="font-weight:700;font-size:16px;margin-bottom:10px;">Hospital settings</div>
    <div class="form-grid">
      <div><label class="field-label">Hospital name</label><input class="input" id="hName" value="${esc(h.name)}"></div>
      <div><label class="field-label">Phone</label><input class="input" id="hPhone" value="${esc(h.phone)}"></div>
      <div style="grid-column:1/-1;"><label class="field-label">Address</label><input class="input" id="hAddr" value="${esc(h.address)}"></div>
      <div><label class="field-label">Emergency number</label><input class="input" id="hEmg" value="${esc(h.emergencyNumber)}"></div>
      <div><label class="field-label">Emergency desk</label><input class="input" id="hDesk" value="${esc(h.emergencyDesk)}"></div>
    </div>
    <button class="btn btn-primary" style="margin-top:14px;" onclick="App.saveHospital()">${esc(t("save"))}</button>
    <p class="disclaimer">Security settings: prototype sessions expire after ${SESSION_MINUTES} minutes of inactivity and are cleared on sign out. Passwords are never displayed in the interface.</p>
  </div>`;
};
App.saveHospital = function () {
  if (!this.requireAdmin()) return;
  const h = Store.data.hospital;
  h.name = document.getElementById("hName").value.trim() || h.name;
  h.phone = document.getElementById("hPhone").value.trim();
  h.address = document.getElementById("hAddr").value.trim();
  h.emergencyNumber = document.getElementById("hEmg").value.trim() || "108";
  h.emergencyDesk = document.getElementById("hDesk").value.trim();
  Store.save();
  Audit.log("Hospital settings changed", h.name, "Success");
  this.toast("Hospital settings saved");
};

/* ------------------- admin appointment reassignment action --------------- */
const baseApptRows = App.apptRows;
App.apptRows = function (list, role) {
  const rows = baseApptRows.call(this, list, role);
  return rows;
};

const baseAdminAppointments = App.adminAppointments;
App.adminAppointments = function () {
  const db = Store.data;
  const flagged = db.appointments.filter((a) => a.priority === "Emergency" || a.priority === "Urgent" || a.reassignmentStatus === "Proposed");
  const head = flagged.length
    ? `<div class="card" style="padding:16px;margin-bottom:12px;">
      <div class="font-display" style="font-weight:700;font-size:15px;margin-bottom:8px;">Priority & reassignment queue</div>
      ${flagged
        .map((a) => {
          const p = this.patientById(a.patientId);
          const d = this.doctorById(a.doctorId);
          return `<div class="card ${a.priority === "Emergency" ? "alert-danger" : a.priority === "Urgent" ? "alert-warn" : ""}" style="padding:12px;margin-bottom:8px;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center;">
          <div><div style="font-weight:700;">${esc(a.id)} · ${esc(p ? p.name : "—")}</div>
          <div style="font-size:12.5px;color:var(--muted);">${esc(d ? d.name : "—")} · ${fmtDateShort(a.date)} ${esc(a.time)} · ${esc(a.consultationType || "In person")}</div>
          ${a.reassignmentStatus ? `<div style="font-size:12.5px;">Reassignment: ${esc(a.reassignmentStatus)}${a.reassignmentReason ? " · " + esc(a.reassignmentReason) : ""}</div>` : ""}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">${this.priorityBadge(a.priority)}
            <button class="btn btn-ghost btn-sm" onclick="App.adminProposeReassign('${a.id}')">Find replacement</button>
            ${a.reassignmentStatus === "Proposed" ? `<button class="btn btn-primary btn-sm" onclick="App.acceptReassignment('${a.id}')">Approve reassignment</button>` : ""}
          </div>
        </div>`;
        })
        .join("")}
    </div>`
    : "";
  return head + baseAdminAppointments.call(this);
};

App.adminProposeReassign = function (apptId) {
  if (!this.requireAdmin()) return;
  const res = this.proposeReassignment(apptId, "Admin initiated");
  if (!res) {
    const a = Store.data.appointments.find((x) => x.id === apptId);
    const d = a ? this.doctorById(a.doctorId) : null;
    this.toast(t("noSpecialist") + " See Referrals for nearby hospitals" + (d ? " with " + d.specialization : "") + ".");
  } else {
    this.toast("Proposed " + res.doctor.name + " — waiting for confirmation");
  }
  this.render();
};

/* --------------------- registration validation upgrade ------------------- */
const baseRegister = App.doRegister;
App.doRegister = function (e) {
  e.preventDefault();
  const f = e.target;
  const email = normalizeEmail(f.email.value);
  if (!String(f.name.value || "").trim()) {
    this.toast(t("required"));
    return false;
  }
  if (!isValidEmail(email)) {
    this.toast(t("invalidEmail"));
    return false;
  }
  if (!String(f.password.value || "").trim()) {
    this.toast(t("passwordRequired"));
    return false;
  }
  f.email.value = email;
  const res = baseRegister.call(this, e);
  const u = this.currentUser();
  if (u) {
    const s = Session.get();
    Session.set({ userId: u.id, role: u.role, expires: Date.now() + SESSION_MINUTES * 60 * 1000 });
    const p = this.patientById(u.linkedId);
    if (p) {
      p.preferredLanguage = I18n.get() || "en";
      Store.save();
    }
    Audit.log("Patient registered", u.email, "Success");
  }
  return res;
};

/* --------------- patient record privacy: hide other patients ------------- */
const basePatientProfile = App.patientProfile;
App.patientProfile = function (id, role) {
  const u = this.currentUser();
  const s = Session.get();
  if (!u) return this.denied();
  if (u.role === "patient" && id !== u.linkedId) {
    Audit.log("Blocked cross-patient profile access", id, "Denied");
    return this.denied();
  }
  if (u.role === "doctor") {
    const authorised = Store.data.appointments.some((a) => a.patientId === id && a.doctorId === u.linkedId);
    if (!authorised) {
      Audit.log("Blocked unauthorised patient access", id, "Denied");
      return this.denied();
    }
  }
  if (u.role === "admin" && !(s && s.adminAuthed)) return this.denied();
  Audit.log("Record accessed", id, "Success");
  return basePatientProfile.call(this, id, role);
};

window.App = App;
export { Audit, migrate };
