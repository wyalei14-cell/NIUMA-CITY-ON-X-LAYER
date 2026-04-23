// This script manually adds Citizen #1 to the reducer
const fs = require('fs');
const path = require('path');

// Read the store.ts file
const storePath = path.join(__dirname, '../apps/node/src/store.ts');
let storeContent = fs.readFileSync(storePath, 'utf8');

// Check if our event already exists
if (storeContent.includes('0x36f0a9E2b10e2DEaeb08fB702e4B84c3f9F5834a')) {
  console.log('✅ Citizen #1 event already exists in store.ts');
  process.exit(0);
}

// Find the seedEvents array and add our event after it
const citizenEvent = `  {
    id: "citizen-1-actual",
    source: "chain",
    type: "CitizenRegistered",
    blockNumber: 28438057,
    logIndex: 0,
    payload: { citizenId: 1, owner: "0x36f0a9E2b10e2DEaeb08fB702e4B84c3f9F5834a", metadataURI: "ipfs://agent/0x36f0a9e2b10e2deaeb08fb702e4b84c3f9f5834a" }
  },`;

// Insert after seedEvents declaration (before the closing bracket)
const insertAfter = 'const seedEvents: WorldEvent[] = [';
const insertPoint = storeContent.indexOf(insertAfter) + insertAfter.length;
const beforeInsert = storeContent.substring(0, insertPoint);
const afterInsert = storeContent.substring(insertPoint);

const newContent = beforeInsert + '\n' + citizenEvent + afterInsert;

fs.writeFileSync(storePath, newContent, 'utf8');
console.log('✅ Added Citizen #1 event to store.ts');
console.log('🔄 Restart the node to apply changes: npm run dev:node');
