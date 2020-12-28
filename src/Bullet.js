import Node from './Node.js';

const mat4 = glMatrix.mat4;
const vec3 = glMatrix.vec3;
const quat = glMatrix.quat;

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
    }

    fire(pos, q, direction, hitIgnoreTags) {
        vec3.scale(this.velocity, direction, this.speed);
        this.rotation = q;
        this.translation = pos;
        
        // make it dynamic so that phsics picks it up
        this.dynamic = 2;
        this.hitIgnoreTags = hitIgnoreTags;

        // add it to physics queue
        console.log(this.scene);
        this.scene.addNode(this);
        this.physics.addNode(this);
    }

    clone() {
        return new Bullet({
            ...this,
            children: this.children.map(child => child.clone()),
        });
    }

}
