# Zotero 7 Migration Plan for Mdnotes Extension

This document outlines the complete migration plan for updating the Mdnotes extension from Zotero 6 to Zotero 7.

## Current Extension Analysis

The Mdnotes extension is currently a **XUL overlay-based extension** with the following structure:

- **Type**: Legacy overlay extension
- **Current target**: Zotero 5.0.79 to 6.0.*
- **Main functionality**: Export Zotero items and notes to markdown
- **UI integration**: Context menu items and toolbar menu items
- **Preferences**: Custom preferences window

### Current Files Structure
```
├── install.rdf              # Legacy manifest
├── chrome.manifest          # Chrome registration
├── content/
│   ├── overlay.xul          # XUL overlay
│   ├── mdnotes.js           # Main extension logic
│   └── options.xul          # Preferences window
├── defaults/preferences/
│   └── mdnotes.js           # Default preferences
├── locale/
│   └── en-US/
│       ├── mdnotes.dtd      # DTD localization
│       └── mdnotes.properties
└── skin/
    └── default/
        └── overlay.css
```

## Migration Requirements

Based on the Zotero 7 migration guide, the following changes are **mandatory**:

### 1. Manifest System Migration
- ✅ **Required**: Convert `install.rdf` → `manifest.json`
- ✅ **Required**: Convert `update.rdf` → `updates.json` (if applicable)

### 2. Extension Architecture Migration
- ✅ **Required**: Convert XUL overlay → Bootstrap system
- ✅ **Required**: Create `bootstrap.js` with lifecycle hooks
- ✅ **Required**: Implement window hooks for UI injection

### 3. File Format Migration
- ✅ **Required**: Convert `.xul` files → `.xhtml` files
- ✅ **Required**: Update XUL syntax for Zotero 7 compatibility

### 4. Chrome Registration Migration
- ✅ **Required**: Replace `chrome.manifest` → Runtime chrome registration
- ✅ **Required**: Register chrome resources in `bootstrap.js`

### 5. Preferences Migration
- ✅ **Required**: Move `defaults/preferences/mdnotes.js` → `prefs.js` in root
- ✅ **Required**: Update preferences pane registration

### 6. Localization Migration
- 🔶 **Recommended**: Convert DTD/Properties → Fluent localization system
- 🔶 **Alternative**: Keep DTD/Properties with runtime registration

## Detailed Migration Steps

### Step 1: Create manifest.json

**Target**: `/app/manifest.json`

```json
{
  "manifest_version": 2,
  "name": "Mdnotes for Zotero",
  "version": "1.0.0",
  "description": "Export Zotero items and notes to markdown",
  "author": "A. Ortega",
  "homepage_url": "https://github.com/argenos/zotero-mdnotes",
  "icons": {
    "48": "skin/default/icon.png",
    "96": "skin/default/icon@2x.png"
  },
  "applications": {
    "zotero": {
      "id": "mdnotes@mdnotes.github.io",
      "update_url": "https://github.com/argenos/zotero-mdnotes/releases/latest/download/updates.json",
      "strict_min_version": "6.999",
      "strict_max_version": "7.0.*"
    }
  }
}
```

### Step 2: Create bootstrap.js

**Target**: `/app/bootstrap.js`

The bootstrap system requires implementing these functions:

```javascript
var chromeHandle;

function startup({ id, version, rootURI }, reason) {
    // Register chrome resources
    var aomStartup = Cc["@mozilla.org/addons/addon-manager-startup;1"]
        .getService(Ci.amIAddonManagerStartup);
    var manifestURI = Services.io.newURI(rootURI + "manifest.json");
    chromeHandle = aomStartup.registerChrome(manifestURI, [
        ["content", "mdnotes", "content/"],
        ["locale", "mdnotes", "en-US", "locale/en-US/"],
        ["skin", "mdnotes", "default", "skin/default/"]
    ]);
    
    // Initialize the extension
    Zotero.Mdnotes.init();
}

function shutdown() {
    // Clean up chrome registration
    if (chromeHandle) {
        chromeHandle.destruct();
        chromeHandle = null;
    }
    
    // Remove UI modifications from all windows
    var windows = Zotero.getMainWindows();
    for (let win of windows) {
        Zotero.Mdnotes.removeFromWindow(win);
    }
}

function onMainWindowLoad({ window }) {
    // Add UI elements to the window
    Zotero.Mdnotes.addToWindow(window);
}

function onMainWindowUnload({ window }) {
    // Remove UI elements from the window
    Zotero.Mdnotes.removeFromWindow(window);
}

function install(data, reason) {
    // Installation tasks if needed
}

function uninstall(data, reason) {
    // Uninstallation cleanup if needed
}
```

### Step 3: Convert XUL Files to XHTML

**Files to convert**:
- `content/overlay.xul` → Remove (functionality moves to bootstrap)
- `content/options.xul` → `content/options.xhtml`

**Key changes for options.xhtml**:
1. Change file extension: `.xul` → `.xhtml`
2. Update XML declaration and namespaces
3. Update `<preference>` binding syntax
4. Update XUL elements that changed in Firefox 115

