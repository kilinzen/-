/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Coins,
  Gem,
  Shield,
  Zap,
  Sparkles,
  Award,
  Gift,
  Users,
  Compass,
  MessageSquare,
  Volume2,
  ListTodo,
  TrendingUp,
  Video,
  BookOpen,
  ArrowRight,
  Package,
  Wand2,
  Lock,
  Play,
  Share2,
  RotateCcw,
  BadgeAlert,
  Sliders,
  DollarSign,
  CalendarCheck2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PlayerStats, SkinItem } from "./types";
import SnakeGame from "./components/SnakeGame";

// Constants for available Hero Skins matching the infographic
const HERO_SKINS: SkinItem[] = [
  {
    id: "blue",
    name: "Standard Little Blue Snake",
    chinese: "小蛇",
    bonusText: "Base Speed +20%",
    bonusType: "speed",
    bonusValue: 0.2,
    cost: 0,
    color: "#3B82F6", // Blue
    description: "Cute and speedy! The master of tight corner squeezes.",
  },
  {
    id: "dragon",
    name: "Volcanic Flame Dragon",
    chinese: "巨龍",
    bonusText: "Starting Number +30%",
    bonusType: "shield", // Used conceptually
    bonusValue: 5,
    cost: 1500, // Gold
    color: "#EF4444", // Red/Orange
    description: "Formed from molten fire. Instantly smashes basic gates.",
  },
  {
    id: "mecha",
    name: "Mecha Iron Serpent",
    chinese: "機器蛇",
    bonusText: "Negative Block Damage -30%",
    bonusType: "gold",
    bonusValue: 0.3,
    cost: 250, // Gems
    color: "#10B981", // Emerald Green
    description: "Engineered cyborg. Negates fraction calculation loops.",
  },
  {
    id: "phoenix",
    name: "Cosmic Neon Phoenix",
    chinese: "鳳凰蛇",
    bonusText: "Double Gold & Mega Shield (+50%)",
    bonusType: "gold",
    bonusValue: 1.0,
    cost: 10, // Fragments
    color: "#EC4899", // Neon Pink/Violet
    description: "An ancient celestial beast of glowing solar flares. Earn double gold coins in runs and starts with deep shield coverage.",
  }
];

// Initial default stats
const INITIAL_STATS: PlayerStats = {
  gold: 850,
  gems: 100,
  highScore: 120,
  currentStage: 1,
  battlePassXp: 80,
  premiumPassUnlocked: false,
  selectedSkin: "blue",
  unlockedSkins: ["blue"],
  lastOfflineTime: new Date().toISOString(),
  gearHelmetLevel: 1,
  gearArmorLevel: 1,
  gearRingLevel: 1,
  metaStartCount: 5,
  metaDoorShield: 0,
  metaGoldMultiplier: 1,
  metaMagnetRadius: 40,
  metaOfflineEarnings: 2, // Gold per minute
  dailyPlayedCount: 0,
  dailyCountGrown: 0,
  dailyBossDefeated: 0,
  dailyUpgradesCount: 0,
  claimedQuests: [],
  consecutiveLogins: 1,
  lastLoginDate: "",
  dailyLoginClaimed: false,
  heroFragments: 0,
  customDailyQuests: [],
};

// Initial leaderboard entries
const DEFAULT_LEADERBOARD = [
  { rank: 1, name: "Player_123", score: 999999, isPlayer: false },
  { rank: 2, name: "SnakeKing", score: 888888, isPlayer: false },
  { rank: 3, name: "RunMaster", score: 777777, isPlayer: false },
  { rank: 4, name: "You", score: 120, isPlayer: true },
];

// Daily login reward configuration with increasing values reaching a grand 7th-day bonus
export const DAILY_LOGIN_REWARDS = [
  { day: 1, type: "gold" as const, amount: 150, description: "$150 Gold" },
  { day: 2, type: "gems" as const, amount: 30, description: "💎30 Gems" },
  { day: 3, type: "fragments" as const, amount: 1, description: "✨1 Hero Fragment" },
  { day: 4, type: "gems" as const, amount: 55, description: "💎55 Gems" },
  { day: 5, type: "fragments" as const, amount: 2, description: "✨2 Hero Fragments" },
  { day: 6, type: "gems" as const, amount: 100, description: "💎100 Gems" },
  { day: 7, type: "mega" as const, amount: 5, description: "👑 Day 7 Grand Chest ($1,000, 💎50, ✨5 fragments)", gold: 1000, gems: 50, fragments: 5 }
];

