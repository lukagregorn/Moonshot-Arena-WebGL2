import Node from './Node.js';

const mat4 = glMatrix.mat4;
const vec3 = glMatrix.vec3;
const quat = glMatrix.quat;

export default class Bullet extends Node {

    constructor(options) {
        super(options);

        this.mousemoveHandler = this.mousemoveHandler.bind(this);
        this.keydownHandler = this.keydownHandler.bind(this);
        this.keyupHandler = this.keyupHandler.bind(this);
        this.keys = {};

        // movement
        this.velocity = [0, 0, 0];
        this.r = [0, 0, 0];
        this.acceleration = [0, 0, 0];
        this.mouseSensitivity = 0.002;
        this.maxSpeed = 6;
        this.speed = 20;
        this.friction = 0.2;

        this.canJump = true;
        this.jumping = false;
        this.jumpPower = 40;
        this.jumpTime = .2;
        this.jumpCooldown = .6;
    }

}
