/* Browser voice helpers: speech recognition, speech synthesis, audio recording.
   All of this runs fully in the browser — no backend required. */
/* eslint-disable */
import { I18n, t } from "./i18n.js";

export const Speech = {
  rec: null,
  active: false,
  supported() {
    return typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  },
  /** onResult(text, isFinal), onError(message), onEnd() */
  start({ onResult, onError, onEnd, continuous = false } = {}) {
    if (!this.supported()) {
      onError && onError(t("noSpeech"));
      return false;
    }
    this.stop();
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new Ctor();
    rec.lang = I18n.bcp47();
    rec.interimResults = true;
    rec.continuous = continuous;
    rec.onresult = (e) => {
      let text = "";
      let isFinal = false;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
        if (e.results[i].isFinal) isFinal = true;
      }
      onResult && onResult(text.trim(), isFinal);
    };
    rec.onerror = (e) => {
      const msg =
        e.error === "not-allowed" || e.error === "service-not-allowed"
          ? t("micDenied")
          : e.error === "no-speech"
            ? "No speech detected. Please try again."
            : "Speech recognition error: " + e.error;
      onError && onError(msg);
    };
    rec.onend = () => {
      this.active = false;
      onEnd && onEnd();
    };
    try {
      rec.start();
      this.rec = rec;
      this.active = true;
      return true;
    } catch (err) {
      onError && onError("Could not start listening. Please try again.");
      return false;
    }
  },
  stop() {
    if (this.rec) {
      try {
        this.rec.onend = null;
        this.rec.stop();
      } catch (e) {}
      this.rec = null;
    }
    this.active = false;
  },
};

export const Tts = {
  muted: false,
  supported() {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  },
  speak(text, onDone) {
    if (!this.supported() || this.muted || !text) {
      onDone && onDone();
      return false;
    }
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text));
      u.lang = I18n.bcp47();
      const voices = window.speechSynthesis.getVoices() || [];
      const v = voices.find((x) => x.lang === u.lang) || voices.find((x) => x.lang && x.lang.split("-")[0] === u.lang.split("-")[0]);
      if (v) u.voice = v;
      u.onend = () => onDone && onDone();
      window.speechSynthesis.speak(u);
      return true;
    } catch (e) {
      onDone && onDone();
      return false;
    }
  },
  stop() {
    if (this.supported()) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
  },
};

export const Recorder = {
  mediaRecorder: null,
  stream: null,
  chunks: [],
  url: null,
  seconds: 0,
  timer: null,
  async start(onTick, onError) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === "undefined") {
      onError && onError("Audio recording is not supported in this browser.");
      return false;
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      onError && onError(t("micDenied"));
      return false;
    }
    this.chunks = [];
    this.seconds = 0;
    this.mediaRecorder = new MediaRecorder(this.stream);
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size) this.chunks.push(e.data);
    };
    this.mediaRecorder.start();
    this.timer = setInterval(() => {
      this.seconds++;
      onTick && onTick(this.seconds);
    }, 1000);
    return true;
  },
  stop() {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) return resolve(null);
      clearInterval(this.timer);
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: "audio/webm" });
        if (this.url) URL.revokeObjectURL(this.url);
        this.url = URL.createObjectURL(blob);
        this.release();
        resolve({ url: this.url, seconds: this.seconds });
      };
      try {
        this.mediaRecorder.stop();
      } catch (e) {
        this.release();
        resolve(null);
      }
    });
  },
  discard() {
    clearInterval(this.timer);
    if (this.url) {
      URL.revokeObjectURL(this.url);
      this.url = null;
    }
    this.release();
    this.seconds = 0;
  },
  release() {
    if (this.stream) {
      this.stream.getTracks().forEach((tr) => tr.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
  },
};

export function fmtClock(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return m + ":" + s;
}
