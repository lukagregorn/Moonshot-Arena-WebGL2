import Application from './src/Application.js';
import * as WebGL from './src/WebGL.js';
import GLTFLoader from './src/GLTFLoader.js';
import Renderer from './src/Renderer.js';
import Physics from './src/Physics.js';
import Light from './src/Light.js';
import RoundManager from './src/RoundManager.js';

const mat4 = glMatrix.mat4;

class App extends Application {

    async start() {
        this.loader = new GLTFLoader();
        await this.loader.load('./assets/main_scene/main_scene.gltf');

        this.scene = await this.loader.loadScene(this.loader.defaultScene);
        this.camera = await this.loader.loadNode('Camera_Orientation');
        this.player = await this.loader.loadNode('Player');
        const head = await this.loader.loadNode('Head');
        const shootPoint = await this.loader.loadNode('ShootPoint');
        const spawnpoints = await this.loader.loadNode('Spawnpoints');

        this.prefabs = {
            bullet: await this.loader.loadNode('Bullet'),
            enemy: await this.loader.loadNode('Enemy')
        }

               
        if (!this.scene || !this.camera) {
            throw new Error('Scene or Camera not present in glTF');
        }
        
        if (!this.camera.camera) {
            throw new Error('Camera node does not contain a camera reference');
        }

        if (!this.prefabs.bullet) {
            throw new Error('Where is my bullet :/');
        }

        // give player a camera reference
        this.player.init(head, shootPoint, this.prefabs);

        // make light
        this.light = new Light();
        this.scene.addNode(this.light);

        this.renderer = new Renderer(this.gl);
        this.renderer.prepareScene(this.scene);
    
        this.physics = new Physics();
        await this.physics.init();
        this.physics.loaded = true;
        this.physics.prepareWorld(this.scene);

        this.time = Date.now();
        this.startTime = this.time;
        this.aspect = 1;

        this.pointerlockchangeHandler = this.pointerlockchangeHandler.bind(this);
        document.addEventListener('pointerlockchange', this.pointerlockchangeHandler);

        this.initUI();
        this.resize();
        
        this.playerDiedCallback = this.playerDiedCallback.bind(this);
        this.roundManager = new RoundManager(this.player, this.prefabs, spawnpoints, this.playerDiedCallback);
    }

    initUI() {
        this.gameplayUI = document.querySelector('#gameplay-overlay');
        this.titleUI = document.querySelector('#title-overlay');

        this.playButton = document.querySelector('#play');

        this.play = this.play.bind(this);
        this.playButton.addEventListener('click', this.play);

        this.gameplayUI.addEventListener('mousedown', (e) => {
            this.canvas.requestPointerLock();
        })
    }

    play() {
        console.log("this fired");
        this.titleUI.style.display = "none";
        this.gameplayUI.style.display = "block";

        this.canvas.requestPointerLock();
        this.roundManager.setPlaying(true);
    }

    playerDiedCallback() {
        document.exitPointerLock();

        this.physics.setBodyPosition(this.player.body, this.player.spawnpoint);
        this.physics.updateNodePosition(this.player);
        this.player.updateMatrix();

        this.gameplayUI.style.display = "none";
        this.titleUI.style.display = "block";
    }

    pointerlockchangeHandler() {
        if (!this.camera || !this.player) {
            return;
        }

        if (document.pointerLockElement === this.canvas) {
            this.player.enableMouseLock();
        } else {
            this.player.disableMouseLock();
        }
    }

    update() {
        const t = this.time = Date.now();
        const dt = (this.time - this.startTime) * 0.001;
        this.startTime = this.time;

        if (this.roundManager) {
            if (!this.roundManager.playing) {
                return;
            }
            this.roundManager.update(dt);
        }
        
        if (this.physics) {
            if (this.physics.loaded) {
                this.physics.update(dt);
            }
        }

        
    }

    render() {
        if (this.renderer) {
            this.renderer.render(this.scene, this.camera, this.light);
        }
    }

    resize() {
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;
        const aspectRatio = w / h;

        if (this.camera) {
            this.camera.camera.aspect = aspectRatio;
            this.camera.camera.updateMatrix();
        }
    }

}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.querySelector('canvas');
    const app = new App(canvas);
});
