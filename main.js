/**
 * MAIN INITIALIZATION
 */

class ArenaGame {
    constructor() {
        this.initialized = false;
        this.loading = false;
    }
    
    // Initialize the game
    async init() {
        if (this.initialized) return;
        
        console.log('Initializing Arena Game...');
        
        try {
            // Load saved data
            this.loadSavedData();
            
            // Preload assets
            await this.preloadAssets();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup UI
            this.setupUI();
            
            this.initialized = true;
            console.log('Arena Game initialized successfully!');
            
        } catch (error) {
            console.error('Failed to initialize Arena Game:', error);
            uiManager.showNotification('Failed to initialize game', 'error');
        }
    }
    
    // Load saved data
    loadSavedData() {
        // Player stats are loaded in config.js
        console.log('Loading saved data...');
    }
    
    // Preload assets
    async preloadAssets() {
        console.log('Preloading assets...');
        
        // Preload default unit sprites
        const spritesToLoad = {};
        
        Object.values(gameConfig.DEFAULTS).forEach(unit => {
            if (unit.sprite) {
                spritesToLoad[`unit_${unit.id}`] = unit.sprite;
            }
            if (unit.weapon?.sprite) {
                spritesToLoad[`weapon_${unit.id}`] = unit.weapon.sprite;
            }
            if (unit.weapon?.projectile?.sprite) {
                spritesToLoad[`proj_${unit.id}`] = unit.weapon.projectile.sprite;
            }
        });
        
        // Load all sprites
        await assetManager.loadSprites(spritesToLoad);
        
        console.log('Assets preloaded');
    }
    
    // Setup event listeners
    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Arena size slider
        const arenaSlider = document.getElementById('arena-slider');
        if (arenaSlider) {
            arenaSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value) / 100;
                gameConfig.state.arenaSize = value;
                
                const display = document.getElementById('arena-size-value');
                if (display) {
                    display.textContent = `${e.target.value}%`;
                }
            });
        }
        
        // Game speed slider
        const speedSlider = document.getElementById('game-speed-slider');
        if (speedSlider) {
            speedSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                gameConfig.state.timeScale = value;
                
                const display = document.getElementById('speed-display');
                if (display) {
                    display.textContent = `${value.toFixed(1)}x`;
                }
            });
        }
        
        // Environment selector
        const environmentSelect = document.getElementById('arena-environment');
        if (environmentSelect) {
            environmentSelect.addEventListener('change', (e) => {
                gameConfig.state.environment = e.target.value;
            });
        }
        
        // Physics mode selector
        const physicsSelect = document.getElementById('physics-mode');
        if (physicsSelect) {
            physicsSelect.addEventListener('change', (e) => {
                gameConfig.state.physicsMode = e.target.value;
            });
        }
        
        // Start battle button
        const startBtn = document.getElementById('start-battle-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                // Update UI before starting
                uiManager.updateSetup();
            });
        }
        
        // Window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // Prevent context menu on canvas
        document.addEventListener('contextmenu', (e) => {
            if (e.target.id === 'game-canvas') {
                e.preventDefault();
            }
        });
        
        console.log('Event listeners setup complete');
    }
    
    // Setup UI
    setupUI() {
        console.log('Setting up UI...');
        
        // Update all UI elements
        uiManager.updateMenu();
        uiManager.updateSetup();
        uiManager.updateGallery();
        
        // Add CSS for notifications
        this.addNotificationStyles();
        
        console.log('UI setup complete');
    }
    
    // Add notification styles dynamically
    addNotificationStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .notification-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 400px;
            }
            
            .notification {
                background: var(--panel);
                border-radius: 10px;
                padding: 15px 20px;
                border-left: 4px solid var(--primary);
                box-shadow: var(--shadow);
                transform: translateX(100%);
                opacity: 0;
                transition: all 0.3s ease;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .notification.show {
                transform: translateX(0);
                opacity: 1;
            }
            
            .notification.success {
                border-left-color: var(--success);
            }
            
            .notification.warning {
                border-left-color: var(--warning);
            }
            
            .notification.error {
                border-left-color: var(--danger);
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .notification-close {
                background: none;
                border: none;
                color: var(--text-muted);
                cursor: pointer;
                font-size: 1.2rem;
                padding: 5px;
            }
            
            .notification-close:hover {
                color: var(--text);
            }
        `;
        document.head.appendChild(style);
    }
    
    // Handle window resize
    handleResize() {
        // Update canvas size if in game
        if (gameConfig.state.isPlaying && gameConfig.state.canvas) {
            const viewportMin = Math.min(window.innerWidth, window.innerHeight);
            const arenaSize = gameConfig.state.arenaSize;
            const size = Math.floor(viewportMin * arenaSize) - 40;
            
            gameConfig.state.canvas.width = size;
            gameConfig.state.canvas.height = size;
        }
    }
    
    // Start the game
    start() {
        this.init().then(() => {
            console.log('Arena Game is ready!');
            uiManager.showNotification('Welcome to Arena Game!', 'success');
        });
    }
}

// Create and start the game
const arenaGame = new ArenaGame();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    arenaGame.start();
});

// Export functions for debugging
window.debug = {
    gameConfig,
    assetManager,
    uiManager,
    importManager,
    gameEngine,
    physicsEngine
};

console.log('Arena Game loaded. Type "debug" in console for debugging tools.');