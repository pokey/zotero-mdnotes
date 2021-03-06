/*globals Zotero, OS, require, Components, window */
"use strict";

function getPref(pref_name) {
  return Zotero.Prefs.get(`extensions.mdnotes.${pref_name}`, true);
}

const typemap = {
  artwork: "Illustration",
  audioRecording: "Recording",
  bill: "Legislation",
  blogPost: "Blog post",
  book: "Book",
  bookSection: "Chapter",
  case: "Legal case",
  computerProgram: "Data",
  conferencePaper: "Conference paper",
  email: "Letter",
  encyclopediaArticle: "Encyclopaedia article",
  film: "Film",
  forumPost: "Forum post",
  hearing: "Hearing",
  instantMessage: "Instant message",
  interview: "Interview",
  journalArticle: "Article",
  letter: "Letter",
  magazineArticle: "Magazine article",
  manuscript: "Manuscript",
  map: "Image",
  newspaperArticle: "Newspaper article",
  patent: "Patent",
  podcast: "Podcast",
  presentation: "Presentation",
  radioBroadcast: "Radio broadcast",
  report: "Report",
  statute: "Legislation",
  thesis: "Thesis",
  tvBroadcast: "TV broadcast",
  videoRecording: "Recording",
  webpage: "Webpage"
};

function getAuthors(item) {
  var creators = item.getCreators();
  var creatorTypeID = Zotero.CreatorTypes.getID("author");
  var creatorArray = [];

  if (creators) {
    for (let creator of creators) {
      if (creator.creatorTypeID === creatorTypeID) {
        let creatorName = `${creator.firstName} ${creator.lastName}`;
        creatorArray.push(formatInternalLink(creatorName));
      }
    }
  }

  return creatorArray.join(", ");
}

function day_of_the_month(d) {
  return (d.getDate() < 10 ? "0" : "") + d.getDate();
}

function get_month_mm_format(d) {
  return (d.getMonth() < 10 ? "0" : "") + d.getMonth();
}

function getDates(item) {
  let dateString = "| Date | ";
  if (getPref("link_dates")){
    dateString += `${formatInternalLink(item.getField("date"))}\n`;
  } else {
    dateString += `${formatInternalLink(item.getField("date"), "no-links")}\n`;
  }
  const date = new Date(item.getField("dateAdded"));
  var dateAddedStr = `${date.getFullYear()}-${get_month_mm_format(date)}-${day_of_the_month(date)}`;
  if (getPref("link_dates")){
    dateString += `| Date added | ${formatInternalLink(dateAddedStr)}\n`;
  } else {
    dateString += `| Date added | ${formatInternalLink(dateAddedStr, "no-links")}\n`;
  }

  return dateString;
}

function getCiteKey(item) {
  if (typeof Zotero.BetterBibTeX === "object" && Zotero.BetterBibTeX !== null) {
    var bbtItem = Zotero.BetterBibTeX.KeyManager.get(item.getField("id"));
    return bbtItem.citekey;
  }

  return "undefined";
}

function getLocalLink(item) {
    const library_id = item.libraryID ? item.libraryID : 0;
    return `zotero://select/items/${library_id}_${item.key}`;
}

function getLinks(item) {
  let linksString = "| Zotero links | ";

  if (getPref("export_local_library")) {
    linksString += `[Local library](${getLocalLink(item)})`;
  }

  if (getPref("export_cloud_link")) {
    linksString += `[Cloud library](${Zotero.URI.getItemURI(item)})\n`;
  }

  return linksString;
}

function getURLs(item) {
  let linksString = "";

  if (item.getField("DOI")) {
    let doi = item.getField("DOI");
    linksString += `| DOI | [${doi}](${doi})\n`;
  }

  if (item.getField("url")) {
    let url = item.getField("url");
    linksString += `| URL | ${url}\n`;
  }

  return linksString;
}

