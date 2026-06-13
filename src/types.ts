/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PlayerStats {
  gold: number;
  gems: number;
  highScore: number;
  currentStage: number;
  battlePassXp: number;
  premiumPassUnlocked: boolean;
  selectedSkin: string;
  unlockedSkins: string[]; // e.g. ["blue", "dragon", "mecha"]
  lastOfflineTime: string; // ISO string for calculating idle rewards
  
  // Equipment levels
  gearHelmetLevel: number;
  gearArmorLevel: number;
  gearRingLevel: number;

  // Permanent metaUpgrades
  metaStartCount: number;      // starts with more numbers
  metaDoorShield: number;      // negates first contact with negative gates
  metaGoldMultiplier: number;  // increases gold earned
  metaMagnetRadius: number;    // grabs items from adjacent lanes
  metaOfflineEarnings: number; // offline generation speed

  // Daily task claims
  dailyPlayedCount: number;    // e.g. 0/3
  dailyCountGrown: number;     // e.g. 0/500
  dailyBossDefeated: number;   // e.g. 0/1
  dailyUpgradesCount: number;  // e.g. 0/5 upgrades purchased in menus
  claimedQuests: string[];     // ["play", "grow", "boss"]

  // Daily log-in and custom quests
  consecutiveLogins: number;   // 1 to 7
  lastLoginDate: string;       // YYYY-MM-DD
  dailyLoginClaimed: boolean;  // Has claimed today's reward
  heroFragments: number;       // Fragments for unlocking legendary skins
  customDailyQuests: Array<{
    id: string;
    title: string;
    description: string;
    target: number;
    current: number;
    rewardType: "gold" | "gems" | "fragments";
    rewardAmount: number;
    claimed: boolean;
  }>;
}

export interface GearItem {
  id: string;
  name: string;
  slot: "helmet" | "armor" | "ring";
  level: number;
  multiplier: number;
  cost: number;
  iconName: string;
}

export interface SkinItem {
  id: string;
  name: string;
  chinese: string;
  bonusText: string;
  bonusType: "speed" | "gold" | "shield";
  bonusValue: number;
  cost: number;
  color: string;
  description: string;
}

export interface RoguelikeUpgrade {
  id: string;
  title: string;
  chinese: string;
  description: string;
  icon: string;
  effect: (gameState: any) => void;
}
