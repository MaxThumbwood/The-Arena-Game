/**
 * ENHANCED MOB IMPORT SYSTEM
 */

class ImportManager {
    constructor() {
        this.queue = [];
        this.processing = false;
        this.importedCount = 0;
        this.supportedFormats = ['.json', '.agm', '.arena'];
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
    }
    
    // Main import function
    async importMob() {
        const fileInput = document.getElementById('mob-file-input');
        const files = fileInput.files;
        
        if (files.length === 0) {
            uiManager.showNotification('Please select files to import', 'warning');
            return;
        }
        
        // Clear previous messages
        const messageContainer = document.getElementById('import-messages');
        messageContainer.innerHTML = '';
        
        // Process each file
        for (const file of files) {
            await this.processFile(file);
        }
        
        // Update UI
        uiManager.updateImporter();
        
        // Clear file input
        fileInput.value = '';
    }
    
    // Process a single file
    async processFile(file) {
        try {
            // Validate file
            if (!this.validateFile(file)) {
                return;
            }
            
            // Read file
            const content = await this.readFile(file);
            const json = JSON.parse(content);
            
            // Process JSON
            const result = await this.processJSON(json, file.name);
            
            // Show result
            this.showImportResult(result, file.name);
            
        } catch (error) {
            console.error('Import error:', error);
            this.showImportError(error.message, file.name);
        }
    }
    
    // Validate file
    validateFile(file) {
        // Check size
        if (file.size > this.maxFileSize) {
            this.showImportError(`File too large: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`, file.name);
            return false;
        }
        
        // Check extension
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (!this.supportedFormats.includes(ext)) {
            this.showImportError(`Unsupported format: ${file.name}`, file.name);
            return false;
        }
        
        return true;
    }
    