// Based on https://github.com/retorquere/zotero-better-bibtex/blob/1d69fcc248abf7fe1315352aa06d419d97f5758b/content/ZoteroPane.ts#L142-L144
function getCites(item) {
  const extra = item.getField('extra') || ''
  const citations = [...new Set(extra.split('\n').filter(line => line.startsWith('cites:')))]
  if (citations.length) {
    const citationsString = citations.map(line => `[[${line.substr(7)}]]`).join(", ")

    return `| Cites | ${citationsString}\n`;
  } else {
    return '';
  }
}

function getTags(item) {
  const tagsArray = [];
  let mdnotesTag = getPref("import_tag");

  if (mdnotesTag) {
    tagsArray.push(mdnotesTag);
  }

  const tagsString = "| Tags | ";
  var itemTags = item.getTags();

  if (itemTags) {
    for (const tag of itemTags) {
      let tagContent = tag.tag;

      if (getPref("tag_format") === "internal") {
        tagContent = formatInternalLink(tagContent);
      } else {
        tagContent = `#${lowerCaseDashTitle(tagContent)}`;
      }

      tagsArray.push(tagContent);
    }
  }

  return tagsString + tagsArray.sort().join(", ");
}

function getCollectionNames(item) {
  const collectionArray = [];
  var collections = item.getCollections();

  for (let collectionID of collections) {
    var collection = Zotero.Collections.get(collectionID);
    const collectionName = collection.name;
    collectionArray.push(formatInternalLink(collectionName));
  }

  if (collectionArray.length) {
    return `| Topics | ${collectionArray.join(", ")}\n`;
  } {
    return "";
  }
}

function getRelatedItems(item) {
  var relatedItemUris = item.getRelations()["dc:relation"],
    relatedItemsArray = [];

  if (relatedItemUris) {
    for (let uri of relatedItemUris) {
      var itemID = Zotero.URI.getURIItemID(uri),
        relatedItem = Zotero.Items.get(itemID);

      if (getPref("citekey_title")) {
        relatedItemsArray.push(`${formatInternalLink(getCiteKey(relatedItem))}`);
      } else {
        relatedItemsArray.push(`${formatInternalLink(relatedItem.getField("title"))}`);
      }
    }
  }

  if (relatedItemsArray.length) {
    return `| Related | ${relatedItemsArray.join(", ")}\n`;
  } else {
    return "";
  }
}

function getMetadata(item) {
  let metadataString = "# Metadata\n";

  metadataString += `| Title | ${item.getField("title")} |\n`
  metadataString += `| --: | :-- |\n`

  if (getPref("export_type")) {
    var zoteroType = Zotero.ItemTypes.getName(item.getField("itemTypeID"));
    const itemType = typemap[zoteroType];
    if (getPref("link_type")){
      metadataString += `| Type | #${lowerCaseDashTitle(itemType)}\n`;
    } else {
      metadataString += `| Type | ${formatInternalLink(itemType, "no-links")}\n`;
    }

  }

  if (getPref("export_authors")) {
    metadataString +=  `| Authors | ${getAuthors(item)}\n`;
  }

  if (getPref("export_dates")) {
    metadataString += getDates(item);
  }

  var pubTitle = item.getField("publicationTitle", true, true);
  if (getPref("export_pub_title") && pubTitle) {
    metadataString += `| Publication | ${formatInternalLink(pubTitle)}\n`;
  }

  if (getPref("export_urls")) {
    metadataString += getURLs(item);
  }

  if (getPref("export_citekey")) {
    metadataString += `| Cite key | \`${getCiteKey(item)}\`\n`;
  }

  if (getPref("export_collections")) {
    metadataString += getCollectionNames(item);
  }

  if (getPref("export_related")) {
    metadataString += getRelatedItems(item);
  }

  metadataString += getCites(item);

  if (getPref("export_tags")) {
    metadataString += getTags(item) + "\n";
  }

  if (getPref("file_conf") !== "split") {
    metadataString += getLinks(item) + "\n";
  }

  if (getPref("export_pdfs")) {
    var pdfArray;
    pdfArray = getZoteroAttachments(item);
    if (pdfArray.length == 1) {
      metadataString += `| PDF Attachments | ${pdfArray[0]}\n`;
    } else if (pdfArray.length > 1) {
      metadataString += `| PDF Attachments | ${pdfArray.join(', ')}\n`;
    }

  }

  return metadataString;
}

