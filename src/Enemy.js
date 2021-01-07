import Node from './Node.js';

const mat4 = glMatrix.mat4;
const vec3 = glMatrix.vec3;
const quat = glMatrix.quat;

function clamp(num, min, max) {
    return num <= min ? min : num >= max ? max : num;
}

export default class Enemy extends Node {

    constructor(options) {
        super(options);

        this.keys = {};

        this.prefabs = null;
        this.target = null;

        this.physics = options.physics || null;
        this.scene = options.scene || null;

        // enemy
        this.shootRange = 50;
        this.walkRange = 90;
        
        // physics
        this.isHumanoid = true;
        this.tag = "enemy";
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
        this.speed = 12;
        this.friction = 0.2;

        this.canJump = true;
        this.jumping = false;
        this.jumpPower = 50;
        this.jumpTime = .11;
        this.jumpCooldown = 2.2;
    }


    update(dt) {
        // rotate 
        this.rotateTowardsTarget();

        // follow player
        this.followTarget(dt);

        // fire rate cooldown
        const fr = 0.5;
        if (!this.canFire) {
            this.fireRate -= dt;
            if (this.fireRate <= 0) {
                this.canFire = true;
                this.fireRate = fr;
            }
        } else {
            if (this.targetInShootRange()) {
                this.shoot();
            }
        }
    }
    
    getSoundVolume() {
        const distance = this.getDistanceFromTarget();
        if (distance > -1) {
            return clamp(1 - (distance / (this.shootRange + 5)), 0, 1);;
        }

        return 0;
    }
    
    shoot() {
        if ((!this.prefabs && this.prefabs.bullet) || !this.canFire) {
            return;
        }

        if (!this.target) {
            return;
        }

        this.canFire = false;

        const pos = mat4.getTranslation(vec3.create(), this.shootPoint.getGlobalMatrix());
        const q = mat4.getRotation(quat.create(), this.getGlobalMatrix());
        const direction = vec3.sub(vec3.create(), this.target.translation, pos);
        vec3.normalize(direction, direction);
        
        // sfx
        const gunshot = new Audio("../assets/sfx/EnemyGunShot.wav"); 
        gunshot.preload = 'auto'; 
        gunshot.volume = this.getSoundVolume();
        gunshot.play();

        const bullet = this.prefabs.bullet.clone(this.target);
        bullet.fire(pos, q, direction, ["enemy"]);
    }

    takeHit() {
        if (this.dead) {
            return;
        }

        this.dead = true;

        // play sound fx
        const hitEnemy = new Audio("../assets/sfx/BulletHitEnemy.wav"); 
        hitEnemy.preload = 'auto'; 
        hitEnemy.volume = 1;
        hitEnemy.play();

        // die
        this.roundManager.enemyDied(this);
    }

    getDistanceFromTarget() {
        const target = this.target;
        if (!target) {
            return -1;
        }

        const direction = vec3.sub(vec3.create(), target.translation, this.translation);
        return vec3.length(direction);
    }

    targetInShootRange() {
        const distance = this.getDistanceFromTarget();
        if (distance > -1) {
            return distance <= this.shootRange;
        }

        return false;
    }


    targetInWalkRange() {
        const distance = this.getDistanceFromTarget();
        if (distance > -1) {
            return distance <= this.walkRange;
        }

        return false;
    }

    followTarget(dt) {
        const c = this;
        const target = this.target;

        if (!target || !this.targetInWalkRange()) {
            return;
        }

        c.acceleration = vec3.create();
        
        const forward = vec3.set(vec3.create(),
        -Math.sin(c.r[1]), 0, -Math.cos(c.r[1]));

        let acc = c.acceleration;

        vec3.add(acc, acc, forward);
        vec3.scale(acc, acc, dt * c.speed);
    }


    rotateTowardsTarget() {
        const c = this;
        const target = this.target;

        if (!target || !this.targetInWalkRange()) {
            return;
        }

        const pi = Math.PI;
        const twopi = pi*2;
        
        const currentDir = [-Math.sin(c.r[1]), 0, -Math.cos(c.r[1])];  // forward trenutni
        const desiredDir = vec3.sub(vec3.create(), target.translation, c.translation);  // forward zeljeni
        desiredDir[1] = 0; // y bi dal proc ker kokr vidm topi ne merijo gor dol ampak sam levo desno
        vec3.normalize(desiredDir, desiredDir);  // se normaliziramo
        
        const angle = vec3.angle(currentDir, desiredDir);  // dobimo kot med nasima vektorjema;
        c.r[1] += angle;  // dodas kot y osi;
        
        // Ker nas angle ne zanima al se vrtimo v levo al desno bo vedno vrnu manjsi kot
        // zato preverimo ce smo s tem da smo pristeli angle mogoce kot sam se povecali (tega nocemo)
        // ce smo ga povecali potem ga zmanjsamo za 2x ker ocitno je angle vrnu kot v drugo stran

        const newDir = [-Math.sin(c.r[1]), 0, -Math.cos(c.r[1])];
        const newAngle = vec3.angle(newDir, desiredDir);
        if (newAngle > angle) {
            c.r[1] -= 2*angle;
        }

        c.r[1] = ((c.r[1] % twopi) + twopi) % twopi; // limit rotation so we dont go to inifity

        //console.log("Angle: ", angle, "Rotation:", c.r);

        const degrees = c.r.map(x => x * 180 / pi);
        quat.fromEuler(c.rotation, ...degrees)

        // update rotation
        c.updateMatrix();
    }


    init(target, prefabs, spawnpoint, roundManager) {
        this.shootPoint = this.children[0].children[0];
        this.prefabs = prefabs;
        this.target = target;
        this.roundManager = roundManager;

        this.dynamic = 1;

        this.translation = spawnpoint;
        this.updateMatrix();

        this.scene.addNode(this);
        this.physics.addNode(this);

    }

    clone() {
        return new Enemy({
            ...this,
            children: this.children.map(child => child.clone()),
        });
    }

}
