import Node from './Node.js';

const mat4 = glMatrix.mat4;
const vec3 = glMatrix.vec3;
const quat = glMatrix.quat;

function clamp(num, min, max) {
    return num <= min ? min : num >= max ? max : num;
}

export default class Bullet extends Node {

    constructor(options) {
        super(options);
        // tag
        this.tag = "bullet";
        this.hitIgnoreTags = [];

        // movement
        this.velocity = [0, 0, 0];
        this.speed = 100;

        this.physics = options.physics || null;
        this.scene = options.scene || null;
        this.playerNode = options.playerNode || null;

        this.impacted = false;
    }

    getDistanceFromPlayer() {
        const target = this.playerNode;
        if (!target) {
            return -1;
        }

        const direction = vec3.sub(vec3.create(), target.translation, this.translation);
        return vec3.length(direction);
    }

    getSoundVolume() {
        const distance = this.getDistanceFromPlayer();
        if (distance > -1) {
            return clamp(0.1 - (distance / 1000), 0, 0.05);
        }

        return 0;
    }

    onImpact(tag) {
        if (this.impacted) {
            return;
        }

        this.impacted = true;
        if (tag == "none") {
            // sfx
            const inpact = new Audio("../assets/sfx/BulletInpact.wav"); 
            inpact.preload = 'auto'; 
            inpact.volume = this.getSoundVolume();
            inpact.play();
        }
    }

    fire(pos, q, direction, hitIgnoreTags) {
        vec3.scale(this.velocity, direction, this.speed);
        this.rotation = q;
        this.translation = pos;
        
        // make it dynamic so that phsics picks it up
        this.dynamic = 2;
        this.hitIgnoreTags = hitIgnoreTags;

        // add it to physics queue
        //console.log(this.scene);
        this.scene.addNode(this);
        this.physics.addNode(this);
    }

    clone(player) {
        return new Bullet({
            ...this,
            children: this.children.map(child => child.clone()),
            playerNode: player,
        });
    }

}
