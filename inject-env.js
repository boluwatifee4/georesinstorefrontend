#!/usr/bin/env node

/**
 * This script replaces environment variables in the built files
 * Run this after `ng build` to inject environment variables
 */

const fs = require("fs");
const path = require("path");

// Environment variables to replace
const envVars = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || "",
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || "",
};

// Path to the dist directory
const distPath = path.join(__dirname, "dist", "grs-frontend");

function replaceInFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  let content = fs.readFileSync(filePath, "utf8");
  let modified = false;

  // Replace environment variables
  Object.entries(envVars).forEach(([key, value]) => {
    const placeholder = `process?.env?.['${key}']`;
    const replacement = `'${value}'`;

    if (content.includes(placeholder)) {
      content = content.replace(
        new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
        replacement
      );
      modified = true;
      // console.log(`Replaced ${key} in ${path.basename(filePath)}`);
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content);
  }
}

function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    // console.log("Dist directory not found. Please run `ng build` first.");
    return;
  }

  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith(".js")) {
      replaceInFile(filePath);
    }
  });
}

// console.log("Injecting environment variables into built files...");
processDirectory(distPath);
// console.log("Environment variable injection complete!");
