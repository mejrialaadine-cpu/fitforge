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
  Lock,
  Crown,
  LogOut,
  Mail,
  Key
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
// 1. PURE DETERMINISTIC CALCULATIONS
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

  const rawCalories = manualCalorieOverride ? Number(manualCalorieOverride) : tdee + calorieAdjustment;
  const targetCalories = Math.max(1000, rawCalories);

  const proteinPerKg = goal === "fat_loss" || goal === "recomp" ? 2.0 : 1.8;
  const fatPerKg = 0.85;

  const proteinGrams = Math.round(weightKg * proteinPerKg);
  const fatGrams = Math.round(weightKg * fatPerKg);
  const remainingCalories = Math.max(0, targetCalories - (proteinGrams * 4 + fatGrams * 9));
  const carbGrams = Math.round(remainingCalories / 4);

  return {
    bmi,
    bmr,
    tdee,
    dailyCalories: proteinGrams * 4 + carbGrams * 4 + fatGrams * 9,
    proteinGrams,
    carbGrams,
    fatGrams
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
    equipment: "Full Gym",
    thumbnailUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=900&q=80",
    cues: ["Retract shoulder blades into pad.", "Plant feet flat on the floor.", "Lower bar to mid-chest."]
  },
  {
    id: "ex_lat_pulldown",
    name: "Wide-Grip Lat Pulldown",
    muscleGroup: "Back",
    equipment: "Full Gym",
    thumbnailUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80",
    cues: ["Keep chest tall.", "Drive elbows down toward hips."]
  },
  {
    id: "ex_barbell_squat",
    name: "Barbell Back Squat",
    muscleGroup: "Legs",
    equipment: "Full Gym",
    thumbnailUrl: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=900&q=80",
    cues: ["Take a 360° breath into core.", "Sit down between hips."]
  },
  {
    id: "ex_ohp",
    name: "Seated Dumbbell Overhead Press",
    muscleGroup: "Shoulders",
    equipment: "Dumbbells",
    thumbnailUrl: "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?auto=format&fit=crop&w=900&q=80",
    cues: ["Press in scapular plane.", "Keep ribcage stacked over pelvis."]
  }
];

const INITIAL_FOODS_DB = [
  { id: "food_chicken_breast", name: "Chicken Breast (Escalope de Poulet)", servingGrams: 150, calories: 180, protein: 34, carbs: 0, fat: 3.9, costTND: 3.2, role: "protein" },
  { id: "food_sardines", name: "Fresh Grilled Sardines (Sardine Grillée)", servingGrams: 150, calories: 310, protein: 37, carbs: 0, fat: 17, costTND: 2.1, role: "protein" },
  { id: "food_eggs", name: "Whole Chicken Eggs (3 Large)", servingGrams: 150, calories: 215, protein: 19, carbs: 1.1, fat: 14.3, costTND: 1.35, role: "protein" },
  { id: "food_couscous", name: "Steamed Whole-Wheat Couscous", servingGrams: 220, calories: 246, protein: 8.4, carbs: 51, fat: 0.4, costTND: 0.85, role: "carb" },
  { id: "food_olive_oil", name: "Tunisian Extra-Virgin Olive Oil (1 Tbsp)", servingGrams: 14, calories: 124, protein: 0, carbs: 0, fat: 14, costTND: 0.45, role: "fat" }
];

// ============================================================================
// 3. MAIN APP COMPONENT
// ============================================================================

