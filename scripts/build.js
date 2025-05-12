#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Path to package.json
const pkgPath = path.join(rootDir, 'package.json');

// Check if terser is installed
try {
  // Try to read package.json
  const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  
  // Check if terser is in dependencies or devDependencies
  const hasTerser = (
    (pkgJson.dependencies && pkgJson.dependencies.terser) || 
    (pkgJson.devDependencies && pkgJson.devDependencies.terser)
  );
  
  if (!hasTerser) {
    console.log('Installing terser...');
    execSync('npm install --save-dev terser@5.28.1', { stdio: 'inherit' });
  } else {
    console.log('Terser is already installed');
  }
} catch (err) {
  console.error('Error reading package.json or installing terser:', err);
  console.log('Installing terser anyway...');
  execSync('npm install --save-dev terser@5.28.1', { stdio: 'inherit' });
}

// Run vite build
console.log('Running vite build...');
execSync('npx vite build', { stdio: 'inherit' }); 