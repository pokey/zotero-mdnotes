# Mdnotes for Zotero 7 - Installation Guide

## Overview

This is the Zotero 7 compatible version of the Mdnotes extension. It has been fully migrated from the legacy XUL overlay system to the modern bootstrap system required by Zotero 7.

## Compatibility

- **Zotero 6**: ✅ Fully compatible (bootstrapped mode)
- **Zotero 7**: ✅ Fully compatible (modern bootstrap system)
- **Original functionality**: ✅ All features preserved

## Installation

### For Zotero 7 Beta Users

1. **Download** the extension file: `mdnotes-zotero7.xpi`
2. **Open** Zotero 7 beta
3. **Install** by either:
   - Drag and drop the `.xpi` file onto the Zotero window
   - Go to `Tools → Add-ons → Install Add-on From File...` and select the `.xpi` file
4. **Restart** Zotero if prompted
5. **Verify** installation by right-clicking any item and checking for Mdnotes options

### For Zotero 6 Users

The same `.xpi` file works with Zotero 6! Follow the same installation steps above.

## Features

All original Mdnotes functionality is preserved:

### Context Menu Options
- **Batch export to markdown** - Create all markdown files for selected items
- **Create Notes file** - Create a markdown file for your notes
- **Create Zotero item metadata file** - Export item metadata to markdown
- **Export Zotero note to markdown** - Convert Zotero notes to markdown

### Preferences
Access via `Tools → Mdnotes Options...` or toolbar menu:
- Export directory configuration
- File organization settings (single file vs. split files)
- Internal link format options
- Metadata export settings
- Tag format configuration
- Notes file settings

## What Changed?

This version includes significant internal changes for Zotero 7 compatibility:

### Technical Changes
- ✅ Converted from XUL overlays to bootstrap system
- ✅ Added WebExtension-style manifest.json
- ✅ Updated file APIs for Firefox 115 compatibility
- ✅ Modernized preference system
- ✅ Added Fluent localization support
- ✅ Maintained backward compatibility with Zotero 6

### User Experience
- ✅ Same menu locations and options
- ✅ Same export functionality
- ✅ Same preferences interface
- ✅ All existing preferences preserved during upgrade

## Troubleshooting

### Extension Won't Install
- Ensure you're using Zotero 6.0.30+ or Zotero 7 beta
- Try restarting Zotero and installing again
- Check that the file isn't corrupted by re-downloading

### Menu Items Don't Appear
- Restart Zotero completely
- Check that the extension is enabled in `Tools → Add-ons`
- Try disabling and re-enabling the extension

### Export Not Working
- Check the export directory setting in preferences
- Ensure you have write permissions to the export directory
- Try exporting to a different directory

### Preferences Window Issues
- The preferences use the new Zotero 7 preference system
- Some visual layout may differ slightly from the original
- All functionality remains the same

## Support

If you encounter issues:

1. **Check the Browser Console**: 
   - In Zotero 7: `Help → Developer → Browser Console`
   - Look for any error messages starting with "Mdnotes:"

2. **Reset Preferences**:
   - Close Zotero
   - Remove preferences starting with `extensions.mdnotes.` from your Zotero profile
   - Restart Zotero

3. **Report Issues**:
   - Include your Zotero version
   - Include any error messages from the Browser Console
   - Describe what you were trying to do when the issue occurred

## Development

For developers interested in the migration process:

- See `MIGRATION_PLAN.md` for the complete migration strategy
- See `ZOTERO7_CHANGES.md` for detailed technical changes
- Run `node test_conversion.js` to validate the conversion
- Build with `make mdnotes.xpi` (requires zip utility)

## Credits

Original Mdnotes extension by A. Ortega  
Zotero 7 migration by [Your Organization/Name]  
Based on the [Zotero 7 migration guide](https://www.zotero.org/support/dev/zotero_7_for_developers)