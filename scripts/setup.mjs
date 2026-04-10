#!/usr/bin/env node
import { execSync } from "child_process";
import { existsSync, copyFileSync, readFileSync, writeFileSync } from "fs";
import { randomBytes } from "crypto";
import { createInterface } from "readline";
import { networkInterfaces } from "os";

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

function ask(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function detectLanIp() {
  const nets = networkInterfaces();
  for (const iface of Object.values(nets)) {
    for (const net of iface ?? []) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost";
}

console.log("");
console.log("===================================");
console.log("  Task Manager - Setup");
console.log("===================================");
console.log("");

// Check Node.js version
const nodeVersion = parseInt(process.versions.node.split(".")[0], 10);
if (nodeVersion < 18) {
  console.error(`Error: Node.js 18+ required. Current: v${process.versions.node}`);
  process.exit(1);
}
console.log(`✓ Node.js v${process.versions.node} detected`);

// Install dependencies
console.log("");
console.log("Installing dependencies...");
run("npm install");
console.log("✓ Dependencies installed");

// Create .env if not exists
console.log("");
if (!existsSync(".env")) {
  copyFileSync(".env.example", ".env");
  const secret = randomBytes(32).toString("hex");
  let env = readFileSync(".env", "utf-8");
  env = env.replace("generate-a-secret-here", secret);
  env = env.replace("a-dev-secret-change-in-production", secret);
  writeFileSync(".env", env);
  console.log("✓ Created .env with random NEXTAUTH_SECRET");
} else {
  console.log("✓ .env already exists");
}

// Detect LAN IP and configure NEXTAUTH_URL
console.log("");
let lanIp = detectLanIp();
console.log(`Detected network IP: ${lanIp}`);
const useDetected = await ask("Use this IP for network access? (Y/n) ");

if (useDetected.trim().toLowerCase() === "n") {
  lanIp = await ask("Enter the server IP address or hostname: ");
  lanIp = lanIp.trim();
}

let env = readFileSync(".env", "utf-8");
env = env.replace(/NEXTAUTH_URL=.*/, `NEXTAUTH_URL="http://${lanIp}:3000"`);
writeFileSync(".env", env);
console.log(`✓ Network URL set to http://${lanIp}:3000`);

// Generate Prisma client and set up database
console.log("");
console.log("Setting up database...");
run("npx prisma generate");
run("npx prisma db push");
console.log("✓ Database ready");

// Ask about seed data
console.log("");
const answer = await ask("Load demo data? (y/N) ");
if (answer.trim().toLowerCase() === "y") {
  run("npx prisma db seed");
  console.log("✓ Demo data loaded");
  console.log("  Login: admin@taskmanager.com / password123");
}

console.log("");
console.log("===================================");
console.log("  Setup complete!");
console.log("");
console.log("  Development:  npm run dev");
console.log("  Production:   node scripts/start.mjs");
console.log("");
console.log(`  Access URL:   http://${lanIp}:3000`);
console.log("===================================");
console.log("");
