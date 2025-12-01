/**
 * ENHANCED UNIT CLASS with Sprite Support
 */

class EnhancedUnit {
    constructor(id, x, y, config) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * config.speed * 2;
        this.vy = (Math.random() - 0.5) * config.speed * 2;
        
        // Core stats
        this.name = config.name;
        this.type = config.type;
        this.class = config.class;
        this.color = config.color;
        this.hp = config.hp;
        this.maxHp = config.maxHp || config.hp;
        this.speed = config.speed;
        this.baseSpeed = config.baseSpeed || config.speed;
        this.radius = config.radius;
        this.hasIframes = config.hasIframes || false;
        this.bodyDmg = config.bodyDmg || 0;
        
        // Weapon system
        this.weapon = config.weapon || { type: 'none' };
        
        // Sprite system
        this.sprite = {
            body: config.sprite || null,
            weapon: config.weapon?.sprite || null,
            loaded: false
        };
        
        // Load sprites
        this.loadSprites();
        
        // Custom data
        this.customData = config.customData || {};
        this.abilities = config.abilities || [];
        this.rarity = config.rarity || 'common';
        
        // Combat stats
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = 0.05;
        this.cooldown = 0;
        this.hits = 0;
        this.kills = 0;
        this.damageDealt = 0;
        this.damageTaken = 0;
        this.alive = true;
        this.iFrameTimer = 0;
        
        // Movement
        this.targetX = null;
        this.targetY = null;
        this.wanderTimer = 0;
        
        // Visual effects
        this.trail = [];
        this.maxTrail = 10;
        this.glowIntensity = 0;
        
        // AI Behavior
        this.target = null;
        this.aggroRange = 200;
        this.attackRange = this.weapon.range || 50;
        this.lastAttackTime = 0;
        
