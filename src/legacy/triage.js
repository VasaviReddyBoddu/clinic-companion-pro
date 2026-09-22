/* Symptom -> department matching (keyword based, prototype only).
   This is NOT a diagnosis engine. It only suggests which department to visit. */
/* eslint-disable */

const RULES = [
  {
    spec: "Cardiology",
    icon: "❤️",
    words: ["chest pain", "chest", "heart", "heart attack", "palpitation", "palpitations", "bp", "blood pressure", "cholesterol", "angina", "గుండె", "ఛాతీ", "दिल", "छाती", "सीने"],
  },
  {
    spec: "Dermatology",
    icon: "🧴",
    words: ["skin", "rash", "acne", "pimple", "itching", "allergy", "eczema", "hair fall", "చర్మం", "దురద", "त्वचा", "खुजली", "मुँहासे", "दाने"],
  },
  {
    spec: "Orthopedics",
    icon: "🦴",
    words: ["bone", "fracture", "joint", "knee", "back pain", "shoulder", "sprain", "arthritis", "ఎముక", "మోకాలు", "నడుము", "हड्डी", "जोड़", "घुटना", "कमर"],
  },
  {
    spec: "Pediatrics",
    icon: "🧒",
    words: ["child", "baby", "kid", "infant", "child fever", "child cough", "పిల్ల", "బిడ్డ", "बच्चा", "बच्चे", "शिशु"],
  },
  {
    spec: "General Medicine",
    icon: "🩺",
    words: ["fever", "cold", "cough", "weakness", "headache", "vomiting", "stomach", "body pain", "tired", "జ్వరం", "జలుబు", "దగ్గు", "నీరసం", "बुखार", "सर्दी", "खांसी", "कमज़ोरी", "सिरदर्द"],
  },
];

const EMERGENCY_WORDS = [
  "heart attack",
  "severe chest pain",
  "cannot breathe",
  "can't breathe",
  "difficulty breathing",
  "breathless",
  "unconscious",
  "fainted",
  "severe bleeding",
  "heavy bleeding",
  "stroke",
  "paralysis",
  "seizure",
  "poison",
  "గుండెపోటు",
  "శ్వాస",
  "రక్తస్రావం",
  "స్పృహ",
  "दिल का दौरा",
  "साँस",
  "बेहोश",
  "खून बह",
];

export function isEmergencyText(text) {
  const s = String(text || "").toLowerCase();
  return EMERGENCY_WORDS.some((w) => s.includes(w.toLowerCase()));
}

/** Returns { spec, icon, score } or null */
export function suggestSpecialization(text) {
  const s = String(text || "").toLowerCase().trim();
  if (!s) return null;
  let best = null;
  for (const r of RULES) {
    let score = 0;
    for (const w of r.words) {
      if (s.includes(w.toLowerCase())) score += w.includes(" ") ? 3 : 2;
    }
    if (score > 0 && (!best || score > best.score)) best = { spec: r.spec, icon: r.icon, score };
  }
  return best || { spec: "General Medicine", icon: "🩺", score: 0 };
}

export const SPEC_ICONS = RULES.reduce((acc, r) => {
  acc[r.spec] = r.icon;
  return acc;
}, {});

/* Mock nearby hospital data. Replace with a real maps/location API in production. */
export const NEARBY_HOSPITALS = [
  {
    id: "H-201",
    name: "Sunrise Super Speciality",
    address: "Road No. 12, Banjara Hills, Hyderabad",
    phone: "040 2345 1100",
    distanceKm: 2.4,
    emergency: true,
    departments: ["Cardiology", "General Medicine", "Orthopedics", "Neurology"],
    doctor: "Dr. Naveen Rao",
    nextSlot: "11:30",
  },
  {
    id: "H-202",
    name: "CityCare Hospital",
    address: "Gachibowli Main Road, Hyderabad",
    phone: "040 2345 2200",
    distanceKm: 5.1,
    emergency: true,
    departments: ["Cardiology", "Pediatrics", "Dermatology"],
    doctor: "Dr. Shruthi Mohan",
    nextSlot: "12:15",
  },
  {
    id: "H-203",
    name: "Lakeview Multispeciality",
    address: "Kukatpally, Hyderabad",
    phone: "040 2345 3300",
    distanceKm: 8.7,
    emergency: false,
    departments: ["Orthopedics", "General Medicine", "Dermatology", "Pediatrics"],
    doctor: "Dr. Imran Qureshi",
    nextSlot: "16:00",
  },
];

export function hospitalsFor(spec) {
  return NEARBY_HOSPITALS.filter((h) => h.departments.includes(spec));
}