export default function App() {
  // Load initial stats from local storage safely
  const [stats, setStats] = useState<PlayerStats>(() => {
    const saved = localStorage.getItem("snake_runner_stats_v1");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure standard fields
        return { ...INITIAL_STATS, ...parsed };
      } catch (e) {
        return INITIAL_STATS;
      }
    }
    return INITIAL_STATS;
  });

  // Native game language toggle (default to Traditional Chinese)
  const [language, setLanguage] = useState<"en" | "zh">(() => {
    const saved = localStorage.getItem("snake_runner_lang_v1");
    return (saved === "en" || saved === "zh") ? saved : "zh";
  });

  // Persistent Welcome game intro modal popup state
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(() => {
    const saved = localStorage.getItem("snake_runner_welcome_v1");
    return saved !== "true";
  });

  useEffect(() => {
    localStorage.setItem("snake_runner_lang_v1", language);
  }, [language]);

  // Robust localized translation dictionary and interpolation helper
  const t = (key: string, replacements?: Record<string, string | number>) => {
    const dicts: Record<"en" | "zh", Record<string, string>> = {
      zh: {
        "app_title": "爆款黃金數字蛇蛇跑酷：倖存者傳奇",
        "app_subtitle": "隨機運算門 + 倖存者挂機養成系統",
        "gold": "金幣",
        "diamonds": "鑽石",
        "shards": "碎片",
        "best": "紀錄",
        "tab_arcade": "🎮 跑酷挑戰",
        "tab_heroes": "龍鳳獸 龍鳳門",
        "tab_gears": "🛡️ 裝備強化",
        "tab_talents": "🔬 神聖天賦",
        "tab_gacha": "🎁 幸運寶箱",
        "tab_rank": "🏆 排行榜",
        "tab_studio": "🎬 AI 流量短片",
        "guide_title": "🐍 爆款黃金數字蛇蛇：進化傳奇 🐍",
        "guide_subtitle": "歡迎來到全網最解壓的「數字融合跑酷 + 倖存者永久挂機」極限冒險！一分鐘輕鬆上手，挑戰百萬長度蛇王！",
        "guide_play_title": "1. 左右滑控 ── 反應倍增門",
        "guide_play_desc": "左右拖曳滑動，輕鬆操縱數字小蛇。穿過綠色的加法與乘法門（如 +15, x3）使小蛇長度與分值瞬間暴漲！千萬避開紅色減法除法門（如 -20, /5）。",
        "guide_shield_title": "2. 天賦神裝 ── 負數牆大免疫",
        "guide_shield_desc": "在選單中強化「跑酷追風頭盔 (Helmet)」、「防彈護鏡 (Armor)」，可在起跑獲得自帶聖盾，完美抵消高達幾百點的負數障礙，保證不輕易翻車失敗！",
        "guide_boss_title": "3. 狂掃熔岩龍 ── 凱旋奪鑽石",
        "guide_boss_desc": "每個賽道的盡頭，都盤踞著狂野咆哮的「火山熔岩巨龍首領」！帶領你長達數百節的無敵巨蛇，用強大段數正面衝擊粉碎首領，掠奪頂級財寶和鳳凰魂石碎塊！",
        "guide_quest_title": "4. 挂機外快 & 挑戰鳳凰",
        "guide_quest_desc": "玩到累了？離線也能持續自動吸金！连续登入第7天即可抱走終極大禮盒。解鎖日常任務獲得珍稀英雄之魂，集齊10片碎塊直接免費激活終極「仙能鳳凰蛇」！",
        "guide_close_btn": "領取神裝，開啟跑酷！",
        "cur_stage": "當前跑酷賽區目標：第 {stage} 區",
        "passive_earnings": "挂機生產率",
        "g_rate": "每分鐘生金",
        "skin_title": "蛇蛇外觀英雄會",
        "skin_subtitle": "解鎖專屬於你的獨特進化外骨骼！每隻都具有強悍的戰鬥被動輔助屬性。",
        "active": "正在使用",
        "equip": "裝備英雄",
        "lock": "鎖定中",
        "ready": "可裝備",
        "gear_title": "倖存者重工業裝備部",
        "gear_subtitle": "消耗跑酷獲得的金幣永久鑄造穿戴神裝，成倍爆發起點生命和流量金幣轉換力！",
        "gear_helmet": "跑酷追風頭盔",
        "gear_helmet_desc": "精工重造，起跑小蛇出生基礎節段長度永久增加。",
        "gear_armor": "神盾守護護心鏡",
        "gear_armor_desc": "自帶防彈抗壓，提供能夠直接抵消負面乘以除法的初始神碑能量護盾。",
        "gear_ring": "磁力暴能指環",
        "gear_ring_desc": "激活重力磁力共振，大幅度放大完賽跑酷後獲得的金幣金幣結算。",
        "gear_base_seg": "起點蛇節段",
        "gear_shield_lvl": "初始吸傷聖盾",
        "gear_gold_mult": "結算金幣乘率",
        "upgrade": "強化升級",
        "talent_title": "永恆神聖天賦研發部",
        "talent_subtitle": "科學研究深度天賦，無死角蛻變蛇蛇的核心戰鬥能級！",
        "talent_start": "出生成長根基",
        "talent_start_desc": "永久加厚起跑初始節段長度：當前已成 {val} 節",
        "talent_shield": "防負大門抗體",
        "talent_shield_desc": "完全抵扣減乘大門造成的衰退衝擊：當前層數 {val} 盾",
        "talent_coin": "流量金幣提纯",
        "talent_coin_desc": "使結算時的金幣分成加成：當前分紅 +{val}%",
        "talent_offline": "離線地心礦脈",
        "talent_offline_desc": "在你不玩遊戲、閉眼入睡時自動加載黃金外快：當前速度 {val}g/分鐘",
        "allocate": "投資進行科研",
        "chest_title": "倖存特工祕寶箱",
        "chest_subtitle": "爽快多重自豪爆開箱！百分百開出紫金級稀有裝備材料與充沛的亮晶晶寶石！",
        "ordinary_chest": "免費補給寶箱 (免點數)",
        "ordinary_chest_desc": "提供基礎外快零錢。模擬觀看一小段30秒直播廣告即可獲得補給。",
        "rare_chest": "稀有藍寶石秘箱",
        "rare_chest_desc": "富含中等金幣與不菲鑽石。需花費 40 鑽石解鎖。",
        "epic_chest": "皇家傳奇黃金罈",
        "epic_chest_desc": "百分百極高概率爆出鳳凰珍稀英魂碎片與海量金幣。需花費 120 鑽石解鎖。",
        "watch_ad": "📺 觀看模擬廣告 (直接點擊解鎖)",
        "open_gems": "💎 消耗 {cost} 鑽石開啟",
        "rank_title": "全球 TikTok 跑酷霸主風雲榜",
        "rank_subtitle": "與全世界數十萬精英數學大師玩家實時較量極限蛇身大長度紀錄！",
        "hp_score": "得分 HP 節數",
        "you_tag": "⭐ (本尊玩家)",
        "ai_title": "TikTok 爆款流量短影音 AI 實驗室",
        "ai_subtitle": "由 server 端安全集成的 Google Gemini 超大模型傾情驅動，一鍵為你量身精製專屬跑酷文案、口播腳本及爆款轉化秘密！",
        "custom_style": "指定短視頻挑戰 / 客製化解言風格",
        "style_desc": "例如「咆哮嘶吼的大崩盤速通」、「極致強迫症全解壓合流」、「搞笑反應解說」、「深夜講述都市奇聞配音」等。",
        "placeholder": "請輸入配音或短片風格，例如：咆哮笑看手殘、令人極度舒適的完美合流...",
        "btn_gemini": "🎬 讓 AI 創作短片腳本",
        "drafting": "🎬 深度思考並寫作中...",
        "ai_script": "🎙️ AI 爆款影音口播腳本 (Script)",
        "ai_advice": "📌 流量專家宣傳策略與留存分析",
        "no_ai_yet": "目前還沒有生成的文案腳本喔。在上方輸入風格調性並點擊「讓 AI 創作短片腳本」來調度 Gemini 超腦創作吧！",
        "bp_title": "戰鬥倖存者聯賽訓練營",
        "bp_subtitle": "完成每一跑酷賽道的通關與吞噬長度，解鎖豐厚的季度神像密盒！",
        "bp_progress": "近期聯賽特訓進度",
        "bp_ready": "訓練營星級禮盒已備好",
        "claim_tier": "領取特訓星級禮包",
        "unlock_premium": "啟動黃金通行證 (送80鑽石)",
        "premium_active": "👑 皇家傳奇版已順利連鎖實行",
        "consecutive_login": "老特工連續登入福利",
      },
      en: {
        "app_title": "Super Number Snake Runner: Survivor Legend",
        "app_subtitle": "RL growth + SURVIVOR.IO IDLE SYSTEM",
        "gold": "GOLD",
        "diamonds": "DIAMONDS",
        "shards": "SHARDS",
        "best": "BEST",
        "tab_arcade": "🎮 ARCADE",
        "tab_heroes": "🐉 HERO SKIN",
        "tab_gears": "🛡️ GEARS",
        "tab_talents": "🔬 TALENTS",
        "tab_gacha": "🎁 CHEST",
        "tab_rank": "🏆 RANK",
        "tab_studio": "🎬 VIRAL AI",
        "guide_title": "🐍 Super Number Snake Runner 🐍",
        "guide_subtitle": "Welcome to the ultimate combination of dynamic snake multiplication runs and Survivor-style rogue upgrades!",
        "guide_play_title": "1. Slide & Control: Simple Left-Right Steer",
        "guide_play_desc": "Steer your running snake left and right to enter positive green gates (like +15, x3) to instantly skyrocket your number counts! Avoid dangerous red gates (like -20, /2).",
        "guide_shield_title": "2. Deploy Active Shields & Gears",
        "guide_shield_desc": "Collect energy shields and level up your Helmet, Flackplate Armour, or Magnet loop. They protect you from drop penalties and negative computation blocks so you never fail instantly!",
        "guide_boss_title": "3. Defeat Molten Volcanic Bosses",
        "guide_boss_desc": "Every single track ends with a fierce Volcano Flame Dragon showdown. Reach with superior length strength to shatter the boss and grab precious gems and rare phoenix shards!",
        "guide_quest_title": "4. Idle Earnings & Hero Quests",
        "guide_quest_desc": "Earn passive money when you sleep. Claims of consecutive visits yield gorgeous 7th-day Grand Chests. Complete daily objectives to get shards to unlock the legendary Neon Phoenix skin for free!",
        "guide_close_btn": "Ready, Set, Crawl!",
        "cur_stage": "Current Track Target: Section {stage}",
        "passive_earnings": "PASSIVE REVENUE RATE",
        "g_rate": "g / min",
        "skin_title": "Hero Cohort",
        "skin_subtitle": "Unlock viral snake designs based on your currency accomplishments.",
        "active": "ACTIVE",
        "equip": "EQUIP HERO",
        "lock": "LOCKED",
        "ready": "READY",
        "gear_title": "Survivor Gear Armoury",
        "gear_subtitle": "Upgrade permanent items to boost multiplication gate attributes.",
        "gear_helmet": "Crawl Helmet",
        "gear_helmet_desc": "Boosts your starting segment counts by +2 per tier.",
        "gear_armor": "Aegis Flackplate",
        "gear_armor_desc": "Grants initial passive shielding for surviving negative doors.",
        "gear_ring": "Magneto Loop",
        "gear_ring_desc": "Permanently boosts coin payout factor from runners.",
        "gear_base_seg": "Current segment base",
        "gear_shield_lvl": "Shield level",
        "gear_gold_mult": "Gold multi",
        "upgrade": "Upgrade",
        "talent_title": "Persistent Skill Talents",
        "talent_subtitle": "Unlock absolute talent nodes using your accrued gold coins.",
        "talent_start": "Core Start Segment",
        "talent_start_desc": "Start runs with larger base numbering: current count {val}",
        "talent_shield": "Logic Gate Shield",
        "talent_shield_desc": "Absorbs subtraction hits: current level {val}",
        "talent_coin": "Viral Coin multiplier",
        "talent_coin_desc": "Increases coin payouts factor: current mult x{val}",
        "talent_offline": "Idle crawling speed",
        "talent_offline_desc": "Increases offline gold accrued speed: current level {val}g/min",
        "allocate": "Allocate Research",
        "chest_title": "Gacha Treasure Chests",
        "chest_subtitle": "Simulate rewarding chest openings to find gear pieces and gems.",
        "ordinary_chest": "Ordinary Chest",
        "ordinary_chest_desc": "Yields basic gold currency. Simulated ad chest.",
        "rare_chest": "Rare Chest",
        "rare_chest_desc": "Yields medium gold. Cost 40 gems.",
        "epic_chest": "Epic Chest",
        "epic_chest_desc": "Yields major gold & gear materials. Cost 120 gems.",
        "watch_ad": "📺 WATCH AD (SIMULATED)",
        "open_gems": "💎 OPEN ({cost} GEMS)",
        "rank_title": "TikTok Global Challenge",
        "rank_subtitle": "Compete with number growth players worldwide dynamically.",
        "hp_score": "HP score",
        "you_tag": "⭐ (You)",
        "ai_title": "TikTok Viral Content Laboratory",
        "ai_subtitle": "Use our server-side integration of Google Gemini to write customized gameplay content scripts.",
        "custom_style": "Custom TikTok Challenge / Script style",
        "style_desc": "Specify a style (e.g. funny fail reaction, story reaction, energetic speedrunner hook...).",
        "placeholder": "e.g. fail story reaction, energetic speedrunner hook...",
        "btn_gemini": "DRAFT VIRAL SHORT",
        "drafting": "🤖 GENERATING...",
        "ai_script": "🎙️ AI PROMO SHORT SCRIPT",
        "ai_advice": "📌 CONTENT ADVICE & FORMULAS",
        "no_ai_yet": "No script generated yet. Click \"DRAFT VIRAL SHORT\" above to invoke the Gemini API model!",
        "bp_title": "Battle Survivor Pass",
        "bp_subtitle": "Complete stages and grow numbers to level up seasonal pass items.",
        "bp_progress": "Progress",
        "bp_ready": "Tier Reward Ready",
        "claim_tier": "CLAIM TIER BOX",
        "unlock_premium": "UNLOCK PREMIUM",
        "premium_active": "PREMIUM ACTIVATED",
        "consecutive_login": "DAILY SURVIVOR LOGIN",
      }
    };
    let val = dicts[language][key] || key;
    if (replacements) {
      Object.entries(replacements).forEach(([k, v]) => {
        val = val.replace(`{${k}}`, String(v));
      });
    }
    return val;
  };

  const getSkinZhName = (id: string) => {
    switch (id) {
      case "blue": return "經典亮亮小藍蛇";
      case "dragon": return "火山烈焰熔岩巨龍";
      case "mecha": return "鋼鐵合金機甲獸";
      case "phoenix": return "霓虹極光仙能鳳凰";
      default: return "";
    }
  };

  const getSkinZhDescription = (id: string) => {
    switch (id) {
      case "blue": return "超級可愛又靈活！身手敏捷，能在最狹窄的空間和倍率門夾縫中自由穿梭。";
      case "dragon": return "在地心熔岩烈火中孕育而成。起跑自帶火龍之威，能瞬間粉碎沿途阻礙！";
      case "mecha": return "重工科技結晶鋼鐵身軀。能大幅抵消負數牆面、減除大門造成的重傷！";
      case "phoenix": return "擁有璀璨極光的太陽鳳凰。跑酷所得金幣永久翻倍，起手自帶特高聖盾防阻！";
      default: return "";
    }
  };

  const getSkinZhBonus = (id: string) => {
    switch (id) {
      case "blue": return "基礎移動速度 +20%";
      case "dragon": return "出生基礎段數 +30%";
      case "mecha": return "負數牆受傷抵消 +30%";
      case "phoenix": return "雙倍金幣掉落 & 聖盾範圍 +50%";
      default: return "";
    }
  };

  const getLoginRewardDesc = (reward: typeof DAILY_LOGIN_REWARDS[0]) => {
    if (language === "zh") {
      if (reward.type === "gold") return `🪙$${reward.amount} 金幣`;
      if (reward.type === "gems") return `💎${reward.amount} 鑽石`;
      if (reward.type === "fragments") return `✨${reward.amount} 英雄碎塊`;
      return "👑 第7天極限至尊寶箱 (+$1,000金幣、💎50、✨5碎裂)";
    } else {
      return reward.description;
    }
  };

  const [activeTab, setActiveTab] = useState<"arcade" | "heroes" | "gears" | "talents" | "gacha" | "leaderboard" | "studio">("arcade");
  const [selectedSkinDetail, setSelectedSkinDetail] = useState<SkinItem>(HERO_SKINS[0]);
  const [leaderboard, setLeaderboard] = useState(DEFAULT_LEADERBOARD);
  
  // Idle reward state
  const [idleGoldReward, setIdleGoldReward] = useState(0);
  const [showIdlePopup, setShowIdlePopup] = useState(false);

  // AI studio dynamic generator state
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [generatedScript, setGeneratedScript] = useState("");
  const [generatedStrategy, setGeneratedStrategy] = useState("");

  // Sound synthesis safety activation notice
  const [toastMsg, setToastMsg] = useState("");

  // --- CONSECUTIVE DAILY LOGIN & QUESTS GENERATION ENGINE ---
  useEffect(() => {
    const today = new Date();
    // Safe YYYY-MM-DD timezone string local verification
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    setStats(prev => {
      let streak = prev.consecutiveLogins || 1;
      let claimedToday = prev.dailyLoginClaimed;
      let lastDate = prev.lastLoginDate;

      if (!lastDate) {
        // First login on this profile
        lastDate = todayStr;
        streak = 1;
        claimedToday = false;
      } else if (lastDate !== todayStr) {
        // Day transition occurred!
        const lastObj = new Date(lastDate + "T00:00:00");
        const todayObj = new Date(todayStr + "T00:00:00");
        const diffMs = todayObj.getTime() - lastObj.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Logged in the subsequent consecutive day.
          // Advance the streak day only if they actually claimed yesterday's login獎
          if (prev.dailyLoginClaimed) {
            streak = streak >= 7 ? 1 : streak + 1;
          }
          claimedToday = false;
        } else if (diffDays > 1) {
          // Missed a day! Reset consecutive login tracker streak
          streak = 1;
          claimedToday = false;
        }
        lastDate = todayStr;
      }

      // Generate 5 active achievable quests for today
      let quests = prev.customDailyQuests || [];
      const needsNewQuests = quests.length === 0 || prev.lastLoginDate !== todayStr;

      if (needsNewQuests) {
        quests = [
          {
            id: "q_play",
            title: "Track Dominator",
            description: "Complete 3 runs on active tracks",
            target: 3,
            current: 0,
            rewardType: "gold",
            rewardAmount: 150,
            claimed: false
          },
          {
            id: "q_grow",
            title: "Giant Swell",
            description: "Accumulate 500 grown segments in total runs",
            target: 500,
            current: 0,
            rewardType: "fragments",
            rewardAmount: 1,
            claimed: false
          },
          {
            id: "q_boss",
            title: "Dragon Slayer",
            description: "Defeat 1 Volcano Dragon Boss on the track",
            target: 1,
            current: 0,
            rewardType: "fragments",
            rewardAmount: 2,
            claimed: false
          },
          {
            id: "q_upgrade",
            title: "Heavy Metal",
            description: "Upgrade Gear or Talents 2 times in menus",
            target: 2,
            current: 0,
            rewardType: "gems",
            rewardAmount: 25,
            claimed: false
          },
          {
            id: "q_score",
            title: "Golden High Limit",
            description: "Achieve a peak score of 150+ in a single track",
            target: 150,
            current: 0,
            rewardType: "gold",
            rewardAmount: 250,
            claimed: false
          }
        ];
      }

      return {
        ...prev,
        consecutiveLogins: streak,
        dailyLoginClaimed: claimedToday,
        lastLoginDate: lastDate,
        customDailyQuests: quests,
        // Reset legacy old tracking properties on new calendar day
        ...(prev.lastLoginDate !== todayStr ? {
          dailyPlayedCount: 0,
          dailyCountGrown: 0,
          dailyBossDefeated: 0,
          dailyUpgradesCount: 0,
          claimedQuests: []
        } : {})
      };
    });
  }, []);

  // Save stats to LocalStorage whenever they change
  useEffect(() => {
    localStorage.setItem("snake_runner_stats_v1", JSON.stringify(stats));
    
    // Dynamically update Player rank scorecard based on current stats High Score
    setLeaderboard(prev => {
      return prev.map(entry => {
        if (entry.isPlayer) {
          return { ...entry, score: stats.highScore };
        }
        return entry;
      }).sort((a,b) => b.score - a.score)
        .map((entry, idx) => ({ ...entry, rank: idx + 1 }));
    });
  }, [stats]);

  // Offline idle calculation triggers
  useEffect(() => {
    const lastActive = new Date(stats.lastOfflineTime).getTime();
    const now = Date.now();
    const diffMs = now - lastActive;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins >= 1) {
      // Offline cap yields up to max 12 hours (720 mins)
      const cappedMins = Math.min(720, diffMins);
      const rewardRate = stats.metaOfflineEarnings || 2;
      const calculatedGold = cappedMins * rewardRate;

      if (calculatedGold > 0) {
        setIdleGoldReward(calculatedGold);
        setShowIdlePopup(true);
      }
    }

    // Refresh active reference timezone
    const timer = setInterval(() => {
      setStats(prev => ({
        ...prev,
        lastOfflineTime: new Date().toISOString()
      }));
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2800);
  };

  // Claim idle gold reward
  const handleClaimIdleRewards = () => {
    setStats(prev => ({
      ...prev,
      gold: prev.gold + idleGoldReward,
      lastOfflineTime: new Date().toISOString()
    }));
    triggerToast(`💰 Claimed Offline Idle Rewards: +$${idleGoldReward}!`);
    setShowIdlePopup(false);
    setIdleGoldReward(0);
  };

  // --- CLAIMING DAILY REWARDS & BONUS ACTIONS ---
  const claimDailyLoginBonus = () => {
    if (stats.dailyLoginClaimed) {
      triggerToast("❌ Today's bonus is claimed! Return tomorrow for the subsequent day!");
      return;
    }

    const currentDay = stats.consecutiveLogins || 1;
    const reward = DAILY_LOGIN_REWARDS[currentDay - 1];

    let gAdd = 0;
    let gemAdd = 0;
    let fragAdd = 0;

    if (reward.type === "gold") gAdd = reward.amount;
    else if (reward.type === "gems") gemAdd = reward.amount;
    else if (reward.type === "fragments") fragAdd = reward.amount;
    else if (reward.type === "mega") {
      gAdd = reward.gold || 1000;
      gemAdd = reward.gems || 50;
      fragAdd = reward.fragments || 5;
    }

    setStats(prev => ({
      ...prev,
      gold: prev.gold + gAdd,
      gems: prev.gems + gemAdd,
      heroFragments: (prev.heroFragments || 0) + fragAdd,
      dailyLoginClaimed: true
    }));

    triggerToast(`🎉 DAY ${currentDay} CLAIMED: +${reward.description}!`);
  };

  const handleClaimCustomDailyQuest = (id: string) => {
    const quest = stats.customDailyQuests?.find(q => q.id === id);
    if (!quest) return;

    if (quest.claimed) {
      triggerToast("❌ Already claimed!");
      return;
    }

    if (quest.current < quest.target) {
      triggerToast("❌ Completion targets have not been met!");
      return;
    }

    let gAdd = 0;
    let gemAdd = 0;
    let fragAdd = 0;

    if (quest.rewardType === "gold") gAdd = quest.rewardAmount;
    if (quest.rewardType === "gems") gemAdd = quest.rewardAmount;
    if (quest.rewardType === "fragments") fragAdd = quest.rewardAmount;

    setStats(prev => {
      const updatedQuests = (prev.customDailyQuests || []).map(q => {
        if (q.id === id) return { ...q, claimed: true };
        return q;
      });

      return {
        ...prev,
        gold: prev.gold + gAdd,
        gems: prev.gems + gemAdd,
        heroFragments: (prev.heroFragments || 0) + fragAdd,
        battlePassXp: prev.battlePassXp + 35, // Progress the battle survivor pass too!
        customDailyQuests: updatedQuests
      };
    });

    triggerToast(`🎁 Quest Claimed! +${gAdd ? `$${gAdd} Gold` : ""}${gemAdd ? ` 💎${gemAdd} gems` : ""}${fragAdd ? ` ✨${fragAdd} shards` : ""}!`);
  };

  // Stage callbacks
  const handleGameWin = (gold: number, gems: number, endScore: number) => {
    setStats(prev => {
      const nextStage = prev.currentStage + 1;
      const isNewHighScore = endScore > prev.highScore;
      const milestoneXp = 45;

      // Update Custom daily quests progress
      const updatedQuests = (prev.customDailyQuests || []).map(q => {
        if (q.id === "q_play") return { ...q, current: Math.min(q.target, q.current + 1) };
        if (q.id === "q_boss") return { ...q, current: Math.min(q.target, q.current + 1) };
        if (q.id === "q_score") return { ...q, current: Math.max(q.current, endScore) };
        return q;
      });

      return {
        ...prev,
        gold: prev.gold + gold,
        gems: prev.gems + gems,
        currentStage: nextStage,
        highScore: isNewHighScore ? endScore : prev.highScore,
        battlePassXp: prev.battlePassXp + milestoneXp,
        dailyPlayedCount: Math.min(3, prev.dailyPlayedCount + 1),
        dailyBossDefeated: Math.min(1, prev.dailyBossDefeated + 1),
        customDailyQuests: updatedQuests
      };
    });
    triggerToast(`🏆 Stage Win! Earned +$${gold} and 💎${gems}!`);
  };

  const handleGameLose = (peakScore: number) => {
    setStats(prev => {
      // Update Custom daily quests progress
      const updatedQuests = (prev.customDailyQuests || []).map(q => {
        if (q.id === "q_play") return { ...q, current: Math.min(q.target, q.current + 1) };
        if (q.id === "q_score") return { ...q, current: Math.max(q.current, peakScore || 1) };
        return q;
      });

      return {
        ...prev,
        dailyPlayedCount: Math.min(3, prev.dailyPlayedCount + 1),
        customDailyQuests: updatedQuests
      };
    });
    triggerToast("💀 Defeated! Adjust upgrades and slide back!");
  };

  const handleScoreGrow = (amount: number) => {
    setStats(prev => {
      const nextCount = Math.min(500, prev.dailyCountGrown + amount);
      const updatedQuests = (prev.customDailyQuests || []).map(q => {
        if (q.id === "q_grow") return { ...q, current: Math.min(q.target, q.current + amount) };
        return q;
      });

      return {
        ...prev,
        dailyCountGrown: nextCount,
        customDailyQuests: updatedQuests
      };
    });
  };

  // Hero Purchasing
  const handleEquipOrBuySkin = (skin: SkinItem) => {
    if (stats.unlockedSkins.includes(skin.id)) {
      setStats(prev => ({ ...prev, selectedSkin: skin.id }));
      triggerToast(`🐍 Equipped ${skin.name}!`);
    } else {
      // Try to unlock
      if (skin.id === "dragon") {
        if (stats.gold >= skin.cost) {
          setStats(prev => ({
            ...prev,
            gold: prev.gold - skin.cost,
            unlockedSkins: [...prev.unlockedSkins, skin.id],
            selectedSkin: skin.id
          }));
          triggerToast(`🔓 Volcanic Flame Dragon Unlocked!`);
        } else {
          triggerToast("❌ Insufficient gold coins for purchase!");
        }
      } else if (skin.id === "mecha") {
        if (stats.gems >= skin.cost) {
          setStats(prev => ({
            ...prev,
            gems: prev.gems - skin.cost,
            unlockedSkins: [...prev.unlockedSkins, skin.id],
            selectedSkin: skin.id
          }));
          triggerToast(`🔓 Mecha Iron Serpent Unlocked!`);
        } else {
          triggerToast("❌ Insufficient diamonds/gems for Cyborg integration!");
        }
      } else if (skin.id === "phoenix") {
        if ((stats.heroFragments || 0) >= skin.cost) {
          setStats(prev => ({
            ...prev,
            heroFragments: (prev.heroFragments || 0) - skin.cost,
            unlockedSkins: [...prev.unlockedSkins, skin.id],
            selectedSkin: skin.id
          }));
          triggerToast(`🔓 Legendary Cosmic Neon Phoenix Activated!`);
        } else {
          triggerToast(`❌ Need ${skin.cost} Hero Fragments to craft this celestial hero!`);
        }
      }
    }
  };

  // Gear System survivor.io upgrader
  const handleUpgradeGear = (slot: "helmet" | "armor" | "ring") => {
    let currentLevel = 1;
    if (slot === "helmet") currentLevel = stats.gearHelmetLevel;
    if (slot === "armor") currentLevel = stats.gearArmorLevel;
    if (slot === "ring") currentLevel = stats.gearRingLevel;

    const baseCost = Math.round(150 + currentLevel * 120);

    if (stats.gold >= baseCost) {
      setStats(prev => {
        const nextStats = { ...prev };
        nextStats.gold -= baseCost;
        if (slot === "helmet") {
          nextStats.gearHelmetLevel += 1;
          // Helmet boosts base start count
          nextStats.metaStartCount = Math.round(5 + nextStats.gearHelmetLevel * 2);
        }
        if (slot === "armor") {
          nextStats.gearArmorLevel += 1;
          // Armor grants passive door shields
          nextStats.metaDoorShield = 1;
        }
        if (slot === "ring") {
          nextStats.gearRingLevel += 1;
          // Ring multiplies values
          nextStats.metaGoldMultiplier = 1 + nextStats.gearRingLevel * 0.15;
        }

        // Progress upgrades count and upgrades daily quest
        nextStats.dailyUpgradesCount = (nextStats.dailyUpgradesCount || 0) + 1;
        nextStats.customDailyQuests = (nextStats.customDailyQuests || []).map(q => {
          if (q.id === "q_upgrade") return { ...q, current: Math.min(q.target, q.current + 1) };
          return q;
        });

        return nextStats;
      });
      triggerToast(`🛡️ Upgraded ${slot.toUpperCase()} to Level ${currentLevel + 1}!`);
    } else {
      triggerToast(`❌ Need $${baseCost} Gold to upgrade this piece!`);
    }
  };

  // Meta Talent allocated
  const handleAllocateTalent = (type: "start" | "shield" | "multiplier" | "offline") => {
    const cost = Math.round(200 + (
      type === "start" ? stats.metaStartCount * 50 : 
      type === "shield" ? (stats.metaDoorShield + 1) * 350 : 
      type === "multiplier" ? stats.metaGoldMultiplier * 300 : stats.metaOfflineEarnings * 80
    ));

    if (stats.gold >= cost) {
      setStats(prev => {
        const update = { ...prev };
        update.gold -= cost;
        if (type === "start") update.metaStartCount += 1;
        if (type === "shield") update.metaDoorShield += 1;
        if (type === "multiplier") update.metaGoldMultiplier += 0.05;
        if (type === "offline") update.metaOfflineEarnings += 2; // Increments offline payout

        // Progress upgrades count and upgrades daily quest
        update.dailyUpgradesCount = (update.dailyUpgradesCount || 0) + 1;
        update.customDailyQuests = (update.customDailyQuests || []).map(q => {
          if (q.id === "q_upgrade") return { ...q, current: Math.min(q.target, q.current + 1) };
          return q;
        });

        return update;
      });
      triggerToast(`🔓 Persistent Talent Upgraded successfully!`);
    } else {
      triggerToast(`❌ Need $${cost} Gold Coins to research this talent.`);
    }
  };

  // Quest milestone rewards claims
  const handleClaimDailyQuest = (questType: "play" | "grow" | "boss") => {
    if (stats.claimedQuests.includes(questType)) return;

    // Check targets matching infographic
    let allowed = false;
    let goldReward = 100;
    let gemReward = 20;

    if (questType === "play" && stats.dailyPlayedCount >= 3) {
      allowed = true;
      goldReward = 100;
      gemReward = 10;
    }
    if (questType === "grow" && stats.dailyCountGrown >= 500) {
      allowed = true;
      goldReward = 150;
      gemReward = 15;
    }
    if (questType === "boss" && stats.dailyBossDefeated >= 1) {
      allowed = true;
      goldReward = 200;
      gemReward = 20;
    }

    if (allowed) {
      setStats(prev => ({
        ...prev,
        gold: prev.gold + goldReward,
        gems: prev.gems + gemReward,
        battlePassXp: prev.battlePassXp + 35,
        claimedQuests: [...prev.claimedQuests, questType],
      }));
      triggerToast(`🎁 Quest claimed! +$${goldReward} and 💎${gemReward}!`);
    } else {
      triggerToast("❌ Goal milestones are not completed yet!");
    }
  };

  // Simulating Gacha chest pulls
  const handlePullChest = (type: "common" | "rare" | "epic") => {
    let price = 0;
    if (type === "rare") price = 40; // gems
    if (type === "epic") price = 120; // gems

    if (type === "common") {
      // Simulated ad cooldown check
      const rewardedGold = Math.floor(Math.random() * 80) + 40;
      setStats(prev => ({ ...prev, gold: prev.gold + rewardedGold }));
      triggerToast(`🎬 Gacha Chest Opened: +$${rewardedGold} Gold coins!`);
    } else if (stats.gems >= price) {
      const rewardedGold = type === "rare" ? Math.floor(Math.random() * 250) + 100 : Math.floor(Math.random() * 800) + 500;
      const extraGems = type === "rare" ? 0 : Math.floor(Math.random() * 20);
      
      // helmet or armor component simulation
      setStats(prev => ({
        ...prev,
        gems: prev.gems - price,
        gold: prev.gold + rewardedGold,
        gemsAccrued: prev.gems + extraGems,
      }));
      triggerToast(`📦 Epic Gacha opened: +$${rewardedGold} Gold, 💎${extraGems}!`);
    } else {
      triggerToast("❌ Missing sufficient diamonds/gems for this chest pull.");
    }
  };

  // Battle Pass simulations unlocks
  const handleClaimBattlePassTier = () => {
    if (stats.battlePassXp >= 100) {
      setStats(prev => ({
        ...prev,
        battlePassXp: prev.battlePassXp - 100,
        gold: prev.gold + 300,
        gems: prev.gems + 15
      }));
      triggerToast("🦁 Season Pass Tier claimed! +$300 & 💎15!");
    } else {
      triggerToast("❌ Need 100 BattlePass XP. Complete stages and daily tasks!");
    }
  };

  const handleUnlockPremiumPass = () => {
    if (!stats.premiumPassUnlocked) {
      setStats(prev => ({
        ...prev,
        premiumPassUnlocked: true,
        gems: prev.gems + 80 // Bonus Gems!
      }));
      triggerToast("👑 Premium Battle Pass Unlocked! Received 80 Gem Bonus!");
    }
  };

  // AI-powered dynamic viral marketing generator (Gemini integration)
  const handleGenerateViralShort = async () => {
    setIsLoadingAi(true);
    setGeneratedScript("");
    setGeneratedStrategy("");

    const activeSkin = HERO_SKINS.find(s => s.id === stats.selectedSkin);

    try {
      const res = await fetch("/api/viral-studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skinName: activeSkin?.name || "Standard Little Blue Snake",
          currentStage: stats.currentStage,
          highScore: stats.highScore,
          metaUpgrades: {
            startCount: stats.metaStartCount,
            doorShield: stats.metaDoorShield,
            payoutMultiplier: stats.metaGoldMultiplier,
            offlineLevel: stats.metaOfflineEarnings,
          },
          playerPrompt: customPrompt,
        }),
      });

      const data = await res.json();
      if (data.script) {
        setGeneratedScript(data.script);
        setGeneratedStrategy(data.strategyBlueprint);
        triggerToast("🤖 AI generated viral video formula successfully!");
      } else {
        triggerToast("⚠️ AI response parsed incorrectly. Using high-scoring preset.");
      }
    } catch (e) {
      triggerToast("⚠️ Network issue. Using standard fallback TikTok formula.");
    } finally {
      setIsLoadingAi(false);
    }
  };

  const getQuestDisplayName = (quest: any) => {
    if (language === "zh") {
      switch (quest.id) {
        case "q_play": return "賽道制霸先鋒";
        case "q_grow": return "巨量長度大師";
        case "q_boss": return "熔岩巨龍獵手";
        case "q_upgrade": return "強化狂熱份子";
        case "q_score": return "突破數值極限";
        default: return quest.title;
      }
    }
    return quest.title;
  };

  const getQuestDisplayDesc = (quest: any) => {
    if (language === "zh") {
      switch (quest.id) {
        case "q_play": return "在當前賽道上主動完成 3 次跑酷衝刺挑戰";
        case "q_grow": return "在跑酷關卡中累計長出並吞噬 500 節蛇段長度";
        case "q_boss": return "在賽道終點成功擊敗 1 個熔岩噴火龍 Boss 首領";
        case "q_upgrade": return "升級穿戴裝備或投入永久天賦科學研究累計 2 次";
        case "q_score": return "在單場跑酷中累計達到並衝破 150 點最高單場得分";
        default: return quest.description;
      }
    }
    return quest.description;
  };

  const activeSkinObj = HERO_SKINS.find(s => s.id === stats.selectedSkin) || HERO_SKINS[0];

  return (
    <div className="min-h-screen bg-[#070811] text-gray-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      
      {/* Dynamic Toast indicator */}
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-indigo-600/90 border border-indigo-400 backdrop-blur-md px-5 py-3 rounded-xl shadow-2xl shadow-indigo-600/30 text-white font-bold text-sm z-50 flex items-center gap-2 animate-fade-in-down animate-bounce">
          <Sparkles className="w-4 h-4 text-yellow-300" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Offline Idle Reward Modal popup */}
      {showIdlePopup && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f1124] border-2 border-yellow-500/40 rounded-2xl p-6 text-center max-w-sm w-full shadow-2xl shadow-yellow-500/10">
            <div className="w-16 h-16 rounded-full bg-yellow-500/10 border-2 border-yellow-400 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Coins className="w-8 h-8 text-yellow-400" />
            </div>
            <h4 className="text-2xl font-black text-yellow-400 font-sans uppercase">Idle Crawl Payout!</h4>
            <p className="text-slate-300 text-xs mt-1 mb-6">
              While you slept, your number snakes have crawled miles of track and gathered idle gold coins for you.
            </p>

            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 mb-6">
              <span className="text-[10px] uppercase text-yellow-400 font-black tracking-widest block">Accrued offline</span>
              <span className="text-3xl font-extrabold text-[#FBBF24] font-mono block mt-0.5">${idleGoldReward}</span>
            </div>

            <button
              onClick={handleClaimIdleRewards}
              className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 font-black text-sm rounded-xl tracking-wide hover:from-yellow-400 hover:to-amber-400 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              CLAIM GOLD REWARDS
            </button>
          </div>
        </div>
      )}

      {/* Immersive Game Welcome Guide / Startup Introduction Modal */}
      <AnimatePresence>
        {showWelcomeModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25 }}
              className="bg-[#0f1124] border-2 border-purple-500/40 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl shadow-purple-900/40 my-8 max-h-[90vh] overflow-y-auto"
            >
              {/* Language quick switcher in header */}
              <div className="flex justify-between items-center mb-6 border-b border-purple-500/10 pb-4">
                <div className="flex gap-2 items-center">
                  <span className="text-xl animate-spin">⚡</span>
                  <span className="text-[10px] text-purple-400 font-mono font-black tracking-widest uppercase">
                    TRAINING BASE / 倖存者引導
                  </span>
                </div>
                <div className="bg-slate-950/90 border border-slate-800 p-1 rounded-xl flex gap-1">
                  <button
                    onClick={() => setLanguage("zh")}
                    className={`px-3 py-1 text-[10.5px] font-black tracking-wide rounded-lg transition-all ${
                      language === "zh" 
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25" 
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    繁體中文
                  </button>
                  <button
                    onClick={() => setLanguage("en")}
                    className={`px-3 py-1 text-[10.5px] font-black tracking-wide rounded-lg transition-all ${
                      language === "en" 
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25" 
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>

              {/* Logo heading */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 flex items-center justify-center shadow-lg shadow-purple-600/35 mx-auto mb-3">
                  <span className="text-4xl animate-pulse">🐍</span>
                </div>
                <h3 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-pink-300 uppercase tracking-tight font-sans">
                  {t("guide_title")}
                </h3>
                <p className="text-xs text-slate-300 mt-2 max-w-lg mx-auto leading-relaxed">
                  {t("guide_subtitle")}
                </p>
              </div>

              {/* Explanatory Sections */}
              <div className="space-y-3 mb-6">
                
                {/* 1. Slide to grow */}
                <div className="bg-slate-950/70 border border-slate-900 p-4 rounded-2xl flex gap-3.5 items-start">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                    <Compass className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">
                      {t("guide_play_title")}
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                      {t("guide_play_desc")}
                    </p>
                  </div>
                </div>

                {/* 2. Armours & Shields */}
                <div className="bg-slate-950/70 border border-slate-900 p-4 rounded-2xl flex gap-3.5 items-start">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">
                      {t("guide_shield_title")}
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                      {t("guide_shield_desc")}
                    </p>
                  </div>
                </div>

                {/* 3. Volcanic dragon boss */}
                <div className="bg-slate-950/70 border border-slate-900 p-4 rounded-2xl flex gap-3.5 items-start">
                  <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5 text-red-400 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">
                      {t("guide_boss_title")}
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                      {t("guide_boss_desc")}
                    </p>
                  </div>
                </div>

                {/* 4. Idle cap visits */}
                <div className="bg-slate-950/70 border border-slate-900 p-4 rounded-2xl flex gap-3.5 items-start">
                  <div className="w-10 h-10 rounded-xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <Gift className="w-5 h-5 text-amber-400 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">
                      {t("guide_quest_title")}
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                      {t("guide_quest_desc")}
                    </p>
                  </div>
                </div>

              </div>

              {/* Close Button */}
              <button
                onClick={() => {
                  localStorage.setItem("snake_runner_welcome_v1", "true");
                  setShowWelcomeModal(false);
                }}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 border border-purple-400/20 text-white font-black text-xs rounded-xl tracking-widest hover:from-purple-500 hover:to-amber-500 flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-purple-600/25"
              >
                <Play className="w-4 h-4 fill-white animate-pulse" />
                {t("guide_close_btn")}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GORGEOUS TOP STRIP HUD STATS */}
      <header className="sticky top-0 bg-[#070811]/90 backdrop-blur-md border-b border-purple-500/10 px-4 md:px-8 py-3.5 z-40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo Brand matching visual design */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 flex items-center justify-center shadow-lg shadow-purple-600/20">
              <span className="text-xl">🐍</span>
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-indigo-100 uppercase">
                {t("app_title")}
              </h1>
              <p className="text-[10px] text-purple-400 font-mono tracking-widest uppercase mt-px">
                {t("app_subtitle")}
              </p>
            </div>
          </div>

          {/* Currencies & Controls Wrapper */}
          <div className="flex flex-wrap gap-4 items-center justify-center md:justify-end">
            
            {/* Currencies list */}
            <div className="flex flex-wrap gap-2 items-center justify-center">
              {/* Gold coins wrapper */}
              <div className="bg-[#0f1124] border border-yellow-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-inner">
                <Coins className="w-4 h-4 text-yellow-400" />
                <span className="text-[9px] text-yellow-500/70 font-mono font-bold mr-0.5">{t("gold")}</span>
                <span className="text-xs font-extrabold text-yellow-300 font-mono">${stats.gold}</span>
              </div>

              {/* Gems diamonds wrapper */}
              <div className="bg-[#0f1124] border border-cyan-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-inner">
                <Gem className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="text-[9px] text-cyan-500/70 font-mono font-bold mr-0.5">{t("diamonds")}</span>
                <span className="text-xs font-extrabold text-cyan-300 font-mono">{stats.gems}</span>
              </div>

              {/* Hero Fragments collector wrapper */}
              <div className="bg-[#0f1124] border border-pink-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-inner">
                <Sparkles className="w-4 h-4 text-pink-400" />
                <span className="text-[9px] text-pink-500/70 font-mono font-bold mr-0.5">{t("shards")}</span>
                <span className="text-xs font-extrabold text-[#F472B6] font-mono">{stats.heroFragments || 0}/10</span>
              </div>

              {/* Highest Score Record count */}
              <div className="bg-slate-900 border border-pink-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-inner">
                <Award className="w-4 h-4 text-pink-400" />
                <span className="text-[9px] text-pink-500/70 font-sans font-bold mr-0.5">{t("best")}</span>
                <span className="text-xs font-extrabold text-pink-300 font-mono">{stats.highScore}</span>
              </div>
            </div>

            {/* Quick Lang Switcher & Help Info */}
            <div className="flex items-center gap-1.5 bg-[#0a0c16] border border-purple-500/15 p-1 rounded-xl shadow-inner shrink-0">
              {/* Language switcher */}
              <button
                onClick={() => setLanguage(language === "zh" ? "en" : "zh")}
                className="px-2.5 py-1.5 rounded-lg text-[9px] font-black font-mono transition-all uppercase bg-purple-900/30 hover:bg-purple-800 text-purple-200 border border-purple-500/10 flex items-center gap-1"
              >
                🌐 {language === "zh" ? "ENGLISH" : "繁體中文"}
              </button>

              {/* Float Help Button */}
              <button
                onClick={() => setShowWelcomeModal(true)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-pink-900/20 text-pink-300 hover:text-white border border-pink-500/10 hover:border-pink-500/30 transition-all font-mono text-xs font-bold"
                title={language === "zh" ? "顯示遊戲說明與指南" : "Show Game Instructions"}
              >
                ❓
              </button>
            </div>

          </div>

        </div>
      </header>

      {/* DETAILED CONTENT CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: ACTIVE VIEW TAB MODULE (COL 7) */}
        <section className="lg:col-span-7 flex flex-col gap-6" id="viewSection">
          
          {/* Main Action tab content controllers */}
          <div className="bg-[#0f1124]/40 border border-purple-500/10 rounded-2xl p-4">
            
            {/* Nav List */}
            <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
              <button
                onClick={() => setActiveTab("arcade")}
                className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all border outline-none ${
                  activeTab === "arcade"
                    ? "bg-indigo-600/20 border-indigo-500 text-indigo-200"
                    : "bg-slate-900/60 border-transparent text-slate-400 hover:text-white"
                }`}
              >
                {t("tab_arcade")}
              </button>
              <button
                onClick={() => setActiveTab("heroes")}
                className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all border outline-none ${
                  activeTab === "heroes"
                    ? "bg-indigo-600/20 border-indigo-500 text-indigo-200"
                    : "bg-slate-900/60 border-transparent text-slate-400 hover:text-white"
                }`}
              >
                {t("tab_heroes")}
              </button>
              <button
                onClick={() => setActiveTab("gears")}
                className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all border outline-none ${
                  activeTab === "gears"
                    ? "bg-indigo-600/20 border-indigo-500 text-indigo-200"
                    : "bg-slate-900/60 border-transparent text-slate-400 hover:text-white"
                }`}
              >
                {t("tab_gears")}
              </button>
              <button
                onClick={() => setActiveTab("talents")}
                className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all border outline-none ${
                  activeTab === "talents"
                    ? "bg-indigo-600/20 border-indigo-500 text-indigo-200"
                    : "bg-slate-900/60 border-transparent text-slate-400 hover:text-white"
                }`}
              >
                {t("tab_talents")}
              </button>
              <button
                onClick={() => setActiveTab("gacha")}
                className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all border outline-none ${
                  activeTab === "gacha"
                    ? "bg-indigo-600/20 border-indigo-500 text-indigo-200"
                    : "bg-slate-900/60 border-transparent text-slate-400 hover:text-white"
                }`}
              >
                {t("tab_gacha")}
              </button>
              <button
                onClick={() => setActiveTab("leaderboard")}
                className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all border outline-none ${
                  activeTab === "leaderboard"
                    ? "bg-indigo-600/20 border-indigo-500 text-indigo-200"
                    : "bg-slate-900/60 border-transparent text-slate-400 hover:text-white"
                }`}
              >
                {t("tab_rank")}
              </button>
              <button
                onClick={() => setActiveTab("studio")}
                className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all border outline-none ${
                  activeTab === "studio"
                    ? "bg-indigo-600/20 border-indigo-500 text-indigo-200"
                    : "bg-slate-900/60 border-transparent text-slate-500 hover:text-white"
                }`}
              >
                {t("tab_studio")}
              </button>
            </div>
          </div>

          {/* ACTIVE TAB VIEWER SCREEN CARD CONTAINER */}
          <div className="bg-[#0f1124]/40 border border-purple-500/10 rounded-3xl p-5 min-h-[480px]">
            {/* 1. Play Arcade mode containing HTML5 Game Engine */}
            {activeTab === "arcade" && (
              <div className="flex flex-col gap-5">
                <div className="flex justify-between items-center bg-black/40 border border-slate-800 p-3.5 rounded-2xl">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 uppercase">
                      <Compass className="w-4 h-4 text-purple-400 animate-spin" /> {language === "zh" ? "賽道突圍中" : "SECURING LINE SECTION"}
                    </h3>
                    <p className="text-xs text-slate-400">{t("cur_stage", { stage: stats.currentStage })}</p>
                  </div>
                  {/* Farming indicator */}
                  <div className="text-right text-xs">
                    <span className="text-slate-400 block font-mono text-[10px]">{t("passive_earnings")}</span>
                    <span className="text-yellow-400 font-extrabold font-mono">${stats.metaOfflineEarnings} {t("g_rate")}</span>
                  </div>
                </div>

                <SnakeGame
                  stats={stats}
                  selectedSkinColor={activeSkinObj.color}
                  selectedSkinIcon={stats.selectedSkin === "blue" ? "🔵" : stats.selectedSkin === "dragon" ? "🦖" : stats.selectedSkin === "mecha" ? "🤖" : "🔥"}
                  onWin={handleGameWin}
                  onLose={handleGameLose}
                  onScoreGrow={handleScoreGrow}
                />
              </div>
            )}

            {/* 2. Skin unlock segment */}
            {activeTab === "heroes" && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-2xl font-black text-white font-sans uppercase">{t("skin_title")}</h3>
                  <p className="text-xs text-slate-400">{t("skin_subtitle")}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {HERO_SKINS.map((skin) => {
                    const isUnlocked = stats.unlockedSkins.includes(skin.id);
                    const isSelected = stats.selectedSkin === skin.id;

                    return (
                      <div
                        key={skin.id}
                        onClick={() => setSelectedSkinDetail(skin)}
                        className={`bg-[#141732] border rounded-2xl p-4 cursor-pointer relative transition-all ${
                          isSelected ? "border-indigo-400 shadow-lg" : "border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="absolute top-2.5 right-2.5">
                          {isSelected ? (
                            <span className="bg-indigo-600/20 border border-indigo-400 text-indigo-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full font-mono">
                              {language === "zh" ? "正在使用" : "EQUIPPED"}
                            </span>
                          ) : isUnlocked ? (
                            <span className="bg-slate-800 border border-slate-700 text-slate-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full font-mono">
                              {language === "zh" ? "可裝備" : "READY"}
                            </span>
                          ) : (
                            <span className="bg-amber-600/20 border border-amber-400 text-amber-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full font-mono">
                              {language === "zh" ? "未解鎖" : "LOCKED"}
                            </span>
                          )}
                        </div>

                        {/* Skin Orb Avatar */}
                        <div
                          className="w-14 h-14 rounded-full flex items-center justify-center text-3xl mb-4 shadow-md mt-2"
                          style={{ backgroundColor: `${skin.color}20`, border: `2px solid ${skin.color}` }}
                        >
                          {skin.id === "blue" ? "🔵" : skin.id === "dragon" ? "🦖" : skin.id === "mecha" ? "🤖" : "🔥"}
                        </div>

                        <h4 className="text-sm font-extrabold text-white uppercase">
                          {language === "zh" ? getSkinZhName(skin.id) : skin.chinese}
                        </h4>
                        <span className="text-[10px] uppercase block font-semibold text-purple-400 tracking-wider">
                          {skin.name}
                        </span>

                        <div className="bg-black/40 border border-slate-800/40 rounded-lg p-2.5 mt-3 text-xs font-mono text-emerald-400">
                          {language === "zh" ? getSkinZhBonus(skin.id) : skin.bonusText}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Skin purchase details view */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row gap-5 items-center">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center text-5xl shrink-0"
                    style={{ backgroundColor: `${selectedSkinDetail.color}15`, border: `3px solid ${selectedSkinDetail.color}` }}
                  >
                    {selectedSkinDetail.id === "blue" ? "🔵" : selectedSkinDetail.id === "dragon" ? "🦖" : selectedSkinDetail.id === "mecha" ? "🤖" : "🔥"}
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h4 className="text-lg font-black text-white uppercase">
                      {language === "zh" ? getSkinZhName(selectedSkinDetail.id) : selectedSkinDetail.chinese}
                    </h4>
                    <span className="text-xs text-indigo-300 block mb-1">{selectedSkinDetail.name}</span>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                      {language === "zh" ? getSkinZhDescription(selectedSkinDetail.id) : selectedSkinDetail.description}
                    </p>
                  </div>
                  <div className="shrink-0 w-full md:w-auto">
                    <button
                      onClick={() => handleEquipOrBuySkin(selectedSkinDetail)}
                      className={`w-full md:w-auto px-6 py-3 rounded-xl font-extrabold text-sm active:scale-95 transition-all outline-none ${
                        stats.unlockedSkins.includes(selectedSkinDetail.id)
                          ? "bg-indigo-600 text-white"
                          : "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 hover:from-amber-400 hover:to-yellow-400"
                      }`}
                    >
                      {stats.unlockedSkins.includes(selectedSkinDetail.id) ? (
                        stats.selectedSkin === selectedSkinDetail.id 
                          ? (language === "zh" ? "正在使用" : "ACTIVE") 
                          : (language === "zh" ? "裝備英雄" : "EQUIP HERO")
                      ) : (
                        language === "zh" 
                          ? `消耗 ${selectedSkinDetail.id === "dragon" ? `$${selectedSkinDetail.cost} 金幣` : selectedSkinDetail.id === "mecha" ? `💎${selectedSkinDetail.cost} 鑽石` : `✨${selectedSkinDetail.cost} 碎塊`} 解鎖`
                          : `UNLOCK FOR ${selectedSkinDetail.id === "dragon" ? `$${selectedSkinDetail.cost} Gold` : selectedSkinDetail.id === "mecha" ? `💎${selectedSkinDetail.cost} Gems` : `✨${selectedSkinDetail.cost} Shards`}`
                      )}
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* 3. Survivor.io Equipment upgrader */}
            {activeTab === "gears" && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-2xl font-black text-white font-sans uppercase">{t("gear_title")}</h3>
                  <p className="text-xs text-slate-400">{t("gear_subtitle")}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  
                  {/* Helmet item card */}
                  <div className="bg-[#141732] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between items-center text-center">
                    <div>
                      <span className="text-xs font-mono font-bold bg-[#FBBF24]/10 text-yellow-400 px-3 py-1 rounded-full border border-yellow-500/20 block w-max mx-auto mb-3">LVL {stats.gearHelmetLevel}</span>
                      <span className="text-4xl block mb-2">🪖</span>
                      <h4 className="font-extrabold text-white uppercase">{t("gear_helmet")}</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-[150px] mx-auto">{t("gear_helmet_desc")}</p>
                      <span className="text-xs font-semibold text-slate-400 mt-2 block font-mono">
                        {t("gear_base_seg")}: {stats.metaStartCount}
                      </span>
                    </div>

                    <button
                      onClick={() => handleUpgradeGear("helmet")}
                      className="w-full mt-5 py-2.5 bg-indigo-600/80 border border-indigo-400/40 text-xs font-extrabold rounded-xl text-indigo-100 hover:bg-indigo-600 transition-all uppercase"
                    >
                      {t("upgrade")}: ${Math.round(150 + stats.gearHelmetLevel * 120)}
                    </button>
                  </div>

                  {/* Armor item card */}
                  <div className="bg-[#141732] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between items-center text-center">
                    <div>
                      <span className="text-xs font-mono font-bold bg-[#FBBF24]/10 text-yellow-400 px-3 py-1 rounded-full border border-yellow-500/20 block w-max mx-auto mb-3">LVL {stats.gearArmorLevel}</span>
                      <span className="text-4xl block mb-2">🛡️</span>
                      <h4 className="font-extrabold text-white uppercase">{t("gear_armor")}</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-[150px] mx-auto">{t("gear_armor_desc")}</p>
                      <span className="text-xs font-semibold text-slate-400 mt-2 block font-mono">
                        {t("gear_shield_lvl")}: {stats.metaDoorShield} Charge
                      </span>
                    </div>

                    <button
                      onClick={() => handleUpgradeGear("armor")}
                      className="w-full mt-5 py-2.5 bg-indigo-600/80 border border-indigo-400/40 text-xs font-extrabold rounded-xl text-indigo-100 hover:bg-indigo-600 transition-all uppercase"
                    >
                      {t("upgrade")}: ${Math.round(150 + stats.gearArmorLevel * 120)}
                    </button>
                  </div>

                  {/* Ring multiplier item card */}
                  <div className="bg-[#141732] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between items-center text-center">
                    <div>
                      <span className="text-xs font-mono font-bold bg-[#FBBF24]/10 text-yellow-400 px-3 py-1 rounded-full border border-yellow-500/20 block w-max mx-auto mb-3">LVL {stats.gearRingLevel}</span>
                      <span className="text-4xl block mb-2">💍</span>
                      <h4 className="font-extrabold text-white uppercase">{t("gear_ring")}</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-[150px] mx-auto">{t("gear_ring_desc")}</p>
                      <span className="text-xs font-semibold text-slate-400 mt-2 block font-mono">
                        {t("gear_gold_mult")}: +{Math.round((stats.metaGoldMultiplier - 1)*100)}%
                      </span>
                    </div>

                    <button
                      onClick={() => handleUpgradeGear("ring")}
                      className="w-full mt-5 py-2.5 bg-indigo-600/80 border border-indigo-400/40 text-xs font-extrabold rounded-xl text-indigo-100 hover:bg-indigo-600 transition-all uppercase"
                    >
                      {t("upgrade")}: ${Math.round(150 + stats.gearRingLevel * 120)}
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* 4. Talent Allocator panel */}
            {activeTab === "talents" && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-2xl font-black text-white font-sans uppercase">{t("talent_title")}</h3>
                  <p className="text-xs text-slate-400">{t("talent_subtitle")}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Start count talent */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex gap-4 items-center">
                    <span className="text-3xl">🏁</span>
                    <div className="flex-1">
                      <h4 className="text-sm font-extrabold text-[#FFF] uppercase">{t("talent_start")}</h4>
                      <p className="text-xs text-slate-400">{t("talent_start_desc")}: {stats.metaStartCount}</p>
                      <button
                        onClick={() => handleAllocateTalent("start")}
                        className="mt-2 text-[10px] font-extrabold uppercase text-yellow-400 flex items-center gap-1 hover:underline"
                      >
                        {t("allocate")}: ${200 + stats.metaStartCount * 50} {t("gold_unit")} <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Door shield talent */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex gap-4 items-center">
                    <span className="text-3xl">🛡️</span>
                    <div className="flex-1">
                      <h4 className="text-sm font-extrabold text-[#FFF] uppercase">{t("talent_shield")}</h4>
                      <p className="text-xs text-slate-400">{t("talent_shield_desc")}: {stats.metaDoorShield}</p>
                      <button
                        onClick={() => handleAllocateTalent("shield")}
                        className="mt-2 text-[10px] font-extrabold uppercase text-yellow-400 flex items-center gap-1 hover:underline"
                      >
                        {t("allocate")}: ${200 + (stats.metaDoorShield + 1) * 350} {t("gold_unit")} <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Gold Multiplier talent */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex gap-4 items-center">
                    <span className="text-3xl">⭐</span>
                    <div className="flex-1">
                      <h4 className="text-sm font-extrabold text-[#FFF] uppercase">{t("talent_multi")}</h4>
                      <p className="text-xs text-slate-400">{t("talent_multi_desc")}: x{stats.metaGoldMultiplier.toFixed(2)}</p>
                      <button
                        onClick={() => handleAllocateTalent("multiplier")}
                        className="mt-2 text-[10px] font-extrabold uppercase text-yellow-400 flex items-center gap-1 hover:underline"
                      >
                        {t("allocate")}: ${Math.round(200 + stats.metaGoldMultiplier * 300)} {t("gold_unit")} <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Idle speed talent */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex gap-4 items-center">
                    <span className="text-3xl">⏱️</span>
                    <div className="flex-1">
                      <h4 className="text-sm font-extrabold text-[#FFF] uppercase">{t("talent_idle")}</h4>
                      <p className="text-xs text-slate-400">{t("talent_idle_desc")}: {stats.metaOfflineEarnings}g/min</p>
                      <button
                        onClick={() => handleAllocateTalent("offline")}
                        className="mt-2 text-[10px] font-extrabold uppercase text-yellow-400 flex items-center gap-1 hover:underline"
                      >
                        {t("allocate")}: ${200 + stats.metaOfflineEarnings * 80} {t("gold_unit")} <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* 5. Gacha chest module */}
            {activeTab === "gacha" && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-2xl font-black text-white font-sans uppercase">{t("chest_title")}</h3>
                  <p className="text-xs text-slate-400">{t("chest_subtitle")}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Common Chest */}
                  <div className="bg-[#141732] border border-slate-800 p-5 rounded-2xl flex flex-col justify-between items-center text-center">
                    <div>
                      <span className="text-slate-300 text-xs font-bold uppercase block">{t("chest_ordinary")}</span>
                      <span className="text-4xl block my-3">📦</span>
                      <p className="text-xs text-slate-400">{t("chest_ordinary_desc")}</p>
                    </div>
                    <button
                      onClick={() => handlePullChest("common")}
                      className="w-full mt-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-extrabold rounded-xl uppercase text-yellow-400 flex items-center justify-center gap-1"
                    >
                      {t("watch_ad")}
                    </button>
                  </div>

                  {/* Rare Chest */}
                  <div className="bg-[#141732] border border-purple-950 p-5 rounded-2xl flex flex-col justify-between items-center text-center">
                    <div>
                      <span className="text-purple-300 text-xs font-bold uppercase block">{t("chest_rare")}</span>
                      <span className="text-4xl block my-3">🔮</span>
                      <p className="text-xs text-slate-400">{t("chest_rare_desc")}</p>
                    </div>
                    <button
                      onClick={() => handlePullChest("rare")}
                      className="w-full mt-5 py-2.5 bg-purple-700 hover:bg-purple-600 text-xs font-extrabold rounded-xl uppercase text-purple-100 flex items-center justify-center gap-1"
                    >
                      {t("open_gems_40")}
                    </button>
                  </div>

                  {/* Epic Chest */}
                  <div className="bg-[#141732] border border-amber-950 p-5 rounded-2xl flex flex-col justify-between items-center text-center">
                    <div>
                      <span className="text-amber-300 text-xs font-bold uppercase block">{t("chest_epic")}</span>
                      <span className="text-4xl block my-3">👑</span>
                      <p className="text-xs text-slate-400">{t("chest_epic_desc")}</p>
                    </div>
                    <button
                      onClick={() => handlePullChest("epic")}
                      className="w-full mt-5 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-600 text-slate-950 font-black text-xs rounded-xl uppercase flex items-center justify-center gap-1"
                    >
                      {t("grand_open")}
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* 6. High Score Leaderboard list */}
            {activeTab === "leaderboard" && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-2xl font-black text-white font-sans uppercase font-head">{t("leaderboard_title")}</h3>
                  <p className="text-xs text-slate-400">{t("leaderboard_subtitle")}</p>
                </div>

                <div className="flex flex-col gap-2.5 bg-slate-950/60 p-4 rounded-2xl border border-slate-900">
                  {leaderboard.map((entry) => (
                    <div
                      key={entry.name}
                      className={`flex items-center justify-between p-3 rounded-xl border ${
                        entry.isPlayer 
                          ? "bg-indigo-600/10 border-indigo-500/40 text-white font-bold" 
                          : "bg-slate-900/60 border-slate-800 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black font-mono ${
                          entry.rank === 1 ? "bg-yellow-500 text-slate-950" :
                          entry.rank === 2 ? "bg-slate-350 text-slate-900 bg-gray-400" :
                          entry.rank === 3 ? "bg-amber-600 text-white" : "bg-slate-800 text-slate-400"
                        }`}>
                          {entry.rank}
                        </span>
                        <span className="text-sm font-semibold">{entry.name} {entry.isPlayer && `⭐ ${language === "zh" ? "(你)" : "(You)"}`}</span>
                      </div>
                      <span className="text-sm font-extrabold font-mono text-yellow-400">
                        {entry.score.toLocaleString()} {language === "zh" ? "最高分長度" : "HP score"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7. AI VIRAL PROMO & STRATEGY CENTER */}
            {activeTab === "studio" && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 font-sans uppercase">
                    {t("studio_title")}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {t("studio_subtitle")}
                  </p>
                </div>

                {/* Gemini prompt box */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5">
                  <span className="text-xs text-indigo-300 font-extrabold block uppercase mb-1">{t("studio_custom_style")}</span>
                  <p className="text-[11px] text-slate-400 mb-3">
                    {t("studio_custom_style_desc")}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      className="flex-1 bg-slate-950 border border-slate-700/60 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
                      placeholder={language === "zh" ? "例如：爆笑手殘挑戰、熱血極限瞬移、解壓極簡旁白..." : "e.g. fail story reaction, energetic speedrunner hook..."}
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                    />
                    <button
                      onClick={handleGenerateViralShort}
                      disabled={isLoadingAi}
                      className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white text-xs font-black rounded-xl border border-purple-400/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <Wand2 className="w-4 h-4 animate-pulse" /> {isLoadingAi ? t("studio_generating") : t("studio_generate")}
                    </button>
                  </div>
                </div>

                {/* Gemini terminal outputs */}
                {(generatedScript || generatedStrategy) ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Script view */}
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between max-h-[350px] overflow-y-auto">
                      <div>
                        <span className="text-[10px] text-pink-400 font-black tracking-widest block uppercase mb-2">🎙️ {t("studio_script")}</span>
                        <div className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
                          {generatedScript}
                        </div>
                      </div>
                    </div>

                    {/* Marketing blue-prints */}
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between max-h-[350px] overflow-y-auto">
                      <div>
                        <span className="text-[10px] text-indigo-400 font-black tracking-widest block uppercase mb-2">📌 {t("studio_advice")}</span>
                        <div className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
                          {generatedStrategy}
                        </div>
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="bg-slate-900/40 border border-dashed border-slate-800/80 rounded-2xl p-8 text-center text-slate-500">
                    <Video className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                    <p className="text-xs">{t("studio_no_script")}</p>
                  </div>
                )}

              </div>
            )}

          </div>
        </section>

        {/* RIGHT COLUMN: VIRAL GAMEPLAY FORMULA DOCUMENTATION & BP PANELS (COL 5) */}
        <section className="lg:col-span-5 flex flex-col gap-6" id="blueprintSection">
          
          {/* Survivor.io styled Season Pass / Battle Pass container */}
          <div className="bg-gradient-to-br from-indigo-950 to-slate-950 border border-indigo-500/25 rounded-3xl p-5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <span className="bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10px] font-black uppercase px-2 py-0.5 rounded-full animate-pulse">
                SEASON 1
              </span>
            </div>

            <h3 className="text-lg font-black text-white font-sans uppercase">{t("bp_title")}</h3>
            <p className="text-xs text-indigo-300 mb-4">{t("bp_subtitle")}</p>

            <div className="bg-[#0f1124] border border-indigo-400/20 rounded-2xl p-4 mb-4">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-slate-400">{t("bp_progress")}: {stats.battlePassXp}/100 XP</span>
                <span className="text-yellow-400 font-bold uppercase text-[10px]">{t("bp_ready")}</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-pink-500 to-indigo-500 h-full rounded-full" style={{ width: `${Math.min(100, stats.battlePassXp)}%` }} />
              </div>
            </div>

            <div className="flex justify-between gap-4">
              <button
                onClick={handleClaimBattlePassTier}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl uppercase active:scale-95 transition-all outline-none"
              >
                {t("bp_claim")}
              </button>

              <button
                onClick={handleUnlockPremiumPass}
                disabled={stats.premiumPassUnlocked}
                className={`flex-1 py-3 border rounded-xl font-extrabold text-xs uppercase transition-all flex items-center justify-center gap-1 active:scale-95 outline-none ${
                  stats.premiumPassUnlocked 
                    ? "bg-slate-900 border-slate-800 text-slate-500" 
                    : "bg-gradient-to-r from-amber-500 to-yellow-500 border-yellow-400 text-slate-950"
                }`}
              >
                <Lock className="w-3.5 h-3.5" /> {stats.premiumPassUnlocked ? t("bp_unlocked") : t("bp_unlock")}
              </button>
            </div>
          </div>

          {/* Daily Consecutive Login Tracker Box */}
          <div className="bg-[#0f1124]/70 border border-indigo-500/35 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
            <h3 className="text-base font-black text-white tracking-wide uppercase mb-3 flex items-center gap-2">
              <CalendarCheck2 className="w-5 h-5 text-indigo-400" /> {t("login_title")}
            </h3>
            <p className="text-[11px] text-slate-400 mb-4 font-sans">
              {t("login_subtitle")}
            </p>

            {/* Horizontal progress timeline of Day 1 to 7 */}
            <div className="grid grid-cols-7 gap-1 px-1 py-1 mb-4">
              {DAILY_LOGIN_REWARDS.map((reward) => {
                const currentDay = stats.consecutiveLogins || 1;
                const isClaimed = stats.dailyLoginClaimed && reward.day === currentDay;
                const isPast = reward.day < currentDay;
                const isToday = reward.day === currentDay;
                
                return (
                  <div 
                    key={reward.day}
                    className={`flex flex-col items-center p-1.5 rounded-lg border text-center transition-all relative ${
                      isPast 
                        ? "bg-slate-950/80 border-slate-900/60 text-slate-500" 
                        : isToday
                        ? "bg-indigo-950/90 border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.25)] text-slate-100 font-black"
                        : "bg-slate-900/40 border-slate-800/60 text-slate-400"
                    }`}
                  >
                    <span className="text-[9px] font-black tracking-tighter uppercase font-mono mb-1 text-slate-400">D{reward.day}</span>
                    <span className="text-sm mb-1">
                      {reward.type === "gold" ? "🪙" : reward.type === "gems" ? "💎" : reward.type === "fragments" ? "✨" : "👑"}
                    </span>
                    <span className="text-[8px] font-black font-mono leading-none tracking-tight block truncate w-full text-slate-300">
                      {reward.type === "gold" ? `$${reward.amount}` : reward.type === "gems" ? `💎${reward.amount}` : reward.type === "fragments" ? `✨${reward.amount}` : "MEGA"}
                    </span>
                    
                    {isPast && (
                      <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                        <span className="text-[10px]">✅</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Claim button */}
            <button
              onClick={claimDailyLoginBonus}
              disabled={stats.dailyLoginClaimed}
              className={`w-full py-2.5 rounded-xl font-extrabold text-[11px] uppercase transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-md ${
                stats.dailyLoginClaimed
                  ? "bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-amber-500 to-yellow-500 border border-yellow-400 text-slate-950 hover:from-amber-400 hover:to-yellow-400"
              }`}
            >
              <Gift className="w-4 h-4 animate-bounce" /> 
              {stats.dailyLoginClaimed 
                ? t("login_claimed") 
                : t("login_claim_day", { day: stats.consecutiveLogins || 1 })
              }
            </button>
          </div>

          {/* Daily Quests List */}
          <div className="bg-[#0f1124]/40 border border-purple-500/10 rounded-3xl p-5">
            <h3 className="text-base font-black text-white tracking-wide uppercase mb-3 flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-indigo-400" /> {t("quest_title")}
            </h3>
            <p className="text-[11px] text-slate-400 mb-4 font-sans">
              {t("quest_subtitle")}
            </p>

            <div className="flex flex-col gap-3">
              {(stats.customDailyQuests || []).map((quest) => {
                const isComplete = quest.current >= quest.target;
                const isProgressPct = Math.round((quest.current / quest.target) * 100);
                
                return (
                  <div 
                    key={quest.id} 
                    className="bg-slate-950/60 border border-slate-900 rounded-2xl p-3.5 flex justify-between items-center gap-4 hover:border-slate-800/80 transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[12px] text-slate-100 uppercase tracking-wide block truncate">
                          {getQuestDisplayName(quest)}
                        </span>
                        {quest.claimed && (
                          <span className="text-[8px] bg-slate-850 text-slate-400 font-bold font-mono px-1.5 py-0.5 rounded border border-slate-800 uppercase">{t("quest_claimed_tag")}</span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 mt-0.5 block leading-tight">
                        {getQuestDisplayDesc(quest)}
                      </span>
                      
                      {/* Custom progress horizontal meter */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-850">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              isComplete ? "bg-emerald-500" : "bg-indigo-500"
                            }`} 
                            style={{ width: `${Math.min(100, isProgressPct)}%` }} 
                          />
                        </div>
                        <span className="text-[9px] font-mono font-bold text-slate-400 shrink-0 whitespace-nowrap">
                          {quest.current}/{quest.target}
                        </span>
                      </div>

                      {/* Reward indicator badges */}
                      <div className="text-[10px] font-black text-yellow-400 mt-1.5 flex items-center gap-1">
                        <span>{t("reward")}:</span>
                        <span className="bg-slate-900/90 text-slate-300 px-1.5 py-0.5 rounded text-[9.5px] border border-slate-850 flex items-center gap-1 font-mono">
                          {quest.rewardType === "gold" ? "🪙" : quest.rewardType === "gems" ? "💎" : "✨"}
                          {quest.rewardAmount} {quest.rewardType.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleClaimCustomDailyQuest(quest.id)}
                      disabled={quest.claimed || !isComplete}
                      className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase whitespace-nowrap active:scale-95 transition-all outline-none ${
                        quest.claimed
                          ? "bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed"
                          : isComplete
                          ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-extrabold animate-pulse"
                          : "bg-slate-900 border border-slate-800/40 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      {quest.claimed ? t("quest_claimed") : !isComplete ? t("quest_progress") : t("quest_claim")}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* FULL GAME DESIGN DOCUMENT & STRATEGY PANEL (Satisfies Blueprint Prompt Requirements) */}
          <div className="bg-[#0f1124]/40 border border-purple-500/10 rounded-3xl p-5 flex flex-col gap-4">
            <h3 className="text-base font-black text-white tracking-wide uppercase flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-pink-400" /> {t("formula_title")}
            </h3>

            <div className="text-xs text-slate-300 space-y-4 leading-relaxed font-sans">
              <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
                <span className="text-xs font-black text-[#FBBF24] block uppercase">{t("f_block1_title")}</span>
                <p className="mt-1.5 text-slate-400 leading-relaxed font-sans">
                  {t("f_block1_desc")}
                </p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
                <span className="text-xs font-black text-[#EF4444] block uppercase">{t("f_block2_title")}</span>
                <div className="mt-1.5 text-slate-400 leading-relaxed font-sans whitespace-pre-line">
                  {t("f_block2_desc")}
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
                <span className="text-xs font-black text-emerald-400 block uppercase">{t("f_block3_title")}</span>
                <p className="mt-1.5 text-slate-400 leading-relaxed font-sans">
                  {t("f_block3_desc")}
                </p>
              </div>
            </div>
          </div>

        </section>

      </main>

    </div>
  );
}
