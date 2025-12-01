/**
 * ENHANCED UI MANAGEMENT
 */

class UIManager {
    constructor() {
        this.currentScreen = 'menu';
        this.modals = new Map();
        this.notifications = [];
        this.tips = [
            "Tip: Import custom mobs with sprites for better visuals!",
            "Tip: Body units deal damage on collision with enemies!",
            "Tip: Projectiles can bounce off walls with the right settings!",
            "Tip: Use the slow-motion effect to watch epic moments!",
            "Tip: Different environments affect unit movement!",
            "Tip: Try the 'Bouncy' physics mode for chaotic battles!",
            "Tip: Save your favorite unit configurations as presets!",
            "Tip: Import multiple JSON files at once for quick setup!"
        ];
    }
    
    // Navigation
    showScreen(id) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        
        // Show target screen
        const target = document.getElementById(`screen-${id}`);
        if (target) {
            target.classList.remove('hidden');
            this.currentScreen = id;
            
            // Update UI based on screen
            this.updateScreen(id);
            
            // Add entry animation
            target.style.animation = 'none';
            setTimeout(() => {
                target.style.animation = 'panelSlideUp 0.6s ease';
            }, 10);
        }
    }
    
    updateScreen(screenId) {
        switch(screenId) {
            case 'menu':
                this.updateMenu();
                break;
            case 'setup':
                this.updateSetup();
                break;
            case 'importer':
                this.updateImporter();
                break;
            case 'gallery':
                this.updateGallery();
                break;
            case 'game':
                this.updateGameHUD();
                break;
            case 'summary':
                this.updateSummary();
                break;
        }
    }
    
    // Menu Screen
    updateMenu() {
        // Update stats
        document.getElementById('total-units').textContent = 
            Object.keys(gameConfig.DEFAULTS).length + Object.keys(gameConfig.state.CUSTOM_MOBS).length;
        document.getElementById('total-battles').textContent = 
            gameConfig.state.playerStats.totalBattles;
        
        // Random tip
        const randomTip = this.tips[Math.floor(Math.random() * this.tips.length)];
        document.getElementById('random-tip').textContent = randomTip;
        
        // Create background particles
        this.createBackgroundParticles();
    }
    
    // Setup Screen
    updateSetup() {
        // Update arena size display
        const slider = document.getElementById('arena-slider');
        const display = document.getElementById('arena-size-value');
        slider.value = gameConfig.state.arenaSize * 100;
        display.textContent = `${Math.round(gameConfig.state.arenaSize * 100)}%`;
        
        // Update environment
        document.getElementById('arena-environment').value = gameConfig.state.environment;
        
        // Update physics mode
        document.getElementById('physics-mode').value = gameConfig.state.physicsMode;
        
        // Update unit count
        const totalUnits = gameConfig.state.SPAWN_CONFIG.reduce((sum, slot) => sum + slot.count, 0);
        document.getElementById('total-units-count').textContent = `${totalUnits} units`;
        
        // Update balance
        const balance = gameConfig.calculateBalance(
            gameConfig.state.SPAWN_CONFIG.map(s => s.config)
        );
        document.getElementById('arena-balance').textContent = `Balance: ${balance}`;
        
        // Render unit list
        this.renderUnitList();
    }
    
    renderUnitList() {
        const container = document.getElementById('setup-list');
        const emptyState = document.getElementById('empty-units');
        
        if (gameConfig.state.SPAWN_CONFIG.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }
        
        emptyState.classList.add('hidden');
        container.innerHTML = '';
        
        gameConfig.state.SPAWN_CONFIG.forEach(slot => {
            const unit = slot.config;
            const card = this.createUnitCard(slot);
            container.appendChild(card);
        });
    }
    
    createUnitCard(slot) {
        const unit = slot.config;
        const card = document.createElement('div');
        card.className = 'unit-card';
        card.dataset.id = slot.id;
        card.style.borderLeftColor = unit.color;
        
        card.innerHTML = `
            <div class="unit-card-header">
                <div class="unit-name">${unit.name}</div>
                <span class="unit-type" style="background: ${this.getTypeColor(unit.type)}">
                    ${unit.type.toUpperCase()}
                </span>
            </div>
            
            <div class="unit-stats">
                <div class="stat-item">
                    <span class="stat-label">HP</span>
                    <span class="stat-value">${unit.hp}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">DMG</span>
                    <span class="stat-value">${this.getUnitDamage(unit)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">SPD</span>
                    <span class="stat-value">${unit.speed}</span>
                </div>
            </div>
            
            <div class="unit-count">
                <div class="count-controls">
                    <button class="btn-icon" onclick="modifyUnitCount('${slot.id}', -1)">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="count-value">${slot.count}</span>
                    <button class="btn-icon" onclick="modifyUnitCount('${slot.id}', 1)">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
            
            <div class="unit-controls">
                <button class="btn-icon" onclick="editUnit('${slot.id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon" onclick="duplicateUnit('${slot.id}')" title="Duplicate">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="btn-icon" onclick="removeUnit('${slot.id}')" title="Remove">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        return card;
    }
    
    getTypeColor(type) {
        const colors = {
            melee: '#3498db',
            ranged: '#2ecc71',
            body: '#e74c3c',
            magic: '#9b59b6'
        };
        return colors[type] || '#95a5a6';
    }
    
    getUnitDamage(unit) {
        if (unit.weapon && unit.weapon.damage) {
            return unit.weapon.damage;
        }
        if (unit.bodyDmg) {
            return unit.bodyDmg;
        }
        return 0;
    }
    
    // Game HUD
    updateGameHUD() {
        // Update unit status bars
        this.updateUnitStatus();
    }
    
    updateUnitStatus() {
        const container = document.querySelector('.hud-units');
        if (!container) return;
        
        container.innerHTML = '';
        
        gameConfig.state.units.forEach(unit => {
            if (!unit.alive) return;
            
            const status = document.createElement('div');
            status.className = 'unit-status';
            status.style.borderLeftColor = unit.color;
            status.innerHTML = `
                <div class="unit-name">${unit.name}</div>
                <div class="unit-hp">${Math.ceil(unit.hp)}/${unit.maxHp}</div>
                <div class="unit-hp-bar">
                    <div class="unit-hp-fill" style="width: ${(unit.hp / unit.maxHp) * 100}%"></div>
                </div>
            `;
            container.appendChild(status);
        });
    }
    
    // Results Screen
    updateSummary() {
        // This will be populated by game results
    }
    
    // Gallery Screen
    updateGallery() {
        const container = document.getElementById('unit-gallery');
        container.innerHTML = '';
        
        // Add default units
        Object.values(gameConfig.DEFAULTS).forEach(unit => {
            const card = this.createGalleryCard(unit);
            container.appendChild(card);
        });
        
        // Add custom units
        Object.values(gameConfig.state.CUSTOM_MOBS).forEach(unit => {
            const card = this.createGalleryCard(unit);
            container.appendChild(card);
        });
    }
    
    createGalleryCard(unit) {
        const card = document.createElement('div');
        card.className = 'gallery-card';
        card.innerHTML = `
            <div class="gallery-card-header" style="background: ${unit.color}20">
                <div class="gallery-card-name">${unit.name}</div>
                <div class="gallery-card-type">${unit.type}</div>
            </div>
            <div class="gallery-card-body">
                <div class="gallery-card-stats">
                    <div class="stat">
                        <i class="fas fa-heart"></i>
                        <span>${unit.hp}</span>
                    </div>
                    <div class="stat">
                        <i class="fas fa-running"></i>
                        <span>${unit.speed}</span>
                    </div>
                    <div class="stat">
                        <i class="fas fa-crosshairs"></i>
                        <span>${this.getUnitDamage(unit)}</span>
                    </div>
                </div>
                <p class="gallery-card-desc">${unit.description || 'No description'}</p>
            </div>
            <div class="gallery-card-footer">
                <button class="btn small" onclick="addUnitFromGallery('${unit.id}')">
                    <i class="fas fa-plus"></i> Add to Arena
                </button>
            </div>
        `;
        
        return card;
    }
    
    // Importer Screen
    updateImporter() {
        this.setupFileDrop();
        this.updateImportPreview();
    }
    
    setupFileDrop() {
        const dropZone = document.getElementById('drop-zone');
        const fileInput = document.getElementById('mob-file-input');
        
        dropZone.addEventListener('click', () => fileInput.click());
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'var(--primary)';
            dropZone.style.background = 'rgba(255, 71, 87, 0.1)';
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.style.borderColor = 'var(--secondary)';
            dropZone.style.background = 'rgba(55, 66, 250, 0.05)';
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'var(--secondary)';
            dropZone.style.background = 'rgba(55, 66, 250, 0.05)';
            
            const files = e.dataTransfer.files;
            this.handleDroppedFiles(files);
        });
        
        fileInput.addEventListener('change', (e) => {
            this.handleDroppedFiles(e.target.files);
        });
    }
    
    handleDroppedFiles(files) {
        const importPreview = document.getElementById('preview-content');
        importPreview.innerHTML = '';
        
        Array.from(files).forEach(file => {
            if (file.type === 'application/json' || file.name.endsWith('.json') || 
                file.name.endsWith('.agm') || file.name.endsWith('.arena')) {
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const json = JSON.parse(e.target.result);
                        this.displayImportPreview(file.name, json);
                    } catch (error) {
                        this.showImportMessage(`Error parsing ${file.name}: ${error.message}`, 'error');
                    }
                };
                reader.readAsText(file);
            } else {
                this.showImportMessage(`Skipped ${file.name}: Not a JSON file`, 'warning');
            }
        });
    }
    
    displayImportPreview(filename, json) {
        const preview = document.getElementById('preview-content');
        const div = document.createElement('div');
        div.className = 'import-preview-item';
        div.innerHTML = `
            <div class="preview-header">
                <i class="fas fa-file-code"></i>
                <span>${filename}</span>
                <button class="btn-icon small" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="preview-body">
                <pre>${JSON.stringify(json, null, 2).substring(0, 500)}${JSON.stringify(json, null, 2).length > 500 ? '...' : ''}</pre>
            </div>
        `;
        preview.appendChild(div);
    }
    
    updateImportPreview() {
        // Update preview based on selected files
    }
    
    // Modal Management
    showModal(id) {
        const modal = document.getElementById(`modal-${id}`);
        if (modal) {
            modal.classList.remove('hidden');
            this.modals.set(id, modal);
        }
    }
    
    hideModal(id) {
        const modal = this.modals.get(id);
        if (modal) {
            modal.classList.add('hidden');
            this.modals.delete(id);
        }
    }
    
    // Notifications
    showNotification(message, type = 'info') {
        const notification = {
            id: Date.now(),
            message,
            type,
            timestamp: Date.now()
        };
        
        this.notifications.push(notification);
        this.renderNotification(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            this.removeNotification(notification.id);
        }, 5000);
    }
    
    renderNotification(notification) {
        const container = document.getElementById('notification-container') || this.createNotificationContainer();
        
        const element = document.createElement('div');
        element.className = `notification ${notification.type}`;
        element.dataset.id = notification.id;
        element.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(notification.type)}"></i>
                <span>${notification.message}</span>
            </div>
            <button class="notification-close" onclick="uiManager.removeNotification(${notification.id})">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(element);
        
        // Animate in
        setTimeout(() => {
            element.classList.add('show');
        }, 10);
    }
    
    getNotificationIcon(type) {
        const icons = {
            info: 'info-circle',
            success: 'check-circle',
            warning: 'exclamation-triangle',
            error: 'times-circle'
        };
        return icons[type] || 'info-circle';
    }
    
    removeNotification(id) {
        const element = document.querySelector(`.notification[data-id="${id}"]`);
        if (element) {
            element.classList.remove('show');
            setTimeout(() => {
                element.remove();
            }, 300);
        }
        
        this.notifications = this.notifications.filter(n => n.id !== id);
    }
    
    createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'notification-container';
        document.body.appendChild(container);
        return container;
    }
    
    // Background Particles
    createBackgroundParticles() {
        const container = document.getElementById('bg-particles');
        if (!container) return;
        
        container.innerHTML = '';
        
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Random properties
            const size = Math.random() * 5 + 2;
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            const duration = Math.random() * 20 + 10;
            const delay = Math.random() * 5;
            const opacity = Math.random() * 0.3 + 0.1;
            
            particle.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: var(--primary);
                border-radius: 50%;
                left: ${x}%;
                top: ${y}%;
                opacity: ${opacity};
                animation: float ${duration}s linear ${delay}s infinite;
                filter: blur(${size / 2}px);
            `;
            
            container.appendChild(particle);
        }
    }
    
    // Tab Switching
    switchTab(tabId) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab
        const tab = document.getElementById(tabId);
        if (tab) {
            tab.classList.add('active');
        }
        
        const btn = document.querySelector(`.tab-btn[onclick="switchTab('${tabId}')"]`);
        if (btn) {
            btn.classList.add('active');
        }
    }
    
    // Quick Add Modal
    showQuickAdd() {
        const modal = document.getElementById('modal-quick-add');
        const content = document.getElementById('quick-add-content');
        
        content.innerHTML = '';
        
        // Add default units
        Object.values(gameConfig.DEFAULTS).forEach(unit => {
            const btn = document.createElement('button');
            btn.className = 'quick-add-btn';
            btn.innerHTML = `
                <div class="quick-add-icon" style="background: ${unit.color}"></div>
                <div class="quick-add-info">
                    <div class="quick-add-name">${unit.name}</div>
                    <div class="quick-add-type">${unit.type}</div>
                </div>
                <i class="fas fa-plus"></i>
            `;
            btn.onclick = () => {
                addUnitSlot(unit.id);
                this.hideModal('quick-add');
            };
            content.appendChild(btn);
        });
        
        // Add custom units
        Object.values(gameConfig.state.CUSTOM_MOBS).forEach(unit => {
            const btn = document.createElement('button');
            btn.className = 'quick-add-btn';
            btn.innerHTML = `
                <div class="quick-add-icon" style="background: ${unit.color || '#95a5a6'}"></div>
                <div class="quick-add-info">
                    <div class="quick-add-name">${unit.name}</div>
                    <div class="quick-add-type">${unit.type} (Custom)</div>
                </div>
                <i class="fas fa-plus"></i>
            `;
            btn.onclick = () => {
                addUnitSlot(`custom:${unit.id}`);
                this.hideModal('quick-add');
            };
            content.appendChild(btn);
        });
        
        this.showModal('quick-add');
    }
    
    closeQuickAdd() {
        this.hideModal('quick-add');
    }
}

