/*globals Zotero, Components, Cc, Ci, Services */
"use strict";

var chromeHandle;

function log(msg) {
  Zotero.debug("Mdnotes: " + msg);
}

function startup({ id, version, rootURI, resourceURI }, reason) {
  // Zotero 6 compatibility: resourceURI instead of rootURI
  if (!rootURI && resourceURI) {
    rootURI = resourceURI.spec;
  }
  
  log(`Starting up version ${version}`);
  
  // For Zotero 6 compatibility - wait for Zotero to be initialized
  if (typeof Zotero === 'undefined') {
    if (typeof setTimeout === 'undefined') {
      // Fallback for older environments
      Components.utils.import("resource://gre/modules/Timer.jsm");
    }
    setTimeout(() => startup({ id, version, rootURI, resourceURI }, reason), 100);
    return;
  }
  
  // Skip chrome registration for now - load resources directly
  // This works for many Zotero 7 extensions that don't need chrome:// URLs
  log("Skipping chrome registration - using direct resource loading");
  
  // Note: Chrome registration can be added later if chrome:// URLs are specifically needed
  // For now, we'll load scripts directly using rootURI
  
  // Load the main extension script
  try {
    Services.scriptloader.loadSubScript(rootURI + "content/mdnotes.js");
  } catch (e) {
    log("Error loading mdnotes.js: " + e);
    throw e;
  }
  
  // Register preference pane
  if (Zotero.PreferencePanes) {
    Zotero.PreferencePanes.register({
      pluginID: id,
      src: "content/options.xhtml",
      scripts: ["content/options.js"],
      stylesheets: ["skin/default/options.css"]
    });
  }
  
  // Initialize the extension for existing windows
  const windows = Zotero.getMainWindows();
  for (let win of windows) {
    addToWindow(win);
  }
  
  log("Startup complete");
}

function shutdown() {
  log("Shutting down");
  
  // Clean up chrome registration (if it was created)
  if (chromeHandle) {
    try {
      chromeHandle.destruct();
    } catch (e) {
      log("Error during chrome cleanup: " + e);
    }
    chromeHandle = null;
  }
  
  // Remove UI modifications from all windows
  const windows = Zotero.getMainWindows();
  for (let win of windows) {
    removeFromWindow(win);
  }
  
  // Unregister preference pane
  if (Zotero.PreferencePanes) {
    try {
      Zotero.PreferencePanes.unregister('mdnotes@mdnotes.github.io');
    } catch (e) {
      // May not exist
    }
  }
  
  log("Shutdown complete");
}

function onMainWindowLoad({ window }) {
  log("Main window loaded");
  addToWindow(window);
}

function onMainWindowUnload({ window }) {
  log("Main window unloaded");
  removeFromWindow(window);
}

function install(data, reason) {
  log("Installing");
}

function uninstall(data, reason) {
  log("Uninstalling");
}

function addToWindow(window) {
  if (!window || !window.document) return;
  
  const doc = window.document;
  
  // Skip stylesheet for now since chrome:// URLs aren't registered
  // The extension will work without custom styling initially
  log("Skipping stylesheet - using default styling");
  
  // Add string bundle
  addStringBundle(doc);
  
  // Add context menu items to item menu
  addItemMenuItems(doc);
  
  // Add toolbar menu items
  addToolbarMenuItems(doc);
  
  // Add Tools menu items
  addToolsMenuItems(doc);
}

function removeFromWindow(window) {
  if (!window || !window.document) return;
  
  const doc = window.document;
  
  // Remove stylesheet
  doc.getElementById('mdnotes-stylesheet')?.remove();
  
  // Remove string bundle
  doc.getElementById('mdnotes-bundle')?.remove();
  
  // Remove menu items
  const elementsToRemove = [
    'id-mdnotes-separator',
    'id-mdnotes-batch-export-item',
    'id-mdnotes-create-notes-file',
    'id-mdnotes-export-item',
    'id-mdnotes-export-zotero-note',
    'mdnotes-options-toolbar',
    'mdnotes-options-tools'
  ];
  
  for (let id of elementsToRemove) {
    doc.getElementById(id)?.remove();
  }
}

