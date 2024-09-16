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
      <div ref="gameArea" class="game-area">
        <PlayerComponent 
          v-for="(player, id) in players" 
          :key="id" 
          :player="player" 
          :isYou="playerId === id" 
        />
      </div>
  
      <!-- Intégration de OverlayText -->
      <OverlayText v-if="showOverlay" :message="dialogueMessage" @close="showOverlay = false" />
    </div>
  </template>
  
  <script>
  import { ref as dbRef, set, remove, onValue, onChildAdded, onChildRemoved, onDisconnect } from 'firebase/database';
  import { auth, database } from '../firebase';
  import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
  import KeyPressListener from '../KeyPressListener';
  import { playerColors, createName, getRandomSafeSpot, getKeyString, isSolid, randomFromArray } from '../gameHelpers'; 
  import PlayerComponent from './PlayerComponent.vue';
  import OverlayText from './OverlayText.vue'; // Importer OverlayText
  
  export default {
    components: {
      PlayerComponent,
      OverlayText // Déclaration du composant
    },
    data() {
      return {
        playerId: null,
        playerName: '',
        players: {},
        coins: {},
        playerElements: {},
        coinElements: {},
        showOverlay: false,  // Contrôle de la visibilité de l'overlay
        dialogueMessage: 'fdsfsdfdfdsfdfd',  // Message de dialogue à afficher
      };
    },
    methods: {
      sendDataToFirebase(id, couleur, indice) {
        const infoRef = dbRef(database, `info/${id}`);
        set(infoRef, {
          couleur: couleur,
          indice: indice,
        }).then(() => {
          console.log(`Data sent to info/ path: {id: "${id}", couleur: "${couleur}", indice: "${indice}"}`);
        }).catch((error) => {
          console.error('Error writing to info/ path:', error);
        });
      },
  
      // Exemple pour afficher un dialogue
      triggerDialogue(message) {
        this.dialogueMessage = message;
        this.showOverlay = true;
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
  
          // Affichage du dialogue lorsque la pièce est trouvée
          this.triggerDialogue('You found a coin!');
        }
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
  
        onValue(playersRef, (snapshot) => {
          this.players = snapshot.val() || {};
        });
  
        onChildAdded(playersRef, (snapshot) => {
          const addedPlayer = snapshot.val();
          this.players = { ...this.players, [addedPlayer.id]: addedPlayer };
        });
  
        onChildRemoved(playersRef, (snapshot) => {
          const removedPlayerId = snapshot.val().id;
          const { [removedPlayerId]: _, ...remainingPlayers } = this.players;
          this.players = remainingPlayers;
        });
  
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
  
          console.log(`Player is now in case: (${newX}, ${newY})`);
  
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

      this.$refs.gameArea.appendChild(coinElement);
    },
    removeCoinElement(x, y) {
      const key = getKeyString(x, y);
      this.$refs.gameArea.removeChild(this.coinElements[key]);
      delete this.coinElements[key];
    }
  },
  mounted() {
    this.initGame();
  }
};
</script>

<style scoped>
.game-container {
  margin-left: 400px;
  margin-top: 200px;
  position: relative;
  width: 240px;
  height: 208px;
  background: url('../assets/images/map.png') no-repeat;
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

input[type="text"],
button {
  font-family: inherit;
  font-weight: bold;
  font-size: 10px;
  height: 12px;
  border-radius: 4px;
}

input[type="text"] {
  border: 3px solid #222034;
  width: 50px;
  text-transform: uppercase;
}

button {
  background: #59ff5a;
  border-bottom: 2px solid #1e830b;
}

/* Characters */
.grid-cell {
  position: absolute;
  width: 16px;
  height: 16px;
}

.Character {
  transition: transform 0.4s;
}

.Character_you-arrow {
  display: none;
  position: absolute;
  top: -18px;
  left: 5px;
  width: 7px;
  height: 5px;
  background: url('../assets/images/arrow.png') no-repeat;
}

.Coin_sprite {
  background: url('../assets/images/coin.png') no-repeat;
}

.Coin_shadow {
  background: url('../assets/images/coin-shadow.png') no-repeat;
}
</style>