function htmlLinkToMarkdown(link) {
  const mdLink = `[${link.text}](${link.href})`;
  return mdLink;
}

function formatLists(list, bullet) {
  for (const element of list.childNodes) {
    element.innerHTML = `${bullet} ${element.innerHTML}`;
  }
}

function formatInternalLink(content, linkStyle) {
  linkStyle = typeof linkStyle !== 'undefined' ? linkStyle : getPref("link_style");

  if (linkStyle === "wiki") {
    return `[[${content}]]`;
  } else if (linkStyle === "markdown") {
    return `[${content}](${lowerCaseDashTitle(content)})`;
  } else {
    return `${content}`;
  }
}

var wordRegex = /\w+/g;

function lowerCaseDashTitle(content) {
  return `${content.match(wordRegex).join("-").toLowerCase()}`;
}

function getZoteroNotes(item) {
  var noteIDs = item.getNotes();
  var noteArray = [];

  if (noteIDs) {
    for (let noteID of noteIDs) {
      let note = Zotero.Items.get(noteID);
      let noteContent = note.getNote();
      noteArray.push(noteToMarkdown(noteContent));
    }
  }

  return noteArray;
}

function getZoteroAttachments(item) {
  let attachmentIDs = item.getAttachments();
  var linksArray = [];
  for (let id of attachmentIDs) {
    let attachment = Zotero.Items.get(id);
    if (attachment.attachmentContentType == 'application/pdf') {
      var link = `[${attachment.getField("title")}](zotero://open-pdf/library/items/${attachment.key})`;
      linksArray.push(link);
    }
  }
  return linksArray;
}

// Hacky solution from https://stackoverflow.com/a/25047903
var isDate = function (date) {
  return (new Date(date).toString() !== "Invalid Date") && !isNaN(new Date(date));
};

// From https://stackoverflow.com/a/29774197
// Return the date in yyyy-mm-dd format
function simpleISODate(date) {
  const offset = date.getTimezoneOffset();
  date = new Date(date.getTime() + (offset * 60 * 1000));
  return date.toISOString().split('T')[0];
}


function formatNoteTitle(titleString) {
  var strInParenthesis = titleString.match(/\(([^\)]+)\)/g);

  if (!strInParenthesis) {
    // Just replace all slashes and colons with dashes
    return titleString.replace(/\/|:/g, "-");
  } else {
    var dateInParenthesis = strInParenthesis[0].replace(/\(|\)/g, "");

    if (isDate(dateInParenthesis)) {
      var date = new Date(dateInParenthesis);
      return titleString.replace(dateInParenthesis, simpleISODate(date));
    } else {
      return titleString;
    }
  }
}

function noteToMarkdown(noteContent) {
  const domParser = Components.classes["@mozilla.org/xmlextras/domparser;1"].createInstance(Components.interfaces.nsIDOMParser),
    mapObj = {
      "<p>": "",
      "</p>": "",
      "<strong>": "**",
      "</strong>": "**",
      "<b>": "**",
      "</b>": "**",
      "<u>": "#### ",
      "</u>": "",
      "<em>": "*",
      "</em>": "*",
      "<blockquote>": "> ",
      "</blockquote>": "",
      "<br><br>": "\n\n"
    },
    re = new RegExp(Object.keys(mapObj).join("|"), "gi");
  var noteMD = {};
  let noteString = "";
  const fullDomNoteBody = domParser.parseFromString(noteContent, "text/html").body;
  const fullDomNote = fullDomNoteBody.childNodes;

  const commentStartRe = /^<p>\s*<!--/;
  const commentEndRe = /-->\s*<\/p>$/;

  for (let i = 0; i < fullDomNote.length; i++) {
    const para = fullDomNote[i];

    if (i === 0) {
      noteMD.title = formatNoteTitle(para.textContent);
      continue;
    }

    if (para.innerHTML) {
      for (const link of para.getElementsByTagName("a")) {
        link.outerHTML = htmlLinkToMarkdown(link);
      }

      const parsedInner = para.innerHTML.replace(re, function (matched) {
        // tslint:disable-line:only-arrow-functions
        return mapObj[matched];
      });
      para.innerHTML = parsedInner;

      if (para.innerHTML.startsWith("\"#")) {
        noteString += para.textContent.substring(1, para.textContent.lastIndexOf("\"")) + "\n\n";
        continue;
      }

      if (para.innerHTML.startsWith("\"")) {
        const lastQuote = para.textContent.lastIndexOf("\"")
        const quoteContents = para.textContent.substring(1, lastQuote)
        const finalContent = para.textContent.substring(lastQuote+1)
        noteString += `> ${quoteContents}${finalContent}\n\n`;
        continue;
      } // Handle lists

      if (commentStartRe.test(para.outerHTML) && commentEndRe.test(para.outerHTML)) {
        noteString += `${para.innerHTML}\n\n`;
        continue;
      } // Handle comments


      if (para.outerHTML.startsWith("<ul>")) {
        formatLists(para, "-");
      }

      if (para.outerHTML.startsWith("<ol>")) {
        formatLists(para, "1.");
      }

      noteString += para.textContent + "\n\n";
    }
  }

  noteMD.content = noteString;
  return noteMD;
}

