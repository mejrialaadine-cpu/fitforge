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
  LogOut
} from "lucide-react";
import { supabase } from "./supabaseClient";

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
// 2. EXERCISE DATABASE WITH GIF LOOPS & VIDEO DEMOS
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
  },
  {
    id: "ex_db_row",
    name: "Single-Arm Dumbbell Row",
    muscleGroup: "Back",
    equipment: "Dumbbells",
    thumbnailUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=900&q=80",
    cues: ["Brace off bench with free hand.", "Pull elbow toward back pocket."]
  },
  {
    id: "ex_bicep_curl",
    name: "Incline Dumbbell Bicep Curl",
    muscleGroup: "Arms",
    equipment: "Dumbbells",
    thumbnailUrl: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=900&q=80",
    cues: ["Let arms hang fully behind torso.", "Supinate wrists as you curl."]
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
  name: "Maha",
  age: 28,
  sex: "female",
  heightCm: 168,
  weightKg: 80.0,
  targetWeightKg: 72.0,
  goal: "fat_loss",
  activityMultiplier: 1.375
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
        alert("Account created successfully! Check your email to confirm if required.");
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
                <div className="w-8 h-8 rounded
