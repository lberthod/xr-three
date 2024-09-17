<template>
    <div>
      <!-- Render CoinComponent for each coin -->
      <CoinComponent
        v-for="(coin, key) in coins"
        :key="key"
        :x="coin.x"
        :y="coin.y"
      />
    </div>
  </template>
  
  <script>
  import { ref , reactive, onMounted } from 'vue';
  import { getKeyString, getRandomSafeSpot, randomFromArray } from '../../gameHelpers';
  import CoinComponent from './CoinComponent.vue';
  import { ref as  dbRef, set, onChildAdded, onChildRemoved } from 'firebase/database'; // Firebase functions
  import { database } from '../../firebase'; // Import your Firebase setup
  
  export default {
    components: {
      CoinComponent,
    },
    setup() {
      // Reactive object to store coins
      const coins = reactive({});
  
      const initCoinListeners = () => {
        const coinsRef = dbRef(database, 'coins');
  
        // Adding coins dynamically from Firebase
        onChildAdded(coinsRef, (snapshot) => {
          const coin = snapshot.val();
          const key = getKeyString(coin.x, coin.y);
          coins[key] = coin; // Add the coin to the reactive coins object
        });
  
        // Removing coins dynamically from Firebase
        onChildRemoved(coinsRef, (snapshot) => {
          const { x, y } = snapshot.val();
          const key = getKeyString(x, y);
          delete coins[key]; // Remove the coin from the reactive coins object
        });
  
        // Start placing coins
        placeCoin();
      };
  
      const placeCoin = () => {
        const { x, y } = getRandomSafeSpot();
        const coinRef = dbRef(database, `coins/${getKeyString(x, y)}`);
        set(coinRef, { x, y });
  
        // Set a random timeout to place the next coin
        const coinTimeouts = [2000, 3000, 4000, 5000];
        setTimeout(() => {
          placeCoin();
        }, randomFromArray(coinTimeouts));
      };
  
      // Vue lifecycle hook to initialize coin listeners after the component is mounted
      onMounted(() => {
        initCoinListeners();
      });
  
      return {
        coins, // Expose the reactive coins object to the template
      };
    },
  };
  </script>
  
  <style scoped>
  /* Add any specific styles for CoinManagement */
  </style>
  