### Step 4: Update Main Extension Logic

**Target**: `content/mdnotes.js`

Need to refactor the code to work without overlays:

```javascript
Zotero.Mdnotes = {
    init() {
        // Initialize extension-wide functionality
    },
    
    addToWindow(window) {
        // Add menu items to context menus
        this.addContextMenuItems(window);
        // Add toolbar menu items
        this.addToolbarMenuItems(window);
    },
    
    removeFromWindow(window) {
        // Remove all added UI elements
        let elements = [
            'id-mdnotes-separator',
            'id-mdnotes-batch-export-item',
            'id-mdnotes-create-notes-file',
            'id-mdnotes-export-item',
            'id-mdnotes-export-zotero-note'
        ];
        
        for (let id of elements) {
            window.document.getElementById(id)?.remove();
        }
    },
    
    addContextMenuItems(window) {
        // Programmatically add menu items to context menu
        let contextMenu = window.document.getElementById('zotero-itemmenu');
        if (!contextMenu) return;
        
        // Add separator
        let separator = window.document.createXULElement('menuseparator');
        separator.id = 'id-mdnotes-separator';
        contextMenu.appendChild(separator);
        
        // Add menu items...
    }
};
```

### Step 5: Move Default Preferences

**Action**: Move `defaults/preferences/mdnotes.js` → `prefs.js`

**Target**: `/app/prefs.js`

```javascript
// Copy the exact content from defaults/preferences/mdnotes.js
pref("extensions.mdnotes.directory", "");
pref("extensions.mdnotes.citekey_title", true);
// ... all other preferences
```

### Step 6: Register Preference Pane

**Target**: Add to bootstrap.js startup function

```javascript
Zotero.PreferencePanes.register({
    pluginID: 'mdnotes@mdnotes.github.io',
    src: 'content/options.xhtml',
    scripts: ['content/options.js'],
    stylesheets: ['skin/default/options.css']
});
```

### Step 7: Update Localization (Optional but Recommended)

**Current**: DTD + Properties files
**Target**: Fluent (.ftl files)

**Migration path**:
1. Create `locale/en-US/mdnotes.ftl`
2. Convert DTD entities to Fluent identifiers
3. Update code to use `document.l10n` API
4. Register Fluent files in bootstrap

**Example conversion**:
```xml
<!-- DTD -->
<!ENTITY mdnotes-options.label "Mdnotes Options">
```

```
# Fluent
mdnotes-options-label = Mdnotes Options
```

## Compatibility Strategy

To ensure smooth transition, we can implement a **dual-compatibility approach**:

1. **Keep both manifest files**: Include both `install.rdf` and `manifest.json`
2. **Version targeting**: 
   - Zotero 6: Uses `install.rdf` and overlay system
   - Zotero 7: Uses `manifest.json` and bootstrap system
3. **Shared code**: Main logic in `mdnotes.js` can work with both systems

## Testing Plan

1. **Zotero 7 Beta Testing**:
   - Install extension in Zotero 7 beta
   - Verify all menu items appear correctly
   - Test all export functionality
   - Test preferences window
   - Test localization

2. **Regression Testing**:
   - Ensure Zotero 6 compatibility (if maintaining dual support)
   - Test all existing functionality
   - Performance testing

3. **Edge Cases**:
   - Multiple window scenarios
   - Extension disable/enable cycles
   - Preference migration from old versions

## Migration Risks and Mitigations

### High Risk Items
1. **XUL → XHTML conversion**: Complex UI layouts may break
   - **Mitigation**: Test thoroughly, use browser dev tools for debugging

2. **Menu injection without overlays**: Dynamic menu creation is more complex
   - **Mitigation**: Use Zotero's existing menu APIs where possible

3. **Preference binding changes**: `<preference>` tags work differently
   - **Mitigation**: Test all preference controls thoroughly

### Medium Risk Items
1. **Chrome registration timing**: Resources must be available when needed
   - **Mitigation**: Ensure proper registration order in bootstrap

2. **Localization system changes**: DTD system still works but deprecated
   - **Mitigation**: Keep DTD initially, migrate to Fluent later

## Timeline Estimate

- **Phase 1** (2-3 days): Core bootstrap conversion and manifest creation
- **Phase 2** (2-3 days): XUL to XHTML conversion and UI updates
- **Phase 3** (1-2 days): Preferences system migration
- **Phase 4** (1-2 days): Testing and bug fixes
- **Phase 5** (Optional, 2-3 days): Fluent localization migration

**Total**: 6-10 days for basic migration, +2-3 days for complete modernization

## Success Criteria

✅ Extension loads successfully in Zotero 7
✅ All menu items appear in correct locations
✅ All export functionality works as expected
✅ Preferences window opens and saves settings correctly
✅ No JavaScript errors in browser console
✅ Extension can be enabled/disabled without issues
✅ Performance is equivalent to Zotero 6 version

This migration plan provides a comprehensive roadmap for updating the Mdnotes extension to work with Zotero 7 while maintaining functionality and user experience.