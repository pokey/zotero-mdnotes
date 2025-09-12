// Simple test script to validate the Zotero 7 conversion
// This is NOT meant to run in Zotero - it's for basic syntax checking

"use strict";

// Mock objects for testing
const MockZotero = {
  debug: (msg) => console.log('DEBUG:', msg),
  Prefs: {
    get: (key, usePrefix) => {
      const prefs = {
        'extensions.mdnotes.directory': '',
        'extensions.mdnotes.citekey_title': true,
        'extensions.mdnotes.link_style': 'wiki',
        'extensions.mdnotes.title_suffix': '-zotero',
        'extensions.mdnotes.notes_suffix': '',
        'extensions.mdnotes.file_conf': 'split'
      };
      return prefs[usePrefix ? key : `extensions.mdnotes.${key}`];
    },
    openPreferences: (id) => console.log('Opening preferences for', id)
  },
  PreferencePanes: {
    register: (options) => console.log('Registering pane:', options.pluginID),
    unregister: (id) => console.log('Unregistering pane:', id)
  },
  getMainWindows: () => [],
  File: {
    putContentsAsync: (path, contents) => console.log('Writing file:', path)
  }
};

const MockServices = {
  io: {
    newURI: (uri) => ({ spec: uri })
  },
  scriptloader: {
    loadSubScript: (uri) => console.log('Loading script:', uri)
  }
};

const MockComponents = {
  classes: {
    '@mozilla.org/addons/addon-manager-startup;1': {
      getService: () => ({
        registerChrome: (manifestURI, registrations) => {
          console.log('Registering chrome:', registrations);
          return { destruct: () => console.log('Chrome deregistered') };
        }
      })
    }
  },
  interfaces: {
    amIAddonManagerStartup: {}
  }
};

const MockChromeUtils = {
  importESModule: (module) => {
    if (module.includes('osfile.mjs')) {
      return {
        OS: {
          Constants: { Path: { homeDir: '/home/user' } },
          Path: {
            join: (...parts) => parts.join('/'),
            normalize: (path) => path
          },
          File: {
            exists: (path) => Promise.resolve(false)
          }
        }
      };
    }
    if (module.includes('filePicker.mjs')) {
      return {
        FilePicker: class {
          constructor() {
            this.modeSave = 'save';
            this.modeGetFolder = 'folder';
            this.returnOK = 'ok';
            this.returnReplace = 'replace';
          }
          init() {}
          appendFilter() {}
          show() { return Promise.resolve(this.returnOK); }
        }
      };
    }
    return {};
  }
};

// Set up global mocks
global.Zotero = MockZotero;
global.Services = MockServices;
global.Cc = MockComponents.classes;
global.Ci = MockComponents.interfaces;
global.ChromeUtils = MockChromeUtils;
global.window = { openDialog: () => {} };

// Test basic functionality
console.log('Testing Zotero 7 conversion...');

try {
  // Test bootstrap functions exist and work
  eval(`
    ${require('fs').readFileSync('./bootstrap.js', 'utf8')}
    
    // Test startup
    startup({
      id: 'mdnotes@mdnotes.github.io',
      version: '1.0.0',
      rootURI: 'chrome://mdnotes/'
    }, 1);
    
    console.log('✓ Bootstrap startup works');
    
    // Test shutdown
    shutdown();
    console.log('✓ Bootstrap shutdown works');
  `);
} catch (e) {
  console.error('✗ Bootstrap test failed:', e.message);
}

try {
  // Test that mdnotes.js loads without syntax errors
  eval(`
    ${require('fs').readFileSync('./content/mdnotes.js', 'utf8')}
    console.log('✓ mdnotes.js loads without syntax errors');
  `);
} catch (e) {
  console.error('✗ mdnotes.js test failed:', e.message);
}

console.log('\nConversion test complete!');
console.log('\nNext steps:');
console.log('1. Build the extension: make mdnotes.xpi');
console.log('2. Test in Zotero 7 beta');
console.log('3. Verify all menu items appear correctly');
console.log('4. Test export functionality');
console.log('5. Test preferences window');