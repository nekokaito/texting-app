const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.resolve(__dirname, "..");

const foldersToRemove = [
  "node_modules",
  ".expo",
  ".expo-shared",
  "dist",
  "build",
  "android/.gradle",
  "android/app/build",
  "android/build",
  "ios/build",
];

function removeFolder(folder) {
  const target = path.join(root, folder);

  if (fs.existsSync(target)) {
    console.log(`Removing: ${folder}`);
    fs.rmSync(target, {
      recursive: true,
      force: true,
    });
  } else {
    console.log(`Skipping: ${folder} (not found)`);
  }
}

function run(command) {
  console.log(`\n> ${command}\n`);

  try {
    execSync(command, {
      cwd: root,
      stdio: "inherit",
      shell: true,
    });
  } catch (error) {
    console.error(`Command failed: ${command}`);
    process.exit(1);
  }
}

console.log("\n====================================");
console.log("   TEXTING PROJECT RESET");
console.log("====================================\n");

// 1. Remove dependencies and caches
foldersToRemove.forEach(removeFolder);

// 2. Remove package-lock if you want a completely fresh install
// Uncomment if needed:
// removeFolder("package-lock.json");

// 3. Reinstall dependencies
run("npm install");

// 4. Clear Expo / Metro cache
run("npx expo start --clear");