function getItemTitle(item) {
  return `# ${item.getField("title")}\n\n`;
}

function getFileName(item) {
  let citekeyTitle = getPref("citekey_title");

  if (citekeyTitle) {
    return getCiteKey(item);
  } else {
    if (getPref("link_style") === "wiki") {
      return item.getField("title");
    } else {
      return lowerCaseDashTitle(item.getField("title"));
    }
  }
}

function getZoteroFileContents(itemExport, fileName) {
  var zoteroNoteContents = itemExport.title;
  zoteroNoteContents += itemExport.metadata;

  if (itemExport.notes) {
    zoteroNoteContents += `\n${getPref("export_notes_heading")}\n\n`;

    for (let note of itemExport.notes) {
      let noteFileName = `${fileName} - ${note.title}`;
      zoteroNoteContents += `* ${formatInternalLink(noteFileName)}\n`;
    }
  }

  return zoteroNoteContents;
}


function getFiles(itemExport, fileName, titleSuffix) {
  var fileArray = [];
  var noteFile = {
    name: `${fileName}${getPref("notes_suffix")}`,
    contents: getMDNoteFileContents(itemExport, fileName, titleSuffix)
  };
  fileArray.push(noteFile);

  var zoteroNoteContents = itemExport.title;
  zoteroNoteContents += itemExport.metadata;

  if (itemExport.notes) {
    zoteroNoteContents += `\n${getPref("export_notes_heading")}\n\n`;

    for (let note of itemExport.notes) {
      let noteFileName = `${fileName} - ${note.title}`;
      zoteroNoteContents += `* ${formatInternalLink(noteFileName)}\n`;
      let fileContents = `# ${note.title}\n\n`;
      fileContents += note.content;
      fileArray.push({
        name: noteFileName,
        contents: fileContents
      });
    }

    fileArray.push({
      name: `${fileName}${titleSuffix}`,
      contents: zoteroNoteContents
    });
  }

  return fileArray;
}

function getFileContents(itemExport) {
  var fileContents = "";

  fileContents += `# [${itemExport.title}](${itemExport.localLink})`;

  fileContents += `\n${itemExport.authors}. `;
  if (itemExport.url) {
    fileContents += `[‘${itemExport.title}’](${itemExport.url}), `;
  } else {
    fileContents += `‘${itemExport.title}’, `;
  }
  fileContents += `${formatInternalLink(itemExport.date)}.\n`;

  if (itemExport.abstract) {
    fileContents += `\n> ${itemExport.abstract}\n`;
  }

  if (getPref("create_notes_file")) {
    fileContents += "\n# Notes\n";
    fileContents += "\n<!-- ↑ notes here ↑ -->\n";
  }

  if (itemExport.notes) {
    fileContents += `\n${getPref("export_notes_heading")}\n\n`;

    for (let note of itemExport.notes) {
      fileContents += `## ${note.title}\n\n`;
      fileContents += note.content;
    }
  }

  fileContents += itemExport.metadata;

  return fileContents;
}

