export const playerColors = ["blue", "red", "orange", "yellow", "green", "purple"];

export function createName() {
  const prefix = randomFromArray(["1", "", "", ""]);
  const animal = randomFromArray(["", "", "", ""]);
  return `${prefix} ${animal}`;
}

export function randomFromArray(array) {
  return array[Math.floor(Math.random() * array.length)];
}

export function getKeyString(x, y) {
  return `${x}x${y}`;
}

export function getRandomSafeSpot() {
  return randomFromArray([
    { x: 1, y: 4 },
    { x: 2, y: 6 },
    { x: 7, y: 7 }
  ]);
}

export function isSolid(x, y) {
  const mapData = {
    minX: 1,
    maxX: 14,
    minY: 4,
    maxY: 12,
    blockedSpaces: {
      "7x4": true,
      "1x11": true,
      // more blocked spaces
    },
  };
  return mapData.blockedSpaces[`${x}x${y}`] || x < mapData.minX || x > mapData.maxX || y < mapData.minY || y > mapData.maxY;
}