        console.log(`Created unit: ${this.name} at (${x}, ${y})`);
    }
    
    // Load sprites asynchronously
    async loadSprites() {
        try {
            // Load body sprite
            if (this.sprite.body) {
                const bodyImg = await assetManager.loadSprite(this.sprite.body, `unit_${this.id}`);
                if (bodyImg) {
                    this.sprite.body = bodyImg;
                } else {
                    // Create fallback sprite
                    this.sprite.body = assetManager.createFallbackSprite(this.color, this.radius);
                }
            } else {
                // Create colored circle
                this.sprite.body = assetManager.createFallbackSprite(this.color, this.radius);
            }
            
            // Load weapon sprite
            if (this.weapon.sprite) {
                const weaponImg = await assetManager.loadSprite(this.weapon.sprite, `weapon_${this.id}`);
                if (weaponImg) {
                    this.sprite.weapon = weaponImg;
                } else {
                    // Create fallback weapon
                    this.sprite.weapon = assetManager.createWeaponSprite(this.weapon.model, this.color);
                }
            } else if (this.weapon.model) {
                // Create weapon based on model
                this.sprite.weapon = assetManager.createWeaponSprite(this.weapon.model, this.color);
            }
            
            this.sprite.loaded = true;
        } catch (error) {
            console.warn(`Failed to load sprites for ${this.name}:`, error);
            // Create fallback sprites
            this.sprite.body = assetManager.createFallbackSprite(this.color, this.radius);
            if (this.weapon.model) {
                this.sprite.weapon = assetManager.createWeaponSprite(this.weapon.model, this.color);
            }
            this.sprite.loaded = true;
        }
    }
    
    // Update unit logic
    update(deltaTime, effectiveTimeScale) {
        if (!this.alive || gameConfig.state.countdown.active) return;
        
        // Update i-frames
        if (this.iFrameTimer > 0) {
            this.iFrameTimer -= deltaTime * effectiveTimeScale;
        }
        
        // Update cooldown
        if (this.cooldown > 0) {
            this.cooldown -= deltaTime * effectiveTimeScale;
        }
        
        // AI Behavior
        this.updateAI(deltaTime, effectiveTimeScale);
        
        // Apply velocity with physics
        this.applyPhysics(deltaTime, effectiveTimeScale);
        
        // Update trail
        this.updateTrail();
        
        // Update glow
        this.glowIntensity = Math.max(0, this.glowIntensity - deltaTime * 0.1);
        
        // Auto-attack if weapon is ready
        if (this.cooldown <= 0 && this.weapon.type !== 'none') {
            this.attack();
        }
    }
    
    // AI Logic
    updateAI(deltaTime, effectiveTimeScale) {
        // Find nearest enemy
        let nearestEnemy = null;
        let nearestDist = Infinity;
        
        for (const unit of gameConfig.state.units) {
            if (unit === this || !unit.alive) continue;
            
            const dx = unit.x - this.x;
            const dy = unit.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < nearestDist) {
                nearestDist = dist;
                nearestEnemy = unit;
            }
        }
        
        // If we have a target and it's dead, clear it
        if (this.target && (!this.target.alive || this.target.hp <= 0)) {
            this.target = null;
        }
        
        // Set new target if none
        if (!this.target && nearestEnemy && nearestDist < this.aggroRange) {
            this.target = nearestEnemy;
        }
        
        // If we have a target, move towards or away based on unit type
        if (this.target) {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            
            // Different behavior based on unit type
            switch(this.type) {
                case 'melee':
                    // Move towards target
                    if (dist > this.attackRange) {
                        this.vx += Math.cos(angle) * this.speed * 0.05 * effectiveTimeScale;
                        this.vy += Math.sin(angle) * this.speed * 0.05 * effectiveTimeScale;
                    }
                    // Face target
                    this.rotation = angle;
                    break;
                    
                case 'ranged':
                    // Keep distance
                    const desiredDist = this.attackRange * 0.8;
                    if (dist < desiredDist - 20) {
                        // Move away
                        this.vx -= Math.cos(angle) * this.speed * 0.05 * effectiveTimeScale;
                        this.vy -= Math.sin(angle) * this.speed * 0.05 * effectiveTimeScale;
                    } else if (dist > desiredDist + 20) {
                        // Move closer
                        this.vx += Math.cos(angle) * this.speed * 0.05 * effectiveTimeScale;
                        this.vy += Math.sin(angle) * this.speed * 0.05 * effectiveTimeScale;
                    }
                    // Face target
                    this.rotation = angle;
                    break;
                    
                case 'body':
                    // Charge straight at target
                    this.vx += Math.cos(angle) * this.speed * 0.1 * effectiveTimeScale;
                    this.vy += Math.sin(angle) * this.speed * 0.1 * effectiveTimeScale;
                    this.rotation = angle;
                    break;
                    
                case 'magic':
                    // Circle around target
                    const circleAngle = angle + Math.PI / 2;
                    this.vx += Math.cos(circleAngle) * this.speed * 0.03 * effectiveTimeScale;
                    this.vy += Math.sin(circleAngle) * this.speed * 0.03 * effectiveTimeScale;
                    // Face target
                    this.rotation = angle;
                    break;
            }
        } else {
            // Wander behavior
            this.wanderTimer -= deltaTime * effectiveTimeScale;
            if (this.wanderTimer <= 0) {
                this.wanderTimer = Math.random() * 2 + 1;
                const wanderAngle = Math.random() * Math.PI * 2;
                this.vx += Math.cos(wanderAngle) * this.speed * 0.02 * effectiveTimeScale;
                this.vy += Math.sin(wanderAngle) * this.speed * 0.02 * effectiveTimeScale;
            }
        }
        
        // Limit speed
        const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        const maxSpeed = this.speed * 2;
        if (currentSpeed > maxSpeed) {
            this.vx = (this.vx / currentSpeed) * maxSpeed;
            this.vy = (this.vy / currentSpeed) * maxSpeed;
        }
    }
    
    // Apply physics
    applyPhysics(deltaTime, effectiveTimeScale) {
        // Apply velocity
        this.x += this.vx * deltaTime * effectiveTimeScale;
        this.y += this.vy * deltaTime * effectiveTimeScale;
        
        // Apply rotation
        this.rotation += this.rotSpeed * deltaTime * effectiveTimeScale;
        
        // Boundary collision
        const arenaWidth = gameConfig.state.canvas.width;
        const arenaHeight = gameConfig.state.canvas.height;
        const wallBounce = gameConfig.CONSTANTS.WALL_BOUNCE_DAMPING;
        
        if (this.x < this.radius) {
            this.x = this.radius;
            this.vx = Math.abs(this.vx) * wallBounce;
            this.createWallImpact(this.x, this.y, -1, 0);
        }
        if (this.x > arenaWidth - this.radius) {
            this.x = arenaWidth - this.radius;
            this.vx = -Math.abs(this.vx) * wallBounce;
            this.createWallImpact(this.x, this.y, 1, 0);
        }
        if (this.y < this.radius) {
            this.y = this.radius;
            this.vy = Math.abs(this.vy) * wallBounce;
            this.createWallImpact(this.x, this.y, 0, -1);
        }
        if (this.y > arenaHeight - this.radius) {
            this.y = arenaHeight - this.radius;
            this.vy = -Math.abs(this.vy) * wallBounce;
            this.createWallImpact(this.x, this.y, 0, 1);
        }
        
        // Apply friction
        const friction = gameConfig.state.physicsMode === 'sticky' ? 0.9 : 0.98;
        this.vx *= friction;
        this.vy *= friction;
        
        // Minimum velocity cutoff
        if (Math.abs(this.vx) < 0.1) this.vx = 0;
        if (Math.abs(this.vy) < 0.1) this.vy = 0;
    }
    
    // Create wall impact effect
    createWallImpact(x, y, normalX, normalY) {
        if (Math.abs(this.vx) + Math.abs(this.vy) > 2) {
            gameConfig.state.particles.push({
                x: x + normalX * this.radius,
                y: y + normalY * this.radius,
                vx: normalX * 5,
                vy: normalY * 5,
                life: 1,
                color: '#ffffff',
                size: 3
            });
        }
    }
    
    // Update movement trail
    updateTrail() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrail) {
            this.trail.shift();
        }
    }
    
    // Attack logic
    attack() {
        if (this.weapon.type === 'projectile' && this.weapon.projectile) {
            this.cooldown = this.weapon.cooldown || 30;
            
            const projectile = this.createProjectile();
            gameConfig.state.projectiles.push(projectile);
            
            // Visual feedback
            this.glowIntensity = 1;
            
            // Sound effect would go here
        } else if (this.weapon.type === 'melee') {
            this.cooldown = this.weapon.cooldown || 20;
            this.performMeleeAttack();
        }
        
        this.lastAttackTime = Date.now();
    }
    
    // Create projectile
    createProjectile() {
        const projConfig = this.weapon.projectile;
        
        // Calculate direction
        let angle = this.rotation;
        if (this.target) {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            angle = Math.atan2(dy, dx);
        }
        
        const projectile = {
            id: gameConfig.generateId('proj'),
            x: this.x + Math.cos(angle) * (this.radius + 10),
            y: this.y + Math.sin(angle) * (this.radius + 10),
            vx: Math.cos(angle) * projConfig.speed,
            vy: Math.sin(angle) * projConfig.speed,
            owner: this,
            damage: projConfig.damage || this.weapon.damage || 10,
            life: projConfig.life || 60,
            maxLife: projConfig.life || 60,
            size: projConfig.size || 4,
            color: projConfig.color || this.color,
            type: projConfig.type || 'arrow',
            model: projConfig.model || 'circle',
            
            // Enhanced properties
            onWallHit: projConfig.onWallHit || 'destroy',
            bounceCount: projConfig.bounceCount || 0,
            maxBounces: projConfig.bounceCount || 0,
            pierce: projConfig.pierce || false,
            gravity: projConfig.gravity || 0,
            homing: projConfig.homing || null,
            explosion: projConfig.explosion || null,
            
            // Sprite
            sprite: projConfig.sprite || null,
            spriteLoaded: false,
            
            // Trail
            trail: [],
            maxTrail: 5
        };
        
        // Load projectile sprite
        if (projectile.sprite) {
            assetManager.loadSprite(projectile.sprite, `proj_${projectile.id}`).then(img => {
                projectile.sprite = img;
                projectile.spriteLoaded = true;
            }).catch(() => {
                // Create fallback
                projectile.sprite = assetManager.createProjectileSprite(projectile.type, projectile.color);
                projectile.spriteLoaded = true;
            });
        } else {
            // Create default sprite
            projectile.sprite = assetManager.createProjectileSprite(projectile.type, projectile.color);
            projectile.spriteLoaded = true;
        }
        
        return projectile;
    }
    
    // Perform melee attack
    performMeleeAttack() {
        const angle = this.rotation;
        const range = this.weapon.range || 25;
        const attackX = this.x + Math.cos(angle) * (this.radius + range);
        const attackY = this.y + Math.sin(angle) * (this.radius + range);
        
        // Check for hits
        for (const target of gameConfig.state.units) {
            if (target === this || !target.alive) continue;
            
            const distance = Math.hypot(target.x - attackX, target.y - attackY);
            if (distance < target.radius + 5) {
                const damage = this.weapon.damage || 10;
                game.dealDamage(this, target, damage, 'melee');
                
                // Knockback
                const knockback = 5;
                target.vx += Math.cos(angle) * knockback;
                target.vy += Math.sin(angle) * knockback;
                
                break; // Single target for melee
            }
        }
        
        // Visual effect
        this.createMeleeSwing(angle, range);
        this.glowIntensity = 1;
    }
    
    // Create melee swing effect
    createMeleeSwing(angle, range) {
        const swingAngle = angle - Math.PI / 4;
        const swingArc = Math.PI / 2;
        const segments = 8;
        
        for (let i = 0; i < segments; i++) {
            const segAngle = swingAngle + (swingArc / segments) * i;
            const dist = range * (0.5 + Math.random() * 0.5);
            
            gameConfig.state.particles.push({
                x: this.x + Math.cos(segAngle) * (this.radius + dist),
                y: this.y + Math.sin(segAngle) * (this.radius + dist),
                vx: Math.cos(segAngle) * 2 + (Math.random() - 0.5),
                vy: Math.sin(segAngle) * 2 + (Math.random() - 0.5),
                life: 0.5,
                color: this.color,
                size: 2
            });
        }
    }
    
    // Take damage
    takeDamage(amount, source, type = 'physical') {
        if (this.iFrameTimer > 0) return false;
        
        this.hp -= amount;
        this.damageTaken += amount;
        
        // I-frames if applicable
        if (this.hasIframes) {
            this.iFrameTimer = gameConfig.CONSTANTS.IFRAME_DURATION;
        }
        
        // Visual feedback
        this.glowIntensity = 1;
        this.createDamageParticles();
        
        // Slow motion on big hits
        if (amount > this.maxHp * 0.2) {
            gameConfig.state.cinematicTime = gameConfig.CONSTANTS.SLOW_MO_DURATION;
        }
        
        // Camera shake
        if (amount > 20) {
            gameConfig.state.camera.shakeDuration = Math.min(30, amount / 5);
            gameConfig.state.camera.shakeIntensity = Math.min(5, amount / 10);
        }
        
        // Death check
        if (this.hp <= 0 && this.alive) {
            this.die(source);
            return true;
        }
        
        return false;
    }
    
    // Create damage particles
    createDamageParticles() {
        for (let i = 0; i < 5; i++) {
            gameConfig.state.particles.push({
                x: this.x + (Math.random() - 0.5) * this.radius,
                y: this.y + (Math.random() - 0.5) * this.radius,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 1,
                color: this.color,
                size: 3
            });
        }
    }
    
    // Death
    die(killer) {
        this.alive = false;
        
        // Give kill credit
        if (killer) {
            killer.kills++;
        }
        
        // Death explosion
        this.createDeathExplosion();
        
        // Remove from targeting
        gameConfig.state.units.forEach(unit => {
            if (unit.target === this) {
                unit.target = null;
            }
        });
        
        console.log(`${this.name} died!`);
    }
    
    // Create death explosion
    createDeathExplosion() {
        // Core explosion
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 8;
            
            gameConfig.state.particles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1 + Math.random(),
                color: this.color,
                size: 2 + Math.random() * 4
            });
        }
        
        // Shockwave
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            
            gameConfig.state.effects.push({
                type: 'shockwave',
                x: this.x,
                y: this.y,
                radius: 0,
                maxRadius: this.radius * 3,
                speed: 10,
                color: this.color,
                life: 1
            });
        }
        
        // Camera shake
        gameConfig.state.camera.shakeDuration = 30;
        gameConfig.state.camera.shakeIntensity = 5;
    }
    
    // Draw unit
    draw(ctx) {
        if (!this.alive) return;
        
        ctx.save();
        
        // Apply camera transformations
        this.applyCameraTransform(ctx);
        
        // Draw trail
        this.drawTrail(ctx);
        
        // Draw shadow
        this.drawShadow(ctx);
        
        // Draw body
        this.drawBody(ctx);
        
        // Draw weapon
        this.drawWeapon(ctx);
        
        // Draw HP bar
        this.drawHPBar(ctx);
        
        // Draw name
        this.drawName(ctx);
        
        // Draw selection/glow
        this.drawGlow(ctx);
        
        ctx.restore();
    }
    
    // Apply camera transformations
    applyCameraTransform(ctx) {
        const camera = gameConfig.state.camera;
        const canvas = gameConfig.state.canvas;
        
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(camera.zoom, camera.zoom);
        ctx.translate(-canvas.width / 2 + camera.panX, -canvas.height / 2 + camera.panY);
        
        // Camera shake
        if (camera.shakeDuration > 0) {
            ctx.translate(
                (Math.random() * 2 - 1) * camera.shakeIntensity,
                (Math.random() * 2 - 1) * camera.shakeIntensity
            );
        }
    }
    
    // Draw movement trail
    drawTrail(ctx) {
        if (this.trail.length < 2) return;
        
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(this.trail[0].x, this.trail[0].y);
        
        for (let i = 1; i < this.trail.length; i++) {
            const point = this.trail[i];
            ctx.lineTo(point.x, point.y);
        }
        
        ctx.stroke();
        ctx.restore();
    }
    
    // Draw shadow
    drawShadow(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(
            this.x + 3,
            this.y + 3,
            this.radius,
            this.radius * 0.5,
            0, 0, Math.PI * 2
        );
        ctx.fill();
        ctx.restore();
    }
    
    // Draw body
    drawBody(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // I-frame flash
        if (this.iFrameTimer > 0 && Math.floor(this.iFrameTimer) % 2 === 0) {
            ctx.globalAlpha = 0.7;
        }
        
        // Draw sprite or colored circle
        if (this.sprite.loaded && this.sprite.body) {
            ctx.rotate(this.rotation);
            ctx.drawImage(
                this.sprite.body,
                -this.radius,
                -this.radius,
                this.radius * 2,
                this.radius * 2
            );
        } else {
            // Fallback: colored circle
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Add highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(-this.radius * 0.3, -this.radius * 0.3, this.radius * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    // Draw weapon
    drawWeapon(ctx) {
        if (!this.sprite.weapon || this.weapon.type === 'none') return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Draw weapon sprite
        const weapon = this.weapon;
        const offsetX = weapon.offsetX || this.radius;
        const offsetY = weapon.offsetY || 0;
        
        if (this.sprite.weapon) {
            ctx.drawImage(
                this.sprite.weapon,
                offsetX - 16,
                offsetY - 16,
                32, 32
            );
        } else {
            // Fallback: simple weapon shape
            ctx.fillStyle = '#ffffff';
            if (weapon.model === 'sword') {
                ctx.fillRect(offsetX, offsetY - 3, 25, 6);
            } else if (weapon.model === 'bow') {
                ctx.strokeStyle = '#8B4513';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(0, -this.radius);
                ctx.lineTo(20, -this.radius);
                ctx.moveTo(0, this.radius);
                ctx.lineTo(20, this.radius);
                ctx.stroke();
            }
        }
        
        ctx.restore();
    }
    
    // Draw HP bar
    drawHPBar(ctx) {
        const hpPercent = this.hp / this.maxHp;
        const barWidth = gameConfig.CONSTANTS.HP_BAR_WIDTH;
        const barHeight = gameConfig.CONSTANTS.HP_BAR_HEIGHT;
        const barY = this.y - this.radius - 10;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(this.x - barWidth / 2, barY, barWidth, barHeight);
        
        // HP fill
        const gradient = ctx.createLinearGradient(
            this.x - barWidth / 2, barY,
            this.x + barWidth / 2, barY
        );
        
        if (hpPercent > 0.5) {
            gradient.addColorStop(0, '#2ecc71');
            gradient.addColorStop(1, '#27ae60');
        } else if (hpPercent > 0.25) {
            gradient.addColorStop(0, '#f39c12');
            gradient.addColorStop(1, '#e67e22');
        } else {
            gradient.addColorStop(0, '#e74c3c');
            gradient.addColorStop(1, '#c0392b');
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x - barWidth / 2, barY, barWidth * hpPercent, barHeight);
        
        // Border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - barWidth / 2, barY, barWidth, barHeight);
    }
    
    // Draw name
    drawName(ctx) {
        const nameY = this.y - this.radius - 25;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(this.x - 40, nameY - 10, 80, 20);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.name, this.x, nameY);
    }
    
    // Draw glow/selection
    drawGlow(ctx) {
        if (this.glowIntensity <= 0) return;
        
        ctx.save();
        ctx.globalAlpha = this.glowIntensity * 0.5;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}