/**
 * ENHANCED ARENA GAME CONFIGURATION
 */

const gameConfig = {
    VERSION: "2.0.0",
    
    // Enhanced Default Units with sprite support
    DEFAULTS: {
        swordsman: {
            id: "swordsman",
            name: "Swordsman",
            type: "melee",
            class: "warrior",
            color: "#3498db",
            hp: 300,
            maxHp: 300,
            speed: 2.0,
            radius: 16,
            hasIframes: true,
            bodyDmg: 15,
            weapon: {
                type: "melee",
                model: "sword",
                damage: 25,
                cooldown: 20,
                range: 35,
                sprite: "assets/sword.png", // Path to sprite
                offsetX: 15,
                offsetY: 0,
                rotationOffset: 0
            },
            abilities: ["charge", "block"],
            description: "A classic warrior with sword and shield",
            rarity: "common",
            cost: 100
        },
        archer: {
            id: "archer",
            name: "Archer",
            type: "ranged",
            class: "ranger",
            color: "#2ecc71",
            hp: 150,
            maxHp: 150,
            speed: 2.8,
            radius: 12,
            hasIframes: false,
            bodyDmg: 5,
            weapon: {
                type: "projectile",
                model: "bow",
                damage: 15,
                cooldown: 25,
                range: 300,
                sprite: "assets/bow.png",
                offsetX: 10,
                offsetY: 0,
                projectile: {
                    type: "arrow",
                    model: "line",
                    damage: 15,
                    speed: 12,
                    life: 80,
                    size: 4,
                    color: "#f1c40f",
                    sprite: "assets/arrow.png",
                    onWallHit: "destroy",
                    bounceCount: 0,
                    pierce: false,
                    gravity: 0
                }
            },
            abilities: ["rapid_fire", "precision"],
            description: "Ranged specialist with deadly accuracy",
            rarity: "common",
            cost: 120
        },
        berserker: {
            id: "berserker",
            name: "Berserker",
            type: "body",
            class: "berserker",
            color: "#e74c3c",
            hp: 400,
            maxHp: 400,
            speed: 3.5,
            radius: 20,
            hasIframes: false,
            bodyDmg: 30,
            weapon: {
                type: "body",
                model: "fists",
                damage: 0,
                cooldown: 0
            },
            abilities: ["rage", "unstoppable"],
            passive: "Damage increases when HP is low",
            description: "Unarmed powerhouse that grows stronger when injured",
            rarity: "rare",
            cost: 200
        },
        mage: {
            id: "mage",
            name: "Battle Mage",
            type: "magic",
            class: "mage",
            color: "#9b59b6",
            hp: 180,
            maxHp: 180,
            speed: 1.8,
            radius: 14,
            hasIframes: false,
            bodyDmg: 0,
            weapon: {
                type: "projectile",
                model: "staff",
                damage: 25,
                cooldown: 60,
                range: 400,
                sprite: "assets/staff.png",
                offsetX: 15,
                offsetY: 0,
                projectile: {
                    type: "fireball",
                    model: "circle",
                    damage: 25,
                    speed: 6,
                    life: 120,
                    size: 10,
                    color: "#e67e22",
                    sprite: "assets/fireball.png",
                    onWallHit: "bounce",
                    bounceCount: 2,
                    pierce: false,
                    gravity: 0,
                    homing: {
                        enabled: true,
                        strength: 0.05,
                        radius: 150
                    },
                    explosion: {
                        enabled: true,
                        radius: 40,
                        damage: 15
                    }
                }
            },
            abilities: ["fireball", "teleport"],
            description: "Arcane master with homing fireballs",
            rarity: "epic",
            cost: 300
        },
        assassin: {
            id: "assassin",
            name: "Shadow Assassin",
            type: "melee",
            class: "assassin",
            color: "#34495e",
            hp: 200,
            maxHp: 200,
            speed: 4.0,
            radius: 10,
            hasIframes: true,
            bodyDmg: 20,
            weapon: {
                type: "melee",
                model: "dagger",
                damage: 40,
                cooldown: 15,
                range: 25,
                sprite: "assets/dagger.png",
                offsetX: 10,
                offsetY: 0,
                effects: ["bleed", "critical"]
            },
            abilities: ["stealth", "backstab"],
            passive: "Critical hits on unaware targets",
            description: "Swift assassin with deadly precision",
            rarity: "legendary",
            cost: 400
        }
    },
    
    // Arena Environments
    ENVIRONMENTS: {
        void: {
            name: "Void Arena",
            bgColor: "#000000",
            wallColor: "#333333",
            friction: 0.98,
            bounce: 0.5
        },
        grass: {
            name: "Grass Field",
            bgColor: "#1a472a",
            wallColor: "#2d573c",
            friction: 0.95,
            bounce: 0.3,
            particles: true
        },
        desert: {
            name: "Desert",
            bgColor: "#d4a574",
            wallColor: "#b08968",
            friction: 0.9,
            bounce: 0.4
        },
        ice: {
            name: "Ice Rink",
            bgColor: "#a8d0e6",
            wallColor: "#7bb8d4",
            friction: 0.99,
            bounce: 0.8
        }
    },
    
    // Physics Modes
    PHYSICS_MODES: {
        normal: {
            name: "Normal",
            friction: 0.98,
            bounce: 0.5,
            gravity: 0
        },
        low_friction: {
            name: "Low Friction",
            friction: 0.99,
            bounce: 0.7,
            gravity: 0
        },
        bouncy: {
            name: "Bouncy",
            friction: 0.95,
            bounce: 0.9,
            gravity: 0
        },
        sticky: {
            name: "Sticky",
            friction: 0.9,
            bounce: 0.2,
            gravity: 0
        }
    },
    
    // Sprite Cache
    SPRITE_CACHE: {},
    
    // Game State
    state: {
        // Player data
        playerStats: {
            totalBattles: 0,
            totalDamage: 0,
            unitsUnlocked: 5,
            favoriteUnit: "swordsman"
        },
        
        // Imported units
        CUSTOM_MOBS: {},
        
        // Current setup
        SPAWN_CONFIG: [],
        
        // Game settings
        arenaSize: 0.95,
        environment: "void",
        physicsMode: "normal",
        
        // Current game
        isPlaying: false,
        isPaused: false,
        gameTime: 0,
        timeScale: 1.0,
        cinematicTime: 0,
        
        // Camera
        camera: {
            zoom: 1.0,
            targetZoom: 1.0,
            panX: 0,
            panY: 0,
            targetPanX: 0,
            targetPanY: 0,
            shakeDuration: 0,
            shakeIntensity: 0,
            mode: "dynamic" // dynamic, follow, static
        },
        
        // Countdown
        countdown: {
            active: false,
            timer: 3.0,
            numbers: ["3", "2", "1", "FIGHT!"]
        },
        
        // Units in current game
        units: [],
        projectiles: [],
        particles: [],
        effects: [],
        
        // Performance tracking
        frameCount: 0,
        fps: 60,
        lastFrameTime: 0
    },
    
    // Game Constants
    CONSTANTS: {
        SLOW_MO_DURATION: 20,
        SLOW_MO_FACTOR: 0.1,
        IFRAME_DURATION: 12,
        MAX_UNITS: 100,
        MAX_PROJECTILES: 200,
        CAMERA_SHAKE_DURATION: 30,
        CAMERA_SHAKE_INTENSITY: 3,
        COUNTDOWN_DURATION: 3.0,
        
        // Physics
        WALL_BOUNCE_DAMPING: 0.8,
        WALL_FRICTION: 0.98,
        MIN_VELOCITY: 0.1,
        GRAVITY: 0,
        
        // Visual
        HP_BAR_HEIGHT: 5,
        HP_BAR_WIDTH: 30,
        NAME_TAG_HEIGHT: 20,
        SHADOW_BLUR: 10,
        
        // Performance
        TARGET_FPS: 60,
        DELTA_TIME: 1/60,
        
        // Damage Types
        DAMAGE_TYPES: {
            PHYSICAL: "physical",
            MAGIC: "magic",
            TRUE: "true"
        }
    },
    
    // Initialize
    init: function() {
        this.loadPlayerStats();
        this.preloadDefaultSprites();
    },
    
    // Load player stats from localStorage
    loadPlayerStats: function() {
        const saved = localStorage.getItem("arenaPlayerStats");
        if (saved) {
            try {
                this.state.playerStats = JSON.parse(saved);
            } catch (e) {
                console.warn("Failed to load player stats:", e);
            }
        }
    },
    
    // Save player stats to localStorage
    savePlayerStats: function() {
        try {
            localStorage.setItem("arenaPlayerStats", JSON.stringify(this.state.playerStats));
        } catch (e) {
            console.warn("Failed to save player stats:", e);
        }
    },
    
    // Preload default sprites
    preloadDefaultSprites: function() {
        // This would load default sprites in a real implementation
        // For now, we'll use colored circles as fallbacks
        console.log("Preloading default sprites...");
    },
    
    // Load a sprite image
    loadSprite: function(url, callback) {
        if (!url || url.startsWith("#")) {
            // Color-only, no sprite
            callback(null);
            return;
        }
        
        // Check cache
        if (this.SPRITE_CACHE[url]) {
            callback(this.SPRITE_CACHE[url]);
            return;
        }
        
        // Load new sprite
        const img = new Image();
        img.onload = () => {
            this.SPRITE_CACHE[url] = img;
            callback(img);
        };
        img.onerror = () => {
            console.warn(`Failed to load sprite: ${url}`);
            callback(null);
        };
        img.src = url;
    },
    
    // Create a colored circle as fallback sprite
    createFallbackSprite: function(color, size) {
        const canvas = document.createElement("canvas");
        canvas.width = size * 2;
        canvas.height = size * 2;
        const ctx = canvas.getContext("2d");
        
        // Draw gradient circle
        const gradient = ctx.createRadialGradient(size, size, 0, size, size, size);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, "rgba(0,0,0,0.5)");
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(size, size, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Add highlight
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.beginPath();
        ctx.arc(size * 0.7, size * 0.7, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        return canvas;
    },
    
    // Generate a unique ID
    generateId: function(prefix = "unit") {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },
    
    // Calculate unit balance (for setup screen)
    calculateBalance: function(units) {
        if (units.length === 0) return "Empty";
        
        const totalHP = units.reduce((sum, unit) => sum + unit.hp, 0);
        const avgHP = totalHP / units.length;
        const hpVariance = units.reduce((sum, unit) => sum + Math.abs(unit.hp - avgHP), 0) / units.length;
        
        if (hpVariance / avgHP > 0.5) {
            return "Unbalanced";
        } else if (hpVariance / avgHP > 0.2) {
            return "Slightly Unbalanced";
        } else {
            return "Balanced";
        }
    },
    
    // Get total units count
    getTotalUnits: function() {
        return Object.keys(this.DEFAULTS).length + Object.keys(this.state.CUSTOM_MOBS).length;
    }
};

// Initialize on load
window.addEventListener("DOMContentLoaded", () => {
    gameConfig.init();
});

// Make config globally accessible
window.gameConfig = gameConfig;