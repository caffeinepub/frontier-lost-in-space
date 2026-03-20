// Centralized registry of all A.E.G.I.S. voice line trigger keys and their text.
// Categories: alert | mission | story | tutorial | combat | cinematic
export type VoiceCategory =
  | "alert"
  | "mission"
  | "story"
  | "tutorial"
  | "combat"
  | "cinematic";
export type VoicePriority = 1 | 2 | 3 | 4; // LOW=1 NORMAL=2 HIGH=3 CRITICAL=4

export interface VoiceLine {
  text: string;
  category: VoiceCategory;
  priority: VoicePriority;
  interruptible: boolean; // can a higher-priority line interrupt this one?
}

export const AEGIS_VOICE_LINES: Record<string, VoiceLine> = {
  // ALERTS
  alert_oxygen_warning: {
    text: "Warning. Oxygen recycler efficiency dropping. Immediate attention required.",
    category: "alert",
    priority: 3,
    interruptible: true,
  },
  alert_shield_drift: {
    text: "Shield frequency drift detected. Recommend recalibration.",
    category: "alert",
    priority: 2,
    interruptible: true,
  },
  alert_cooling_loop: {
    text: "Weapon cooling loop blockage. Heat management compromised.",
    category: "alert",
    priority: 3,
    interruptible: true,
  },
  alert_missile_jam: {
    text: "Missile rack jam detected. Launcher offline.",
    category: "alert",
    priority: 3,
    interruptible: true,
  },
  alert_reactor_instability: {
    text: "Reactor instability detected. Power output fluctuating.",
    category: "alert",
    priority: 4,
    interruptible: false,
  },
  alert_hull_breach: {
    text: "Hull breach detected in forward section. Structural integrity compromised.",
    category: "alert",
    priority: 4,
    interruptible: false,
  },
  alert_resolved: {
    text: "Alert resolved. System returning to nominal.",
    category: "alert",
    priority: 2,
    interruptible: true,
  },

  // MISSIONS
  mission_start: {
    text: "New mission objective received. Engage when ready.",
    category: "mission",
    priority: 3,
    interruptible: true,
  },
  mission_complete: {
    text: "Mission complete. All objectives achieved. Well done, Commander.",
    category: "mission",
    priority: 3,
    interruptible: false,
  },
  mission_progress: {
    text: "Mission progress updated. Continuing engagement.",
    category: "mission",
    priority: 2,
    interruptible: true,
  },

  // STORY
  story_systems_damaged: {
    text: "Multiple systems damaged. Initiating damage assessment protocol.",
    category: "story",
    priority: 3,
    interruptible: false,
  },
  story_oxygen_critical: {
    text: "Oxygen levels critical. Life support prioritization engaged.",
    category: "story",
    priority: 4,
    interruptible: false,
  },
  story_aegis_contact: {
    text: "A.E.G.I.S. online. Tactical interface synchronized. I am ready to assist.",
    category: "story",
    priority: 3,
    interruptible: false,
  },
  story_hull_breach: {
    text: "Hull integrity below fifty percent. Recommend immediate evasive action.",
    category: "story",
    priority: 4,
    interruptible: false,
  },
  story_first_threat: {
    text: "Threat confirmed. Combat protocols engaged.",
    category: "story",
    priority: 3,
    interruptible: false,
  },
  story_survival_choice: {
    text: "Commander, we have limited options. Your decision determines our survival.",
    category: "story",
    priority: 3,
    interruptible: false,
  },
  story_stabilized: {
    text: "All critical systems stabilized. Phase one complete.",
    category: "story",
    priority: 3,
    interruptible: false,
  },

  // TUTORIAL
  tutorial_intro: {
    text: "Welcome, Commander. I am A.E.G.I.S. Let me guide you through tactical operations.",
    category: "tutorial",
    priority: 2,
    interruptible: true,
  },
  tutorial_movement: {
    text: "Use the navigation controls to orient your view.",
    category: "tutorial",
    priority: 2,
    interruptible: true,
  },
  tutorial_scan: {
    text: "Initiate a scan to identify contacts in your sector.",
    category: "tutorial",
    priority: 2,
    interruptible: true,
  },
  tutorial_target: {
    text: "Tap a contact on the tactical display to acquire target lock.",
    category: "tutorial",
    priority: 2,
    interruptible: true,
  },
  tutorial_lock: {
    text: "Target acquired. Confirm lock-on before engaging.",
    category: "tutorial",
    priority: 2,
    interruptible: true,
  },
  tutorial_fire: {
    text: "Weapons hot. Select a weapon system and engage.",
    category: "tutorial",
    priority: 2,
    interruptible: true,
  },
  tutorial_radar: {
    text: "Monitor your radar for incoming threats.",
    category: "tutorial",
    priority: 2,
    interruptible: true,
  },
  tutorial_control_panel: {
    text: "Access the command panel for ship systems and mission data.",
    category: "tutorial",
    priority: 2,
    interruptible: true,
  },
  tutorial_complete: {
    text: "Tutorial complete. You are cleared for full tactical operations.",
    category: "tutorial",
    priority: 3,
    interruptible: false,
  },

  // COMBAT / CINEMATIC
  hostile_contact_detected: {
    text: "Hostile contact detected. Weapons free.",
    category: "cinematic",
    priority: 4,
    interruptible: false,
  },
  target_destroyed: {
    text: "Target eliminated.",
    category: "combat",
    priority: 2,
    interruptible: true,
  },
  incoming_fire: {
    text: "Incoming fire. Shields engaged.",
    category: "combat",
    priority: 3,
    interruptible: true,
  },
  scan_complete: {
    text: "Scan complete. Contacts logged.",
    category: "combat",
    priority: 2,
    interruptible: true,
  },
};