// Create global UI manager instance
window.uiManager = new UIManager();

// Navigation Functions (kept for compatibility)
function goToMenu() {
    uiManager.showScreen('menu');
}

function goToSetup() {
    uiManager.showScreen('setup');
}

function goToImporter() {
    uiManager.showScreen('importer');
}

function goToGallery() {
    uiManager.showScreen('gallery');
}

function showTutorial() {
    uiManager.showNotification('Tutorial coming soon!', 'info');
}

function showCredits() {
    uiManager.showNotification('Created with ❤️ by Arena Game Dev Team', 'info');
}

// Unit Management Functions
function addUnitSlot(unitId, count = 1) {
    let template, templateKey;
    
    if (unitId.startsWith('custom:')) {
        const id = unitId.split(':')[1];
        template = gameConfig.state.CUSTOM_MOBS[id];
        templateKey = 'custom';
    } else {
        template = gameConfig.DEFAULTS[unitId];
        templateKey = unitId;
    }
    
    if (!template) {
        uiManager.showNotification('Unit not found!', 'error');
        return;
    }
    
    const newId = gameConfig.generateId('unit');
    const index = gameConfig.state.SPAWN_CONFIG.filter(s => s.config.name.startsWith(template.name)).length + 1;
    const newConfig = JSON.parse(JSON.stringify(template));
    
    // Add suffix for duplicate names
    newConfig.name = template.name + (index > 1 ? ` ${String.fromCharCode(64 + index)}` : '');
    
    gameConfig.state.SPAWN_CONFIG.push({
        id: newId,
        templateKey: templateKey,
        count: count,
        config: newConfig
    });
    
    uiManager.updateSetup();
    uiManager.showNotification(`Added ${newConfig.name}`, 'success');
}

