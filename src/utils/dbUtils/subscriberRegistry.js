// utils/subscriberRegistry.js
const fs = require("fs");
const path = require("path");

function loadSubscribers() {
  const dir = path.join(__dirname, "../../subscribers");
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".js"));

  const subscribers = [];
  for (const file of files) {
    const mod = require(path.join(dir, file));
    const cls = typeof mod === "function" ? mod : Object.values(mod)[0];
    if (cls) {
      subscribers.push(new cls());
    }
  }
  return subscribers;
}

module.exports = { loadSubscribers };
