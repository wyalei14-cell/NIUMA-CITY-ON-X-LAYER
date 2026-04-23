const fs = require('fs');
const path = require('path');

const storePath = path.join(__dirname, '../apps/node/src/store.ts');
let storeContent = fs.readFileSync(storePath, 'utf8');

// Remove the old seed citizen event (the one with 0x0000...0001 address)
const oldEvent = `  {
    id: "seed-citizen-1",
    source: "chain",
    type: "CitizenRegistered",
    blockNumber: 1,
    logIndex: 0,
    payload: { citizenId: 1, owner: "0x0000000000000000000000000000000000000001", metadataURI: "ipfs://founder" }
  },`;

storeContent = storeContent.replace(oldEvent, '');
fs.writeFileSync(storePath, storeContent, 'utf8');
console.log('✅ Removed duplicate citizen event. Only the real Citizen #1 remains.');
console.log('   Address: 0x36f0a9E2b10e2DEaeb08fB702e4B84c3f9F5834a');
