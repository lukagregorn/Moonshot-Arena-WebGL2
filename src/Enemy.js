import Node from './Node.js';

const mat4 = glMatrix.mat4;
const vec3 = glMatrix.vec3;
const quat = glMatrix.quat;

export default class Enemy extends Node {

    constructor(options) {
        super(options);

        this.keys = {};

        this.prefabs = null;
        this.target = null;

        // enemy
        this.range = 60;
        
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
        this.speed = 15;
        this.friction = 0.2;

        this.canJump = true;
        this.jumping = false;
        this.jumpPower = 50;
        this.jumpTime = .11;
        this.jumpCooldown = 2.2;
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
        

        // scale acceleration
        vec3.scale(acc, acc, dt * c.speed);
        
        // rotate 
        this.rotateTowardsTarget();

        // fire rate cooldown
        const fr = 0.5;
        if (!this.canFire) {
            this.fireRate -= dt;
            if (this.fireRate <= 0) {
                this.canFire = true;
                this.fireRate = fr;
            }
        } else {
            if (this.targetInRange()) {
                this.shoot();
            }
        }
    }
    
    
    shoot() {
        if ((!this.prefabs && this.prefabs.bullet) || !this.canFire) {
            return;
        }

        this.canFire = false;

        const pos = mat4.getTranslation(vec3.create(), this.shootPoint.getGlobalMatrix());
        const q = mat4.getRotation(quat.create(), this.getGlobalMatrix());
        const direction = [
            2 * (q[0] * q[2] + q[3] * q[1]),
            2 * (q[1] * q[2] - q[3] * q[0]),
            1 - 2 * (q[0] * q[0] + q[1] * q[1])
        ];

        vec3.negate(direction, direction);

        const bullet = this.prefabs.bullet.clone();
        bullet.fire(pos, q, direction, ["enemy"]);
    }

    targetInRange() {
        const target = this.target;
        if (!target) {
            return false;
        }

        const direction = vec3.sub(vec3.create(), target.translation, this.translation);
        const distance = vec3.length(direction);

        return distance <= this.range;
    }


    rotateTowardsTarget() {
        const c = this;
        const target = this.target;

        if (!target || !this.targetInRange()) {
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


    init(target, shootPoint, prefabs) {
        this.shootPoint = shootPoint;
        this.prefabs = prefabs;
        this.target = target;
    }

}
