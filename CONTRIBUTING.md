# Contributing

## Installing local version

1. `make release`. Ignore the sed error.
2. Open Zotero
3. Go to `Tools` > `Add-ons` > `Gear icon` > `Install Add-on From File...`
4. Select the new `.xpi` file.

## Debugging

I couldn't figure out how to see the console output of the Zotero add-on, so instead I do something like this:

```javascript
  // Write debug info to file instead of console
  try {
    const debugInfo = {
      hasBBT: typeof Zotero.BetterBibTeX === "object",
      bbtValue: Zotero.BetterBibTeX,
      timestamp: new Date().toISOString(),
      itemID: item.getField("id"),
      itemIdDirect: item.id,
      itemKey: Zotero.BetterBibTeX.KeyManager.get(item.getField("id")),
    };
    
    const debugPath = OS.Path.join("/tmp", "zotero-mdnotes-debug.json");
    Zotero.File.putContentsAsync(debugPath, JSON.stringify(debugInfo, null, 2));
  } catch (e) {
    // Silent fail if writing debug info fails
  }
  ```