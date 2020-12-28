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
        
        //physics
        this.isHumanoid = true;

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
        this.jumpPower = 45;
        this.jumpTime = .1;
        this.jumpCooldown = 2.5;
    }


    update(dt) {
        const c = this;
        const jt = 0.1;
        const jc = 2.5;

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

    }

    enableMouseLock() {
        document.addEventListener('mousemove', this.mousemoveHandler);
        document.addEventListener('keydown', this.keydownHandler);
        document.addEventListener('keyup', this.keyupHandler);
    }

    disableMouseLock() {
        document.removeEventListener('mousemove', this.mousemoveHandler);
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

        //c.r[0] -= halfpi/2;
        c.r[1] = ((c.r[1] % twopi) + twopi) % twopi;

        const degrees = c.r.map(x => x * 180 / pi);
        quat.fromEuler(c.cameraNode.rotation, ...degrees)

        // update camera node rotation
        c.cameraNode.updateMatrix();
    }

    keydownHandler(e) {
        this.keys[e.code] = true;
    }

    keyupHandler(e) {
        this.keys[e.code] = false;
    }

    setCameraNode(camNode) {
        this.cameraNode = camNode;
    }

}