    // Read file as text
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }
    
    // Process JSON data
    async processJSON(data, filename) {
        // Validate required fields
        if (!data.name) {
            throw new Error('Missing required field: name');
        }
        
        // Generate unique ID
        const unitId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Build unit configuration
        const unitConfig = this.buildUnitConfig(data, unitId);
        
        // Load sprites if specified
        await this.loadUnitSprites(unitConfig);
        
        // Add to custom mobs
        gameConfig.state.CUSTOM_MOBS[unitId] = unitConfig;
        
        // Save to localStorage
        this.saveToStorage(unitId, unitConfig);
        
        return {
            success: true,
            unitId: unitId,
            config: unitConfig
        };
    }
    
    // Build unit configuration from JSON
    buildUnitConfig(data, unitId) {
        const config = {
            id: unitId,
            name: data.name,
            type: this.normalizeType(data.type || data.class || 'melee'),
            class: data.class || 'custom',
            color: data.color || this.generateRandomColor(),
            hp: data.hp || data.base_hp || 100,
            maxHp: data.hp || data.base_hp || 100,
            speed: data.speed || data.movement_speed || 2.0,
            baseSpeed: data.speed || data.movement_speed || 2.0,
            radius: data.radius || 12,
            hasIframes: data.has_iframes || false,
            bodyDmg: data.body_dmg || 0,
            description: data.description || 'Imported custom unit',
            rarity: data.rarity || 'common',
            cost: data.cost || 100,
            
            // Weapon system
            weapon: this.buildWeaponConfig(data),
            
            // Abilities
            abilities: data.abilities || [],
            
            // Custom data
            customData: data,
            
            // Metadata
            importedAt: new Date().toISOString(),
            filename: data.filename || 'unknown',
            version: data.version || '1.0'
        };
        
        return config;
    }
    
    // Build weapon configuration
    buildWeaponConfig(data) {
        const weapon = {
            type: 'none',
            model: 'custom',
            damage: 0,
            cooldown: 30
        };
        
        // If weapon data is provided
        if (data.weapon) {
            Object.assign(weapon, {
                type: data.weapon.type || 'melee',
                model: data.weapon.model || 'custom',
                damage: data.weapon.damage || 10,
                cooldown: data.weapon.cooldown || 30,
                range: data.weapon.range || 25,
                sprite: data.weapon.sprite || null,
                offsetX: data.weapon.offsetX || 0,
                offsetY: data.weapon.offsetY || 0,
                visuals: data.weapon.visuals || null
            });
            
            // Projectile configuration
            if (data.weapon.projectile) {
                weapon.projectile = this.buildProjectileConfig(data.weapon.projectile);
            }
        }
        // Legacy format support
        else if (data.projectile) {
            weapon.type = 'projectile';
            weapon.projectile = this.buildProjectileConfig(data.projectile);
        }
        
        return weapon;
    }
    
    // Build projectile configuration
    buildProjectileConfig(projectileData) {
        return {
            type: projectileData.type || 'arrow',
            model: projectileData.model || 'circle',
            damage: projectileData.damage || 10,
            speed: projectileData.speed || 8,
            life: projectileData.life || 60,
            size: projectileData.size || 4,
            color: projectileData.color || '#ffffff',
            sprite: projectileData.sprite || null,
            
            // Enhanced properties
            onWallHit: projectileData.onWallHit || 'destroy',
            bounceCount: projectileData.bounceCount || 0,
            pierce: projectileData.pierce || false,
            gravity: projectileData.gravity || 0,
            
            // Special effects
            homing: projectileData.homing || null,
            explosion: projectileData.explosion || null,
            trail: projectileData.trail || null,
            
            // Custom data
            custom: projectileData
        };
    }
    
    // Load unit sprites
    async loadUnitSprites(unitConfig) {
        try {
            // Load body sprite
            if (unitConfig.sprite) {
                await assetManager.loadSprite(unitConfig.sprite, `unit_${unitConfig.id}`);
            }
            
            // Load weapon sprite
            if (unitConfig.weapon?.sprite) {
                await assetManager.loadSprite(unitConfig.weapon.sprite, `weapon_${unitConfig.id}`);
            }
            
            // Load projectile sprite
            if (unitConfig.weapon?.projectile?.sprite) {
                await assetManager.loadSprite(unitConfig.weapon.projectile.sprite, `proj_${unitConfig.id}`);
            }
        } catch (error) {
            console.warn('Failed to load sprites:', error);
        }
    }
    
    // Save to localStorage
    saveToStorage(unitId, config) {
        try {
            const storageKey = `arena_custom_unit_${unitId}`;
            localStorage.setItem(storageKey, JSON.stringify(config));
            
            // Update index
            const index = JSON.parse(localStorage.getItem('arena_custom_units_index') || '[]');
            if (!index.includes(unitId)) {
                index.push(unitId);
                localStorage.setItem('arena_custom_units_index', JSON.stringify(index));
            }
        } catch (error) {
            console.warn('Failed to save unit to localStorage:', error);
        }
    }
    
    // Load from localStorage
    loadFromStorage() {
        try {
            const index = JSON.parse(localStorage.getItem('arena_custom_units_index') || '[]');
            
            index.forEach(unitId => {
                const storageKey = `arena_custom_unit_${unitId}`;
                const saved = localStorage.getItem(storageKey);
                
                if (saved) {
                    try {
                        const config = JSON.parse(saved);
                        gameConfig.state.CUSTOM_MOBS[unitId] = config;
                        this.importedCount++;
                    } catch (error) {
                        console.warn(`Failed to parse saved unit ${unitId}:`, error);
                    }
                }
            });
            
            console.log(`Loaded ${this.importedCount} custom units from storage`);
        } catch (error) {
            console.error('Failed to load custom units from storage:', error);
        }
    }
    
    // Show import result
    showImportResult(result, filename) {
        const messageContainer = document.getElementById('import-messages');
        const message = document.createElement('div');
        message.className = 'import-message success';
        
        const unit = result.config;
        message.innerHTML = `
            <div class="message-header">
                <i class="fas fa-check-circle"></i>
                <span>Successfully imported: ${unit.name}</span>
            </div>
            <div class="message-body">
                <div class="unit-preview">
                    <div class="preview-color" style="background: ${unit.color}"></div>
                    <div class="preview-info">
                        <div class="preview-name">${unit.name}</div>
                        <div class="preview-stats">
                            <span>HP: ${unit.hp}</span>
                            <span>DMG: ${unit.weapon.damage || unit.bodyDmg}</span>
                            <span>SPD: ${unit.speed}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        messageContainer.appendChild(message);
        
        // Scroll to bottom
        messageContainer.scrollTop = messageContainer.scrollHeight;
        
        uiManager.showNotification(`Imported ${unit.name} successfully!`, 'success');
    }
    
    // Show import error
    showImportError(error, filename) {
        const messageContainer = document.getElementById('import-messages');
        const message = document.createElement('div');
        message.className = 'import-message error';
        message.innerHTML = `
            <div class="message-header">
                <i class="fas fa-times-circle"></i>
                <span>Failed to import ${filename}</span>
            </div>
            <div class="message-body">
                <p>${error}</p>
            </div>
        `;
        
        messageContainer.appendChild(message);
        messageContainer.scrollTop = messageContainer.scrollHeight;
        
        uiManager.showNotification(`Failed to import ${filename}`, 'error');
    }
    
    // Helper: Normalize unit type
    normalizeType(type) {
        const typeMap = {
            'warrior': 'melee',
            'swordsman': 'melee',
            'knight': 'melee',
            'fighter': 'melee',
            
            'archer': 'ranged',
            'ranger': 'ranged',
            'sniper': 'ranged',
            'gunner': 'ranged',
            
            'mage': 'magic',
            'wizard': 'magic',
            'sorcerer': 'magic',
            'warlock': 'magic',
            
            'berserker': 'body',
            'brawler': 'body',
            'unarmed': 'body',
            'tank': 'body'
        };
        
        const normalized = type.toLowerCase();
        return typeMap[normalized] || normalized;
    }
    
    // Helper: Generate random color
    generateRandomColor() {
        const colors = [
            '#3498db', '#2ecc71', '#e74c3c', '#9b59b6', '#1abc9c',
            '#f1c40f', '#e67e22', '#34495e', '#16a085', '#8e44ad',
            '#2c3e50', '#f39c12', '#d35400', '#c0392b', '#7f8c8d'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    // Batch import
    async batchImport() {
        const fileInput = document.getElementById('mob-file-input');
        const files = fileInput.files;
        
        if (files.length === 0) {
            uiManager.showNotification('No files selected', 'warning');
            return;
        }
        
        // Show loading
        uiManager.showNotification(`Importing ${files.length} files...`, 'info');
        
        // Process all files
        for (const file of files) {
            await this.processFile(file);
        }
        
        uiManager.showNotification(`Successfully imported ${files.length} files!`, 'success');
        
        // Clear file input
        fileInput.value = '';
    }
    
    // Export unit to JSON
    exportUnit(unitId) {
        const unit = gameConfig.state.CUSTOM_MOBS[unitId];
        if (!unit) {
            uiManager.showNotification('Unit not found', 'error');
            return;
        }
        
        // Create export data
        const exportData = {
            name: unit.name,
            type: unit.type,
            class: unit.class,
            color: unit.color,
            hp: unit.hp,
            speed: unit.speed,
            radius: unit.radius,
            has_iframes: unit.hasIframes,
            body_dmg: unit.bodyDmg,
            description: unit.description,
            rarity: unit.rarity,
            cost: unit.cost,
            weapon: unit.weapon,
            abilities: unit.abilities,
            importedAt: unit.importedAt,
            version: '1.0'
        };
        
        // Create download
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `${unit.name.replace(/\s+/g, '_').toLowerCase()}.arena`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        uiManager.showNotification(`Exported ${unit.name}`, 'success');
    }
    
    // Delete unit
    deleteUnit(unitId) {
        const unit = gameConfig.state.CUSTOM_MOBS[unitId];
        if (!unit) return;
        
        if (confirm(`Delete "${unit.name}"? This action cannot be undone.`)) {
            // Remove from CUSTOM_MOBS
            delete gameConfig.state.CUSTOM_MOBS[unitId];
            
            // Remove from localStorage
            localStorage.removeItem(`arena_custom_unit_${unitId}`);
            
            // Update index
            const index = JSON.parse(localStorage.getItem('arena_custom_units_index') || '[]');
            const newIndex = index.filter(id => id !== unitId);
            localStorage.setItem('arena_custom_units_index', JSON.stringify(newIndex));
            
            // Remove from spawn config
            gameConfig.state.SPAWN_CONFIG = gameConfig.state.SPAWN_CONFIG.filter(
                slot => slot.templateKey !== `custom:${unitId}`
            );
            
            uiManager.showNotification(`Deleted ${unit.name}`, 'warning');
            uiManager.updateGallery();
        }
    }
}

// Create global import manager instance
window.importManager = new ImportManager();

// Load saved units on startup
window.addEventListener('DOMContentLoaded', () => {
    importManager.loadFromStorage();
});

// Export functions
function importMob() {
    importManager.importMob();
}

function batchImport() {
    importManager.batchImport();
}

function switchTab(tabId) {
    uiManager.switchTab(tabId);
}