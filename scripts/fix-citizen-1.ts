import { addEvent } from "../apps/node/src/store.js";

const citizenEvent = {
  id: "chain-citizen-1-manual",
  source: "chain" as const,
  type: "CitizenRegistered" as const,
  blockNumber: 28438057,
  logIndex: 0,
  payload: {
    citizenId: 1,
    owner: "0x36f0a9E2b10e2DEaeb08fB702e4B84c3f9F5834a",
    metadataURI: "ipfs://agent/0x36f0a9e2b10e2deaeb08fb702e4b84c3f9f5834a"
  }
};

console.log("Adding Citizen #1 event to reducer...");
addEvent(citizenEvent);
console.log("✅ Event added. Citizen #1 should now be visible in /api/citizens");
console.log("   Address: 0x36f0a9E2b10e2DEaeb08fB702e4B84c3f9F5834a");
console.log("   Metadata: ipfs://agent/0x36f0a9e2b10e2deaeb08fb702e4b84c3f9f5834a");