const DEFAULT_PROFILE = {
  name: "Aladin",
  age: 28,
  sex: "male",
  heightCm: 178,
  weightKg: 78.5,
  targetWeightKg: 82.0,
  goal: "muscle_gain",
  activityMultiplier: 1.55
};

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Auth & Session State
  const [user, setUser] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // 'login' | 'signup'
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authFullName, setAuthFullName] = useState("");
  const [isPremium, setIsPremium] = useState(false);

  const [profile, setProfile] = useState(DEFAULT_PROFILE);

  // Initialize Supabase Auth Listener
  useEffect(() => {
    if (!supabase) {
      setSessionLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchUserProfile(session.user.id);
      setSessionLoading(false);
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
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    
    if (data) {
      setIsPremium(data.is_premium || false);
      if (data.full_name) setProfile(p => ({ ...p, name: data.full_name }));
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!supabase) {
      alert("Supabase is not configured. Running in offline mode.");
      setUser({ email: authEmail });
      setShowAuthModal(false);
      return;
    }

    if (authMode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
        options: { data: { full_name: authFullName || "Athlete" } }
      });
      if (error) {
        alert(error.message);
      } else {
        alert("Account created successfully! You are now logged in.");
        setShowAuthModal(false);
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword
      });
      if (error) {
        alert(error.message);
      } else {
        setShowAuthModal(false);
      }
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
      alert("PRO subscription activated in local test mode (20 TND/mo)");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ is_premium: true, subscription_plan: "pro_20dt", subscription_status: "active" })
      .eq("id", user.id);

    if (error) {
      alert("Error updating subscription: " + error.message);
    } else {
      setIsPremium(true);
      alert("Congratulations! FitForge PRO is now active for 20 TND/month.");
    }
  };

  const nutritionTargets = useMemo(() => calculateNutritionTargets(profile), [profile]);

  return (
    <div className="min-h-screen bg-[#0B0D0F] text-white flex flex-col md:flex-row font-sans">
      
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
                  <input 
                    type="text" 
                    placeholder="Aladin"
                    value={authFullName}
                    onChange={(e) => setAuthFullName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0B0D0F] border border-white/15 text-white" 
                  />
                </div>
              )}
              <div>
                <label className="block text-gray-400 mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  placeholder="name@example.tn"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0B0D0F] border border-white/15 text-white" 
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0B0D0F] border border-white/15 text-white" 
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#B8F34A] text-black font-extrabold text-sm hover:brightness-110 transition mt-2"
              >
                {authMode === "login" ? "Sign In →" : "Register Account →"}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
                  className="text-gray-400 hover:text-[#B8F34A] text-xs underline"
                >
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
          <FitForgeLogo />
        </div>

        {/* PRO SUBSCRIPTION BOX (20 TND/MO) */}
        <div className="p-4 m-3 rounded-2xl bg-gradient-to-br from-[#B8F34A]/20 via-[#15191D] to-[#0B0D0F] border border-[#B8F34A]/40 space-y-2.5">
          <div className="flex items-center gap-2 text-[#B8F34A] font-extrabold text-xs">
            <Crown className="w-4 h-4 fill-current" />
            <span>FitForge PRO Member</span>
          </div>
          <p className="text-[11px] text-gray-300 leading-relaxed">
            AI Coach, Cloud Sync & TND Market Optimizers.
          </p>
          <div className="text-xs font-black text-white">
            20 TND <span className="text-[10px] font-normal text-gray-400">/ month</span>
          </div>
          <button
            onClick={handleUpgradeToPro}
            className={`w-full py-2 rounded-xl text-xs font-extrabold transition ${
              isPremium
                ? "bg-white/10 text-white border border-white/20"
                : "bg-[#B8F34A] text-black hover:brightness-110"
            }`}
          >
            {isPremium ? "✓ PRO Active" : "Upgrade for 20 TND/mo"}
          </button>
        </div>

        <nav className="p-3 space-y-1 flex-1">
          {[
            { id: "dashboard", label: "Dashboard", icon: TrendingUp },
            { id: "workouts", label: "Workout Library", icon: Dumbbell },
            { id: "nutrition", label: "Nutrition & Macros", icon: Flame },
            { id: "meals", label: "Tunisian Meal Plan", icon: Utensils },
            { id: "premium", label: "AI Coach & PRO Tools", icon: Crown, proOnly: true }
          ].map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  active
                    ? "bg-[#B8F34A] text-black font-bold shadow-lg"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
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
            <button 
              onClick={() => { setAuthMode("login"); setShowAuthModal(true); }}
              className="px-2.5 py-1.5 rounded-lg bg-[#B8F34A] text-black font-bold text-[11px]"
            >
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
                <span className="text-xs uppercase tracking-wider text-[#B8F34A] font-bold">
                  Training & Nutrition Command Center
                </span>
                <h1 className="text-2xl md:text-3xl font-black mt-1">
                  Welcome back, {profile.name}
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  Goal: <strong className="text-white capitalize">{profile.goal.replace("_", " ")}</strong> • Status:{" "}
                  <strong className="text-[#B8F34A]">{isPremium ? "FitForge PRO (20 TND/mo)" : "Free Member"}</strong>
                </p>
              </div>

              {!isPremium && (
                <button
                  onClick={handleUpgradeToPro}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#B8F34A] to-[#9EE022] text-black font-black text-xs flex items-center gap-2 shadow-lg hover:brightness-110 transition"
                >
                  <Crown className="w-4 h-4 fill-current" /> Upgrade to PRO — 20 TND/mo
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#15191D] border border-white/10 rounded-2xl p-5">
                <span className="text-xs text-gray-400">Daily Calorie Target</span>
                <div className="text-2xl font-black mt-2">{nutritionTargets.dailyCalories} kcal</div>
              </div>
              <div className="bg-[#15191D] border border-white/10 rounded-2xl p-5">
                <span className="text-xs text-gray-400">Protein Target</span>
                <div className="text-2xl font-black mt-2">{nutritionTargets.proteinGrams}g / day</div>
              </div>
              <div className="bg-[#15191D] border border-white/10 rounded-2xl p-5">
                <span className="text-xs text-gray-400">Cloud Sync Status</span>
                <div className="text-lg font-extrabold mt-2 text-[#B8F34A]">{user ? "Connected to Supabase" : "Offline / Local Mode"}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "workouts" && (
          <div className="space-y-6">
            <h2 className="text-xl font-black">Workout Library</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {EXERCISES_DB.map(ex => (
                <div key={ex.id} className="bg-[#15191D] border border-white/10 rounded-2xl p-4 flex gap-4 items-center">
                  <img src={ex.thumbnailUrl} alt={ex.name} className="w-20 h-20 rounded-xl object-cover border border-white/10" />
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#B8F34A]/15 text-[#B8F34A]">{ex.muscleGroup}</span>
                    <h3 className="font-bold text-sm mt-1">{ex.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{ex.cues[0]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "nutrition" && (
          <div className="space-y-6">
            <h2 className="text-xl font-black">Nutrition Calculator & Macros</h2>
            <div className="bg-[#15191D] border border-white/10 rounded-2xl p-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-[#0B0D0F] rounded-xl border border-white/5">
                <div className="text-xs text-gray-400">Calories</div>
                <div className="text-xl font-black mt-1 text-[#B8F34A]">{nutritionTargets.dailyCalories}</div>
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
            <h2 className="text-xl font-black">Tunisian Grocery & Meal Selector</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {INITIAL_FOODS_DB.map(food => (
                <div key={food.id} className="bg-[#15191D] border border-white/10 rounded-2xl p-5 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-sm">{food.name}</h3>
                    <div className="text-xs text-gray-400 mt-1">
                      {food.protein}g protein • {food.calories} kcal ({food.servingGrams}g)
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-[#B8F34A]">{food.costTND} TND</span>
                  </div>
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
                <h1 className="text-3xl font-black">AI Coach, TND Budget Optimizer & Muscle Volume Heatmaps</h1>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {isPremium
                    ? "Your PRO subscription is active! You have full access to automated volume adjustments and local Tunisian budget solvers."
                    : "Unlock this section by upgrading your account to FitForge PRO for 20 TND per month."}
                </p>

                {!isPremium && (
                  <button
                    onClick={handleUpgradeToPro}
                    className="px-6 py-3.5 rounded-xl bg-[#B8F34A] text-black font-extrabold text-sm hover:brightness-110 transition shadow-lg"
                  >
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
