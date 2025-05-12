#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('=== BUILD DIAGNOSTICS ===');
console.log('Node version:', process.version);
console.log('Working directory:', process.cwd());
console.log('Script location:', __dirname);
console.log('Root directory:', rootDir);

try {
  // Check if package.json exists
  const pkgPath = path.join(rootDir, 'package.json');
  console.log('Looking for package.json at:', pkgPath);
  
  if (fs.existsSync(pkgPath)) {
    console.log('✅ package.json found');
    // Read package.json for diagnostics
    const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    console.log('Package name:', pkgJson.name);
    console.log('Package version:', pkgJson.version);
    
    // Check for terser
    const hasTerser = (
      (pkgJson.dependencies && pkgJson.dependencies.terser) || 
      (pkgJson.devDependencies && pkgJson.devDependencies.terser)
    );
    
    if (hasTerser) {
      console.log('✅ Terser is in package.json');
      console.log('Terser version:', pkgJson.devDependencies?.terser || pkgJson.dependencies?.terser);
    } else {
      console.log('⚠️ Terser not found in package.json, installing...');
      execSync('npm install --save-dev terser@5.28.1', { stdio: 'inherit' });
      console.log('✅ Terser installed');
    }
  } else {
    console.error('❌ package.json not found at', pkgPath);
    throw new Error('package.json not found');
  }
  
  // Check if node_modules exists
  const nodeModulesPath = path.join(rootDir, 'node_modules');
  console.log('Looking for node_modules at:', nodeModulesPath);
  
  if (fs.existsSync(nodeModulesPath)) {
    console.log('✅ node_modules directory found');
    
    // Check for terser in node_modules
    const terserPath = path.join(nodeModulesPath, 'terser');
    if (fs.existsSync(terserPath)) {
      console.log('✅ Terser found in node_modules');
    } else {
      console.log('⚠️ Terser not found in node_modules, installing explicitly...');
      execSync('npm install --save-dev terser@5.28.1', { stdio: 'inherit' });
      console.log('✅ Terser installed');
    }
  } else {
    console.warn('⚠️ node_modules not found, running npm install...');
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed');
  }
  
  // Check for vite.config.ts
  const viteConfigPath = path.join(rootDir, 'vite.config.ts');
  console.log('Looking for vite.config.ts at:', viteConfigPath);
  
  if (fs.existsSync(viteConfigPath)) {
    console.log('✅ vite.config.ts found');
  } else {
    console.error('❌ vite.config.ts not found');
    throw new Error('vite.config.ts not found');
  }
  
  // Run vite build with detailed error output
  console.log('\n=== STARTING VITE BUILD ===');
  try {
    // Run with full output and error capture
    execSync('npx vite build --debug', { 
      stdio: 'inherit',
      env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=4096' }
    });
    console.log('✅ Build completed successfully');
  } catch (buildError) {
    console.error('❌ Build failed with error:');
    console.error(buildError);
    
    // Check output directory
    const distPath = path.join(rootDir, 'dist');
    if (fs.existsSync(distPath)) {
      console.log('dist directory exists but build failed');
      console.log('Contents of dist directory:');
      console.log(fs.readdirSync(distPath));
    } else {
      console.log('dist directory was not created');
    }
    
    // Try with basic configuration as fallback
    console.log('\n=== ATTEMPTING FALLBACK BUILD ===');
    console.log('Creating simple vite.config.js to bypass potential configuration issues...');
    
    const fallbackConfig = `
      import { defineConfig } from 'vite';
      import react from '@vitejs/plugin-react';
      
      export default defineConfig({
        plugins: [react()],
        build: {
          minify: false,
          sourcemap: false
        }
      });
    `;
    
    const fallbackConfigPath = path.join(rootDir, 'vite.config.simple.js');
    fs.writeFileSync(fallbackConfigPath, fallbackConfig);
    
    try {
      console.log('Running fallback build...');
      execSync('npx vite build --config vite.config.simple.js', { 
        stdio: 'inherit',
        env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=4096' }
      });
      console.log('✅ Fallback build completed');
    } catch (fallbackError) {
      console.error('❌ Fallback build also failed:');
      console.error(fallbackError);
      process.exit(1);
    }
  }
} catch (error) {
  console.error('❌ Script error:');
  console.error(error);
  process.exit(1);
} 