import Node from './Node.js';

export default class Light extends Node {

    constructor() {
        super();

        Object.assign(this, {
            position         : [0, 250, 0],
            ambient          : 1,
            diffuse          : 10,
            specular         : 0.6,
            shininess        : 10,
            color            : [255, 255, 255],
            attenuatuion     : [1, 0, 0]
        });
    }

}