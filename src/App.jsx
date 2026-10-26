import React, { useState, useEffect, useMemo } from "react";
import {
  Dumbbell,
  Flame,
  Utensils,
  ShoppingCart,
  TrendingUp,
  User,
  Play,
  Pause,
  CheckCircle2,
  RefreshCw,
  Plus,
  Trash2,
  ShieldCheck,
  Database,
  ChevronRight,
  Clock,
  Award,
  Search,
  Video,
  X,
  Sparkles,
  Check,
  ArrowRight,
  Menu,
  Activity,
  Scale,
  Edit3,
  RotateCcw,
  Download,
  AlertTriangle,
  ExternalLink,
  Layers,
  Sliders,
  Crown,
  Lock,
  LogOut
} from "lucide-react";
import { supabase } from "./supabaseClient";

// ============================================================================
// 0. PROFESSIONAL VECTOR BRAND EMBLEM (FITFORGE CUSTOM SVG LOGO)
// ============================================================================

function FitForgeLogo({ size = "md", onClick }) {
  const dimensions = size === "lg" ? "w-11 h-11" : "w-9 h-9";
  return (
    <div
      onClick={onClick}
      className="inline-flex items-center gap-3 cursor-pointer group select-none"
    >
      <div
        className={`${dimensions} relative rounded-xl bg-[#0B0D0F] border border-[#B8F34A]/50 flex items-center justify-center shadow-lg shadow-[#B8F34A]/10 group-hover:border-[#B8F34A] transition`}
      >
        <svg viewBox="0 0 48 48" className="w-7 h-7">
          <defs>
            <linearGradient id="forgeLimeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D4FF70" />
              <stop offset="100%" stopColor="#9EE022" />
            </linearGradient>
          </defs>
          <polygon
            points="24,3 43,13 43,35 24,45 5,35 5,13"
            fill="#15191D"
            stroke="url(#forgeLimeGrad)"
            strokeWidth="2.5"
          />
          <rect x="9" y="17" width="3.5" height="14" rx="1.5" fill="url(#forgeLimeGrad)" />
          <rect x="13.5" y="19.5" width="2.5" height="9" rx="1" fill="#ffffff" />
          <rect x="35.5" y="17" width="3.5" height="14" rx="1.5" fill="url(#forgeLimeGrad)" />
          <rect x="32" y="19.5" width="2.5" height="9" rx="1" fill="#ffffff" />
          <path
            d="M16,22.5 L32,22.5 L29,26.5 L27,32 L21,32 L19,26.5 Z"
            fill="url(#forgeLimeGrad)"
          />
          <line x1="12" y1="24" x2="36" y2="24" stroke="#0B0D0F" strokeWidth="2" />
        </svg>
      </div>
      <div>
        <div className="flex items-center gap-1.5">
          <span className="font-black tracking-tight text-lg text-white leading-none">
            FIT<span className="text-[#B8F34A]">FORGE</span>
          </span>
          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-[#B8F34A]/15 text-[#B8F34A] border border-[#B8F34A]/30">
            PRO
          </span>
        </div>
        <span className="block text-[10px] font-semibold text-gray-400 tracking-widest uppercase mt-0.5">
          TRAINING & NUTRITION OS
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// 1. DETERMINISTIC ALGORITHMS & UNIT-TESTABLE PURE FUNCTIONS
// ============================================================================

export function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm || heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
}

export function calculateBMR(weightKg, heightCm, age, sex) {
  if (!weightKg || !heightCm || !age) return 0;
  const base = 10 * Number(weightKg) + 6.25 * Number(heightCm) - 5 * Number(age);
  return Math.round(sex === "female" ? base - 161 : base + 5);
}

export function calculateTDEE(bmr, activityMultiplier) {
  return Math.round(bmr * Number(activityMultiplier || 1.375));
}

export function calculateNutritionTargets(profile) {
  const { weightKg, heightCm, age, sex, activityMultiplier, goal, manualCalorieOverride } = profile;
  const bmi = calculateBMI(weightKg, heightCm);
  const bmr = calculateBMR(weightKg, heightCm, age, sex);
  const tdee = calculateTDEE(bmr, activityMultiplier);

  let calorieAdjustment = 0;
  if (goal === "fat_loss") calorieAdjustment = -400;
  if (goal === "muscle_gain") calorieAdjustment = 250;
  if (goal === "recomp") calorieAdjustment = -150;
  if (goal === "strength") calorieAdjustment = 150;
  if (goal === "general_fitness") calorieAdjustment = 0;

  const rawCalories = manualCalorieOverride ? Number(manualCalorieOverride) : tdee + calorieAdjustment;
  const minSafeCalories = sex === "female" ? 1250 : 1500;
  const isUnreasonablyLow = rawCalories < minSafeCalories;
  const isUnreasonablyHigh = rawCalories > tdee + 900;
  const targetCalories = Math.max(1000, rawCalories);

  const proteinPerKg = goal === "fat_loss" || goal === "recomp" ? 2.0 : 1.8;
  const fatPerKg = 0.85;

  const proteinGrams = Math.round(weightKg * proteinPerKg);
  const fatGrams = Math.round(weightKg * fatPerKg);
  const remainingCalories = Math.max(0, targetCalories - (proteinGrams * 4 + fatGrams * 9));
  const carbGrams = Math.round(remainingCalories / 4);
  const reconciledCalories = proteinGrams * 4 + carbGrams * 4 + fatGrams * 9;

  return {
    bmi,
    bmr,
    tdee,
    calorieAdjustment,
    dailyCalories: reconciledCalories,
    proteinGrams,
    carbGrams,
    fatGrams,
    isUnreasonablyLow,
    isUnreasonablyHigh
  };
}

export function evaluateProgressiveOverload(sets, repRangeMax) {
  if (!sets || sets.length === 0) {
    return { readyForIncrease: false, suggestion: "Log working sets to unlock guidance." };
  }
  const workingSets = sets.filter((s) => !s.isWarmup && s.completed);
  if (workingSets.length === 0) {
    return { readyForIncrease: false, suggestion: "Mark working sets as completed." };
  }
  const allHitTopRange = workingSets.every((s) => Number(s.reps) >= repRangeMax);
  const maxWeight = Math.max(...workingSets.map((s) => Number(s.weight) || 0));

  if (allHitTopRange) {
    return {
      readyForIncrease: true,
      nextWeight: maxWeight + 2.5,
      suggestion: `Target achieved! Increase load to ${maxWeight + 2.5} kg next session.`
    };
  }
  return {
    readyForIncrease: false,
    nextWeight: maxWeight,
    suggestion: `Hold load at ${maxWeight} kg and build reps toward ${repRangeMax}.`
  };
}

// ============================================================================
// 2. EXERCISE DATABASE & FOODS
// ============================================================================

const EXERCISES_DB = [
  {
    id: "ex_bench_press",
    name: "Barbell Bench Press",
    muscleGroup: "Chest",
    secondaryMuscles: ["Triceps", "Anterior Deltoid"],
    equipment: "Full Gym",
    difficulty: "Intermediate",
    repRange: [6, 10],
    defaultSets: 3,
    restSeconds: 120,
    rir: "1-2 RIR",
    jointFlags: ["shoulder"],
    motionType: "bench_press",
    thumbnailUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=900&q=80",
    youtubeEmbedId: "vcBig73ojpE",
    cues: ["Retract shoulder blades into pad.", "Plant feet flat on the floor.", "Lower bar to mid-chest."]
  },
  {
    id: "ex_incline_db_press",
    name: "Incline Dumbbell Bench Press (30°)",
    muscleGroup: "Chest",
    secondaryMuscles: ["Upper Pectorals", "Triceps"],
    equipment: "Dumbbells",
    difficulty: "Beginner",
    repRange: [8, 12],
    defaultSets: 3,
    restSeconds: 90,
    rir: "1-2 RIR",
    jointFlags: [],
    motionType: "bench_press",
    thumbnailUrl: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=900&q=80",
    youtubeEmbedId: "8iPEnn-ltC8",
    cues: ["Set bench to 30 degrees.", "Lower dumbbells into a deep stretch."]
  },
  {
    id: "ex_lat_pulldown",
    name: "Wide-Grip Lat Pulldown",
    muscleGroup: "Back",
    secondaryMuscles: ["Biceps", "Rear Delts"],
    equipment: "Full Gym",
    difficulty: "Beginner",
    repRange: [8, 12],
    defaultSets: 3,
    restSeconds: 90,
    rir: "1-2 RIR",
    jointFlags: [],
    motionType: "lat_pulldown",
    thumbnailUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80",
    youtubeEmbedId: "CAwf7n6Luuc",
    cues: ["Keep chest tall.", "Drive elbows down toward hips."]
  },
  {
    id: "ex_barbell_row",
    name: "Pendlay / Bent-Over Barbell Row",
    muscleGroup: "Back",
    secondaryMuscles: ["Lats", "Rhomboids"],
    equipment: "Full Gym",
    difficulty: "Intermediate",
    repRange: [6, 10],
    defaultSets: 3,
    restSeconds: 120,
    rir: "2 RIR",
    jointFlags: ["lower_back"],
    motionType: "row",
    thumbnailUrl: "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=900&q=80",
    youtubeEmbedId: "FWJR5Ve8bnQ",
    cues: ["Hinge hips back.", "Row bar into lower ribcage."]
  },
  {
    id: "ex_ohp",
    name: "Seated Dumbbell Overhead Press",
    muscleGroup: "Shoulders",
    secondaryMuscles: ["Triceps"],
    equipment: "Dumbbells",
    difficulty: "Beginner",
    repRange: [8, 12],
    defaultSets: 3,
    restSeconds: 90,
    rir: "1-2 RIR",
    jointFlags: ["shoulder"],
    motionType: "overhead_press",
    thumbnailUrl: "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?auto=format&fit=crop&w=900&q=80",
    youtubeEmbedId: "qEwKCR5JCog",
    cues: ["Press in scapular plane.", "Keep ribcage stacked over pelvis."]
  },
  {
    id: "ex_lateral_raise",
    name: "Dumbbell Lateral Raise",
    muscleGroup: "Shoulders",
    secondaryMuscles: ["Lateral Deltoid"],
    equipment: "Dumbbells",
    difficulty: "Beginner",
    repRange: [12, 16],
    defaultSets: 3,
    restSeconds: 60,
    rir: "1 RIR",
    jointFlags: [],
    motionType: "overhead_press",
    thumbnailUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=900&q=80",
    youtubeEmbedId: "3VcKaXpzqRo",
    cues: ["Hinge forward slightly.", "Push dumbbells out toward side walls."]
  },
  {
    id: "ex_barbell_squat",
    name: "Barbell Back Squat",
    muscleGroup: "Legs",
    secondaryMuscles: ["Quadriceps", "Glutes", "Core"],
    equipment: "Full Gym",
    difficulty: "Intermediate",
    repRange: [6, 10],
    defaultSets: 3,
    restSeconds: 150,
    rir: "2 RIR",
    jointFlags: ["knee", "lower_back"],
    motionType: "squat",
    thumbnailUrl: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=900&q=80",
    youtubeEmbedId: "ultWZbUMPL8",
    cues: ["Take a 360° breath into core.", "Sit down between hips."]
  },
  {
    id: "ex_rdl",
    name: "Romanian Deadlift (RDL)",
    muscleGroup: "Legs",
    secondaryMuscles: ["Hamstrings", "Glutes"],
    equipment: "Dumbbells",
    difficulty: "Intermediate",
    repRange: [8, 12],
    defaultSets: 3,
    restSeconds: 120,
    rir: "2 RIR",
    jointFlags: ["lower_back"],
    motionType: "hinge",
    thumbnailUrl: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=900&q=80",
    youtubeEmbedId: "JCXUYuzwNrM",
    cues: ["Unlock knees slightly and push hips back.", "Keep weights close to thighs."]
  },
  {
    id: "ex_plank",
    name: "RKC Hard-Style Core Plank",
    muscleGroup: "Core",
    secondaryMuscles: ["Rectus Abdominis"],
    equipment: "Bodyweight",
    difficulty: "Beginner",
    repRange: [10, 15],
    defaultSets: 3,
    restSeconds: 60,
    rir: "1 RIR",
    jointFlags: [],
    motionType: "pushup",
    thumbnailUrl: "https://images.unsplash.com/photo-1566241440091-ec10de8db2e1?auto=format&fit=crop&w=900&q=80",
    youtubeEmbedId: "ASdvN_XEl_c",
    cues: ["Pull elbows toward toes.", "Squeeze quads and glutes hard."]
  }
];

const INITIAL_FOODS_DB = [
  { id: "food_chicken_breast", name: "Chicken Breast (Escalope de Poulet)", basis: "Raw", servingGrams: 150, calories: 180, protein: 34, carbs: 0, fat: 3.9, costTND: 3.2, costUSD: 1.05, category: "Meat & Poultry", role: "protein", allergens: [], isVegetarian: false, source: "USDA #171077", lastVerified: "Oct 2026" },
  { id: "food_sardines", name: "Fresh Grilled Sardines (Sardine Grillée)", basis: "Cooked", servingGrams: 150, calories: 310, protein: 37, carbs: 0, fat: 17, costTND: 2.1, costUSD: 0.7, category: "Fish", role: "protein", allergens: ["fish"], isVegetarian: false, source: "USDA #175139", lastVerified: "Oct 2026" },
  { id: "food_eggs", name: "Whole Chicken Eggs (3 Large)", basis: "Raw", servingGrams: 150, calories: 215, protein: 19, carbs: 1.1, fat: 14.3, costTND: 1.35, costUSD: 0.45, category: "Dairy", role: "protein", allergens: ["eggs"], isVegetarian: true, source: "USDA #748967", lastVerified: "Oct 2026" },
  { id: "food_couscous", name: "Steamed Whole-Wheat Couscous", basis: "Steamed", servingGrams: 220, calories: 246, protein: 8.4, carbs: 51, fat: 0.4, costTND: 0.85, costUSD: 0.28, category: "Grains", role: "carb", allergens: ["gluten"], isVegetarian: true, source: "USDA #169700", lastVerified: "Oct 2026" },
  { id: "food_oats", name: "Rolled Oats (Flocons d'Avoine)", basis: "Dry", servingGrams: 80, calories: 311, protein: 10.5, carbs: 54, fat: 5.5, costTND: 1.15, costUSD: 0.38, category: "Grains", role: "carb", allergens: ["gluten"], isVegetarian: true, source: "USDA #173904", lastVerified: "Oct 2026" },
  { id: "food_olive_oil", name: "Tunisian Olive Oil (1 Tbsp)", basis: "Liquid", servingGrams: 14, calories: 124, protein: 0, carbs: 0, fat: 14, costTND: 0.45, costUSD: 0.15, category: "Fats", role: "fat", allergens: [], isVegetarian: true, source: "USDA #171413", lastVerified: "Oct 2026" }
];

const POSE_LIBRARY = {
  squat: { label: "Squat Biomechanics", activeZone: "legs", start: { ankle: [165, 172], knee: [162, 130], hip: [158, 88], shoulder: [160, 44], elbow: [148, 60], hand: [156, 45], head: [163, 27], bar: [156, 44] }, end: { ankle: [165, 172], knee: [194, 134], hip: [130, 126], shoulder: [156, 82], elbow: [142, 96], hand: [152, 82], head: [162, 65], bar: [152, 82] } },
  bench_press: { label: "Horizontal Press", activeZone: "chest", start: { ankle: [228, 172], knee: [215, 132], hip: [175, 126], shoulder: [112, 124], elbow: [116, 92], hand: [112, 62], head: [92, 122], bar: [112, 60] }, end: { ankle: [228, 172], knee: [215, 132], hip: [175, 126], shoulder: [112, 124], elbow: [125, 138], hand: [120, 102], head: [92, 122], bar: [120, 100] } },
  lat_pulldown: { label: "Vertical Pull", activeZone: "back", start: { ankle: [195, 172], knee: [195, 136], hip: [156, 136], shoulder: [154, 90], elbow: [148, 56], hand: [156, 30], head: [156, 72], bar: [156, 30] }, end: { ankle: [195, 172], knee: [195, 136], hip: [156, 136], shoulder: [150, 92], elbow: [142, 118], hand: [162, 82], head: [152, 74], bar: [162, 82] } },
  row: { label: "Bent-Over Row", activeZone: "back", start: { ankle: [150, 172], knee: [166, 134], hip: [126, 96], shoulder: [182, 72], elbow: [182, 106], hand: [182, 134], head: [196, 62], bar: [182, 136] }, end: { ankle: [150, 172], knee: [166, 134], hip: [126, 96], shoulder: [182, 72], elbow: [148, 66], hand: [158, 96], head: [196, 62], bar: [158, 98] } },
  overhead_press: { label: "Vertical Press", activeZone: "shoulders", start: { ankle: [160, 172], knee: [160, 132], hip: [158, 90], shoulder: [158, 48], elbow: [152, 72], hand: [164, 44], head: [160, 30], bar: [164, 42] }, end: { ankle: [160, 172], knee: [160, 132], hip: [158, 90], shoulder: [158, 46], elbow: [158, 24], hand: [158, 8], head: [160, 30], bar: [158, 8] } },
  pushup: { label: "Push-Up", activeZone: "chest", start: { ankle: [82, 168], knee: [124, 150], hip: [166, 132], shoulder: [218, 110], elbow: [216, 140], hand: [218, 170], head: [236, 102], bar: [218, 170] }, end: { ankle: [82, 168], knee: [124, 160], hip: [166, 152], shoulder: [218, 146], elbow: [196, 148], hand: [218, 170], head: [236, 140], bar: [218, 170] } }
};

function lerpPoint(p1, p2, t) {
  return [p1[0] + (p2[0] - p1[0]) * t, p1[1] + (p2[1] - p1[1]) * t];
}

function RealisticBiomechanicalGifPlayer({ exercise }) {
  const [progress, setProgress] = useState(0);
  const [phaseLabel, setPhaseLabel] = useState("ECCENTRIC (2.0s)");
  const [isPaused, setIsPaused] = useState(false);
  const poseKey = POSE_LIBRARY[exercise?.motionType] ? exercise.motionType : "squat";
  const config = POSE_LIBRARY[poseKey];

  useEffect(() => {
    if (isPaused) return;
    let rafId;
    const startTime = performance.now();
    const cycleDurationMs = 3400;

    const animate = (now) => {
      const elapsed = (now - startTime) % cycleDurationMs;
      const norm = elapsed / cycleDurationMs;
      let t = 0;
      if (norm < 0.45) {
        t = 0.5 - 0.5 * Math.cos((norm / 0.45) * Math.PI);
        setPhaseLabel("ECCENTRIC • LOWERING (2.0s)");
      } else if (norm < 0.58) {
        t = 1;
        setPhaseLabel("ISOMETRIC • PEAK TENSION");
      } else if (norm < 0.9) {
        t = 1 - (0.5 - 0.5 * Math.cos(((norm - 0.58) / 0.32) * Math.PI));
        setPhaseLabel("CONCENTRIC • DRIVE (1.0s)");
      } else {
        t = 0;
        setPhaseLabel("LOCKOUT • RESET");
      }
      setProgress(t);
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [isPaused, poseKey]);

  const cur = {
    ankle: lerpPoint(config.start.ankle, config.end.ankle, progress),
    knee: lerpPoint(config.start.knee, config.end.knee, progress),
    hip: lerpPoint(config.start.hip, config.end.hip, progress),
    shoulder: lerpPoint(config.start.shoulder, config.end.shoulder, progress),
    elbow: lerpPoint(config.start.elbow, config.end.elbow, progress),
    hand: lerpPoint(config.start.hand, config.end.hand, progress),
    head: lerpPoint(config.start.head, config.end.head, progress),
    bar: lerpPoint(config.start.bar, config.end.bar, progress)
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between bg-[#0B0D0F] p-4 select-none overflow-hidden">
      <div className="z-10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#15191D] border border-[#B8F34A]/40 text-[11px] font-bold text-[#B8F34A]">
          <span className="w-2 h-2 rounded-full bg-[#B8F34A] animate-ping" />
          <span>60FPS GIF LOOP: {config.label}</span>
        </div>
        <button onClick={() => setIsPaused(!isPaused)} className="px-2 py-1 rounded bg-white/10 hover:bg-[#B8F34A] hover:text-black font-bold text-white transition text-xs">
          {isPaused ? "Play" : "Pause"}
        </button>
      </div>
      <div className="z-10 flex-1 flex items-center justify-center my-1">
        <svg viewBox="0 0 320 190" className="w-full max-w-[380px] h-[180px]">
          <line x1="20" y1="176" x2="300" y2="176" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
          <line x1={cur.ankle[0]} y1={cur.ankle[1]} x2={cur.knee[0]} y2={cur.knee[1]} stroke="#94a3b8" strokeWidth="10" strokeLinecap="round" />
          <line x1={cur.knee[0]} y1={cur.knee[1]} x2={cur.hip[0]} y2={cur.hip[1]} stroke="#B8F34A" strokeWidth="13" strokeLinecap="round" />
          <line x1={cur.hip[0]} y1={cur.hip[1]} x2={cur.shoulder[0]} y2={cur.shoulder[1]} stroke="#e2e8f0" strokeWidth="15" strokeLinecap="round" />
          <circle cx={cur.head[0]} cy={cur.head[1]} r="11" fill="#f8fafc" />
          <line x1={cur.shoulder[0]} y1={cur.shoulder[1]} x2={cur.elbow[0]} y2={cur.elbow[1]} stroke="#cbd5e1" strokeWidth="9" strokeLinecap="round" />
          <line x1={cur.elbow[0]} y1={cur.elbow[1]} x2={cur.hand[0]} y2={cur.hand[1]} stroke="#94a3b8" strokeWidth="8" strokeLinecap="round" />
          <circle cx={cur.bar[0]} cy={cur.bar[1]} r="13" fill="#15191D" stroke="#B8F34A" strokeWidth="3.5" />
        </svg>
      </div>
      <div className="z-10 bg-[#15191D] border border-white/10 rounded-xl p-2.5 flex items-center justify-between text-xs">
        <span className="font-extrabold text-[#B8F34A]">{phaseLabel}</span>
        <span className="text-xs font-mono text-white">{Math.round(progress * 100)}%</span>
      </div>
    </div>
  );
}

function ExerciseVideoModal({ exercise, onClose }) {
  const [videoTab, setVideoTab] = useState("gif_loop");
  if (!exercise) return null;
  const directYoutubeWatchUrl = `https://www.youtube.com/watch?v=${exercise.youtubeEmbedId}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#15191D] border border-white/15 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0B0D0F]">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-[#B8F34A]/15 text-[#B8F34A]"><Activity className="w-5 h-5" /></span>
            <div>
              <h3 className="text-lg font-bold text-white">{exercise.name} — Biomechanical GIF & Video</h3>
              <p className="text-xs text-gray-400">Primary: {exercise.muscleGroup} • {exercise.equipment}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-white transition"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 pt-4 flex items-center justify-between bg-[#15191D]">
          <div className="inline-flex rounded-lg bg-[#0B0D0F] p-1 border border-white/10">
            <button onClick={() => setVideoTab("gif_loop")} className={`px-3 py-1.5 rounded-md text-xs font-semibold ${videoTab === "gif_loop" ? "bg-[#B8F34A] text-black" : "text-gray-400"}`}>Realistic GIF Loop</button>
            <button onClick={() => setVideoTab("youtube")} className={`px-3 py-1.5 rounded-md text-xs font-semibold ${videoTab === "youtube" ? "bg-[#B8F34A] text-black" : "text-gray-400"}`}>YouTube Video</button>
          </div>
        </div>
        <div className="p-6">
          <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 bg-[#0B0D0F]">
            {videoTab === "gif_loop" ? (
              <RealisticBiomechanicalGifPlayer exercise={exercise} />
            ) : (
              <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${exercise.youtubeEmbedId}?rel=0`} title="Video" allowFullScreen />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function generateWorkoutSchedule(profile) {
  const { experience, daysPerWeek, equipment } = profile;
  if (daysPerWeek <= 3 || experience === "beginner") {
    return [
      { id: "day_fb_a", name: "Full Body Foundation A", durationMinutes: 50, focus: "Squat, Push, Pull", exercises: [EXERCISES_DB[6], EXERCISES_DB[0], EXERCISES_DB[2], EXERCISES_DB[8]] },
      { id: "day_fb_b", name: "Full Body Foundation B", durationMinutes: 50, focus: "Hinge, OHP, Row", exercises: [EXERCISES_DB[7], EXERCISES_DB[4], EXERCISES_DB[3], EXERCISES_DB[5]] }
    ].slice(0, daysPerWeek);
  }
  return [
    { id: "day_upper_a", name: "Upper Body Strength & Density A", durationMinutes: 60, focus: "Chest, Back, Delts", exercises: [EXERCISES_DB[0], EXERCISES_DB[3], EXERCISES_DB[4], EXERCISES_DB[5]] },
    { id: "day_lower_a", name: "Lower Body Quad & Glute A", durationMinutes: 60, focus: "Squat, RDL, Core", exercises: [EXERCISES_DB[6], EXERCISES_DB[7], EXERCISES_DB[8]] }
  ].slice(0, daysPerWeek);
}

// ============================================================================
// 8. MAIN APP COMPONENT WITH AUTH & 20 TND/MO PRO SUBSCRIPTION
// ============================================================================

const ATHLETE_PRESETS = [
  {
    id: "preset_hypertrophy",
    badge: "Intermediate Hypertrophy",
    profile: {
      name: "Aladin",
      age: 28,
      sex: "male",
      heightCm: 178,
      weightKg: 78.5,
      targetWeightKg: 82.0,
      goal: "muscle_gain",
      experience: "intermediate",
      daysPerWeek: 4,
      sessionMinutes: 60,
      equipment: "Full Gym",
      activityMultiplier: 1.55,
      jointLimitations: [],
      dietaryPreference: "omnivore",
      allergies: [],
      unitSystem: "metric",
      manualCalorieOverride: ""
    }
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Supabase Auth & PRO Subscription State
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // 'login' | 'signup'
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authFullName, setAuthFullName] = useState("");
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchUserProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchUserProfile(session.user.id);
      else setIsPremium(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId) => {
    if (!supabase) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (data) {
      setIsPremium(data.is_premium || false);
      if (data.full_name) setProfile(p => ({ ...p, name: data.full_name }));
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!supabase) {
      alert("Supabase not connected. Running in offline test mode.");
      setUser({ email: authEmail });
      setShowAuthModal(false);
      return;
    }

    if (authMode === "signup") {
      const { error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
        options: { data: { full_name: authFullName || "Athlete" } }
      });
      if (error) alert(error.message);
      else {
        alert("Account created! You are now logged in.");
        setShowAuthModal(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
      if (error) alert(error.message);
      else setShowAuthModal(false);
    }
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setIsPremium(false);
  };

  const handleUpgradeToPro = async () => {
    if (!supabase || !user) {
      setIsPremium(true);
      alert("FitForge PRO active in local test mode (20 TND/mo)");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ is_premium: true, subscription_plan: "pro_20dt", subscription_status: "active" })
      .eq("id", user.id);

    if (error) alert("Error activating subscription: " + error.message);
    else {
      setIsPremium(true);
      alert("Success! FitForge PRO is now active for 20 TND/month.");
    }
  };

  const [profile, setProfile] = useState(ATHLETE_PRESETS[0].profile);
  const [customPricesTND, setCustomPricesTND] = useState({});
  const [activeVideoExercise, setActiveVideoExercise] = useState(null);
  const [showPriceEditor, setShowPriceEditor] = useState(false);

  const foodsDb = useMemo(() => {
    return INITIAL_FOODS_DB.map((f) => {
      const customServingPrice = customPricesTND[f.id];
      if (customServingPrice !== undefined && customServingPrice !== "") {
        const numTND = Number(customServingPrice);
        return { ...f, costTND: numTND, costUSD: Number((numTND * 0.32).toFixed(2)), lastVerified: "Custom Price" };
      }
      return f;
    });
  }, [customPricesTND]);

  const nutritionTargets = useMemo(() => calculateNutritionTargets(profile), [profile]);
  const workoutPlan = useMemo(() => generateWorkoutSchedule(profile), [profile]);
  const [selectedSessionIdx, setSelectedSessionIdx] = useState(0);

  const [mealPlanSlots, setMealPlanSlots] = useState([
    { slot: "Breakfast", title: "High-Protein Egg, Oat & Almond Bowl", foodIds: ["food_eggs", "food_oats"], instructions: "Soft-scramble 3 whole eggs; serve alongside warm rolled oats." },
    { slot: "Lunch", title: "Grilled Chicken Breast & Couscous", foodIds: ["food_chicken_breast", "food_couscous", "food_olive_oil"], instructions: "Pan-sear chicken breast with spices; serve over couscous with olive oil." }
  ]);

  const [dailyLog, setDailyLog] = useState([
    { id: "log_1", meal: "Breakfast", foodId: "food_eggs", multiplier: 1 }
  ]);

  const loggedTotals = useMemo(() => {
    return dailyLog.reduce((acc, entry) => {
      const food = foodsDb.find(f => f.id === entry.foodId);
      if (!food) return acc;
      const m = Number(entry.multiplier) || 1;
      acc.calories += Math.round(food.calories * m);
      acc.protein += Math.round(food.protein * m);
      acc.carbs += Math.round(food.carbs * m);
      acc.fat += Math.round(food.fat * m);
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [dailyLog, foodsDb]);

  const currentWorkout = workoutPlan[selectedSessionIdx] || workoutPlan[0];

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: TrendingUp },
    { id: "workouts", label: "Workout Planner", icon: Dumbbell },
    { id: "exercises", label: `Exercise Library (${EXERCISES_DB.length})`, icon: Video },
    { id: "nutrition", label: "Nutrition Calculator", icon: Flame },
    { id: "meals", label: "Meal Planner & Log", icon: Utensils },
    { id: "premium", label: "AI Coach & PRO Suite", icon: Crown, proOnly: true },
    { id: "profile", label: "Customize Profile", icon: Sliders }
  ];

  return (
    <div className="min-h-screen bg-[#0B0D0F] text-white flex flex-col md:flex-row font-sans">
      <ExerciseVideoModal exercise={activeVideoExercise} onClose={() => setActiveVideoExercise(null)} />

      {/* AUTHENTICATION MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="bg-[#15191D] border border-white/15 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <FitForgeLogo size="sm" />
                <h3 className="text-lg font-black">{authMode === "login" ? "Sign In to FitForge" : "Create Account"}</h3>
              </div>
              <button onClick={() => setShowAuthModal(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAuthSubmit} className="space-y-3 text-xs">
              {authMode === "signup" && (
                <div>
                  <label className="block text-gray-400 mb-1">Full Name</label>
                  <input type="text" placeholder="Aladin" value={authFullName} onChange={(e) => setAuthFullName(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-[#0B0D0F] border border-white/15 text-white" />
                </div>
              )}
              <div>
                <label className="block text-gray-400 mb-1">Email Address</label>
                <input type="email" required placeholder="name@example.tn" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-[#0B0D0F] border border-white/15 text-white" />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Password</label>
                <input type="password" required placeholder="••••••••" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-[#0B0D0F] border border-white/15 text-white" />
              </div>
              <button type="submit" className="w-full py-3 rounded-xl bg-[#B8F34A] text-black font-extrabold text-sm hover:brightness-110 transition mt-2">
                {authMode === "login" ? "Sign In →" : "Register Account →"}
              </button>
              <div className="text-center pt-2">
                <button type="button" onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")} className="text-gray-400 hover:text-[#B8F34A] text-xs underline">
                  {authMode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-[#15191D] border-r border-white/10 shrink-0">
        <div className="p-5 flex items-center justify-between border-b border-white/10">
          <FitForgeLogo onClick={() => setActiveTab("dashboard")} />
        </div>

        {/* PRO SUBSCRIPTION BOX (20 TND/MO) */}
        <div className="p-4 m-3 rounded-2xl bg-gradient-to-br from-[#B8F34A]/20 via-[#15191D] to-[#0B0D0F] border border-[#B8F34A]/40 space-y-2.5">
          <div className="flex items-center gap-2 text-[#B8F34A] font-extrabold text-xs">
            <Crown className="w-4 h-4 fill-current" />
            <span>FitForge PRO Member</span>
          </div>
          <p className="text-[11px] text-gray-300 leading-relaxed">AI Coach, Cloud Sync & TND Market Optimizers.</p>
          <div className="text-xs font-black text-white">20 TND <span className="text-[10px] font-normal text-gray-400">/ month</span></div>
          <button onClick={handleUpgradeToPro} className={`w-full py-2 rounded-xl text-xs font-extrabold transition ${isPremium ? "bg-white/10 text-white border border-white/20" : "bg-[#B8F34A] text-black hover:brightness-110"}`}>
            {isPremium ? "✓ PRO Active" : "Upgrade for 20 TND/mo"}
          </button>
        </div>

        <nav className="p-3 space-y-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  active ? "bg-[#B8F34A] text-black font-bold shadow-lg" : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.proOnly && !isPremium && <Lock className="w-3.5 h-3.5 text-amber-400" />}
              </button>
            );
          })}
        </nav>

        {/* AUTH FOOTER */}
        <div className="p-4 m-3 rounded-xl bg-[#0B0D0F] border border-white/10 text-xs flex items-center justify-between">
          <div className="truncate">
            <div className="font-bold text-white truncate">{user ? user.email : "Guest Mode"}</div>
            <div className="text-[10px] text-[#B8F34A]">{isPremium ? "PRO Tier" : "Free Tier"}</div>
          </div>
          {user ? (
            <button onClick={handleLogout} className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30" title="Sign Out">
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={() => { setAuthMode("login"); setShowAuthModal(true); }} className="px-2.5 py-1.5 rounded-lg bg-[#B8F34A] text-black font-bold text-[11px]">
              Sign In
            </button>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-5 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#15191D] border border-white/10 rounded-2xl p-6">
              <div>
                <span className="text-xs uppercase tracking-wider text-[#B8F34A] font-bold">Connected Training & Nutrition Hub</span>
                <h1 className="text-2xl md:text-3xl font-black mt-1">Welcome back, {profile.name}</h1>
                <p className="text-sm text-gray-400 mt-1">
                  Status: <strong className="text-[#B8F34A]">{isPremium ? "FitForge PRO (20 TND/mo)" : "Free Member"}</strong> • Cloud Sync: <strong className="text-white">{user ? "Active via Supabase" : "Local Browser Mode"}</strong>
                </p>
              </div>

              {!isPremium && (
                <button onClick={handleUpgradeToPro} className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#B8F34A] to-[#9EE022] text-black font-black text-xs flex items-center gap-2 shadow-lg hover:brightness-110 transition">
                  <Crown className="w-4 h-4 fill-current" /> Upgrade to PRO — 20 TND/mo
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#15191D] border border-white/10 rounded-2xl p-5">
                <span className="text-xs text-gray-400">Daily Calorie Target</span>
                <div className="text-2xl font-black mt-2">{loggedTotals.calories} / {nutritionTargets.dailyCalories} kcal</div>
              </div>
              <div className="bg-[#15191D] border border-white/10 rounded-2xl p-5">
                <span className="text-xs text-gray-400">Protein Target</span>
                <div className="text-2xl font-black mt-2">{loggedTotals.protein}g / {nutritionTargets.proteinGrams}g</div>
              </div>
              <div className="bg-[#15191D] border border-white/10 rounded-2xl p-5">
                <span className="text-xs text-gray-400">Cloud Status</span>
                <div className="text-lg font-extrabold mt-2 text-[#B8F34A]">{user ? "Connected to Supabase" : "Offline / Guest"}</div>
              </div>
            </div>

            <div className="bg-[#15191D] border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4">Today's Exercises — Click Any Exercise for GIF Loop & Video</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {EXERCISES_DB.slice(0, 4).map(ex => (
                  <div key={ex.id} onClick={() => setActiveVideoExercise(ex)} className="bg-[#0B0D0F] border border-white/10 rounded-xl overflow-hidden cursor-pointer group hover:border-[#B8F34A] transition">
                    <div className="relative h-36">
                      <img src={ex.thumbnailUrl} alt={ex.name} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="w-10 h-10 rounded-full bg-[#B8F34A] text-black flex items-center justify-center shadow"><Play className="w-4 h-4 fill-current ml-0.5" /></span>
                      </div>
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-bold text-[#B8F34A]">{ex.muscleGroup}</span>
                    </div>
                    <div className="p-3.5">
                      <h3 className="font-bold text-sm text-white">{ex.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">3 sets × 8–12 reps</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "workouts" && (
          <div className="space-y-6">
            <h1 className="text-2xl font-black">Workout Library & Logger</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {EXERCISES_DB.map(ex => (
                <div key={ex.id} className="bg-[#15191D] border border-white/10 rounded-2xl p-4 flex gap-4 items-center">
                  <img src={ex.thumbnailUrl} alt={ex.name} className="w-24 h-24 rounded-xl object-cover border border-white/10" />
                  <div className="flex-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#B8F34A]/15 text-[#B8F34A]">{ex.muscleGroup}</span>
                    <h3 className="font-bold text-sm mt-1">{ex.name}</h3>
                    <button onClick={() => setActiveVideoExercise(ex)} className="mt-2 px-3 py-1.5 rounded-lg bg-[#B8F34A] text-black font-bold text-xs">View GIF Loop & Video</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "exercises" && (
          <div className="space-y-6">
            <h1 className="text-2xl font-black">Exercise Video & GIF Library</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {EXERCISES_DB.map(ex => (
                <div key={ex.id} onClick={() => setActiveVideoExercise(ex)} className="bg-[#15191D] border border-white/10 rounded-2xl overflow-hidden cursor-pointer group hover:border-[#B8F34A] transition">
                  <div className="relative h-48">
                    <img src={ex.thumbnailUrl} alt={ex.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-5 space-y-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#B8F34A]/15 text-[#B8F34A]">{ex.muscleGroup}</span>
                    <h3 className="font-bold text-base">{ex.name}</h3>
                    <p className="text-xs text-gray-400">{ex.cues[0]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "nutrition" && (
          <div className="space-y-6">
            <h1 className="text-2xl font-black">Nutrition Calculator & Macros</h1>
            <div className="bg-[#15191D] border border-white/10 rounded-2xl p-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-[#0B0D0F] rounded-xl border border-white/5">
                <div className="text-xs text-gray-400">Calories</div>
                <div className="text-xl font-black mt-1 text-[#B8F34A]">{nutritionTargets.dailyCalories} kcal</div>
              </div>
              <div className="p-4 bg-[#0B0D0F] rounded-xl border border-white/5">
                <div className="text-xs text-gray-400">Protein</div>
                <div className="text-xl font-black mt-1">{nutritionTargets.proteinGrams}g</div>
              </div>
              <div className="p-4 bg-[#0B0D0F] rounded-xl border border-white/5">
                <div className="text-xs text-gray-400">Carbs</div>
                <div className="text-xl font-black mt-1">{nutritionTargets.carbGrams}g</div>
              </div>
              <div className="p-4 bg-[#0B0D0F] rounded-xl border border-white/5">
                <div className="text-xs text-gray-400">Fats</div>
                <div className="text-xl font-black mt-1">{nutritionTargets.fatGrams}g</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "meals" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-[#15191D] border border-white/10 rounded-2xl p-6">
              <div>
                <h1 className="text-2xl font-black">Tunisian Grocery & Meal Planner</h1>
                <p className="text-xs text-gray-400 mt-1">USD & TND market prices synced.</p>
              </div>
              <button onClick={() => setShowPriceEditor(!showPriceEditor)} className="px-4 py-2.5 rounded-xl bg-[#B8F34A] text-black font-extrabold text-xs flex items-center gap-2">
                <Edit3 className="w-4 h-4" /> {showPriceEditor ? "Close Price Book" : "Update Prices (TND)"}
              </button>
            </div>

            {showPriceEditor && (
              <div className="p-4 rounded-xl bg-[#15191D] border border-[#B8F34A]/40 space-y-3">
                <h3 className="text-sm font-extrabold text-[#B8F34A]">Live Tunisian Market Price Book</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {foodsDb.map(f => (
                    <div key={f.id} className="p-3 rounded-xl bg-[#0B0D0F] border border-white/10 flex items-center justify-between gap-2 text-xs">
                      <div>
                        <div className="font-bold text-white">{f.name}</div>
                        <div className="text-[11px] text-gray-400">{f.servingGrams}g</div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input type="number" step="0.1" value={f.costTND} onChange={(e) => setCustomPricesTND({ ...customPricesTND, [f.id]: e.target.value })} className="w-16 px-2 py-1 rounded bg-[#0B0D0F] border border-[#B8F34A]/40 text-[#B8F34A] font-extrabold text-right" />
                        <span className="text-[11px] text-gray-400">TND</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mealPlanSlots.map(slot => (
                <div key={slot.slot} className="bg-[#15191D] border border-white/10 rounded-2xl p-5 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#B8F34A]">{slot.slot}</span>
                  <h3 className="text-lg font-bold">{slot.title}</h3>
                  <p className="text-xs text-gray-400">{slot.instructions}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "premium" && (
          <div className="space-y-6">
            <div className="bg-[#15191D] border border-[#B8F34A]/40 rounded-2xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#B8F34A]/10 rounded-full blur-3xl pointer-events-none" />
              <div className="max-w-xl space-y-4 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B8F34A]/20 text-[#B8F34A] text-xs font-bold">
                  <Crown className="w-3.5 h-3.5 fill-current" /> PRO Exclusive Suite
                </div>
                <h1 className="text-3xl font-black">AI Coach, TND Budget Optimizer & Muscle Heatmaps</h1>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {isPremium
                    ? "Your PRO subscription is active! You have full access to automated volume adjustments and local Tunisian budget solvers."
                    : "Unlock this section by upgrading your account to FitForge PRO for 20 TND per month."}
                </p>

                {!isPremium && (
                  <button onClick={handleUpgradeToPro} className="px-6 py-3.5 rounded-xl bg-[#B8F34A] text-black font-extrabold text-sm hover:brightness-110 transition shadow-lg">
                    Activate PRO Subscription — 20 TND / month
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
