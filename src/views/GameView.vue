<template>
    <div class="game-container">
        <div class="player-info">
            <div>
                <label for="player-name">Your Name</label>
                <input v-model="playerName" @change="updatePlayerName" maxlength="10" type="text" />
            </div>
            <div>
                <button @click="changePlayerColor">Change Color</button>
            </div>
        </div>
        <div ref="gameArea" class="game-area"></div>
    </div>
</template>

<script>
import { ref as dbRef, set, remove, onValue, onChildAdded, onChildRemoved, onDisconnect } from 'firebase/database';
import { auth, database } from '../firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import KeyPressListener from '../KeyPressListener';
import { playerColors, createName, getRandomSafeSpot, getKeyString, isSolid } from '../gameHelpers';


function randomFromArray(array) {
    return array[Math.floor(Math.random() * array.length)];
}

export default {
    data() {
        return {
            playerId: null,
            playerName: '',
            players: {},
            coins: {},
            playerElements: {},
            coinElements: {},
        };
    },
    methods: {
        sendDataToFirebase(id, couleur, indice) {
    const infoRef = dbRef(database, `info/${id}`);  // Unique id path in the 'info/' node
    set(infoRef, {
        couleur: couleur,
        indice: indice,
    }).then(() => {
        console.log(`Data sent to info/ path: {id: "${id}", couleur: "${couleur}", indice: "${indice}"}`);
    }).catch((error) => {
        console.error('Error writing to info/ path:', error);
    });
},

        async initGame() {
            try {
                await signInAnonymously(auth);

                onAuthStateChanged(auth, (user) => {
                    if (user) {
                        this.playerId = user.uid;
                        this.playerName = createName();

                        const { x, y } = getRandomSafeSpot();
                        const playerRef = dbRef(database, `players/${this.playerId}`);

                        set(playerRef, {
                            id: this.playerId,
                            name: this.playerName,
                            color: this.randomColor(),
                            x,
                            y,
                            coins: 0,
                        });

                        onDisconnect(playerRef).remove();
                        this.initListeners();
                    }
                });
            } catch (error) {
                console.error('Error during Firebase authentication:', error);
            }
        },
        initListeners() {

        


            new KeyPressListener("ArrowUp", () => this.movePlayer(0, -1));
            new KeyPressListener("ArrowDown", () => this.movePlayer(0, 1));
            new KeyPressListener("ArrowLeft", () => this.movePlayer(-1, 0));
            new KeyPressListener("ArrowRight", () => this.movePlayer(1, 0));

            const playersRef = dbRef(database, 'players');
            const coinsRef = dbRef(database, 'coins');

            // Firebase listeners for player changes
            onValue(playersRef, (snapshot) => {
                this.players = snapshot.val() || {};
                this.updatePlayerElements();
            });

            onChildAdded(playersRef, (snapshot) => {
                const addedPlayer = snapshot.val();
                this.addPlayerElement(addedPlayer);
            });

            onChildRemoved(playersRef, (snapshot) => {
                const removedKey = snapshot.val().id;
                this.removePlayerElement(removedKey);
            });

            // Firebase listeners for coin changes
            onValue(coinsRef, (snapshot) => {
                this.coins = snapshot.val() || {};
            });

            onChildAdded(coinsRef, (snapshot) => {
                const coin = snapshot.val();
                this.addCoinElement(coin);
            });

            onChildRemoved(coinsRef, (snapshot) => {
                const { x, y } = snapshot.val();
                this.removeCoinElement(x, y);
            });

            this.placeCoin();
        },
        movePlayer(xChange, yChange) {
    const player = this.players[this.playerId];
    const newX = player.x + xChange;
    const newY = player.y + yChange;

    if (!isSolid(newX, newY)) {
        const playerRef = dbRef(database, `players/${this.playerId}`);
        set(playerRef, {
            ...player,
            x: newX,
            y: newY,
        });

        // Log the current tile coordinates (case) in real time
        console.log(`Player is now in case: (${newX}, ${newY})`);

        // Check for specific coordinates and send data to Firebase with a unique id
        if (newX === 4 && newY === 4) {
            this.sendDataToFirebase('id_4_4', 'bleu', 'Je suis le ciel et l ocean sont en trois');
        } else if (newX === 6 && newY === 6) {
            this.sendDataToFirebase('id_6_6', 'vert', 'La nature et les feuilles est la deuxieme');
        } else if (newX === 8 && newY === 8) {
            this.sendDataToFirebase('id_8_8', 'jaune', 'Le soleil est en premier');
        } else if (newX === 10 && newY === 10) {
            this.sendDataToFirebase('id_10_10', 'rouge', 'Le sang est en dernier');
        }

        this.checkForCoin(newX, newY);
    }
},



        updatePlayerElements() {
            Object.keys(this.players).forEach((key) => {
                const player = this.players[key];
                let el = this.playerElements[key];

                if (!el) {
                    el = this.createPlayerElement(key, player);
                    this.$refs.gameArea.appendChild(el);
                    this.playerElements[key] = el;
                }

                // Update player DOM elements
                el.querySelector('.Character_name').innerText = player.name;
                el.querySelector('.Character_coins').innerText = player.coins;
                el.setAttribute('data-color', player.color);
                el.setAttribute('data-direction', player.direction);

                const left = 16 * player.x + 'px';
                const top = 16 * player.y - 4 + 'px';
                el.style.transform = `translate3d(${left}, ${top}, 0)`;
            });
        },
        addPlayerElement(player) {
            const characterElement = document.createElement('div');
            characterElement.classList.add('Character', 'grid-cell');
            if (player.id === this.playerId) {
                characterElement.classList.add('you');
            }
            characterElement.innerHTML = `
          <div class="Character_shadow grid-cell"></div>
          <div class="Character_sprite grid-cell"></div>
          <div class="Character_name-container">
            <span class="Character_name"></span>
            <span class="Character_coins">0</span>
          </div>
          <div class="Character_you-arrow"></div>
        `;
            this.playerElements[player.id] = characterElement;

            // Set initial DOM state
            characterElement.querySelector('.Character_name').innerText = player.name;
            characterElement.querySelector('.Character_coins').innerText = player.coins;
            characterElement.setAttribute('data-color', player.color);
            characterElement.setAttribute('data-direction', player.direction);
            const left = 16 * player.x + 'px';
            const top = 16 * player.y - 4 + 'px';
            characterElement.style.transform = `translate3d(${left}, ${top}, 0)`;
            this.$refs.gameArea.appendChild(characterElement);
        },
        removePlayerElement(removedKey) {
            this.$refs.gameArea.removeChild(this.playerElements[removedKey]);
            delete this.playerElements[removedKey];
        },
        checkForCoin(x, y) {
            const key = getKeyString(x, y);
            if (this.coins[key]) {
                remove(dbRef(database, `coins/${key}`));
                const playerRef = dbRef(database, `players/${this.playerId}`);
                set(playerRef, {
                    ...this.players[this.playerId],
                    coins: this.players[this.playerId].coins + 1,
                });
            }
        },

        placeCoin() {
            const { x, y } = getRandomSafeSpot();
            const coinRef = dbRef(database, `coins/${getKeyString(x, y)}`);
            set(coinRef, { x, y });

            const coinTimeouts = [2000, 3000, 4000, 5000];
            setTimeout(() => {
                this.placeCoin();
            }, randomFromArray(coinTimeouts));
        },
        addCoinElement(coin) {
            const key = getKeyString(coin.x, coin.y);
            this.coins[key] = true;

            const coinElement = document.createElement('div');
            coinElement.classList.add('Coin', 'grid-cell');
            coinElement.innerHTML = `
          <div class="Coin_shadow grid-cell"></div>
          <div class="Coin_sprite grid-cell"></div>
        `;

            const left = 16 * coin.x + 'px';
            const top = 16 * coin.y - 4 + 'px';
            coinElement.style.transform = `translate3d(${left}, ${top}, 0)`;

            this.coinElements[key] = coinElement;
            this.$refs.gameArea.appendChild(coinElement);
        },
        removeCoinElement(x, y) {
            const key = getKeyString(x, y);
            this.$refs.gameArea.removeChild(this.coinElements[key]);
            delete this.coinElements[key];
        },
        updatePlayerName() {
            const playerRef = dbRef(database, `players/${this.playerId}`);
            set(playerRef, {
                ...this.players[this.playerId],
                name: this.playerName,
            });
        },
        changePlayerColor() {
            const currentColorIndex = playerColors.indexOf(this.players[this.playerId].color);
            const nextColor = playerColors[(currentColorIndex + 1) % playerColors.length];
            const playerRef = dbRef(database, `players/${this.playerId}`);
            set(playerRef, {
                ...this.players[this.playerId],
                color: nextColor,
            });
        },
        randomColor() {
            return playerColors[Math.floor(Math.random() * playerColors.length)];
        },
    },
    mounted() {
        this.initGame();
    },
};
</script>