function getItemExport(item) {
  var itemExport = {};
  itemExport.metadata = getMetadata(item);
  itemExport.authors = getAuthors(item);
  itemExport.abstract = item.getField("abstractNote");
  itemExport.title = item.getField("title");
  itemExport.url = item.getField("url");
  itemExport.zoteroLinks = getLinks(item);
  itemExport.localLink = getLocalLink(item);
  itemExport.notes = getZoteroNotes(item);
  itemExport.date = item.getField("date");
  itemExport.citekey = getCiteKey(item);
  return itemExport;
}

function getMDNoteFileContents(item, fileName, titleSuffix) {
  var noteText = item.title;
  noteText += `${item.zoteroLinks}\n\n`;

  if (getPref("obsidian.transclude_metadata")) {
    noteText += "!";
  } else {
    noteText += "Metadata: ";
  }

  noteText += `${formatInternalLink(fileName + titleSuffix + "#Metadata")}\n\n`;
  noteText += "## Notes\n";
  return noteText;
}

Zotero.Mdnotes = Zotero.Mdnotes || new class {
  async openPreferenceWindow(paneID, action) {
    const io = {
      pane: paneID,
      action
    };
    window.openDialog(
      "chrome://mdnotes/content/options.xul",
      "mdnotes-options",
      "chrome,titlebar,toolbar,centerscreen" +
      Zotero.Prefs.get("browser.preferences.instantApply", true) ?
      "dialog=no" :
      "modal",
      io
    );
  }

  async addLinkToMDNote(outputFile, itemID, existingAttachments) {
    let linkExists = false;

    for (let id of existingAttachments) {
      let attachment = Zotero.Items.get(id);

      if (attachment.attachmentPath === outputFile) {
        attachment.setField("dateModified", Zotero.Date.dateToSQL(new Date()));
        linkExists = true;
        break;
      }
    }

    if (!linkExists && getPref("attach_to_zotero")) {
      var attachmentFile = await Zotero.Attachments.linkFromFile({
        file: outputFile,
        parentItemID: itemID
      });
    }
  }

  async createNoteFile() {
    var items = Zotero.getActiveZoteroPane().getSelectedItems()
      .filter(item =>
        Zotero.ItemTypes.getName(item.itemTypeID) !== "attachment" &&
        Zotero.ItemTypes.getName(item.itemTypeID) !== "note"
      );
    await Zotero.Schema.schemaUpdatePromise;

    const FilePicker = require("zotero/filePicker").default;

    const fp = new FilePicker();
    var oldPath = getPref("directory") ? getPref("directory") : OS.Constants.Path.homeDir;

    if (oldPath) {
      fp.displayDirectory = oldPath;
    }
    for (const item of items) {
      var itemExport = getItemExport(item);
      const fileName = `${getFileName(item)}${getPref('notes_suffix')}`;

      fp.init(window, "Export markdown notes...", fp.modeSave);
      fp.appendFilter("Markdown", "*.md");
      fp.defaultString = `${fileName}.md`;

      const rv = await fp.show();
      if (rv == fp.returnOK || rv == fp.returnReplace) {
        let outputFile = fp.file;
        if (outputFile.split('.').pop().toLowerCase() != "md") {
          outputFile += ".md";
        }
        let attachmentIDs = item.getAttachments();
        let titleSuffix = getPref("title_suffix");
        const fileContents = getMDNoteFileContents(itemExport, fileName, titleSuffix);
        Zotero.File.putContentsAsync(outputFile, fileContents);

        // Attach note
        this.addLinkToMDNote(outputFile, item.id, attachmentIDs);
      }
    }
  }

  async exportNoteToMarkdown() {
    var items = Zotero.getActiveZoteroPane().getSelectedItems().filter(item =>
      // Zotero.ItemTypes.getName(item.itemTypeID) !== "attachment" &&
      Zotero.ItemTypes.getName(item.itemTypeID) === "note");
    await Zotero.Schema.schemaUpdatePromise;

    const FilePicker = require("zotero/filePicker").default;

    const fp = new FilePicker();
    var oldPath = getPref("directory") ? getPref("directory") : OS.Constants.Path.homeDir;

    if (oldPath) {
      fp.displayDirectory = oldPath;
    }

    fp.init(window, "Export markdown notes...", fp.modeGetFolder);
    const rv = await fp.show();

    if (rv === fp.returnOK) {
      for (const item of items) {
        let noteContent = item.getNote();
        let note = noteToMarkdown(noteContent);
        let parentItem = Zotero.Items.get(item.parentItemID);
        const path = OS.Path.normalize(fp.file);
        var fileName = `${getFileName(parentItem)} - ${note.title}`;
        var outputFile = OS.Path.join(path, `${fileName}.md`);
        var fileContents = `# ${note.title}\n\n${note.content}`;
        Zotero.File.putContentsAsync(outputFile, fileContents);

        // Attach note
        this.addLinkToMDNote(outputFile, parentItem.id, parentItem.getAttachments());
      }
    }
  }

  async exportZoteroItem() {
    var items = Zotero.getActiveZoteroPane().getSelectedItems().filter(item =>
      Zotero.ItemTypes.getName(item.itemTypeID) !== "attachment" &&
      Zotero.ItemTypes.getName(item.itemTypeID) !== "note");
    await Zotero.Schema.schemaUpdatePromise;

    const FilePicker = require("zotero/filePicker").default;

    const fp = new FilePicker();
    var oldPath = getPref("directory") ? getPref("directory") : OS.Constants.Path.homeDir;

    if (oldPath) {
      fp.displayDirectory = oldPath;
    }

    fp.init(window, "Export markdown notes...", fp.modeGetFolder);
    const rv = await fp.show();

    if (rv === fp.returnOK) {
      for (const item of items) {
        var itemExport = getItemExport(item);
        const path = OS.Path.normalize(fp.file);
        const fileName = getFileName(item);
        var outputFile = OS.Path.join(path, `${fileName}${getPref('title_suffix')}.md`);
        const fileContents = getZoteroFileContents(itemExport, fileName);
        Zotero.File.putContentsAsync(outputFile, fileContents);

        // Attach note
        this.addLinkToMDNote(outputFile, item.id, item.getAttachments());
      }
    }
  }

  async batchExport() {
    var items = Zotero.getActiveZoteroPane().getSelectedItems()
      .filter(item =>
        Zotero.ItemTypes.getName(item.itemTypeID) !== "attachment" &&
        Zotero.ItemTypes.getName(item.itemTypeID) !== "note"
      );
    await Zotero.Schema.schemaUpdatePromise;

      for (const item of items) {
        var itemExport = getItemExport(item);
        let attachmentIDs = item.getAttachments();
        const path = "/Users/pokey/src/zotero-notes-export/References";
        let titleSuffix = getPref("title_suffix");
        var fileName = getFileName(item);

        if (getPref("file_conf") === "split") {
          const files = getFiles(itemExport, fileName, titleSuffix);

          var noteFileName = `${fileName}${getPref("notes_suffix")}`;

          for (let exportFile of files) {
            var outputFile = OS.Path.join(path, `${exportFile.name}.md`);
            var fileExists = await OS.File.exists(outputFile);

            if (exportFile.name === `${noteFileName}` && (fileExists || !getPref("create_notes_file"))) {
              continue;
            }
            Zotero.File.putContentsAsync(outputFile, exportFile.contents);

            // Attach new notes
            this.addLinkToMDNote(outputFile, item.id, attachmentIDs);
          }
        } else {
          const fileContents = getFileContents(itemExport);
          var outputFile = OS.Path.join(path, `${fileName}${titleSuffix}.md`);
          Zotero.File.putContentsAsync(outputFile, fileContents);

          // Attach new notes
          this.addLinkToMDNote(outputFile, item.id, attachmentIDs);
        }
      }
  }

  run(method, ...args) {
    this[method].apply(this, args).catch(err => {
      Zotero.debug(err);
    });
  }

}();