function addStringBundle(doc) {
  // Skip string bundle for now since chrome:// URLs aren't registered
  // DTD localization will work from the XUL files directly
  log("Skipping string bundle - using DTD localization");
}

function addItemMenuItems(doc) {
  const contextMenu = doc.getElementById('zotero-itemmenu');
  if (!contextMenu) return;
  
  // Add separator
  const separator = doc.createXULElement('menuseparator');
  separator.id = 'id-mdnotes-separator';
  contextMenu.appendChild(separator);
  
  // Add batch export menu item
  const batchExportItem = doc.createXULElement('menuitem');
  batchExportItem.id = 'id-mdnotes-batch-export-item';
  batchExportItem.setAttribute('label', 'Batch export to markdown');
  batchExportItem.setAttribute('tooltiptext', 'Create all markdown files for the selected items');
  batchExportItem.addEventListener('command', () => {
    Zotero.Mdnotes.run('batchExport');
  });
  contextMenu.appendChild(batchExportItem);
  
  // Add create notes file menu item
  const createNotesItem = doc.createXULElement('menuitem');
  createNotesItem.id = 'id-mdnotes-create-notes-file';
  createNotesItem.setAttribute('label', 'Create Notes file');
  createNotesItem.setAttribute('tooltiptext', 'Create a markdown file for your notes');
  createNotesItem.addEventListener('command', () => {
    Zotero.Mdnotes.run('createNoteFile');
  });
  contextMenu.appendChild(createNotesItem);
  
  // Add export item menu item
  const exportItem = doc.createXULElement('menuitem');
  exportItem.id = 'id-mdnotes-export-item';
  exportItem.setAttribute('label', 'Create Zotero item metadata file');
  exportItem.setAttribute('tooltiptext', 'Create a markdown file for the metadata of selected items');
  exportItem.addEventListener('command', () => {
    Zotero.Mdnotes.run('exportZoteroItem');
  });
  contextMenu.appendChild(exportItem);
  
  // Add export note menu item
  const exportNoteItem = doc.createXULElement('menuitem');
  exportNoteItem.id = 'id-mdnotes-export-zotero-note';
  exportNoteItem.setAttribute('label', 'Export Zotero note to markdown');
  exportNoteItem.setAttribute('tooltiptext', 'Create a markdown file for each Zotero note selected');
  exportNoteItem.addEventListener('command', () => {
    Zotero.Mdnotes.run('exportNoteToMarkdown');
  });
  contextMenu.appendChild(exportNoteItem);
}

function addToolbarMenuItems(doc) {
  const toolbarMenu = doc.getElementById('zotero-tb-actions-popup');
  if (!toolbarMenu) return;
  
  const prefsItem = doc.getElementById('zotero-tb-actions-prefs');
  
  const optionsItem = doc.createXULElement('menuitem');
  optionsItem.id = 'mdnotes-options-toolbar';
  optionsItem.setAttribute('label', 'Mdnotes Options...');
  optionsItem.addEventListener('command', () => {
    Zotero.Mdnotes.openPreferenceWindow();
  });
  
  if (prefsItem && prefsItem.nextSibling) {
    toolbarMenu.insertBefore(optionsItem, prefsItem.nextSibling);
  } else {
    toolbarMenu.appendChild(optionsItem);
  }
}

function addToolsMenuItems(doc) {
  const toolsMenu = doc.getElementById('menu_ToolsPopup');
  if (!toolsMenu) return;
  
  const prefsItem = doc.getElementById('menu_preferences');
  
  const optionsItem = doc.createXULElement('menuitem');
  optionsItem.id = 'mdnotes-options-tools';
  optionsItem.setAttribute('label', 'Mdnotes Options...');
  optionsItem.addEventListener('command', () => {
    Zotero.Mdnotes.openPreferenceWindow();
  });
  
  if (prefsItem && prefsItem.nextSibling) {
    toolsMenu.insertBefore(optionsItem, prefsItem.nextSibling);
  } else {
    toolsMenu.appendChild(optionsItem);
  }
}