<style scoped>
.game-container {
    margin-left: 400px;
    margin-top: 200px;
    position: relative;
    width: 240px;
    height: 208px;
    background: url('../assets/images/map.png') no-repeat no-repeat;
    transform: scale(3);
    image-rendering: pixelated;
}

.player-info {
    position: absolute;
    top: 0;
    left: 0;
    padding: 1em;
    display: flex;
    gap: 0.5em;
    align-items: flex-end;
}

label {
    display: block;
    font-weight: bold;
}

input[type="text"],
button {
    font-family: inherit;
    font-weight: bold;
    font-size: 10px;
    height: 12px;
    border-radius: 4px;
    outline: 0;
}

input[type="text"] {
    outline: 0;
    padding-left: 0.5em;
    border: 3px solid #222034;
    width: 50px;
    text-transform: uppercase;
}

input[type="text"]:focus {
    border-color: #f000ff;
}

button {
    padding-left: 0.5em;
    padding-right: 0.5em;
    background: #59ff5a;
    border: 0;
    border-bottom: 2px solid #1e830b;
    cursor: pointer;
}

button:active {
    position: relative;
    top: 1px;
}

/* Characters */
.grid-cell {
    position: absolute;
    width: 16px;
    height: 16px;
    background-color: white;
}

.Character {
    transition: transform 0.4s;
}