function modifyUnitCount(unitId, delta) {
    const slot = gameConfig.state.SPAWN_CONFIG.find(s => s.id === unitId);
    if (!slot) return;
    
    slot.count = Math.max(0, slot.count + delta);
    
    if (slot.count === 0) {
        removeUnit(unitId);
    } else {
        uiManager.updateSetup();
    }
}

function removeUnit(unitId) {
    const slot = gameConfig.state.SPAWN_CONFIG.find(s => s.id === unitId);
    if (slot) {
        gameConfig.state.SPAWN_CONFIG = gameConfig.state.SPAWN_CONFIG.filter(s => s.id !== unitId);
        uiManager.updateSetup();
        uiManager.showNotification(`Removed ${slot.config.name}`, 'warning');
    }
}

function duplicateUnit(unitId) {
    const slot = gameConfig.state.SPAWN_CONFIG.find(s => s.id === unitId);
    if (slot) {
        addUnitSlot(slot.templateKey, slot.count);
    }
}

function editUnit(unitId) {
    uiManager.showNotification('Unit editor coming soon!', 'info');
}

function clearAllUnits() {
    if (gameConfig.state.SPAWN_CONFIG.length > 0) {
        if (confirm('Clear all units from the arena?')) {
            gameConfig.state.SPAWN_CONFIG = [];
            uiManager.updateSetup();
            uiManager.showNotification('All units cleared', 'warning');
        }
    }
}

function randomizeSquads() {
    // Clear existing
    gameConfig.state.SPAWN_CONFIG = [];
    
    // Add 2-5 random units
    const unitKeys = Object.keys(gameConfig.DEFAULTS);
    const customKeys = Object.keys(gameConfig.state.CUSTOM_MOBS);
    const allUnits = [...unitKeys, ...customKeys.map(k => `custom:${k}`)];
    
    const numUnits = Math.floor(Math.random() * 4) + 2;
    
    for (let i = 0; i < numUnits; i++) {
        const randomUnit = allUnits[Math.floor(Math.random() * allUnits.length)];
        const count = Math.floor(Math.random() * 3) + 1;
        addUnitSlot(randomUnit, count);
    }
    
    uiManager.showNotification('Random squads generated!', 'success');
}

function addFromGallery() {
    uiManager.showQuickAdd();
}