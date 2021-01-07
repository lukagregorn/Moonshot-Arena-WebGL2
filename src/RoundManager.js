export default class RoundManager {

    constructor(player, prefabs, spawnpoints, playerDiedCallbackFunc) {
        this.player = player;
        this.prefabs = prefabs;
        this.spawnpoints = spawnpoints;
        this.enemies = [];

        this.playerDied = playerDiedCallbackFunc;

        // general info
        this.roundInProgress = false;
        this.roundStartCooldown = 3;
        this.playing = false; // is player playing or in title screen

        // round info
        this.currentRound = 0;
        this.maxEnemies = 8;  // how many enemies can be in arena at once
        this.enemiesToKill = 0; // enemies left to kill to finish this round

        // ui elements
        this.roundNumberUI = document.createTextNode("");
        this.enemiesLeftUI = document.createTextNode("");

        const roundElement = document.querySelector("#round-number");
        const enemiesElement = document.querySelector("#enemies-left");

        roundElement.appendChild(this.roundNumberUI);
        enemiesElement.appendChild(this.enemiesLeftUI);

        this.updateUI();
    }

    updateUI() {
        this.enemiesLeftUI.nodeValue = "ENEMIES: " + this.enemiesToKill;
        this.roundNumberUI.nodeValue = "ROUND: " + this.currentRound;
    }

    setPlaying(playing) {
        this.playing = playing;
    }

    restart() {
        this.playing = false;
        this.roundInProgress = false;
        this.currentRound = 0;
        this.enemiesToKill = 0;

        for (const enemy of this.enemies) {
            if (enemy) {
                enemy.destroy();
            }
        }

        this.enemies = null;
        this.enemies = [];

        this.updateUI();

        this.player.respawn();
        this.playerDied();
    }

    calculateEnemiesToKill() {
        return 3 + (this.currentRound-1) * 2;
    }

    getSpawnpoint() {
        return this.spawnpoints.children[Math.floor(Math.random() * this.spawnpoints.children.length)];
    }

    spawnEnemy() {
        const enemyClone = this.prefabs.enemy.clone();
        const spawnpoint = this.getSpawnpoint()
        enemyClone.init(this.player, this.prefabs, spawnpoint.translation, this);

        this.enemies.push(enemyClone);
        console.log(this.enemies);
    }

    enemyDied(enemy) {
        const index = this.enemies.indexOf(enemy);
        if (index >= 0) {
            this.enemies.splice(index, 1);
        }

        enemy.destroy();

        // round update
        this.enemiesToKill -= 1;
        this.updateUI();

        if (this.enemiesToKill <= 0) {
            this.roundFinished();
        }
    }

    roundFinished() {
        this.roundInProgress = false;
        this.roundNumberUI.nodeValue = "ROUND FINISHED";
        this.enemiesLeftUI.nodeValue = "LIFE RESTORED";

        this.player.heal();
    }

    startRound() {
        this.enemiesToKill = this.calculateEnemiesToKill();
        this.roundInProgress = true;
        this.updateUI();
    }

    update(dt) {
        if (!this.roundInProgress) {
            this.roundStartCooldown -= dt;
            this.roundNumberUI.nodeValue = "STARTING ROUND " + (this.currentRound + 1);
            if (this.roundStartCooldown <= 0) {
                this.currentRound += 1;
                this.roundStartCooldown = 3;
                this.startRound();
            }
        } else {
            let amount = this.enemies.length;
            if (amount < this.maxEnemies && this.enemiesToKill > amount) {
                this.spawnEnemy();
            }

        }

        if (this.player.dead && this.playing) {
            this.restart();
            return;
        }

        // update stuff
        if (this.player) {
            this.player.update(dt);
        }


        if (this.enemies) {
            for (const enemy of this.enemies) {
                if (enemy) {
                    enemy.update(dt);
                }
            }
        }
    }

}