.Character.you {
    z-index: 1;
}

.Character.you .Character_you-arrow {
    display: block;
}

.Character_you-arrow {
    display: none;
    position: absolute;
    top: -18px;
    left: 5px;
    width: 7px;
    height: 5px;
    background: url('../assets/images/arrow.png') no-repeat no-repeat;
}

/* Make the character a white cube */
.Character_sprite {
    overflow: hidden;
    top: -3px;
    width: 10px;
    background: url('../assets/images/characters.png');
}

.Character[data-direction="right"] .Character_sprite {
    background-position-x: 16px;
}

.Character[data-color="red"] .Character_sprite {
    background-position-y: -16px;
}

.Character[data-color="orange"] .Character_sprite {
    background-position-y: -32px;
}

.Character[data-color="yellow"] .Character_sprite {
    background-position-y: -48px;
}

.Character[data-color="green"] .Character_sprite {
    background-position-y: -64px;
}

.Character[data-color="purple"] .Character_sprite {
    background-position-y: -80px;
}

.Character_shadow {
    background: url('../assets/images/shadow.png') no-repeat no-repeat;
}

.Character_name-container {
    position: absolute;
    top: -12px;
    left: -5px;
    font-size: 5px;
    padding: 1px 2px 1px;
    border-radius: 3px;
    background: #333;
    color: white;
    font-weight: bold;
    text-transform: uppercase;
    white-space: nowrap;
}

.Character_coins {
    margin-left: 1px;
    color: gold;
}

/* Coins */
.Coin_sprite {
    background: url('../assets/images/coin.png') no-repeat no-repeat;
    animation: coinFloat 0.8s linear infinite alternate-reverse;
}

@keyframes coinFloat {
    from {
        transform: translateY(0);
    }

    to {
        transform: translateY(5px);
    }
}

.Coin_shadow {
    background: url('../assets/images/coin-shadow.png') no-repeat no-repeat;
}
</style>