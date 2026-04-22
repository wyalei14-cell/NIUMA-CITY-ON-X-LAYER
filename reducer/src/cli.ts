import fs from "node:fs";
import path from "node:path";
import { buildManifest, reduceEvents, WorldEvent } from "./index.js";

const [eventsPath = "world/events.json", outputPath = "world/generated/manifest.json"] = process.argv.slice(2);
const events = JSON.parse(fs.readFileSync(eventsPath, "utf8")) as WorldEvent[];
const state = reduceEvents(events);
const manifest = buildManifest({
  version: Number(process.env.WORLD_VERSION || 1),
  constitutionHash: process.env.CONSTITUTION_HASH || "sha256:dev-constitution",
  generatedAt: Number(process.env.GENERATED_AT || Math.floor(Date.now() / 1000)),
  state,
  githubRepo: process.env.GITHUB_REPO || "local/niuma-city-xlayer",
  githubCommit: process.env.GITHUB_COMMIT || "local"
});

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, stateRoot: manifest.stateRoot, version: manifest.version }, null, 2));
