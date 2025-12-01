/**
 * ASSET MANAGER - Handles sprites, sounds, and resources
 */

class AssetManager {
    constructor() {
        this.sprites = new Map();
        this.sounds = new Map();
        this.fonts = new Map();
        this.loading = new Set();
        this.loaded = new Set();
        this.failed = new Set();
        this.progress = 0;
        
        // Default sprite colors (fallbacks)
        this.defaultColors = {
            swordsman: "#3498db",
            archer: "#2ecc71",
            berserker: "#e74c3c",
            mage: "#9b59b6",
            assassin: "#34495e"
        };
    }
    
    // Load a sprite
    async loadSprite(url, id = null) {
        if (!url) return null;
        
        const spriteId = id || url;
        
        // Return if already loaded
        if (this.sprites.has(spriteId)) {
            return this.sprites.get(spriteId);
        }
        
        // Return if currently loading
        if (this.loading.has(spriteId)) {
            return new Promise(resolve => {
                const check = setInterval(() => {
                    if (this.loaded.has(spriteId) || this.failed.has(spriteId)) {
                        clearInterval(check);
                        resolve(this.sprites.get(spriteId) || null);
                    }
                }, 100);
            });
        }
        
        // Start loading
        this.loading.add(spriteId);
        
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                this.sprites.set(spriteId, img);
                this.loaded.add(spriteId);
                this.loading.delete(spriteId);
                this.updateProgress();
                console.log(`Loaded sprite: ${spriteId}`);
                resolve(img);
            };
            
            img.onerror = () => {
                console.warn(`Failed to load sprite: ${url}`);
                this.failed.add(spriteId);
                this.loading.delete(spriteId);
                this.updateProgress();
                resolve(null);
            };
            
            // Handle data URLs and regular URLs
            if (url.startsWith('data:') || url.startsWith('http') || url.startsWith('./') || url.startsWith('/')) {
                img.src = url;
            } else {
                // Try to prepend assets path
                img.src = `assets/${url}`;
            }
        });
    }
    
    // Load multiple sprites
    async loadSprites(spriteMap) {
        const promises = [];
        
        for (const [id, url] of Object.entries(spriteMap)) {
            promises.push(this.loadSprite(url, id));
        }
        
        return Promise.all(promises);
    }
    
    // Create a fallback sprite (colored circle)
    createFallbackSprite(color, size = 32) {
        const canvas = document.createElement('canvas');
        canvas.width = size * 2;
        canvas.height = size * 2;
        const ctx = canvas.getContext('2d');
        
        // Draw gradient circle
        const gradient = ctx.createRadialGradient(
            size, size, 0,
            size, size, size
        );
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, this.darkenColor(color, 0.5));
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(size, size, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Add highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(size * 0.7, size * 0.7, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Add border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        return canvas;
    }
    
    // Create weapon sprite
    createWeaponSprite(type, color = '#ffffff') {
        const canvas = document.createElement('canvas');
        const size = 64;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = color;
        
        switch(type) {
            case 'sword':
                // Sword blade
                ctx.fillRect(size/2, size/2 - 5, 40, 10);
                // Hilt
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(size/2 - 10, size/2 - 10, 10, 20);
                break;
            case 'bow':
                // Bow arc
                ctx.strokeStyle = '#8B4513';
                ctx.lineWidth = 8;
                ctx.beginPath();
                ctx.moveTo(size/2, size/2);
                ctx.quadraticCurveTo(size/2 + 20, size/2 - 20, size/2 + 40, size/2);
                ctx.stroke();
                break;
            case 'staff':
                // Staff
                ctx.fillStyle = '#654321';
                ctx.fillRect(size/2, size/2 - 3, 30, 6);
                // Gem
                ctx.fillStyle = '#9b59b6';
                ctx.beginPath();
                ctx.arc(size/2 + 35, size/2, 8, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'dagger':
                // Dagger blade
                ctx.fillRect(size/2, size/2 - 3, 25, 6);
                // Point
                ctx.beginPath();
                ctx.moveTo(size/2 + 25, size/2);
                ctx.lineTo(size/2 + 35, size/2);
                ctx.lineTo(size/2 + 25, size/2 - 5);
                ctx.fill();
                break;
        }
        
        return canvas;
    }
    
    // Create projectile sprite
    createProjectileSprite(type, color = '#ffffff') {
        const canvas = document.createElement('canvas');
        const size = 32;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        switch(type) {
            case 'arrow':
                ctx.fillStyle = color;
                // Arrow shaft
                ctx.fillRect(size/2 - 15, size/2 - 2, 30, 4);
                // Arrow head
                ctx.beginPath();
                ctx.moveTo(size/2 + 15, size/2);
                ctx.lineTo(size/2 + 25, size/2);
                ctx.lineTo(size/2 + 15, size/2 - 5);
                ctx.fill();
                break;
            case 'fireball':
                // Fireball gradient
                const gradient = ctx.createRadialGradient(
                    size/2, size/2, 0,
                    size/2, size/2, 12
                );
                gradient.addColorStop(0, '#ff9900');
                gradient.addColorStop(0.5, '#ff3300');
                gradient.addColorStop(1, 'transparent');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(size/2, size/2, 12, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'bullet':
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(size/2, size/2, 4, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
        
        return canvas;
    }
    
    // Helper: Darken a color
    darkenColor(color, amount) {
        let r = parseInt(color.slice(1, 3), 16);
        let g = parseInt(color.slice(3, 5), 16);
        let b = parseInt(color.slice(5, 7), 16);
        
        r = Math.floor(r * (1 - amount));
        g = Math.floor(g * (1 - amount));
        b = Math.floor(b * (1 - amount));
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    // Update loading progress
    updateProgress() {
        const total = this.loading.size + this.loaded.size + this.failed.size;
        this.progress = total > 0 ? (this.loaded.size + this.failed.size) / total : 1;
    }
    
    // Check if all assets are loaded
    get isLoading() {
        return this.loading.size > 0;
    }
    
    // Get progress percentage
    getProgress() {
        return Math.floor(this.progress * 100);
    }
    
    // Clear cache
    clearCache() {
        this.sprites.clear();
        this.loading.clear();
        this.loaded.clear();
        this.failed.clear();
        this.progress = 0;
    }
}

// Create global asset manager instance
window.assetManager = new AssetManager();