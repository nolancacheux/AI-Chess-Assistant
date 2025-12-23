/**
 * Chess Assistant - Module Tests
 * Basic tests to verify module structure and exports
 */

const fs = require('fs');
const path = require('path');

// Test utilities
let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`  ✓ ${name}`);
        passed++;
    } catch (error) {
        console.log(`  ✗ ${name}`);
        console.log(`    Error: ${error.message}`);
        failed++;
    }
}

function assertEqual(actual, expected, message = '') {
    if (actual !== expected) {
        throw new Error(`Expected ${expected}, got ${actual}. ${message}`);
    }
}

function assertTrue(value, message = '') {
    if (!value) {
        throw new Error(`Expected truthy value. ${message}`);
    }
}

function assertContains(str, substr, message = '') {
    if (!str.includes(substr)) {
        throw new Error(`Expected "${str}" to contain "${substr}". ${message}`);
    }
}

// File existence tests
console.log('\n📁 File Structure Tests:');

const srcDir = path.join(__dirname, '..', 'src');
const expectedFiles = [
    'config.js',
    'state.js',
    'board.js',
    'engine.js',
    'ui.js',
    'autoplay.js',
    'main.js'
];

expectedFiles.forEach(file => {
    test(`${file} exists`, () => {
        const filePath = path.join(srcDir, file);
        assertTrue(fs.existsSync(filePath), `File ${file} should exist`);
    });
});

// Manifest tests
console.log('\n📋 Manifest Tests:');

const manifestPath = path.join(__dirname, '..', 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

test('Manifest version is 3', () => {
    assertEqual(manifest.manifest_version, 3);
});

test('Content scripts include all modules', () => {
    const scripts = manifest.content_scripts[0].js;
    expectedFiles.forEach(file => {
        assertContains(scripts.join(','), file, `Should include ${file}`);
    });
});

test('Content scripts are in correct order', () => {
    const scripts = manifest.content_scripts[0].js;
    const configIndex = scripts.findIndex(s => s.includes('config.js'));
    const stateIndex = scripts.findIndex(s => s.includes('state.js'));
    const mainIndex = scripts.findIndex(s => s.includes('main.js'));

    assertTrue(configIndex < stateIndex, 'config.js should load before state.js');
    assertTrue(stateIndex < mainIndex, 'state.js should load before main.js');
});

// Module content tests
console.log('\n🔧 Module Content Tests:');

function readModule(name) {
    return fs.readFileSync(path.join(srcDir, name), 'utf8');
}

test('config.js defines ChessAssistant.Config', () => {
    const content = readModule('config.js');
    assertContains(content, 'window.ChessAssistant.Config');
});

test('config.js freezes configuration', () => {
    const content = readModule('config.js');
    assertContains(content, 'Object.freeze');
});

test('state.js defines ChessAssistant.State', () => {
    const content = readModule('state.js');
    assertContains(content, 'window.ChessAssistant.State');
});

test('state.js has getter/setter pattern', () => {
    const content = readModule('state.js');
    assertContains(content, 'get isActive()');
    assertContains(content, 'set isActive(');
});

test('board.js defines ChessAssistant.Board', () => {
    const content = readModule('board.js');
    assertContains(content, 'window.ChessAssistant.Board');
});

test('board.js exports generateFENString', () => {
    const content = readModule('board.js');
    assertContains(content, 'generateFENString');
});

test('engine.js defines ChessAssistant.Engine', () => {
    const content = readModule('engine.js');
    assertContains(content, 'window.ChessAssistant.Engine');
});

test('engine.js handles Stockfish messages', () => {
    const content = readModule('engine.js');
    assertContains(content, 'handleEngineMessage');
    assertContains(content, 'bestmove');
});

test('ui.js defines ChessAssistant.UI', () => {
    const content = readModule('ui.js');
    assertContains(content, 'window.ChessAssistant.UI');
});

test('ui.js exports createPanel', () => {
    const content = readModule('ui.js');
    assertContains(content, 'createPanel');
});

test('autoplay.js defines ChessAssistant.AutoPlay', () => {
    const content = readModule('autoplay.js');
    assertContains(content, 'window.ChessAssistant.AutoPlay');
});

test('autoplay.js handles click simulation', () => {
    const content = readModule('autoplay.js');
    assertContains(content, 'dispatchClickSequence');
    assertContains(content, 'PointerEvent');
});

test('main.js is an IIFE', () => {
    const content = readModule('main.js');
    assertContains(content, "(function()");
    assertContains(content, "'use strict'");
});

test('main.js initializes all modules', () => {
    const content = readModule('main.js');
    assertContains(content, 'window.ChessAssistant.Config');
    assertContains(content, 'window.ChessAssistant.State');
    assertContains(content, 'window.ChessAssistant.Board');
    assertContains(content, 'window.ChessAssistant.Engine');
    assertContains(content, 'window.ChessAssistant.UI');
    assertContains(content, 'window.ChessAssistant.AutoPlay');
});

// No global pollution test
console.log('\n🛡️ Code Quality Tests:');

test('No loose global variables in modules', () => {
    const modules = ['config.js', 'state.js', 'board.js', 'engine.js', 'ui.js', 'autoplay.js'];
    modules.forEach(mod => {
        const content = readModule(mod);
        // Check that there are no var/let/const at the top level outside the namespace
        const lines = content.split('\n');
        let inNamespace = false;

        lines.forEach((line, i) => {
            if (line.includes('window.ChessAssistant')) inNamespace = true;
            if (inNamespace) return;

            // Skip comments and empty lines
            const trimmed = line.trim();
            if (trimmed.startsWith('//') || trimmed.startsWith('/*') ||
                trimmed.startsWith('*') || trimmed === '' ||
                trimmed.startsWith('console.log')) return;

            // Should not have loose variable declarations
            if (/^(var|let|const)\s+\w+/.test(trimmed)) {
                throw new Error(`Global variable found in ${mod} at line ${i + 1}: ${trimmed}`);
            }
        });
    });
});

test('All modules have JSDoc headers', () => {
    expectedFiles.forEach(file => {
        const content = readModule(file);
        assertContains(content, '/**', `${file} should have JSDoc comment`);
        assertContains(content, '@module', `${file} should have @module tag`);
    });
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`Tests: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log('='.repeat(50));

if (failed > 0) {
    console.log('\n❌ Some tests failed!');
    process.exit(1);
} else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
}
