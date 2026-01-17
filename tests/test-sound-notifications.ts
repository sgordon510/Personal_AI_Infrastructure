#!/usr/bin/env bun
/**
 * Sound Notification System Tests
 *
 * Tests the PAI notification infrastructure:
 * - Voice server API endpoint
 * - Notification routing logic
 * - Configuration loading
 *
 * Run with: bun run tests/test-sound-notifications.ts
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// Test results tracking
const results: { name: string; passed: boolean; message: string }[] = [];

function test(name: string, fn: () => boolean | Promise<boolean>, message: string = '') {
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result.then(passed => {
        results.push({ name, passed, message: passed ? 'OK' : message || 'Failed' });
        return passed;
      }).catch(err => {
        results.push({ name, passed: false, message: err.message });
        return false;
      });
    }
    results.push({ name, passed: result, message: result ? 'OK' : message || 'Failed' });
    return result;
  } catch (err: any) {
    results.push({ name, passed: false, message: err.message });
    return false;
  }
}

async function testAsync(name: string, fn: () => Promise<boolean>, message: string = '') {
  try {
    const passed = await fn();
    results.push({ name, passed, message: passed ? 'OK' : message || 'Failed' });
    return passed;
  } catch (err: any) {
    results.push({ name, passed: false, message: err.message });
    return false;
  }
}

// ============================================================================
// Tests
// ============================================================================

console.log('=== PAI Sound Notification Tests ===\n');

// Test 1: VoiceServer directory exists
test('VoiceServer installed', () => {
  const voiceServerPath = join(homedir(), '.claude', 'VoiceServer');
  return existsSync(voiceServerPath);
}, 'VoiceServer not found at ~/.claude/VoiceServer');

// Test 2: server.ts exists
test('server.ts exists', () => {
  const serverPath = join(homedir(), '.claude', 'VoiceServer', 'server.ts');
  return existsSync(serverPath);
}, 'server.ts not found');

// Test 3: voices.json exists
test('voices.json exists', () => {
  const voicesPath = join(homedir(), '.claude', 'VoiceServer', 'voices.json');
  return existsSync(voicesPath);
}, 'voices.json not found');

// Test 4: voices.json is valid JSON
test('voices.json valid', () => {
  const voicesPath = join(homedir(), '.claude', 'VoiceServer', 'voices.json');
  if (!existsSync(voicesPath)) return false;
  try {
    const content = readFileSync(voicesPath, 'utf-8');
    const parsed = JSON.parse(content);
    return typeof parsed === 'object' && Object.keys(parsed).length > 0;
  } catch {
    return false;
  }
}, 'voices.json is not valid JSON');

// Test 5: Voice server health endpoint
await testAsync('Voice server health', async () => {
  try {
    const response = await fetch('http://localhost:8888/health');
    if (!response.ok) return false;
    const data = await response.json();
    return data.status === 'healthy' && data.port === 8888;
  } catch {
    return false;
  }
}, 'Voice server not responding on port 8888');

// Test 6: Voice server notify endpoint accepts requests
await testAsync('Notify endpoint responds', async () => {
  try {
    const response = await fetch('http://localhost:8888/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Test notification', voice_enabled: false })
    });
    const data = await response.json();
    return data.status === 'success';
  } catch {
    return false;
  }
}, 'Notify endpoint failed');

// Test 7: Settings.json exists and is valid
test('Settings.json valid', () => {
  const settingsPath = join(homedir(), '.claude', 'settings.json');
  if (!existsSync(settingsPath)) return false;
  try {
    const content = readFileSync(settingsPath, 'utf-8');
    JSON.parse(content);
    return true;
  } catch {
    return false;
  }
}, 'settings.json missing or invalid JSON');

// Test 8: Notification library exists
test('Notification library exists', () => {
  const libPath = join(process.cwd(), 'Packs', 'pai-hook-system', 'src', 'hooks', 'lib', 'notifications.ts');
  return existsSync(libPath);
}, 'notifications.ts library not found');

// Test 9: Voice handler exists
test('Voice handler exists', () => {
  const handlerPath = join(process.cwd(), 'Packs', 'pai-hook-system', 'src', 'hooks', 'handlers', 'voice.ts');
  return existsSync(handlerPath);
}, 'voice.ts handler not found');

// Test 10: Voice presets exist
test('Voice presets exist', () => {
  const presetsPath = join(process.cwd(), 'Packs', 'pai-prompting-skill', 'src', 'skills', 'Prompting', 'Templates', 'Data', 'VoicePresets.yaml');
  return existsSync(presetsPath);
}, 'VoicePresets.yaml not found');

// ============================================================================
// Results
// ============================================================================

console.log('\n=== Results ===\n');

let passed = 0;
let failed = 0;

for (const result of results) {
  const status = result.passed ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
  console.log(`${status} ${result.name}`);
  if (!result.passed && result.message !== 'Failed') {
    console.log(`     ${result.message}`);
  }
  if (result.passed) passed++;
  else failed++;
}

console.log(`\n=== Summary: ${passed}/${results.length} passed ===\n`);

// Exit with error code if any tests failed
process.exit(failed > 0 ? 1 : 0);
