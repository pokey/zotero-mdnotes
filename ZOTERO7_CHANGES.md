# Zotero 7 Migration Changes

This document summarizes the changes made to migrate the Mdnotes extension to Zotero 7.

## Files Changed

### New Files
- `manifest.json` - WebExtension-style manifest for Zotero 7
- `bootstrap.js` - Bootstrap system replacing XUL overlays
- `prefs.js` - Root-level preferences (moved from `defaults/preferences/`)
- `content/options.xhtml` - XHTML version of options.xul
- `content/options.js` - Options handling script
- `locale/en-US/mdnotes.ftl` - Fluent localization (future-ready)

### Modified Files
- `install.rdf` - Updated to support Zotero 6-7, made bootstrapped
- `content/mdnotes.js` - Updated for Zotero 7 compatibility:
  - Added OS compatibility layer import
  - Updated FilePicker import syntax
  - Fixed openPreferenceWindow method
  - Removed hardcoded export path
- `Makefile` - Updated to include new files and exclude chrome.manifest

### Deprecated Files (kept for reference)
- `chrome.manifest` - Replaced by runtime chrome registration
- `content/overlay.xul` - Functionality moved to bootstrap.js
- `content/options.xul` - Replaced by options.xhtml
- `defaults/preferences/mdnotes.js` - Moved to root as prefs.js

## Key Changes

### 1. Bootstrap System

The extension now uses a bootstrap system instead of XUL overlays:

**Old (Overlay)**:
```xml
<overlay id="mdnotes-overlay">
  <popup id="zotero-itemmenu">
    <menuitem id="id-mdnotes-export-item" label="..." oncommand="..."/>
  </popup>
</overlay>
```

**New (Bootstrap)**:
```javascript
function onMainWindowLoad({ window }) {
  addToWindow(window);
}

function addItemMenuItems(doc) {
  const contextMenu = doc.getElementById('zotero-itemmenu');
  const exportItem = doc.createXULElement('menuitem');
  exportItem.setAttribute('label', '...');
  exportItem.addEventListener('command', () => { /* ... */ });
  contextMenu.appendChild(exportItem);
}
```

### 2. Manifest Format

**Old (install.rdf)**:
```xml
<em:name>Mdnotes for Zotero</em:name>
<em:version>0.0.7</em:version>
<em:targetApplication>
  <em:id>zotero@chnm.gmu.edu</em:id>
  <em:maxVersion>6.0.*</em:maxVersion>
</em:targetApplication>
```

**New (manifest.json)**:
```json
{
  "manifest_version": 2,
  "name": "Mdnotes for Zotero",
  "version": "1.0.0",
  "applications": {
    "zotero": {
      "id": "mdnotes@mdnotes.github.io",
      "strict_max_version": "7.0.*"
    }
  }
}
```

### 3. File Format Updates

- `.xul` files converted to `.xhtml`
- `<textbox>` elements replaced with `<html:input type="text">`
- Added HTML namespace: `xmlns:html="http://www.w3.org/1999/xhtml"`
- Updated preference binding to use preference keys directly

### 4. API Updates

**File Operations**:
```javascript
// Old (Firefox 60)
var { OS } = Cu.import("resource://gre/modules/osfile.jsm");
OS.File.exists(path);
OS.Path.join(dir, file);

// New (Firefox 115 / Zotero 7)
var { OS } = ChromeUtils.importESModule("chrome://zotero/content/osfile.mjs");
// Uses compatibility shims internally
```

**File Picker**:
```javascript
// Old
const FilePicker = require("zotero/filePicker").default;

// New
var { FilePicker } = ChromeUtils.importESModule('chrome://zotero/content/modules/filePicker.mjs');
```

### 5. Chrome Registration

**Old (chrome.manifest)**:
```
content mdnotes content/
locale mdnotes en-US locale/en-US/
```

**New (bootstrap.js)**:
```javascript
const aomStartup = Cc["@mozilla.org/addons/addon-manager-startup;1"]
  .getService(Ci.amIAddonManagerStartup);
const manifestURI = Services.io.newURI(rootURI + "manifest.json");
chromeHandle = aomStartup.registerChrome(manifestURI, [
  ["content", "mdnotes", "content/"],
  ["locale", "mdnotes", "en-US", "locale/en-US/"]
]);
```

## Compatibility

The extension now supports both Zotero 6 and Zotero 7:

- **Zotero 6**: Uses `install.rdf` with bootstrap mode, maintains existing functionality
- **Zotero 7**: Uses `manifest.json` with bootstrap system, modern APIs

## Testing

1. **Build**: `make mdnotes.xpi`
2. **Install**: Drag XPI to Zotero 7 beta
3. **Verify**:
   - Right-click context menu shows Mdnotes options
   - Toolbar menu includes Mdnotes Options
   - Preferences window opens and saves settings
   - Export functionality works

## Potential Issues

1. **Preference migration**: Users upgrading from old versions should have preferences preserved
2. **Menu positioning**: Menu items may appear in slightly different positions
3. **Performance**: Bootstrap system should perform similarly to overlay system
4. **Localization**: DTD system still works, but Fluent is available for future use

## Future Improvements

1. **Full Fluent migration**: Convert all strings to use Fluent localization
2. **Modern UI**: Use Zotero 7's new UI components and styling
3. **Plugin APIs**: Migrate to official Zotero plugin APIs as they become available
4. **TypeScript**: Convert to TypeScript for better development experience