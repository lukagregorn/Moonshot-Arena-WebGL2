import Node from './Node.js';

const mat4 = glMatrix.mat4;
const vec3 = glMatrix.vec3;
const quat = glMatrix.quat;
export default class Player extends Node {

    constructor(options) {
        super(options);

        this.mousemoveHandler = this.mousemoveHandler.bind(this);
        this.keydownHandler = this.keydownHandler.bind(this);
        this.keyupHandler = this.keyupHandler.bind(this);
        this.keys = {};

        this.head = null;
        this.prefabs = null;
        
        // human
        this.health = 5;
        this.maxHealth = 5;
        this.isHit = false;
        this.isHitCooldown = 0.2;

        // physics
        this.isHumanoid = true;
        this.tag = "player";
        this.hitIgnoreTags = [];

        // shooting
        this.shoot = this.shoot.bind(this);
        this.canShoot;
        this.fireRate = 0.5;

        // movement
        this.velocity = [0, 0, 0];
        this.r = [0, 0, 0];
        this.acceleration = [0, 0, 0];
        this.jumpForce = [0,0,0];
        this.mouseSensitivity = 0.002;
        this.maxSpeed = 10;
        this.speed = 15;
        this.friction = 0.2;

        this.canJump = true;
        this.jumping = false;
        this.jumpPower = 50;
        this.jumpTime = .11;
        this.jumpCooldown = 2.2;   

        // sfx
        this.takeHitSFX = new Audio("../assets/sfx/PlayerTakeHit.wav"); 
        this.takeHitSFX.preload = 'auto';
        
    }


    update(dt) {
        const c = this;
        const jt = 0.11;
        const jc = 2.2;
        
        c.acceleration = vec3.create();
        
        const forward = vec3.set(vec3.create(),
        -Math.sin(c.r[1]), 0, -Math.cos(c.r[1]));
        
        const right = vec3.set(vec3.create(),
        Math.cos(c.r[1]), 0, -Math.sin(c.r[1]));
        
        const up = vec3.set(vec3.create(), 0, 1, 0);
        
        // 1: add movement acceleration
        let acc = c.acceleration;
        if (this.keys['KeyW']) {
            vec3.add(acc, acc, forward);
        }
        if (this.keys['KeyS']) {
            vec3.sub(acc, acc, forward);
        }
        if (this.keys['KeyD']) {
            vec3.add(acc, acc, right);
        }
        if (this.keys['KeyA']) {
            vec3.sub(acc, acc, right);
        }
        
        // Jump logic
        if (this.keys['Space']) {
            if (this.canJump) {
                this.jumping = true;
                this.canJump = false;
            }
        }

        if (this.jumping) {
            this.jumpTime -= dt;
            if (this.jumpTime <= 0) {
                this.jumpTime = jt;
                this.jumping = false;
            } else {
                this.jumpForce = vec3.scale(vec3.create(), up, c.jumpPower * c.jumpTime);
            }
        } else {
            this.jumpForce = [0,0,0];
            if (!this.canJump) {
                this.jumpCooldown -= dt;
                if (this.jumpCooldown <= 0) {
                    this.jumpCooldown = jc;
                    this.canJump = true;
                }
            }
        }
        
        
        // 2: update velocity
        vec3.scaleAndAdd(c.velocity, c.velocity, acc, dt * c.speed);

        // 3: if no movement, apply friction
        if (!this.keys['KeyW'] &&
            !this.keys['KeyS'] &&
            !this.keys['KeyD'] &&
            !this.keys['KeyA'])
        {
            vec3.scale(c.velocity, c.velocity, 1 - c.friction);
        }

        // 4: limit speed
        const len = vec3.len(c.velocity);
        if (len > c.maxSpeed) {
            vec3.scale(c.velocity, c.velocity, (c.maxSpeed-1) / len);
        }

        // scale acceleration
        vec3.scale(acc, acc, dt * c.speed);
        
        // fire rate cooldown
        const fr = 0.5;
        if (!this.canFire) {
            this.fireRate -= dt;
            if (this.fireRate <= 0) {
                this.canFire = true;
                this.fireRate = fr;
            }
        }

        // ishit cooldown
        const hc = 0.2;
        if (this.isHit) {
            this.isHitCooldown -= dt;
            if (this.isHitCooldown <= 0) {
                this.isHit = false;
                this.isHitCooldown = hc;
            }
        }
    }
    

    takeHit() {
        if (this.isHit) {
            return;
        }

        this.isHit = true;
        this.health -= 1;
        if (this.health <= 0) {
            this.died();
        }

        // play sound fx
        this.takeHitSFX.play();
    }
    
    shoot() {
        if ((!this.prefabs && this.prefabs.bullet) || !this.canFire) {
            return;
        }

        this.canFire = false;

        const pos = mat4.getTranslation(vec3.create(), this.shootPoint.getGlobalMatrix());
        const q = mat4.getRotation(quat.create(), this.head.children[0].children[1].getGlobalMatrix());
        const direction = [
            2 * (q[0] * q[2] + q[3] * q[1]),
            2 * (q[1] * q[2] - q[3] * q[0]),
            1 - 2 * (q[0] * q[0] + q[1] * q[1])
        ];

        vec3.negate(direction, direction);

        // sfx
        const gunshot = new Audio("../assets/sfx/GunShot.wav"); 
        gunshot.preload = 'auto'; 
        gunshot.volume = 1;
        gunshot.play();

        const bullet = this.prefabs.bullet.clone(this);
        bullet.fire(pos, q, direction, ["player"]);
    }


    died() {
        console.log("Player died what do i do");
    }

    enableMouseLock() {
        document.addEventListener('mousemove', this.mousemoveHandler);
        document.addEventListener('mousedown', this.shoot);
        document.addEventListener('keydown', this.keydownHandler);
        document.addEventListener('keyup', this.keyupHandler);
    }

    disableMouseLock() {
        document.removeEventListener('mousemove', this.mousemoveHandler);
        document.removeEventListener('mousedown', this.shoot);
        document.removeEventListener('keydown', this.keydownHandler);
        document.removeEventListener('keyup', this.keyupHandler);

        for (let key in this.keys) {
            this.keys[key] = false;
        }
    }

    mousemoveHandler(e) {
        const dx = e.movementX;
        const dy = e.movementY;
        const c = this;

        c.r[0] -= dy * c.mouseSensitivity;
        c.r[1] -= dx * c.mouseSensitivity;

        const pi = Math.PI;
        const twopi = pi * 2;
        const halfpi = pi / 2;

        if (c.r[0] > halfpi) {
            c.r[0] = halfpi;
        }
        if (c.r[0] < -halfpi) {
            c.r[0] = -halfpi;
        }

        c.r[1] = ((c.r[1] % twopi) + twopi) % twopi;

        const degrees = c.r.map(x => x * 180 / pi);
        quat.fromEuler(c.head.rotation, ...degrees)

        // update camera node rotation
        c.head.updateMatrix();
    }


    keydownHandler(e) {
        this.keys[e.code] = true;
    }

    keyupHandler(e) {
        this.keys[e.code] = false;
    }

    init(head, shootPoint, prefabs) {
        this.head = head;
        this.shootPoint = shootPoint;
        this.prefabs = prefabs;
    }

}
