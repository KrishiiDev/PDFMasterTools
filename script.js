/* ==========================================================================
   PDFMaster Tools — script.js
   Vanilla JavaScript. No framework, no build step.
   PDF engine: pdf-lib (writes PDFs) + pdf.js (reads/renders), loaded from CDN.
   Everything runs in the browser; files never leave the device.
   ========================================================================== */
(function () {
  "use strict";

  /* ======================================================================
     1. Constants
     ====================================================================== */
  var PDFLIB_URL = "https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js";
  var PDFJS_VERSION = "3.11.174";
  var MAX_FILE_MB = 100;

  var PAGE_SIZES = {
    A4: [595.28, 841.89],
    A3: [841.89, 1190.55],
    A5: [419.53, 595.28],
    Letter: [612, 792],
    Legal: [612, 1008]
  };

  /* pdf-lib StandardFonts names, resolved lazily against window.PDFLib. */
  var FONT_KEYS = {
    Helvetica: "Helvetica",
    "Helvetica-Bold": "HelveticaBold",
    "Helvetica-Oblique": "HelveticaOblique",
    "Times-Roman": "TimesRoman",
    "Times-Bold": "TimesRomanBold",
    Courier: "Courier"
  };

  var CATEGORIES = [
    { id: "management", name: "PDF Management", blurb: "Merge, split, compress and restructure PDF files." },
    { id: "conversion", name: "PDF Conversion", blurb: "Convert between PDF and images, text, HTML and more." },
    { id: "editing", name: "PDF Editing", blurb: "Add text, images, signatures, shapes and watermarks." },
    { id: "organization", name: "PDF Organization", blurb: "Rotate, reorder, delete and duplicate pages." },
    { id: "security", name: "PDF Security", blurb: "Passwords, encryption and metadata control." },
    { id: "images", name: "PDF Images", blurb: "Extract, compress and screenshot PDF imagery." },
    { id: "text", name: "PDF Text", blurb: "Extract, count, search and clean PDF text." },
    { id: "utilities", name: "PDF Utilities", blurb: "View, inspect, analyze and print-optimize PDFs." }
  ];

  /* Inline icon set (24x24 stroke icons). */
  var ICONS = {
    merge: '<path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/><path d="M8 12h8M13 9l3 3-3 3"/>',
    split: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.1 15.9M14.5 14.5L20 20M8.1 8.1L12 12"/>',
    compress: '<path d="M4 8h10M4 12h6M4 16h4M16 4v16M16 4l-3 3M16 4l3 3M16 20l-3-3M16 20l3-3"/>',
    rotate: '<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
    extract: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6M9.5 14.5L12 12l2.5 2.5"/>',
    reorder: '<path d="M5 6h14M5 12h9M5 18h4"/><path d="M18 12l3 3-3 3" transform="translate(-2 -3)"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    crop: '<path d="M6 2v14a2 2 0 0 0 2 2h14M18 22V8a2 2 0 0 0-2-2H2"/>',
    resize: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 8h18M8 3v18"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
    text: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
    code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
    office: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 3v18M9 8h11"/>',
    scan: '<path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3"/><path d="M7 12h10"/>',
    pen: '<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/>',
    signature: '<path d="M3 17c3-1 4-8 6-8s1 7 3 7 3-5 5-5 2 4 4 4"/><path d="M3 21h18"/>',
    highlight: '<path d="M9 11l-4 4v4h4l4-4"/><path d="M13 7l4 4-6 6H7l-2-2 8-8z"/><path d="M4 4h16"/>',
    underline: '<path d="M6 4v6a6 6 0 0 0 12 0V4"/><path d="M4 21h16"/>',
    shapes: '<rect x="3" y="3" width="8" height="8" rx="1"/><circle cx="17" cy="17" r="4"/><path d="M14 3l7 7"/>',
    stamp: '<path d="M5 22h14M6 18h12v-2a3 3 0 0 0-3-3H9a3 3 0 0 0-3 3z"/><path d="M9 13V9a3 3 0 0 1 6 0v4"/>',
    hash: '<path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18"/>',
    note: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8M8 13h5"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    unlock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    eraser: '<path d="M20 20H8.5L3 14.5a2 2 0 0 1 0-2.8L11 3.7a2 2 0 0 1 2.8 0l6.5 6.5a2 2 0 0 1 0 2.8L14 20"/><path d="M8 20l-4-4"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
    grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
    sigma: '<path d="M18 7V4H6l6 8-6 8h12v-3"/>',
    search: '<circle cx="11" cy="11" r="7"/><line x1="20" y1="20" x2="16.65" y2="16.65"/>',
    wand: '<path d="M15 4V2M15 10V8M12.5 6h-2M19.5 6h-2M13 7L3 17l4 4L17 7"/><path d="M14 6l4 4"/>',
    eye: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/>',
    gauge: '<path d="M12 20a8 8 0 1 1 8-8"/><path d="M12 12l4-4"/><path d="M20 12h2"/>',
    printer: '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    zoom: '<circle cx="11" cy="11" r="7"/><line x1="20" y1="20" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
    cpu: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/>',
    shieldCheck: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    play: '<polygon points="5 3 19 12 5 21 5 3"/>'
  };

  function svg(name, size) {
    return (
      '<svg viewBox="0 0 24 24" width="' + (size || 18) + '" height="' + (size || 18) +
      '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (ICONS[name] || ICONS.file) + "</svg>"
    );
  }

  /* ======================================================================
     2. Tool registry (46 offline tools)
     ====================================================================== */
  var TOOLS = [
    // --- Management (1-10) ---
    { n: 1, id: "merge-pdf", name: "Merge PDF", cat: "management", icon: "merge", mode: "local", desc: "Combine multiple PDF files into a single document, in any order." },
    { n: 2, id: "split-pdf", name: "Split PDF", cat: "management", icon: "split", mode: "local", desc: "Split a PDF into one or more documents by page ranges." },
    { n: 3, id: "compress-pdf", name: "Compress PDF", cat: "management", icon: "compress", mode: "local", desc: "Reduce PDF size by re-encoding pages at a chosen quality." },
    { n: 4, id: "rotate-pdf", name: "Rotate PDF", cat: "organization", icon: "rotate", mode: "local", desc: "Rotate selected pages by 90°, 180° or 270°." },
    { n: 5, id: "delete-pdf-pages", name: "Delete PDF Pages", cat: "organization", icon: "trash", mode: "local", desc: "Remove unwanted pages with a visual page picker." },
    { n: 6, id: "extract-pdf-pages", name: "Extract PDF Pages", cat: "organization", icon: "extract", mode: "local", desc: "Pull selected pages out into a brand-new PDF." },
    { n: 7, id: "reorder-pdf-pages", name: "Reorder PDF Pages", cat: "organization", icon: "reorder", mode: "local", desc: "Drag thumbnails to rearrange pages and export the new order." },
    { n: 8, id: "duplicate-pdf-pages", name: "Duplicate PDF Pages", cat: "organization", icon: "copy", mode: "local", desc: "Clone selected pages anywhere in the document." },
    { n: 9, id: "crop-pdf", name: "Crop PDF", cat: "management", icon: "crop", mode: "local", desc: "Trim margins with a precise, per-page crop." },
    { n: 10, id: "resize-pdf", name: "Resize PDF", cat: "management", icon: "resize", mode: "local", desc: "Rescale pages to A4, A3, A5, Letter, Legal or a custom size." },

    // --- Conversion (11-20) ---
    { n: 11, id: "jpg-to-pdf", name: "JPG to PDF", cat: "conversion", icon: "image", mode: "local", desc: "Turn one or many JPG photos into a single PDF." },
    { n: 12, id: "png-to-pdf", name: "PNG to PDF", cat: "conversion", icon: "image", mode: "local", desc: "Combine PNG images into one tidy PDF document." },
    { n: 13, id: "pdf-to-jpg", name: "PDF to JPG", cat: "conversion", icon: "image", mode: "local", desc: "Convert each PDF page into a high-quality JPG image." },
    { n: 14, id: "pdf-to-png", name: "PDF to PNG", cat: "conversion", icon: "image", mode: "local", desc: "Export PDF pages as crisp PNG images." },
    { n: 15, id: "txt-to-pdf", name: "TXT to PDF", cat: "conversion", icon: "text", mode: "local", desc: "Convert plain text files into a paginated, readable PDF." },
    { n: 16, id: "html-to-pdf", name: "HTML to PDF", cat: "conversion", icon: "code", mode: "local", desc: "Render HTML markup into a PDF using your browser's engine." },
    { n: 17, id: "pdf-to-text", name: "PDF to Text", cat: "conversion", icon: "text", mode: "local", desc: "Extract the text layer from a PDF into a .txt file." },

    // --- Editing (21-30) ---
    { n: 18, id: "add-text-to-pdf", name: "Add Text to PDF", cat: "editing", icon: "text", mode: "local", desc: "Click anywhere on a page to place custom text." },
    { n: 19, id: "add-image-to-pdf", name: "Add Image to PDF", cat: "editing", icon: "image", mode: "local", desc: "Place, size and position an image on any page." },
    { n: 20, id: "add-signature", name: "Add Signature", cat: "editing", icon: "signature", mode: "local", desc: "Draw a signature and stamp it onto the PDF." },
    { n: 21, id: "highlight-pdf", name: "Highlight PDF", cat: "editing", icon: "highlight", mode: "local", desc: "Draw translucent highlight boxes over page content." },
    { n: 22, id: "underline-pdf", name: "Underline PDF", cat: "editing", icon: "underline", mode: "local", desc: "Draw underlines beneath selected page content." },
    { n: 23, id: "draw-on-pdf", name: "Draw on PDF", cat: "editing", icon: "pen", mode: "local", desc: "Freehand pen, line, rectangle and circle annotations." },
    { n: 24, id: "add-shapes", name: "Add Shapes", cat: "editing", icon: "shapes", mode: "local", desc: "Insert rectangles, circles, lines and arrows." },
    { n: 25, id: "add-watermark", name: "Add Watermark", cat: "editing", icon: "stamp", mode: "local", desc: "Stamp rotated, translucent text across every page." },
    { n: 26, id: "add-page-numbers", name: "Add Page Numbers", cat: "editing", icon: "hash", mode: "local", desc: "Number every page with a position and starting value you choose." },
    { n: 27, id: "pdf-annotation", name: "PDF Annotation", cat: "editing", icon: "note", mode: "local", desc: "Combined notes, highlights and drawings in one editor." },

    // --- Security (31-35) ---
    { n: 28, id: "protect-pdf", name: "Protect PDF", cat: "security", icon: "lock", mode: "local", desc: "Set an owner password and permission flags." },
    { n: 29, id: "unlock-pdf", name: "Unlock PDF", cat: "security", icon: "unlock", mode: "local", desc: "Remove protection from files your browser can open." },
    { n: 30, id: "remove-metadata", name: "Remove Metadata", cat: "security", icon: "eraser", mode: "local", desc: "Strip author, title, subject, keywords and dates." },
    { n: 31, id: "view-pdf-metadata", name: "View PDF Metadata", cat: "security", icon: "info", mode: "local", desc: "Inspect author, producer, dates, pages and file size." },

    // --- Images (36-40) ---
    { n: 32, id: "extract-images", name: "Extract Images from PDF", cat: "images", icon: "image", mode: "local", desc: "Pull embedded images out of a PDF where present." },
    { n: 33, id: "images-to-pdf", name: "Images to PDF", cat: "images", icon: "merge", mode: "local", desc: "Combine mixed JPG/PNG images into one PDF." },
    { n: 34, id: "pdf-image-compressor", name: "PDF Image Compressor", cat: "images", icon: "compress", mode: "local", desc: "Re-encode page imagery at reduced quality." },
    { n: 35, id: "pdf-screenshot", name: "PDF Screenshot Tool", cat: "images", icon: "camera", mode: "local", desc: "Render any page and save it as a screenshot image." },
    { n: 36, id: "contact-sheet", name: "Contact Sheet Maker", cat: "images", icon: "grid", mode: "local", desc: "Generate a thumbnail contact sheet of all pages." },

    // --- Text (41-45) ---
    { n: 37, id: "word-counter", name: "Word Counter", cat: "text", icon: "sigma", mode: "local", desc: "Count words, characters, sentences and paragraphs." },
    { n: 38, id: "find-highlight", name: "Find and Highlight", cat: "text", icon: "search", mode: "local", desc: "Search extracted text with live match highlighting." },
    { n: 39, id: "text-extractor", name: "Text Extractor", cat: "text", icon: "text", mode: "local", desc: "Pull readable text out of a PDF, page by page." },
    { n: 40, id: "text-to-pdf", name: "Text to PDF", cat: "text", icon: "file", mode: "local", desc: "Type or paste text and export a clean PDF." },
    { n: 41, id: "pdf-text-cleaner", name: "PDF Text Cleaner", cat: "text", icon: "wand", mode: "local", desc: "Normalize spaces, empty lines and duplicate breaks." },

    // --- Utilities ---
    { n: 42, id: "pdf-viewer", name: "PDF Viewer", cat: "utilities", icon: "eye", mode: "local", desc: "Zoom, navigate, fullscreen and download in-browser." },
    { n: 43, id: "pdf-file-info", name: "PDF File Information", cat: "utilities", icon: "info", mode: "local", desc: "File name, type, size, pages and timestamps." },
    { n: 44, id: "pdf-page-counter", name: "PDF Page Counter", cat: "utilities", icon: "hash", mode: "local", desc: "Instantly see how many pages a PDF contains." },
    { n: 45, id: "pdf-size-analyzer", name: "PDF Size Analyzer", cat: "utilities", icon: "gauge", mode: "local", desc: "Size, category and basic structure breakdown." },
    { n: 46, id: "pdf-print-optimizer", name: "PDF Print Optimizer", cat: "utilities", icon: "printer", mode: "local", desc: "Prepare a print-ready copy with page size and margins." }
  ];

  var KEYWORDS = {
    "merge-pdf": "combine join append",
    "split-pdf": "divide separate cut",
    "compress-pdf": "reduce shrink size optimize",
    "pdf-to-jpg": "jpeg image export render",
    "pdf-to-png": "image export render",
    "jpg-to-pdf": "photo jpeg convert",
    "png-to-pdf": "picture convert combine",
    "add-text-to-pdf": "write caption insert",
    "add-image-to-pdf": "logo photo insert",
    "add-signature": "sign draw autograph",
    "highlight-pdf": "mark marker emphasis",
    "underline-pdf": "line emphasis mark",
    "draw-on-pdf": "sketch annotate pen",
    "add-shapes": "box arrow geometry",
    "add-watermark": "brand stamp overlay",
    "add-page-numbers": "numbering footer",
    "pdf-annotation": "comment note markup",
    "protect-pdf": "password restrict secure",
    "unlock-pdf": "decrypt remove password",
    "remove-metadata": "privacy scrub clean",
    "view-pdf-metadata": "properties inspect details",
    "extract-images": "pictures assets extract",
    "images-to-pdf": "merge gallery album",
    "pdf-image-compressor": "shrink optimize size",
    "pdf-screenshot": "capture snapshot render",
    "contact-sheet": "overview grid thumbs",
    "word-counter": "count statistics length",
    "find-highlight": "find search match",
    "text-extractor": "extract text copy",
    "text-to-pdf": "write generate create",
    "pdf-text-cleaner": "clean format normalize",
    "pdf-viewer": "read preview open",
    "pdf-file-info": "details inspect about",
    "pdf-page-counter": "count pages total",
    "pdf-size-analyzer": "analysis weight report",
    "pdf-print-optimizer": "print paper margins",
    "delete-pdf-pages": "remove drop pages",
    "extract-pdf-pages": "cut isolate subset",
    "reorder-pdf-pages": "arrange sort move",
    "duplicate-pdf-pages": "copy clone repeat",
    "crop-pdf": "trim margins cut",
    "resize-pdf": "scale dimensions paper",
    "txt-to-pdf": "text document write",
    "html-to-pdf": "web markup render",
    "pdf-to-text": "extract txt copy"
  };

  function toolById(id) {
    for (var i = 0; i < TOOLS.length; i++) if (TOOLS[i].id === id) return TOOLS[i];
    return null;
  }
  function catName(id) {
    for (var i = 0; i < CATEGORIES.length; i++) if (CATEGORIES[i].id === id) return CATEGORIES[i].name;
    return id;
  }
  function searchTools(q) {
    q = (q || "").trim().toLowerCase();
    if (!q) return TOOLS.slice();
    var words = q.split(/\s+/);
    return TOOLS.filter(function (t) {
      var hay = (t.name + " " + t.desc + " " + (KEYWORDS[t.id] || "")).toLowerCase();
      return words.every(function (w) { return hay.indexOf(w) !== -1; });
    });
  }

  /* ======================================================================
     3. Small DOM / format helpers
     ====================================================================== */
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function h(tag, attrs, html) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "class") node.className = attrs[k];
        else if (k === "html") node.innerHTML = attrs[k];
        else if (attrs[k] !== null && attrs[k] !== undefined) node.setAttribute(k, attrs[k]);
      });
    }
    if (html !== undefined) node.innerHTML = html;
    return node;
  }

  function fmtBytes(b) {
    if (b === null || b === undefined || !isFinite(b) || b < 0) return "—";
    if (b === 0) return "0 B";
    var units = ["B", "KB", "MB", "GB"], i = Math.floor(Math.log(b) / Math.log(1024));
    i = Math.min(i, units.length - 1);
    return (b / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1) + " " + units[i];
  }
  function fmtNum(n) {
    if (n === null || n === undefined || !isFinite(n)) return "—";
    return Math.round(n).toLocaleString();
  }
  function fmtDate(d) {
    if (!d || isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  }
  function parsePdfDate(v) {
    var m = typeof v === "string" && v.match(/^D:(\d{4})(\d\d)?(\d\d)?(\d\d)?(\d\d)?(\d\d)?(Z|[+-]\d\d)?'?(\d\d)?/);
    if (!m) return null;
    var t = Date.UTC(+m[1], (+m[2] || 1) - 1, +m[3] || 1, +m[4] || 0, +m[5] || 0, +m[6] || 0);
    if (m[7] && m[7] !== "Z") t -= (parseInt(m[7], 10) * 60 + (m[7][0] === "-" ? -1 : 1) * (+m[8] || 0)) * 60000;
    return new Date(t);
  }
  function baseName(name) { return (name || "document").replace(/\.[^.]+$/, "") || "document"; }

  /** A user-facing error. Thrown to unwind a tool, caught by runTool(). */
  function ToolError(message) { this.message = message; this.name = "ToolError"; }
  ToolError.prototype = Object.create(Error.prototype);
  function fail(message) { throw new ToolError(message); }

  function download(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }
  function downloadDataUrl(dataUrl, filename) {
    var a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  function dataUrlToBlob(dataUrl) {
    var parts = dataUrl.split(",");
    var mime = (parts[0].match(/:(.*?);/) || [])[1] || "application/octet-stream";
    var bin = atob(parts[1]);
    var arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }
  function pdfBlob(bytes) {
    return new Blob([bytes], { type: "application/pdf" });
  }

  function parseRanges(input, count) {
    var text = (input || "").trim();
    if (!text) fail("Enter a page range, e.g. 1-3, 5.");
    var out = {};
    text.split(/[,;]/).forEach(function (part) {
      var chunk = part.trim();
      if (!chunk) return;
      var m = chunk.match(/^(\d+)\s*(?:-|–|to)\s*(\d+)$/i) || chunk.match(/^(\d+)$/);
      if (!m) fail('"' + chunk + '" is not a valid page or range (use e.g. 1-3, 5).');
      var a = parseInt(m[1], 10);
      var b = m[2] ? parseInt(m[2], 10) : a;
      if (a < 1 || b < a) fail('Invalid range "' + chunk + '".');
      for (var p = a; p <= b; p++) {
        if (p < 1 || p > count) fail("Page " + p + " is out of range (this PDF has " + count + " pages).");
        out[p] = true;
      }
    });
    var list = Object.keys(out).map(Number).sort(function (x, y) { return x - y; });
    if (!list.length) fail("Select at least one page.");
    return list;
  }

  /** pdf-lib has no text wrapper, so measure and wrap manually. */
  function wrapText(text, font, size, maxWidth) {
    var lines = [];
    String(text).replace(/\r\n?/g, "\n").split("\n").forEach(function (raw) {
      if (!raw.trim()) { lines.push(""); return; }
      var line = "";
      raw.split(/\s+/).forEach(function (word) {
        var candidate = line ? line + " " + word : word;
        if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !line) line = candidate;
        else { lines.push(line); line = word; }
      });
      lines.push(line);
    });
    return lines;
  }

  /* ======================================================================
     4. PDF engine (pdf.js reader + pdf-lib writer)
     ====================================================================== */
  var pdfjsReady = false;
  function initPdfJs() {
    if (pdfjsReady || !window.pdfjsLib) return;
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      "vendor/pdf.worker.min.js";
    pdfjsReady = true;
  }
  function requirePdfLib() {
    if (!window.PDFLib) fail("The PDF engine (pdf-lib) could not be loaded. Make sure the vendor/ folder sits next to index.html.");
  }
  function requirePdfJs() {
    initPdfJs();
    if (!window.pdfjsLib) fail("The PDF reader (pdf.js) could not be loaded. Make sure the vendor/ folder sits next to index.html.");
  }

  /** Open a PDF for reading/rendering. Throws a friendly error on failure. */
  function readPdf(file) {
    requirePdfJs();
    return file.arrayBuffer().then(function (buf) {
      return window.pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
    }).catch(function (err) {
      var msg = (err && err.message) || "";
      if (/password/i.test(msg)) fail("This PDF is password-protected. Remove the password first, then try again.");
      fail("Could not read this file. It may be corrupted or not a valid PDF.");
    });
  }

  /** Render one page (1-based) to a canvas. */
  function renderPage(doc, pageNumber, scale) {
    return doc.getPage(pageNumber).then(function (page) {
      var viewport = page.getViewport({ scale: scale || 1.5 });
      var canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));
      var ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return page.render({ canvasContext: ctx, viewport: viewport }).promise.then(function () {
        return { canvas: canvas, width: canvas.width, height: canvas.height, viewport: viewport };
      });
    });
  }

  /** Open a PDF for writing with pdf-lib. */
  function writePdf(file) {
    requirePdfLib();
    return file.arrayBuffer().then(function (buf) {
      return window.PDFLib.PDFDocument.load(new Uint8Array(buf), { ignoreEncryption: true }).then(function (d) {
        if (d.isEncrypted) fail("This PDF is password-protected. Use Unlock PDF first.");
        return d;
      });
    }).catch(function (err) {
      if (err instanceof ToolError) throw err;
      fail("Could not parse this PDF. It may be corrupted or use unsupported encryption.");
    });
  }
  /* PDFDocument.create() is async, but every tool needs the document right away,
     so build the empty document synchronously (same steps create() performs). */
  function newPdf() {
    requirePdfLib();
    var L = window.PDFLib;
    var ctx = L.PDFContext.create();
    var tree = L.PDFPageTree.withContext(ctx);
    var treeRef = ctx.register(tree);
    var catalog = L.PDFCatalog.withContextAndPages(ctx, treeRef);
    ctx.trailerInfo.Root = ctx.register(catalog);
    return new L.PDFDocument(ctx, false, true);
  }
  function embedFont(doc, key) {
    var standards = (window.PDFLib && window.PDFLib.StandardFonts) || {};
    var name = FONT_KEYS[key] || FONT_KEYS.Helvetica;
    return doc.embedFont(standards[name] || name);
  }
  function hexColor(hex, alpha) {
    var m = String(hex || "#000000").replace("#", "");
    if (m.length === 3) m = m[0] + m[0] + m[1] + m[1] + m[2] + m[2];
    var v = parseInt(m, 16);
    return window.PDFLib.rgb(((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255, alpha);
  }

  /* ======================================================================
     5. Static content rendering
     ====================================================================== */
  function renderCategories() {
    var wrap = qs("#categories");
    wrap.innerHTML = "";
    CATEGORIES.forEach(function (cat) {
      var tools = TOOLS.filter(function (t) { return t.cat === cat.id; });
      var sec = h("section", { class: "category", id: "cat-" + cat.id });
      sec.innerHTML =
        '<div class="category-head"><div><h3>' + cat.name + '</h3><p class="muted">' + cat.blurb + "</p></div>" +
        '<span class="category-count">' + tools.length + " tools</span></div>";
      var grid = h("div", { class: "tool-grid" });
      tools.forEach(function (t) { grid.appendChild(toolCard(t)); });
      sec.appendChild(grid);
      wrap.appendChild(sec);
    });
  }

  function toolCard(t) {
    var a = h("a", { class: "tool-card", href: "#tool/" + t.id });
    a.innerHTML =
      '<span class="icon">' + svg(t.icon, 20) + "</span>" +
      "<h3>" + t.name + "" + "</h3>" +
      "<p>" + t.desc + "</p>";
    a.setAttribute("data-tool", t.id);
    return a;
  }

  function renderChips() {
    var row = qs("#categoryChips");
    row.innerHTML = "";
    var all = h("button", { class: "chip", type: "button", "aria-pressed": "true", "data-cat": "" }, "All tools");
    row.appendChild(all);
    CATEGORIES.forEach(function (c) {
      row.appendChild(h("button", { class: "chip", type: "button", "aria-pressed": "false", "data-cat": c.id }, c.name));
    });
    row.addEventListener("click", function (e) {
      var btn = e.target.closest(".chip");
      if (!btn) return;
      qsa(".chip", row).forEach(function (c) { c.setAttribute("aria-pressed", String(c === btn)); });
      filterByCategory(btn.getAttribute("data-cat"));
    });
  }

  var activeQuery = "";
  var activeCategory = "";
  function filterByCategory(cat) { activeCategory = cat || ""; applyFilters(); }

  function applyFilters() {
    var list = searchTools(activeQuery);
    if (activeCategory) list = list.filter(function (t) { return t.cat === activeCategory; });
    var wrap = qs("#categories");
    wrap.innerHTML = "";
    if (!list.length) {
      qs("#noResults").hidden = false;
      return;
    }
    qs("#noResults").hidden = true;

    // group by category, preserving registry order
    CATEGORIES.forEach(function (cat) {
      var tools = list.filter(function (t) { return t.cat === cat.id; });
      if (!tools.length) return;
      var sec = h("section", { class: "category", id: "cat-" + cat.id });
      sec.innerHTML =
        '<div class="category-head"><div><h3>' + cat.name + '</h3><p class="muted">' + cat.blurb + "</p></div>" +
        '<span class="category-count">' + tools.length + " tools</span></div>";
      var grid = h("div", { class: "tool-grid" });
      tools.forEach(function (t) { grid.appendChild(toolCard(t)); });
      sec.appendChild(grid);
      wrap.appendChild(sec);
    });
  }

  function renderStatic() {
    var features = [
      ["cpu", "Local processing", "Files are processed in your browser — most never touch a server."],
      ["play", "Instant results", "No queues, no uploads waiting. Tools finish in the time it takes to click Download."],
      ["shield", "Honest privacy", "Everything runs offline in your browser — no API, no uploads."],
      ["grid", "One consistent UI", "Every tool follows the same upload → configure → download flow."]
    ];
    var fg = qs("#featureGrid");
    fg.innerHTML = features.map(function (f) {
      return '<div class="feature"><span class="icon">' + svg(f[0], 20) + "</span><h3>" + f[1] + "</h3><p>" + f[2] + "</p></div>";
    }).join("");

    var steps = [
      ["search", "Choose a Tool", "Select the PDF tool you need from the toolbox."],
      ["upload", "Upload Your File", "Drag and drop your PDF — or tap to browse."],
      ["download", "Download Result", "Process the file and download the result instantly."]
    ];
    qs("#steps").innerHTML = steps.map(function (s, i) {
      return '<li class="step"><span class="step-num">' + (i + 1) + '</span><span class="icon">' + svg(s[0], 20) +
        "</span><h3>" + s[1] + "</h3><p>" + s[2] + "</p></li>";
    }).join("");

    qs("#privacyList").innerHTML = [
      "Local tools process files entirely on your device",
      "No accounts, no tracking of your documents",
      "Works fully offline — no API, no server, no uploads",
      "Files are discarded the moment you close the tab"
    ].map(function (t) { return "<li>" + t + "</li>"; }).join("");

    var localCount = TOOLS.filter(function (t) { return t.mode === "local"; }).length;
    var pct = Math.round((localCount / TOOLS.length) * 100);
    qs("#localRatio").textContent = localCount + " of " + TOOLS.length + " tools run 100% in your browser";
    qs("#localBar").style.width = pct + "%";
  }

  var FAQS = [
    ["Are these PDF tools free?", "Yes — every tool is free to use, with no sign-up and no watermarks on your documents."],
    ["Is my PDF uploaded to a server?", "For most tools, no. Processing happens entirely inside your browser using pdf-lib and pdf.js. Everything runs offline — there are no API-based tools."],
    ["Can I use the tools on mobile?", "Absolutely. The site is fully responsive — drag & drop is replaced by tapping to pick files on mobile."],
    ["What PDF file sizes are supported?", "Each tool accepts files up to 100 MB. Because processing happens locally, the practical limit depends on your device's memory."],
    ["Can I merge multiple PDFs?", "Yes. Merge PDF accepts unlimited files, lets you reorder them with the arrow buttons, and combines them into a single document."],
    ["Can I compress a PDF?", "Yes — choose light, medium or strong compression and the tool re-renders each page, showing the original size, compressed size and percentage saved."],
    ["Can I protect a PDF with a password?", "Yes — Protect PDF adds a real open-password and permission flags (copy, print, modify). The file is encrypted in your browser, so it asks for the password to open."],
    ["Do I need to install software?", "No installation, no plugins. Everything runs in a modern browser — Chrome, Edge, Firefox or Safari."]
  ];
  function renderFaq() {
    qs("#faqList").innerHTML = FAQS.map(function (f, i) {
      return (
        '<div class="faq-item"><button class="faq-q" type="button" aria-expanded="false" data-faq="' + i + '">' +
        "<span>" + f[0] + '</span><span class="chev">' + svg("rotate", 16) + "</span></button>" +
        '<div class="faq-a" hidden>' + f[1] + "</div></div>"
      );
    }).join("");
    qs("#faqList").addEventListener("click", function (e) {
      var btn = e.target.closest(".faq-q");
      if (!btn) return;
      var open = btn.getAttribute("aria-expanded") === "true";
      var panel = btn.nextElementSibling;
      btn.setAttribute("aria-expanded", String(!open));
      panel.hidden = open;
    });
  }

  /* ======================================================================
     6. Theme, mobile nav, search
     ====================================================================== */
  function initTheme() {
    var stored = null;
    try { stored = sessionStorage.getItem("pdfmaster-theme"); } catch (e) { /* private mode */ }
    var theme = stored || (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    applyTheme(theme);
    qs("#themeToggle").addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      try { sessionStorage.setItem("pdfmaster-theme", next); } catch (e) { /* ignore */ }
    });
  }
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    var btn = qs("#themeToggle");
    btn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#171514" : "#ffffff");
  }

  function initNav() {
    var nav = qs("#primaryNav");
    var toggle = qs("#navToggle");
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  function pickTool(pdfs) {
    var ov = h("div", { class: "modal-overlay" });
    var box = h("div", { class: "modal-box", role: "dialog", "aria-modal": "true" });
    box.appendChild(h("h3", null, "What do you want to do with this PDF?"));
    box.appendChild(h("p", { class: "muted small" }, pdfs[0].name));
    var g = h("div", { class: "modal-grid" });
    ["merge-pdf", "split-pdf", "compress-pdf", "rotate-pdf", "pdf-to-jpg", "add-watermark", "add-page-numbers", "pdf-viewer"].forEach(function (id) {
      var b = h("button", { class: "btn btn-ghost", type: "button" }, toolById(id).name);
      b.addEventListener("click", function () { window.PDFMASTER_PENDING = pdfs; ov.remove(); location.hash = "tool/" + id; });
      g.appendChild(b);
    });
    box.appendChild(g);
    var cancel = h("button", { class: "btn btn-outline btn-sm", type: "button" }, "Cancel");
    cancel.addEventListener("click", function () { ov.remove(); });
    box.appendChild(cancel);
    ov.appendChild(box);
    ov.addEventListener("click", function (e) { if (e.target === ov) ov.remove(); });
    document.body.appendChild(ov);
  }

  function initSearch() {
    var input = qs("#toolSearch");
    var navInput = qs("#navSearch");
    var panel = qs("#searchPanel");
    var navResults = qs("#navSearchResults");

    input.addEventListener("input", function () {
      activeQuery = input.value;
      applyFilters();
    });

    qs("#searchToggle").addEventListener("click", function () {
      var show = panel.hasAttribute("hidden");
      if (show) { panel.removeAttribute("hidden"); navInput.focus(); }
      else panel.setAttribute("hidden", "");
      qs("#searchToggle").setAttribute("aria-expanded", String(show));
    });

    function renderNavResults() {
      var q = navInput.value.trim();
      if (!q) { navResults.setAttribute("hidden", ""); navResults.innerHTML = ""; return; }
      var list = searchTools(q).slice(0, 8);
      navResults.removeAttribute("hidden");
      navResults.innerHTML = list.length
        ? list.map(function (t) {
            return '<button type="button" role="option" data-go="#tool/' + t.id + '">' + svg(t.icon, 16) +
              "<span>" + t.name + '</span><span class="sr-cat">' + catName(t.cat) + "</span></button>";
          }).join("")
        : '<p class="empty">No tools found. Try another search.</p>';
    }
    navInput.addEventListener("input", renderNavResults);
    navInput.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { panel.setAttribute("hidden", ""); qs("#searchToggle").setAttribute("aria-expanded", "false"); }
      if (e.key === "Enter") {
        var first = navResults.querySelector("button");
        if (first) { location.hash = first.getAttribute("data-go").slice(1); panel.setAttribute("hidden", ""); }
      }
    });
    navResults.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-go]");
      if (!btn) return;
      location.hash = btn.getAttribute("data-go").slice(1);
      panel.setAttribute("hidden", "");
    });
    document.addEventListener("click", function (e) {
      if (!panel.contains(e.target) && e.target !== qs("#searchToggle")) {
        panel.setAttribute("hidden", "");
        qs("#searchToggle").setAttribute("aria-expanded", "false");
      }
    });

    // Hero dropzone: send the picked PDF to a sensible tool.
    var dz = qs("#dropzone");
    var fileInput = qs("#heroInput");
    function accept(files) {
      var pdfs = Array.prototype.filter.call(files, function (f) { return /\.pdf$/i.test(f.name) || f.type === "application/pdf"; });
      if (!pdfs.length) { alert("Please choose a PDF file."); return; }
      pickTool(pdfs);
    }
    dz.addEventListener("click", function () { fileInput.click(); });
    dz.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInput.click(); }
    });
    fileInput.addEventListener("change", function () { accept(fileInput.files); fileInput.value = ""; });
    ["dragenter", "dragover"].forEach(function (evt) {
      dz.addEventListener(evt, function (e) { e.preventDefault(); dz.classList.add("dragover"); });
    });
    ["dragleave", "drop"].forEach(function (evt) {
      dz.addEventListener(evt, function (e) { e.preventDefault(); dz.classList.remove("dragover"); });
    });
    dz.addEventListener("drop", function (e) { if (e.dataTransfer && e.dataTransfer.files) accept(e.dataTransfer.files); });
  }

  /* ======================================================================
     7. Reusable tool UI
     ====================================================================== */
  /** Alert box. kind: "error" | "warn" | "ok" */
  function alertBox(kind, message) {
    return h("p", { class: "alert alert-" + kind, role: kind === "error" ? "alert" : "status" }, message);
  }

  function privacyNote(server) {
    var el = h("p", { class: "note" + (server ? " server" : "") });
    el.innerHTML = svg(server ? "upload" : "shieldCheck", 16) +
      "<span>" + (server
        ? "Advanced processing for this feature requires a PDF processing library or server-side API — the file may need to be uploaded for processing."
        : "Your files are processed locally whenever possible — they never leave your device.") + "</span>";
    return el;
  }

  function field(labelText, control, hint) {
    var wrap = h("div", { class: "field" });
    var id = "f" + Math.random().toString(36).slice(2, 8);
    var lab = h("label", { for: id }, labelText);
    control.id = id;
    wrap.appendChild(lab);
    wrap.appendChild(control);
    if (hint) wrap.appendChild(h("span", { class: "hint" }, hint));
    return wrap;
  }
  function input(attrs) { return h("input", Object.assign({ type: "text" }, attrs || {})); }
  function select(options, value) {
    var s = h("select");
    options.forEach(function (o) {
      var opt = h("option", { value: o[0] }, o[1]);
      if (o[0] === value) opt.selected = true;
      s.appendChild(opt);
    });
    return s;
  }
  function textarea(attrs) { return h("textarea", attrs || {}); }
  function checkboxRow(labelText, checked) {
    var inputEl = h("input", { type: "checkbox" });
    inputEl.checked = !!checked;
    var lab = h("label", { class: "checkbox-row" });
    lab.appendChild(inputEl);
    lab.appendChild(h("span", null, labelText));
    lab.input = inputEl;
    return lab;
  }

  function progressBox() {
    var wrap = h("div", { class: "progress" });
    var track = h("div", { class: "progress-track", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": "0" });
    var fill = h("div", { class: "progress-fill" });
    var label = h("p", { class: "progress-label" }, "Processing…");
    track.appendChild(fill);
    wrap.appendChild(track);
    wrap.appendChild(label);
    wrap.set = function (pct, text) {
      var v = Math.max(0, Math.min(100, Math.round(pct || 0)));
      fill.style.width = v + "%";
      track.setAttribute("aria-valuenow", String(v));
      label.textContent = text || ("Processing… " + v + "%");
    };
    return wrap;
  }

  function resultBox(title, size, onDownload, filename) {
    var box = h("div", { class: "result" });
    box.innerHTML = '<span class="result-icon">' + svg("download", 20) + "</span>";
    var info = h("div", { class: "result-info" });
    info.appendChild(h("strong", null, title));
    if (size !== undefined) info.appendChild(h("span", null, fmtBytes(size)));
    box.appendChild(info);
    var btn = h("button", { class: "btn btn-primary", type: "button" }, "Download");
    btn.addEventListener("click", onDownload);
    box.appendChild(btn);
    return box;
  }

  function statsBox(pairs) {
    var dl = h("dl", { class: "stats" });
    pairs.forEach(function (p) {
      var d = h("div", { class: "stat" });
      d.appendChild(h("dt", null, p[0]));
      d.appendChild(h("dd", null, p[1]));
      dl.appendChild(d);
    });
    return dl;
  }

  /**
   * Reusable upload component.
   * opts: { accept, multiple, label, hint, reorder, onFiles }
   * Returns { node, files, addFiles, clear, setFiles }
   */
  function uploader(opts) {
    opts = opts || {};
    var files = [];
    var node = h("div");
    var inputEl = h("input", { type: "file", accept: opts.accept || ".pdf,application/pdf", hidden: "hidden" });
    if (opts.multiple) inputEl.multiple = true;

    var area = h("div", { class: "upload", tabindex: "0", role: "button" });
    area.innerHTML =
      '<span class="icon">' + svg("upload", 24) + "</span>" +
      "<strong>" + (opts.label || "Drag & Drop PDF Files Here") + "</strong>" +
      '<span class="muted small">or <span class="link">choose files</span></span>' +
      '<span class="muted tiny">Max ' + (opts.maxSizeMb || MAX_FILE_MB) + " MB per file · files stay on your device</span>";

    var listWrap = h("div", { hidden: "hidden" });
    var listHead = h("div", { class: "file-list-head" });
    var listTitle = h("h3", null, "Uploaded files");
    var clearBtn = h("button", { class: "btn btn-outline btn-sm", type: "button" }, "Clear all");
    listHead.appendChild(listTitle);
    listHead.appendChild(clearBtn);
    var list = h("ul", { class: "file-list" });
    listWrap.appendChild(listHead);
    listWrap.appendChild(list);
    node.appendChild(area);
    node.appendChild(inputEl);
    node.appendChild(listWrap);

    function validate(fileList) {
      var accepted = [];
      var rejected = [];
      Array.prototype.forEach.call(fileList, function (f) {
        var accept = opts.accept || ".pdf,application/pdf";
        var ok;
        if (accept === "image/*") ok = /^image\//.test(f.type);
        else ok = accept.split(",").some(function (a) {
          a = a.trim().toLowerCase();
          return f.type === a || f.name.toLowerCase().slice(-a.length) === a;
        });
        if (!ok) rejected.push('"' + f.name + '" is not a supported file type.');
        else if (f.size > (opts.maxSizeMb || MAX_FILE_MB) * 1024 * 1024) {
          rejected.push('"' + f.name + '" is ' + fmtBytes(f.size) + " — the limit for this tool is " + (opts.maxSizeMb || MAX_FILE_MB) + " MB.");
        } else accepted.push(f);
      });
      return { accepted: accepted, rejected: rejected };
    }

    function addFiles(fileList) {
      var v = validate(fileList);
      if (v.rejected.length) node.insertBefore(alertBox("error", v.rejected[0]), area.nextSibling);
      else {
        var old = qs(".alert-error", node);
        if (old) old.remove();
      }
      if (!v.accepted.length) return;
      if (opts.multiple) files = files.concat(v.accepted);
      else files = v.accepted.slice(-1);
      renderList();
      if (opts.onFiles) opts.onFiles(files);
    }

    function removeAt(i) { files.splice(i, 1); renderList(); if (opts.onFiles) opts.onFiles(files); }
    function move(i, dir) {
      var j = i + dir;
      if (j < 0 || j >= files.length) return;
      var tmp = files[i]; files[i] = files[j]; files[j] = tmp;
      renderList();
      if (opts.onFiles) opts.onFiles(files);
    }
    function clear() { files = []; renderList(); if (opts.onFiles) opts.onFiles(files); }

    function renderList() {
      listWrap.toggleAttribute("hidden", files.length === 0);
      listTitle.textContent = "Uploaded files (" + files.length + ")";
      list.innerHTML = "";
      files.forEach(function (f, i) {
        var li = h("li", { class: "file-row" });
        if (/^image\//.test(f.type)) {
          var img = h("img", { class: "file-thumb", alt: "" });
          img.src = URL.createObjectURL(f);
          li.appendChild(img);
        } else {
          li.appendChild(h("span", { class: "file-thumb", html: svg("file", 16) }));
        }
        var meta = h("div", { class: "file-meta" });
        meta.appendChild(h("strong", null, (opts.multiple ? i + 1 + ". " : "") + f.name));
        meta.appendChild(h("span", null, fmtBytes(f.size)));
        li.appendChild(meta);

        if (opts.reorder && files.length > 1) {
          var ro = h("div", { class: "file-reorder" });
          var up = h("button", { type: "button", "aria-label": "Move " + f.name + " up" }, "↑");
          var down = h("button", { type: "button", "aria-label": "Move " + f.name + " down" }, "↓");
          up.disabled = i === 0;
          down.disabled = i === files.length - 1;
          up.addEventListener("click", function () { move(i, -1); });
          down.addEventListener("click", function () { move(i, 1); });
          ro.appendChild(up); ro.appendChild(down);
          li.appendChild(ro);
        }
        var rm = h("button", { class: "file-remove", type: "button", "aria-label": "Remove " + f.name }, "✕");
        rm.addEventListener("click", function () { removeAt(i); });
        li.appendChild(rm);
        list.appendChild(li);
      });
    }

    area.addEventListener("click", function () { inputEl.click(); });
    area.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputEl.click(); }
    });
    ["dragenter", "dragover"].forEach(function (evt) {
      area.addEventListener(evt, function (e) { e.preventDefault(); area.classList.add("dragover"); });
    });
    ["dragleave", "drop"].forEach(function (evt) {
      area.addEventListener(evt, function (e) { e.preventDefault(); area.classList.remove("dragover"); });
    });
    area.addEventListener("drop", function (e) { if (e.dataTransfer && e.dataTransfer.files) api.addFiles(e.dataTransfer.files); });
    inputEl.addEventListener("change", function () { api.addFiles(inputEl.files); inputEl.value = ""; });
    clearBtn.addEventListener("click", clear);

    var api = { node: node, files: function () { return files; }, addFiles: addFiles, clear: clear };
    return api;
  }

  /** Wraps a run() function with busy state, progress, and error handling. */
  function actionButton(label, run, progress) {
    var btn = h("button", { class: "btn btn-primary", type: "button" }, label);
    btn.addEventListener("click", function () {
      var old = btn.textContent;
      btn.disabled = true;
      btn.textContent = "Working…";
      var prog = progress || progressBox();
      prog.set(0, "Working…");
      btn.parentNode.insertBefore(prog, btn.nextSibling);
      Promise.resolve()
        .then(function () { return run(prog); })
        .catch(function (err) {
          prog.remove();
          var msg = (err && err.message) || "Something went wrong. Please try again.";
          if (/cannot encode/i.test(msg)) msg = "This text has characters (for example Sinhala or Tamil) that the built-in PDF fonts cannot draw. Use English/Latin text for this tool.";
          var oldErr = btn.parentNode.querySelector(".alert-error"); if (oldErr) oldErr.remove();
          var box = alertBox("error", msg);
          btn.parentNode.insertBefore(box, btn.nextSibling);
        })
        .then(function () {
          btn.disabled = false;
          btn.textContent = old;
          if (prog.parentNode) prog.remove();
        });
    });
    return btn;
  }

  /** Page thumbnail picker built from pdf.js. */
  function pagePicker(file, onChange) {
    var wrap = h("div");
    var selected = {};
    var grid = h("div", { class: "page-grid" });
    var countLabel = h("p", { class: "muted small" }, "Loading preview…");
    wrap.appendChild(countLabel);
    wrap.appendChild(grid);

    readPdf(file).then(function (doc) {
      countLabel.textContent = doc.numPages + " page" + (doc.numPages === 1 ? "" : "s") + " · click a page to select it.";
      var jobs = [];
      for (var i = 1; i <= doc.numPages; i++) {
        (function (n) {
          jobs.push(renderPage(doc, n, 0.32).then(function (r) {
            var btn = h("button", { class: "page-thumb", type: "button", "aria-pressed": "false", "aria-label": "Select page " + n });
            btn.innerHTML = '<img alt="Page ' + n + '" src="' + r.canvas.toDataURL("image/jpeg", 0.7) + '">' +
              '<span class="page-num">' + n + '</span><span class="page-check">✓</span>';
            btn.addEventListener("click", function () {
              selected[n] = !selected[n];
              btn.setAttribute("aria-pressed", String(!!selected[n]));
              if (onChange) onChange(Object.keys(selected).filter(function (k) { return selected[k]; }).map(Number));
            });
            grid.appendChild(btn);
          }));
        })(i);
      }
      return Promise.all(jobs).then(function () {
        Array.prototype.slice.call(grid.children).sort(function (x, y) {
          return parseInt(x.querySelector(".page-num").textContent, 10) - parseInt(y.querySelector(".page-num").textContent, 10);
        }).forEach(function (c) { grid.appendChild(c); });
      });
    }).catch(function (err) {
      wrap.innerHTML = "";
      wrap.appendChild(alertBox("error", err.message));
    });

    wrap.selection = function () {
      return Object.keys(selected).filter(function (k) { return selected[k]; }).map(Number).sort(function (a, b) { return a - b; });
    };
    return wrap;
  }

  /* ======================================================================
     8. Tool handlers
     Each handler receives the page root and renders its own UI.
     ====================================================================== */
  var HANDLERS = {};

  /* ---------------- Management ---------------- */

  HANDLERS["merge-pdf"] = function (root) {
    var up = uploader({ multiple: true, reorder: true });
    var out = h("div");
    root.appendChild(up.node);
    root.appendChild(out);
    var toolbar = h("div", { class: "toolbar" });
    var btn = actionButton("Merge PDFs", function () {
      if (up.files().length < 2) fail("Add at least two PDF files to merge.");
      var target = out;
      return Promise.all(up.files().map(writePdf)).then(function (docs) {
        var merged = newPdf();
        var chain = Promise.resolve();
        docs.forEach(function (src) {
          chain = chain.then(function () {
            return merged.copyPages(src, src.getPageIndices()).then(function (pages) {
              pages.forEach(function (p) { merged.addPage(p); });
            });
          });
        });
        return chain.then(function () { return merged.save(); });
      }).then(function (bytes) {
        var blob = pdfBlob(bytes);
        target.innerHTML = "";
        target.appendChild(resultBox("Merged PDF", blob.size, function () { download(blob, "merged.pdf"); }));
      });
    });
    toolbar.appendChild(btn);
    toolbar.appendChild(privacyNote(false));
    root.appendChild(toolbar);
  };

  HANDLERS["split-pdf"] = function (root) {
    var up = uploader({});
    var controls = h("div", { class: "control-grid cols-3" });
    var modeSel = select([["ranges", "Custom ranges"], ["interval", "Fixed interval"]]);
    var rangesInput = input({ placeholder: "1-3, 4, 5-8" });
    var intervalInput = input({ type: "number", min: "1", value: "1" });
    controls.appendChild(field("Split mode", modeSel));
    controls.appendChild(field("Page ranges (one group per file)", rangesInput, "Each comma group becomes its own PDF."));
    controls.appendChild(field("Pages per file", intervalInput));
    var out = h("div");
    root.appendChild(up.node);
    root.appendChild(controls);
    root.appendChild(h("div", { class: "toolbar" }));
    root.appendChild(out);
    var btn = actionButton("Split PDF", function (prog) {
      if (!up.files().length) fail("Please select a PDF file first.");
      var file = up.files()[0];
      var groups;
      return writePdf(file).then(function (doc) {
        var count = doc.getPageCount();
        prog.set(10, "Reading document…");
        if (modeSel.value === "interval") {
          var n = Math.max(1, parseInt(intervalInput.value, 10) || 0);
          groups = [];
          for (var i = 1; i <= count; i += n) {
            var g = [];
            for (var p = i; p < i + n && p <= count; p++) g.push(p);
            groups.push(g);
          }
        } else {
          groups = rangesInput.value.split(",").filter(function (s) { return s.trim(); })
            .map(function (s) { return parseRanges(s, count); });
          if (!groups.length) fail("Enter at least one page range, e.g. 1-3, 4.");
        }
        var base = baseName(file.name);
        var blobs = [];
        var chain = Promise.resolve();
        groups.forEach(function (group, idx) {
          chain = chain.then(function () {
            var part = newPdf();
            return part.copyPages(doc, group.map(function (g) { return g - 1; })).then(function (pages) {
              pages.forEach(function (pg) { part.addPage(pg); });
              return part.save();
            }).then(function (bytes) {
              blobs.push({ blob: pdfBlob(bytes), name: base + "-part" + (idx + 1) + ".pdf" });
              prog.set(10 + (80 * (idx + 1)) / groups.length, "Building part " + (idx + 1) + " of " + groups.length + "…");
            });
          });
        });
        return chain.then(function () { return { doc: doc, blobs: blobs, base: base }; });
      }).then(function (r) {
        out.innerHTML = "";
        out.appendChild(h("p", { class: "muted small" }, r.blobs.length + " file" + (r.blobs.length > 1 ? "s" : "") + " ready — each downloads separately."));
        r.blobs.forEach(function (b) {
          out.appendChild(resultBox(b.name, b.blob.size, (function (bb) {
            return function () { download(bb.blob, bb.name); };
          })(b)));
        });
      });
    });
    qs(".toolbar", root).appendChild(btn);
    qs(".toolbar", root).appendChild(privacyNote(false));
  };

  HANDLERS["compress-pdf"] = function (root) {
    var up = uploader({});
    var controls = h("div", { class: "control-grid" });
    var level = select([["light", "Light — best quality"], ["medium", "Medium — balanced"], ["strong", "Strong — smallest file"]], "medium");
    controls.appendChild(field("Compression level", level));
    var out = h("div");
    root.appendChild(up.node);
    root.appendChild(controls);
    root.appendChild(h("div", { class: "toolbar" }));
    root.appendChild(out);
    var btn = actionButton("Compress PDF", function (prog) {
      if (!up.files().length) fail("Please select a PDF file first.");
      var file = up.files()[0];
      var q = level.value === "light" ? 0.75 : level.value === "strong" ? 0.45 : 0.6;
      var scale = level.value === "light" ? 1.5 : level.value === "strong" ? 1.0 : 1.25;
      var doc;
      return readPdf(file).then(function (d) {
        doc = d;
        var target = newPdf();
        var chain = Promise.resolve();
        for (var i = 1; i <= d.numPages; i++) {
          (function (n) {
            chain = chain.then(function () {
              return renderPage(d, n, scale).then(function (r) {
                return target.embedJpg(r.canvas.toDataURL("image/jpeg", q)).then(function (img) {
                  var page = target.addPage([r.width / scale, r.height / scale]);
                  page.drawImage(img, { x: 0, y: 0, width: r.width / scale, height: r.height / scale });
                  prog.set((n / d.numPages) * 95, "Re-encoding page " + n + " of " + d.numPages + "…");
                });
              });
            });
          })(i);
        }
        return chain.then(function () { return target.save({ useObjectStreams: true }); });
      }).then(function (bytes) {
        if (bytes.length < file.size) return { bytes: bytes, method: "Image re-encoding (text is no longer selectable)" };
        // Rasterizing made it bigger — fall back to a lossless re-save that keeps text.
        return writePdf(file).then(function (d) { return d.save({ useObjectStreams: true }); }).catch(function () { return null; }).then(function (lossless) {
          if (lossless && lossless.length < file.size) return { bytes: lossless, method: "Lossless optimization (text kept)" };
          return { bytes: null };
        });
      }).then(function (res) {
        out.innerHTML = "";
        if (!res.bytes) {
          out.appendChild(alertBox("warn", "This PDF is already well optimized — no smaller version could be made offline. Keep your original file."));
          return;
        }
        var blob = pdfBlob(res.bytes);
        var pct = Math.round(((file.size - blob.size) / file.size) * 100);
        out.appendChild(statsBox([
          ["Original size", fmtBytes(file.size)],
          ["Compressed size", fmtBytes(blob.size)],
          ["Reduction", pct + "%"],
          ["Method", res.method]
        ]));
        out.appendChild(resultBox("Compressed PDF", blob.size, function () { download(blob, "compressed.pdf"); }));
      });
    });
    qs(".toolbar", root).appendChild(btn);
    qs(".toolbar", root).appendChild(privacyNote(false));
  };

  HANDLERS["rotate-pdf"] = function (root) {
    var up = uploader({});
    var controls = h("div", { class: "control-grid" });
    var pages = input({ value: "all", placeholder: "all" });
    var angle = select([["90", "90° clockwise"], ["180", "180°"], ["270", "270° (90° counter)"]]);
    controls.appendChild(field('Pages ("all" or e.g. 1-3, 5)', pages));
    controls.appendChild(field("Rotation", angle));
    var out = h("div");
    root.appendChild(up.node);
    root.appendChild(controls);
    root.appendChild(h("div", { class: "toolbar" }));
    root.appendChild(out);
    var btn = actionButton("Rotate PDF", function () {
      if (!up.files().length) fail("Please select a PDF file first.");
      return writePdf(up.files()[0]).then(function (doc) {
        var count = doc.getPageCount();
        var targets = pages.value.trim().toLowerCase() === "all"
          ? Array.from({ length: count }, function (_, i) { return i + 1; })
          : parseRanges(pages.value, count);
        var deg = parseInt(angle.value, 10);
        targets.forEach(function (p) {
          var page = doc.getPage(p - 1);
          var current = page.getRotation().angle;
          page.setRotation(window.PDFLib.degrees((current + deg) % 360));
        });
        return doc.save();
      }).then(function (bytes) {
        var blob = pdfBlob(bytes);
        out.innerHTML = "";
        out.appendChild(resultBox("Rotated PDF", blob.size, function () { download(blob, "rotated.pdf"); }));
      });
    });
    qs(".toolbar", root).appendChild(btn);
    qs(".toolbar", root).appendChild(privacyNote(false));
  };

  function pageOpTool(root, cfg) {
    var up = uploader({});
    var picker = h("div");
    var out = h("div");
    var selection = [];
    root.appendChild(up.node);
    root.appendChild(picker);
    root.appendChild(h("div", { class: "toolbar" }));
    root.appendChild(out);

    up.addFiles = (function (orig) {
      return function (fl) { orig(fl); picker.innerHTML = ""; if (up.files().length) picker.appendChild(pagePicker(up.files()[up.files().length - 1], function (sel) { selection = sel; })); };
    })(up.addFiles);

    var btn = actionButton(cfg.button, function (prog) {
      if (!up.files().length) fail("Please select a PDF file first.");
      if (!selection.length) fail("Select at least one page first.");
      var file = up.files()[0];
      return writePdf(file).then(function (doc) {
        prog.set(30, "Building new document…");
        return cfg.run(doc, selection).then(function (bytes) {
          prog.set(95, "Finishing…");
          var blob = pdfBlob(bytes);
          out.innerHTML = "";
          out.appendChild(resultBox(cfg.resultName, blob.size, function () { download(blob, cfg.filename + ".pdf"); }));
        });
      });
    });
    qs(".toolbar", root).appendChild(btn);
    qs(".toolbar", root).appendChild(privacyNote(false));
  }

  HANDLERS["delete-pdf-pages"] = function (root) {
    pageOpTool(root, {
      button: "Delete Selected Pages",
      resultName: "PDF without the selected pages",
      filename: "pages-deleted",
      run: function (doc, selection) {
        var count = doc.getPageCount();
        var keep = [];
        for (var i = 1; i <= count; i++) if (selection.indexOf(i) === -1) keep.push(i);
        if (!keep.length) fail("You can't delete every page — leave at least one.");
        var target = newPdf();
        return target.copyPages(doc, keep.map(function (k) { return k - 1; })).then(function (pages) {
          pages.forEach(function (p) { target.addPage(p); });
          return target.save();
        });
      }
    });
  };

  HANDLERS["extract-pdf-pages"] = function (root) {
    pageOpTool(root, {
      button: "Extract Selected Pages",
      resultName: "Extracted pages PDF",
      filename: "extracted-pages",
      run: function (doc, selection) {
        var target = newPdf();
        return target.copyPages(doc, selection.map(function (s) { return s - 1; })).then(function (pages) {
          pages.forEach(function (p) { target.addPage(p); });
          return target.save();
        });
      }
    });
  };

  HANDLERS["duplicate-pdf-pages"] = function (root) {
    pageOpTool(root, {
      button: "Duplicate Selected Pages",
      resultName: "PDF with duplicated pages",
      filename: "duplicated",
      run: function (doc, selection) {
        var count = doc.getPageCount();
        var target = newPdf();
        var chain = Promise.resolve();
        for (var p = 1; p <= count; p++) {
          (function (n) {
            chain = chain.then(function () {
              return target.copyPages(doc, [n - 1]).then(function (pages) {
                target.addPage(pages[0]);
                if (selection.indexOf(n) === -1) return null;
                return target.copyPages(doc, [n - 1]).then(function (dup) { target.addPage(dup[0]); });
              });
            });
          })(p);
        }
        return chain.then(function () { return target.save(); });
      }
    });
  };

  HANDLERS["reorder-pdf-pages"] = function (root) {
    var up = uploader({});
    var area = h("div");
    var order = [];
    var out = h("div");
    root.appendChild(up.node);
    root.appendChild(area);
    root.appendChild(h("div", { class: "toolbar" }));
    root.appendChild(out);

    up.addFiles = (function (orig) {
      return function (fl) {
        orig(fl);
        area.innerHTML = "";
        order = [];
        if (!up.files().length) return;
        readPdf(up.files()[0]).then(function (doc) {
          area.appendChild(h("p", { class: "muted small" }, doc.numPages + " pages · drag a thumbnail, or use the arrow buttons, to reorder."));
          var grid = h("div", { class: "page-grid" });
          var chain = Promise.resolve();
          for (var i = 1; i <= doc.numPages; i++) {
            (function (n) {
              chain = chain.then(function () {
                return renderPage(doc, n, 0.32).then(function (r) { order.push({ page: n, dataUrl: r.canvas.toDataURL("image/jpeg", 0.7) }); draw(); });
              });
            })(i);
          }
          function draw() {
            grid.innerHTML = "";
            order.forEach(function (item, idx) {
              var wrapEl = h("div", { class: "page-thumb", draggable: "true" });
              wrapEl.style.cursor = "grab";
              wrapEl.innerHTML = '<img alt="Page ' + item.page + '" src="' + item.dataUrl + '"><span class="page-num">' + (idx + 1) + "</span>";
              var upBtn = h("button", { class: "file-reorder", type: "button", "aria-label": "Move earlier" }, "↑");
              upBtn.style.marginLeft = "0.25rem";
              upBtn.disabled = idx === 0;
              upBtn.addEventListener("click", function (e) {
                e.stopPropagation();
                if (idx === 0) return;
                var t = order[idx - 1]; order[idx - 1] = order[idx]; order[idx] = t; draw();
              });
              var downBtn = h("button", { class: "file-reorder", type: "button", "aria-label": "Move later" }, "↓");
              downBtn.style.marginLeft = "0.15rem";
              downBtn.disabled = idx === order.length - 1;
              downBtn.addEventListener("click", function (e) {
                e.stopPropagation();
                if (idx === order.length - 1) return;
                var t = order[idx + 1]; order[idx + 1] = order[idx]; order[idx] = t; draw();
              });
              var controls = h("div", { class: "file-reorder" });
              controls.appendChild(upBtn);
              controls.appendChild(downBtn);
              wrapEl.appendChild(controls);
              wrapEl.addEventListener("dragstart", function (e) { e.dataTransfer.setData("text/plain", String(idx)); });
              wrapEl.addEventListener("dragover", function (e) { e.preventDefault(); });
              wrapEl.addEventListener("drop", function (e) {
                e.preventDefault();
                var from = parseInt(e.dataTransfer.getData("text/plain"), 10);
                if (isNaN(from) || from === idx) return;
                var moved = order.splice(from, 1)[0];
                order.splice(idx, 0, moved);
                draw();
              });
              grid.appendChild(wrapEl);
            });
          }
          area.appendChild(grid);
        }).catch(function (err) { area.innerHTML = ""; area.appendChild(alertBox("error", err.message)); });
      };
    })(up.addFiles);

    var btn = actionButton("Export Reordered PDF", function () {
      if (!up.files().length) fail("Please select a PDF file first.");
      if (!order.length) fail("Wait for the thumbnails to finish loading.");
      return writePdf(up.files()[0]).then(function (doc) {
        var target = newPdf();
        return target.copyPages(doc, order.map(function (o) { return o.page - 1; })).then(function (pages) {
          pages.forEach(function (p) { target.addPage(p); });
          return target.save();
        });
      }).then(function (bytes) {
        var blob = pdfBlob(bytes);
        out.innerHTML = "";
        out.appendChild(resultBox("Reordered PDF", blob.size, function () { download(blob, "reordered.pdf"); }));
      });
    });
    qs(".toolbar", root).appendChild(btn);
    qs(".toolbar", root).appendChild(privacyNote(false));
  };

  HANDLERS["crop-pdf"] = function (root) {
    var up = uploader({});
    var controls = h("div", { class: "control-grid cols-3" });
    function num(id, val) { return input({ type: "number", min: "0", value: String(val), id: id }); }
    var l = num("cl", 10), r = num("cr", 10), t = num("ct", 10), b = num("cb", 10);
    controls.appendChild(field("Left margin (pt)", l));
    controls.appendChild(field("Right margin (pt)", r));
    controls.appendChild(field("Top margin (pt)", t));
    controls.appendChild(field("Bottom margin (pt)", b));
    var all = checkboxRow("Apply to every page", true);
    controls.appendChild(all);
    var out = h("div");
    root.appendChild(up.node);
    root.appendChild(controls);
    root.appendChild(h("div", { class: "toolbar" }));
    root.appendChild(out);
    var btn = actionButton("Apply Crop", function () {
      if (!up.files().length) fail("Please select a PDF file first.");
      return writePdf(up.files()[0]).then(function (doc) {
        var pages = all.input.checked ? doc.getPages() : [];
        pages.forEach(function (page) {
          var size = page.getSize();
          var L = Math.max(0, Math.min(parseFloat(l.value) || 0, size.width - 40));
          var R = Math.max(0, Math.min(parseFloat(r.value) || 0, size.width - 40));
          var T = Math.max(0, Math.min(parseFloat(t.value) || 0, size.height - 40));
          var B = Math.max(0, Math.min(parseFloat(b.value) || 0, size.height - 40));
          if (L + R >= size.width - 20 || T + B >= size.height - 20) fail("Crop margins are too large for these pages.");
          page.setCropBox(L, B, size.width - L - R, size.height - T - B);
        });
        return doc.save();
      }).then(function (bytes) {
        var blob = pdfBlob(bytes);
        out.innerHTML = "";
        out.appendChild(resultBox("Cropped PDF", blob.size, function () { download(blob, "cropped.pdf"); }));
      });
    });
    qs(".toolbar", root).appendChild(btn);
    qs(".toolbar", root).appendChild(privacyNote(false));
  };

  HANDLERS["resize-pdf"] = function (root) {
    var up = uploader({});
    var controls = h("div", { class: "control-grid" });
    var size = select(Object.keys(PAGE_SIZES).map(function (k) { return [k, k]; }).concat([["Custom", "Custom (points)"]]), "A4");
    var cw = input({ type: "number", min: "72", value: "612" });
    var ch = input({ type: "number", min: "72", value: "792" });
    var customWrap = h("div", { class: "control-grid", hidden: "hidden" });
    customWrap.appendChild(field("Width (pt)", cw));
    customWrap.appendChild(field("Height (pt)", ch));
    controls.appendChild(field("Target page size", size));
    size.addEventListener("change", function () {
      customWrap.toggleAttribute("hidden", size.value !== "Custom");
      customWrap.style.marginTop = size.value === "Custom" ? "1rem" : "0";
    });
    var out = h("div");
    root.appendChild(up.node);
    root.appendChild(controls);
    root.appendChild(customWrap);
    root.appendChild(h("div", { class: "toolbar" }));
    root.appendChild(out);
    var btn = actionButton("Resize PDF", function (prog) {
      if (!up.files().length) fail("Please select a PDF file first.");
      return writePdf(up.files()[0]).then(function (doc) {
        var target = size.value === "Custom"
          ? [Math.max(72, parseFloat(cw.value) || 0), Math.max(72, parseFloat(ch.value) || 0)]
          : PAGE_SIZES[size.value];
        var outDoc = newPdf();
        var count = doc.getPageCount();
        var chain = Promise.resolve();
        for (var i = 0; i < count; i++) {
          (function (n) {
            chain = chain.then(function () {
              var orig = doc.getPage(n);
              return outDoc.embedPage(orig).then(function (emb) {
                var size0 = orig.getSize();
                var s = Math.min(target[0] / size0.width, target[1] / size0.height);
                var w = size0.width * s, hh = size0.height * s;
                var page = outDoc.addPage(target);
                page.drawPage(emb, { x: (target[0] - w) / 2, y: (target[1] - hh) / 2, width: w, height: hh });
                prog.set(((n + 1) / count) * 95, "Resizing page " + (n + 1) + " of " + count + "…");
              });
            });
          })(i);
        }
        return chain.then(function () { return outDoc.save(); });
      }).then(function (bytes) {
        var blob = pdfBlob(bytes);
        out.innerHTML = "";
        out.appendChild(resultBox("Resized PDF", blob.size, function () { download(blob, "resized.pdf"); }));
      });
    });
    qs(".toolbar", root).appendChild(btn);
    qs(".toolbar", root).appendChild(privacyNote(false));
  };

  /* ---------------- Conversion ---------------- */

  function imagesToPdfTool(root, mime) {
    var up = uploader({
      multiple: true,
      accept: mime === "image/png" ? "image/png" : "image/jpeg",
      label: mime === "image/png" ? "Drag & Drop PNG Images Here" : "Drag & Drop JPG Images Here"
    });
    var controls = h("div", { class: "control-grid" });
    var pageSize = select([["fit", "Fit to image"]].concat(Object.keys(PAGE_SIZES).map(function (k) { return [k, k]; })), "fit");
    controls.appendChild(field("Page size", pageSize));
    var out = h("div");
    root.appendChild(up.node);
    root.appendChild(controls);
    root.appendChild(h("div", { class: "toolbar" }));
    root.appendChild(out);
    var btn = actionButton("Convert to PDF", function (prog) {
      var files = up.files();
      if (!files.length) fail("Please choose at least one image.");
      var doc = newPdf();
      var chain = Promise.resolve();
      files.forEach(function (f, i) {
        chain = chain.then(function () {
          return f.arrayBuffer().then(function (buf) {
            var embed = mime === "image/png" ? doc.embedPng(new Uint8Array(buf)) : doc.embedJpg(new Uint8Array(buf));
            return embed.then(function (img) {
              var size = pageSize.value === "fit" ? [img.width, img.height] : PAGE_SIZES[pageSize.value];
              var page = doc.addPage(size);
              if (pageSize.value === "fit") {
                page.drawImage(img, { x: 0, y: 0, width: size[0], height: size[1] });
              } else {
                var s = Math.min(size[0] / img.width, size[1] / img.height);
                var w = img.width * s, hh = img.height * s;
                page.drawImage(img, { x: (size[0] - w) / 2, y: (size[1] - hh) / 2, width: w, height: hh });
              }
              prog.set(((i + 1) / files.length) * 95, "Adding image " + (i + 1) + " of " + files.length + "…");
            });
          });
        });
      });
      return chain.then(function () { return doc.save(); }).then(function (bytes) {
        var blob = pdfBlob(bytes);
        out.innerHTML = "";
        out.appendChild(resultBox("PDF with " + files.length + " page" + (files.length > 1 ? "s" : ""), blob.size, function () { download(blob, "images.pdf"); }));
      });
    });
    qs(".toolbar", root).appendChild(btn);
    qs(".toolbar", root).appendChild(privacyNote(false));
  }
  HANDLERS["jpg-to-pdf"] = function (root) { imagesToPdfTool(root, "image/jpeg"); };
  HANDLERS["png-to-pdf"] = function (root) { imagesToPdfTool(root, "image/png"); };

  function pdfToImagesTool(root, format) {
    var up = uploader({});
    var out = h("div");
    var quality = h("div", { class: "control-grid" });
    var scaleInput = input({ type: "number", min: "1", max: "4", step: "0.5", value: "2" });
    quality.appendChild(field("Render scale (higher = sharper)", scaleInput, "2 produces roughly 150 DPI."));
    root.appendChild(up.node);
    root.appendChild(quality);
    root.appendChild(h("div", { class: "toolbar" }));
    root.appendChild(out);
    var btn = actionButton("Convert to " + (format === "png" ? "PNG" : "JPG"), function (prog) {
      if (!up.files().length) fail("Please select a PDF file first.");
      var file = up.files()[0];
      var scale = Math.max(0.5, Math.min(4, parseFloat(scaleInput.value) || 2));
      return readPdf(file).then(function (doc) {
        var base = baseName(file.name);
        var items = [];
        var chain = Promise.resolve();
        for (var i = 1; i <= doc.numPages; i++) {
          (function (n) {
            chain = chain.then(function () {
              return renderPage(doc, n, scale).then(function (r) {
                var dataUrl = r.canvas.toDataURL(format === "png" ? "image/png" : "image/jpeg", 0.9);
                items.push({ url: dataUrl, name: base + "-page" + n + "." + (format === "png" ? "png" : "jpg") });
                prog.set((n / doc.numPages) * 95, "Rendering page " + n + " of " + doc.numPages + "…");
              });
            });
          })(i);
        }
        return chain.then(function () { return items; });
      }).then(function (items) {
        out.innerHTML = "";
        var bar = h("div", { class: "toolbar" });
        bar.appendChild(h("p", { class: "muted small" }, items.length + " image" + (items.length > 1 ? "s" : "") + " ready — click any image to save it, or download all."));
        var all = h("button", { class: "btn btn-primary", type: "button" }, "Download all (" + items.length + ")");
        all.addEventListener("click", function () {
          var i = 0;
          (function next() {
            if (i >= items.length) return;
            downloadDataUrl(items[i].url, items[i].name);
            i++;
            setTimeout(next, 300);
          })();
        });
        bar.appendChild(all);
        out.appendChild(bar);
        var grid = h("div", { class: "img-grid" });
        items.forEach(function (it) {
          var fig = h("figure", { class: "img-card" });
          var img = h("img", { alt: it.name, src: it.url });
          var cap = h("figcaption");
          cap.appendChild(h("span", null, it.name));
          var save = h("button", { class: "btn btn-outline btn-sm", type: "button" }, "Save");
          save.addEventListener("click", function () { downloadDataUrl(it.url, it.name); });
          cap.appendChild(save);
          fig.appendChild(img);
          fig.appendChild(cap);
          grid.appendChild(fig);
        });
        out.appendChild(grid);
      });
    });
    qs(".toolbar", root).appendChild(btn);
    qs(".toolbar", root).appendChild(privacyNote(false));
  }
  HANDLERS["pdf-to-jpg"] = function (root) { pdfToImagesTool(root, "jpeg"); };
  HANDLERS["pdf-to-png"] = function (root) { pdfToImagesTool(root, "png"); };

  function textToPdfCore(text, opts) {
    opts = opts || {};
    var doc = newPdf();
    return embedFont(doc, opts.font || "Helvetica").then(function (font) {
      var size = opts.size || 12;
      var margin = 56;
      var pageSize = PAGE_SIZES.A4;
      var page = doc.addPage(pageSize);
      var y = pageSize[1] - margin;
      wrapText(text, font, size, pageSize[0] - margin * 2).forEach(function (line) {
        if (y < margin) { page = doc.addPage(pageSize); y = pageSize[1] - margin; }
        if (line) page.drawText(line, { x: margin, y: y, size: size, font: font });
        y -= size * 1.45;
      });
      return doc.save();
    });
  }

  HANDLERS["txt-to-pdf"] = function (root) {
    var up = uploader({ accept: ".txt,text/plain", label: "Drag & Drop a TXT File Here" });
    var area = h("div");
    var out = h("div");
    root.appendChild(up.node);
    root.appendChild(area);
    root.appendChild(h("div", { class: "toolbar" }));
    root.appendChild(out);
    var current = { text: "", name: "text.txt" };
    up.node.addEventListener("click", function () {}); // keep click-through intact
    var origAdd = up.addFiles;
    up.addFiles = function (fl) {
      origAdd(fl);
      var f = up.files()[up.files().length - 1];
      if (!f) return;
      current.name = f.name;
      f.text().then(function (t) {
        current.text = t;
        area.innerHTML = "";
        area.appendChild(field("Content preview (editable)", textarea({ rows: 12 })));
        var ta = qs("textarea", area);
        ta.value = t;
        ta.addEventListener("input", function () { current.text = ta.value; });
      }).catch(function () { area.innerHTML = ""; area.appendChild(alertBox("error", "Could not read this file. Is it a plain-text (.txt) file?")); });
    };
    var btn = actionButton("Generate PDF", function () {
      if (!current.text.trim()) fail("The file appears to be empty.");
      return textToPdfCore(current.text, { font: "Courier", size: 10.5 }).then(function (bytes) {
        var blob = pdfBlob(bytes);
        out.innerHTML = "";
        out.appendChild(resultBox("PDF from text", blob.size, function () { download(blob, baseName(current.name) + ".pdf"); }));
      });
    });
    qs(".toolbar", root).appendChild(btn);
    qs(".toolbar", root).appendChild(privacyNote(false));
  };

  HANDLERS["text-to-pdf"] = function (root) {
    var controls = h("div", { class: "control-grid" });
    var body = textarea({ rows: 12, placeholder: "Type or paste your text here…" });
    var size = input({ type: "number", min: "6", max: "36", value: "12" });
    var font = select([["Helvetica", "Helvetica"], ["Times-Roman", "Times Roman"], ["Courier", "Courier"]], "Helvetica");
    controls.appendChild(field("Your text", body));
    var row = h("div", { class: "control-grid" });
    row.appendChild(field("Font size", size));
    row.appendChild(field("Font", font));
    var out = h("div");
    root.appendChild(controls);
    root.appendChild(row);
    root.appendChild(h("div", { class: "toolbar" }));
    root.appendChild(out);
    var btn = actionButton("Generate PDF", function () {
      if (!body.value.trim()) fail("Enter some text first.");
      return textToPdfCore(body.value, { font: font.value, size: parseFloat(size.value) || 12 }).then(function (bytes) {
        var blob = pdfBlob(bytes);
        out.innerHTML = "";
        out.appendChild(resultBox("Generated PDF", blob.size, function () { download(blob, "text.pdf"); }));
      });
    });
    qs(".toolbar", root).appendChild(btn);
    qs(".toolbar", root).appendChild(privacyNote(false));
  };

  HANDLERS["html-to-pdf"] = function (root) {
    var controls = h("div");
    var code = textarea({ rows: 10, class: "mono" });
    code.value = "<h1>Hello from PDFMaster</h1>\n<p>Write <b>HTML</b> and turn it into a PDF.</p>";
    controls.appendChild(field("HTML markup", code, "Rendered with your browser's own engine, rasterized to A4 pages. External stylesheets and scripts are not loaded."));
    var out = h("div");
    root.appendChild(controls);
    root.appendChild(h("div", { class: "toolbar" }));
    root.appendChild(out);
    var btn = actionButton("Render to PDF", function (prog) {
      var html = code.value;
      if (!html.trim()) fail("Enter some HTML first.");
      prog.set(20, "Rendering HTML…");
      return new Promise(function (resolve, reject) {
        var iframe = document.createElement("iframe");
        iframe.style.cssText = "position:fixed;left:-10000px;width:794px;height:1123px;border:0;";
        iframe.setAttribute("sandbox", "allow-same-origin");
        document.body.appendChild(iframe);
        iframe.onload = function () {
          setTimeout(function () {
            try {
              var docEl = iframe.contentDocument.documentElement;
              var box = docEl.getBoundingClientRect();
              var width = Math.max(box.width, iframe.contentWindow.innerWidth);
              var height = Math.max(docEl.scrollHeight, box.height, iframe.contentWindow.innerHeight);
              var scale = 2;
              var canvas = document.createElement("canvas");
              canvas.width = Math.floor(width * scale);
              canvas.height = Math.floor(height * scale);
              var ctx = canvas.getContext("2d");
              ctx.fillStyle = "#ffffff";
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              var inner = new XMLSerializer().serializeToString(docEl);
              var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height +
                '"><foreignObject width="100%" height="100%">' + inner + "</foreignObject></svg>";
              var img = new Image();
              img.onload = function () {
                ctx.scale(scale, scale);
                ctx.drawImage(img, 0, 0);
                iframe.remove();
                resolve(canvas);
              };
              img.onerror = function () { iframe.remove(); reject(new ToolError("HTML rasterization failed. Try simpler markup.")); };
              img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
            } catch (e) {
              iframe.remove();
              reject(new ToolError("HTML rendering failed. Try simpler markup."));
            }
          }, 180);
        };
        iframe.srcdoc = "<!doctype html><html><head><style>body{margin:0;font-family:Arial,Helvetica,sans-serif;color:#111;background:#fff;}img{max-width:100%;}</style></head><body>" +
          html + "</body></html>";
      }).then(function (canvas) {
        prog.set(60, "Building PDF…");
        var doc = newPdf();
        return doc.embedPng(canvas.toDataURL("image/png")).then(function (img) {
          var A4 = PAGE_SIZES.A4;
          var k = A4[0] / img.width, H = img.height * k;
          var pages = Math.max(1, Math.ceil(H / A4[1] - 0.001));
          for (var p = 0; p < pages; p++) {
            var page = doc.addPage(A4);
            page.drawImage(img, { x: 0, y: A4[1] * (p + 1) - H, width: A4[0], height: H });
          }
          return doc.save();
        });
      }).then(function (bytes) {
        var blob = pdfBlob(bytes);
        out.innerHTML = "";
        out.appendChild(resultBox("PDF from HTML", blob.size, function () { download(blob, "html.pdf"); }));
      });
    });
    qs(".toolbar", root).appendChild(btn);
    qs(".toolbar", root).appendChild(privacyNote(false));
  };

  function extractTextPages(doc) {
    var chain = Promise.resolve([]);
    for (var i = 1; i <= doc.numPages; i++) {
      (function (n) {
        chain = chain.then(function (acc) {
          return doc.getPage(n).then(function (page) {
            return page.getTextContent().then(function (content) {
              var text = "", lastY = null, lastEnd = null;
              content.items.forEach(function (it) {
                if (typeof it.str !== "string") return;
                var x = it.transform[4], y = it.transform[5];
                if (lastY !== null && Math.abs(y - lastY) > 3) { text += "\n"; lastEnd = null; }
                else if (lastEnd !== null && x - lastEnd > 1.5 && !/\s$/.test(text) && !/^\s/.test(it.str)) text += " ";
                text += it.str; lastY = y; lastEnd = x + (it.width || 0);
                if (it.hasEOL) { text += "\n"; lastY = null; lastEnd = null; }
              });
              acc.push(text.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim());
              return acc;
            });
          });
        });
      })(i);
    }
    return chain;
  }

  HANDLERS["pdf-to-text"] = function (root) {
    var up = uploader({});
    var out = h("div");
    root.appendChild(up.node);
    root.appendChild(h("div", { class: "toolbar" }));
    root.appendChild(out);
    var btn = actionButton("Extract Text", function (prog) {
      if (!up.files().length) fail("Please select a PDF file first.");
      var file = up.files()[0];
      return readPdf(file).then(function (doc) {
        prog.set(20, "Reading text layer…");
        return extractTextPages(doc).then(function (pages) {
          prog.set(90, "Finishing…");
          var text = pages.join("\n\n--- Page break ---\n\n").trim();
          if (!text) fail("No text layer found — this PDF may be a scan. OCR is not available offline.");
          out.innerHTML = "";
          var bar = h("div", { class: "toolbar" });
          var dl = h("button", { class: "btn btn-primary", type: "button" }, "Download .txt");
          dl.addEventListener("click", function () {
            download(new Blob([text], { type: "text/plain;charset=utf-8" }), baseName(file.name) + ".txt");
          });
          var copy = h("button", { class: "btn btn-ghost", type: "button" }, "Copy text");
          copy.addEventListener("click", function () { navigator.clipboard && navigator.clipboard.writeText(text); });
          bar.appendChild(dl); bar.appendChild(copy);
          out.appendChild(bar);
          out.appendChild(h("pre", { class: "text-preview" }, text));
        });
      });
    });
    qs(".toolbar", root).appendChild(btn);
    qs(".toolbar", root).appendChild(privacyNote(false));
  };

  /* ---------------- Editing ---------------- */

  /** Shared interactive page canvas for placement-based tools. */
  function pageCanvas(root, opts) {
    var state = { doc: null, page: 1, numPages: 0, placements: [], mode: opts.mode || "click" };
    var stage = h("div", { class: "canvas-stage" });
    var overlay = h("div", { class: "canvas-overlay" });
    var baseImg = h("img", { alt: "" });
    stage.appendChild(baseImg);
    stage.appendChild(overlay);
    var nav = h("div", { class: "toolbar" });
    var pv = h("button", { class: "btn btn-ghost btn-sm", type: "button" }, "← Prev");
    var navLabel = h("span", { class: "muted small" }, "Page 1");
    var nx = h("button", { class: "btn btn-ghost btn-sm", type: "button" }, "Next →");
    nav.appendChild(pv); nav.appendChild(navLabel); nav.appendChild(nx);
    root.appendChild(nav);
    root.appendChild(stage);
    pv.addEventListener("click", function () { state.goto(state.page - 1); });
    nx.addEventListener("click", function () { state.goto(state.page + 1); });
    if (state.mode === "drag") overlay.classList.add("mode-drag");

    function refresh() {
      if (!state.doc) return;
      renderPage(state.doc, Math.min(state.page, state.numPages), 1.6).then(function (r) {
        var scale = r.viewport.scale;
        state.pageWidth = r.viewport.width / scale;
        state.pageHeight = r.viewport.height / scale;
        navLabel.textContent = "Page " + state.page + " of " + state.numPages;
        baseImg.src = r.canvas.toDataURL("image/png");
        overlay.innerHTML = "";
        overlay.style.width = "100%";
        // draw existing placements as previews
        state.placements.forEach(function (p) { if (p.page === state.page) drawPreview(p, scale, r); });
      });
    }

    function toPdf(e) {
      var rect = overlay.getBoundingClientRect();
      var fx = (e.clientX - rect.left) / rect.width;
      var fy = (e.clientY - rect.top) / rect.height;
      var pw = state.pageWidth || 600;
      var ph = state.pageHeight || 800;
      return { x: fx * pw, y: ph - fy * ph, fx: fx, fy: fy };
    }

    function drawPreview(p, scale, r) {
      var pct = function (v, total) { return (v * scale * 100) / total; };
      if (p.kind === "text" || p.kind === "note") {
        var el = h("div", { class: "shape-text" });
        el.style.left = pct(p.x, r.width) + "%";
        el.style.top = (100 - (p.y * scale * 100) / r.height) + "%";
        el.style.color = p.color || "#111827";
        el.style.fontSize = ((p.size || 12) / state.pageWidth * 100) + "cqw";
        el.textContent = p.text || "";
        overlay.appendChild(el);
        return;
      }
      if (p.kind === "image" || p.kind === "signature") {
        var im = h("img", { class: "shape-img", alt: "", src: p.dataUrl });
        im.style.left = pct(p.x, r.width) + "%";
        im.style.top = (100 - (p.y * scale * 100) / r.height) + "%";
        im.style.width = ((p.w || 120) * scale * 100) / r.width + "%";
        overlay.appendChild(im);
        return;
      }
      if (p.kind === "pen" || ((p.kind === "line" || p.kind === "arrow") && p.points && p.ex !== undefined)) {
        var s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        s.setAttribute("viewBox", "0 0 " + r.width + " " + r.height);
        var poly = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
        var linePts = p.kind === "pen" ? p.points : [p.points[0], { x: p.ex, y: p.ey }];
        poly.setAttribute("points", (linePts || []).map(function (pt) { return (pt.x * scale) + "," + (r.height - pt.y * scale); }).join(" "));
        poly.setAttribute("fill", "none");
        poly.setAttribute("stroke", p.color || "#dc2626");
        poly.setAttribute("stroke-width", "2");
        s.appendChild(poly);
        overlay.appendChild(s);
        return;
      }
      var box = h("div", { class: "shape-box" });
      box.style.left = pct(p.x, r.width) + "%";
      box.style.top = (100 - ((p.y + (p.h || 0)) * scale * 100) / r.height) + "%";
      box.style.width = pct(p.w || 0, r.width) + "%";
      box.style.height = pct(p.h || 0, r.height) + "%";
      if (p.kind === "highlight") { box.style.background = (p.color || "#facc15") + "66"; }
      else if (p.kind === "underline") { box.style.borderBottom = "3px solid " + (p.color || "#dc2626"); }
      else {
        box.style.border = "2px solid " + (p.color || "#dc2626");
        if (p.kind === "circle") box.style.borderRadius = "50%";
      }
      overlay.appendChild(box);
    }

    var drawing = false;
    var draft = null;
    overlay.addEventListener("pointerdown", function (e) {
      if (!state.doc) return;
      var pt = toPdf(e);
      if (state.mode === "click") {
        var p = Object.assign({ kind: opts.kind, page: state.page, x: pt.x, y: pt.y }, opts.build ? opts.build(pt) : {});
        state.placements.push(p);
        if (opts.onChange) opts.onChange(state.placements);
        refresh();
      } else {
        drawing = true;
        draft = { kind: opts.kind, page: state.page, x: pt.x, y: pt.y, w: 0, h: 0, points: [pt], color: opts.color };
        state.placements.push(draft);
        if (opts.onChange) opts.onChange(state.placements);
      }
    });
    overlay.addEventListener("pointermove", function (e) {
      if (!drawing || !draft) return;
      var pt = toPdf(e);
      var s0 = draft.points[0];
      draft.x = Math.min(pt.x, s0.x);
      draft.y = Math.min(pt.y, s0.y);
      draft.w = Math.abs(pt.x - s0.x);
      draft.h = Math.abs(pt.y - s0.y);
      draft.ex = pt.x; draft.ey = pt.y;
      if (opts.kind === "pen") draft.points.push(pt);
      refresh();
    });
    ["pointerup", "pointerleave"].forEach(function (evt) {
      overlay.addEventListener(evt, function () {
        if (!drawing) return;
        drawing = false;
        if (opts.kind === "pen" && draft.points && draft.points.length < 2) {
          state.placements.pop();
        }
        draft = null;
        refresh();
      });
    });

    state.load = function (file) {
      return readPdf(file).then(function (doc) {
        state.doc = doc;
        state.numPages = doc.numPages;
        return doc.getPage(1).then(function (page) {
          var vp = page.getViewport({ scale: 1 });
          state.pageWidth = vp.width;
          state.pageHeight = vp.height;
          state.placements = [];
          state.page = 1;
          if (opts.onLoaded) opts.onLoaded(state);
          refresh();
          return state;
        });
      });
    };
    state.goto = function (n) { state.page = Math.max(1, Math.min(n, state.numPages)); refresh(); };
    state.clear = function () { state.placements = []; if (opts.onChange) opts.onChange(state.placements); refresh(); };
    state.refresh = refresh;
    return state;
  }

  HANDLERS["add-text-to-pdf"] = function (root) {
    var up = uploader({});
    var controls = h("div", { class: "control-grid cols-3" });
    var text = input({ value: "Hello PDFMaster" });
    var size = input({ type: "number", min: "6", max: "96", value: "14" });
    var color = input({ type: "color", value: "#111827" });
    var font = select([["Helvetica", "Helvetica"], ["Helvetica-Bold", "Helvetica Bold"], ["Helvetica-Oblique", "Helvetica Italic"], ["Times-Roman", "Times Roman"], ["Courier", "Courier"]], "Helvetica");
    controls.appendChild(field("Text", text));
    controls.appendChild(field("Font size", size));
    controls.appendChild(field("Color", color));
    controls.appendChild(field("Font style", font));
    var pageRow = h("div", { class: "field" });
    var pageInput = input({ type: "number", min: "1", value: "1" });
    pageRow.appendChild(h("label", null, "Page"));
    pageRow.appendChild(pageInput);
    controls.appendChild(pageRow);
    var hint = h("p", { class: "muted small" }, "Click on the page preview to place your text.");
    var stageWrap = h("div");
    var clearBtn = h("button", { class: "btn btn-outline btn-sm", type: "button" }, "Clear placements");
    var out = h("div");
    root.appendChild(up.node);
    root.appendChild(controls);
    root.appendChild(pageRow);
    root.appendChild(hint);
    root.appendChild(stageWrap);
    root.appendChild(clearBtn);
    root.appendChild(h("div", { class: "toolbar" }));
    root.appendChild(out);

    var canvas;
    up.node.addEventListener("click", function () {});
    var origAdd = up.addFiles;
    up.addFiles = function (fl) {
      origAdd(fl);
      var f = up.files()[0];
      if (!f) { stageWrap.innerHTML = ""; return; }
      stageWrap.innerHTML = "";
      canvas = pageCanvas(stageWrap, {
        mode: "click",
        kind: "text",
        build: function () { return { text: text.value, size: parseFloat(size.value) || 14, color: color.value, font: font.value }; },
        onLoaded: function (state) { pageInput.max = String(state.numPages); },
        onChange: function () {}
      });
      canvas.load(f).catch(function (err) { stageWrap.innerHTML = ""; stageWrap.appendChild(alertBox("error", err.message)); });
    };
    pageInput.addEventListener("input", function () { if (canvas) canvas.goto(parseInt(pageInput.value, 10) || 1); });
    clearBtn.addEventListener("click", function () { if (canvas) canvas.clear(); });

    // rebuild overlay when text settings change
    function repaint() { if (canvas) canvas.refresh(); }

    var btn = actionButton("Add Text & Download", function () {
      if (!up.files().length) fail("Please select a PDF file first.");
      if (!canvas || !canvas.placements.length) fail("Click on the page preview to place your text first.");
      var placements = canvas.placements.slice();
      return writePdf(up.files()[0]).then(function (doc) {
        return Promise.all(placements.map(function (p) {
          return embedFont(doc, p.font || font.value).then(function (f) {
            var page = doc.getPage(Math.min(p.page, doc.getPageCount()) - 1);
            page.drawText(p.text || text.value, {
              x: p.x, y: p.y, size: p.size || parseFloat(size.value) || 14,
              font: f, color: hexColor(p.color || color.value)
            });
          });
        })).then(function () { return doc.save(); });
      }).then(function (bytes) {
        var blob = pdfBlob(bytes);
        out.innerHTML = "";
        out.appendChild(resultBox("PDF with added text", blob.size, function () { download(blob, "text-added.pdf"); }));
      });
    });
    qs(".toolbar", root).appendChild(btn);
    qs(".toolbar", root).appendChild(privacyNote(false));
  };

  function addImageTool(root, isSignature) {
    var up = uploader({});
    var imageHolder = h("div");
    var controls = h("div", { class: "control-grid cols-3" });
    var widthPct = input({ type: "number", min: "5", max: "100", value: "30" });
    controls.appendChild(field("Width (% of page width)", widthPct));
    var pageInput = input({ type: "number", min: "1", value: "1" });
    controls.appendChild(field("Page", pageInput));
    var stageWrap = h("div");
    var clearBtn = h("button", { class: "btn btn-outline btn-sm", type: "button" }, "Clear placements");
    var out = h("div");
    root.appendChild(up.node);
    root.appendChild(imageHolder);
    root.appendChild(controls);
    root.appendChild(h("p", { class: "muted small" }, "Click on the page preview to position the " + (isSignature ? "signature" : "image") + " (the click sets its top-left corner)."));
    root.appendChild(stageWrap);
    root.appendChild(clearBtn);
    root.appendChild(h("div", { class: "toolbar" }));
    root.appendChild(out);

    var imageData = null; // { dataUrl, bytes }
    if (isSignature) {
      imageHolder.appendChild(field("Draw your signature", h("canvas", { class: "signature-canvas" })));
      var sigCanvas = qs("canvas", imageHolder);
      sigCanvas.width = 640; sigCanvas.height = 240;
      var drawing = false;
      function sigPos(e) {
        var r = sigCanvas.getBoundingClientRect();
        return { x: ((e.clientX - r.left) / r.width) * sigCanvas.width, y: ((e.clientY - r.top) / r.height) * sigCanvas.height };
      }
      sigCanvas.addEventListener("pointerdown", function (e) {
        drawing = true;
        var ctx = sigCanvas.getContext("2d");
        var p = sigPos(e);
        ctx.beginPath(); ctx.moveTo(p.x, p.y);
        ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.strokeStyle = "#111827";
      });
      sigCanvas.addEventListener("pointermove", function (e) {
        if (!drawing) return;
        var ctx = sigCanvas.getContext("2d");
        var p = sigPos(e);
        ctx.lineTo(p.x, p.y); ctx.stroke();
      });
      ["pointerup", "pointerleave"].forEach(function (ev) { sigCanvas.addEventListener(ev, function () { drawing = false; }); });
      var sigBar = h("div", { class: "toolbar" });
      var clearSig = h("button", { class: "btn btn-outline btn-sm", type: "button" }, "Clear signature");
      var useSig = h("button", { class: "btn btn-primary btn-sm", type: "button" }, "Use this signature");
      clearSig.addEventListener("click", function () {
        sigCanvas.getContext("2d").clearRect(0, 0, sigCanvas.width, sigCanvas.height);
        imageData = null;
      });
      useSig.addEventListener("click", function () {
        var dataUrl = sigCanvas.toDataURL("image/png");
        imageData = { dataUrl: dataUrl, bytes: dataUrlToBlob(dataUrl).arrayBuffer ? null : null };
        imageData.promise = dataUrlToBlob(dataUrl).arrayBuffer();
        var status = h("p", { class: "muted small" }, "Signature ready — now click on the page to place it.");
        if (!qs(".sig-status", imageHolder)) { status.className = "muted small sig-status"; imageHolder.appendChild(status); }
        else qs(".sig-status", imageHolder).textContent = "Signature ready — now click on the page to place it.";
      });
      sigBar.appendChild(clearSig); sigBar.appendChild(useSig);
      imageHolder.appendChild(sigBar);
    } else {
      imageHolder.appendChild(field("Image (PNG or JPG)", input({ type: "file", accept: "image/png,image/jpeg" })));
      var fileInput = qs("input[type=file]", imageHolder);
      var preview = h("p", { class: "muted small" }, "No image chosen yet.");
      imageHolder.appendChild(preview);
      fileInput.addEventListener("change", function () {
        var f = fileInput.files[0];
        if (!f) return;
        var dataUrl = URL.createObjectURL(f);
        preview.textContent = f.name + " (" + fmtBytes(f.size) + ")";
        imageData = { dataUrl: dataUrl, promise: f.arrayBuffer() };
      });
    }

    var canvas;
    var origAdd = up.addFiles;
    up.addFiles = function (fl) {
      origAdd(fl);
      var f = up.files()[0];
      if (!f) { stageWrap.innerHTML = ""; return; }
      stageWrap.innerHTML = "";
      canvas = pageCanvas(stageWrap, {
        mode: "click",
        kind: isSignature ? "signature" : "image",
        build: function () { return { dataUrl: imageData ? imageData.dataUrl : "", w: (parseFloat(widthPct.value) || 30) / 100 * (canvas ? canvas.pageWidth : 600) }; },
        onLoaded: function (state) { pageInput.max = String(state.numPages); }
      });
      canvas.load(f).catch(function (err) { stageWrap.innerHTML = ""; stageWrap.appendChild(alertBox("error", err.message)); });
    };
    pageInput.addEventListener("input", function () { if (canvas) canvas.goto(parseInt(pageInput.value, 10) || 1); });
    clearBtn.addEventListener("click", function () { if (canvas) canvas.clear(); });

    var btn = actionButton("Save & Download", function () {
      if (!up.files().length) fail("Please select a PDF file first.");
      if (!imageData) fail(isSignature ? "Draw a signature and press “Use this signature” first." : "Please choose an image first.");
      if (!canvas || !canvas.placements.length) fail("Click on the page preview to position it first.");
      var placements = canvas.placements.slice();
      return writePdf(up.files()[0]).then(function (doc) {
        return imageData.promise.then(function (buf) {
          var u8 = new Uint8Array(buf);
          return u8[0] === 0x89 ? doc.embedPng(u8) : doc.embedJpg(u8);
        }).then(function (img) {
          placements.forEach(function (p) {
            var page = doc.getPage(Math.min(p.page, doc.getPageCount()) - 1);
            var pageWidth = page.getWidth();
            var w = p.w || (parseFloat(widthPct.value) || 30) / 100 * pageWidth;
            var hh = (img.height / img.width) * w;
            page.drawImage(img, { x: p.x, y: p.y - hh, width: w, height: hh });
          });
          return doc.save();
        });
      }).then(function (bytes) {
        var blob = pdfBlob(bytes);
        out.innerHTML = "";
        out.appendChild(resultBox(isSignature ? "Signed PDF" : "PDF with image", blob.size, function () {
          download(blob, isSignature ? "signed.pdf" : "image-added.pdf");
        }));
      });
    });
    qs(".toolbar", root).appendChild(btn);
    qs(".toolbar", root).appendChild(privacyNote(false));
  }
  HANDLERS["add-image-to-pdf"] = function (root) { addImageTool(root, false); };
  HANDLERS["add-signature"] = function (root) { addImageTool(root, true); };

  var DRAG_TOOLS = {
    "highlight-pdf": [{ k: "highlight", label: "Highlight", color: "#facc15" }],
    "underline-pdf": [{ k: "underline", label: "Underline", color: "#dc2626" }],
    "draw-on-pdf": [
      { k: "pen", label: "Pen", color: "#dc2626" },
      { k: "line", label: "Line", color: "#111827" },
      { k: "rect", label: "Rectangle", color: "#2563eb" },
      { k: "circle", label: "Circle", color: "#16a34a" }
    ],
    "add-shapes": [
      { k: "rect", label: "Rectangle", color: "#2563eb" },
      { k: "circle", label: "Circle", color: "#16a34a" },
      { k: "arrow", label: "Arrow", color: "#dc2626" },
      { k: "line", label: "Line", color: "#111827" }
    ],
    "pdf-annotation": [
      { k: "note", label: "Note", color: "#7c3aed" },
      { k: "highlight", label: "Highlight", color: "#facc15" },
      { k: "pen", label: "Draw", color: "#dc2626" }
    ]
  };

  function drawPlacement(doc, p) {
    var page = doc.getPage(Math.min(p.page, doc.getPageCount()) - 1);
    var color = hexColor(p.color || "#dc2626");
    var w = p.w || 0, hh = p.h || 0;
    var sx = p.x, sy = p.y, ex2 = p.x + w, ey2 = p.y + hh;
    if (p.points && p.points[0] && p.ex !== undefined) { sx = p.points[0].x; sy = p.points[0].y; ex2 = p.ex; ey2 = p.ey; }
    if (p.kind === "highlight") {
      page.drawRectangle({ x: p.x, y: p.y, width: w || 60, height: hh || 18, color: color, opacity: 0.35 });
    } else if (p.kind === "underline") {
      page.drawLine({ start: { x: p.x, y: p.y }, end: { x: p.x + (w || 60), y: p.y }, thickness: 2, color: color });
    } else if (p.kind === "pen") {
      (p.points || []).slice(1).forEach(function (pt, i) {
        page.drawLine({ start: p.points[i], end: pt, thickness: 1.6, color: color });
      });
    } else if (p.kind === "rect") {
      page.drawRectangle({ x: p.x, y: p.y, width: w || 60, height: hh || 40, borderColor: color, borderWidth: 1.6 });
    } else if (p.kind === "circle") {
      page.drawEllipse({ x: p.x + w / 2, y: p.y + hh / 2, xScale: w / 2 || 30, yScale: hh / 2 || 20, borderColor: color, borderWidth: 1.6 });
    } else if (p.kind === "line") {
      page.drawLine({ start: { x: sx, y: sy }, end: { x: ex2, y: ey2 }, thickness: 1.6, color: color });
    } else if (p.kind === "arrow") {
      var ex = ex2, ey = ey2;
      page.drawLine({ start: { x: sx, y: sy }, end: { x: ex, y: ey }, thickness: 1.8, color: color });
      var ang = Math.atan2(ey - sy, ex - sx), head = 9;
      page.drawLine({ start: { x: ex, y: ey }, end: { x: ex - head * Math.cos(ang - 0.45), y: ey - head * Math.sin(ang - 0.45) }, thickness: 1.8, color: color });
      page.drawLine({ start: { x: ex, y: ey }, end: { x: ex - head * Math.cos(ang + 0.45), y: ey - head * Math.sin(ang + 0.45) }, thickness: 1.8, color: color });
    } else if (p.kind === "note") {
      return embedFont(doc, "Helvetica-Bold").then(function (font) {
        var label = "• " + (p.text || "Note");
        var tw = font.widthOfTextAtSize(label, 10) + 10;
        page.drawRectangle({ x: p.x, y: p.y - 4, width: tw, height: 18, color: window.PDFLib.rgb(0.96, 0.93, 0.78), borderColor: color, borderWidth: 1 });
        page.drawText(label, { x: p.x + 5, y: p.y + 2, size: 10, font: font, color: window.PDFLib.rgb(0.2, 0.15, 0.05) });
      });
    }
    return Promise.resolve();
  }

  function dragEditorTool(root, toolId) {
    var specs = DRAG_TOOLS[toolId];
    var current = specs[0];
    var up = uploader({});
    var bar = h("div", { class: "annotation-toolbar" });
    var colorInput = input({ type: "color", value: current.color });
    colorInput.style.width = "3rem";
    var noteInput = input({ placeholder: "Note text", value: "Note" });
    var clearBtn = h("button", { class: "btn btn-outline btn-sm", type: "button" }, "Clear annotations");
    var stageWrap = h("div");
    var out = h("div");
    root.appendChild(up.node);
    root.appendChild(bar);
    root.appendChild(h("p", { class: "muted small" }, current.k === "note" ? "Click on the page to place a note." : "Drag on the page to draw."));
    root.appendChild(stageWrap);
    root.appendChild(clearBtn);
    root.appendChild(h("div", { class: "toolbar" }));
    root.appendChild(out);

    var canvas;
    specs.forEach(function (s) {
      var b = h("button", { class: "btn btn-ghost btn-sm", type: "button" }, s.label);
      if (s === current) b.className = "btn btn-primary btn-sm";
      b.addEventListener("click", function () {
        current = s;
        colorInput.value = s.color;
        qsa("button", bar).forEach(function (x) { if (x !== clearBtn) x.className = "btn btn-ghost btn-sm"; });
        b.className = "btn btn-primary btn-sm";
        root.querySelector(".muted.small").textContent = s.k === "note" ? "Click on the page to place a note." : "Drag on the page to draw.";
        mount();
      });
      bar.appendChild(b);
    });
    var colorLabel = h("span", { class: "muted small" }, "Color");
    bar.appendChild(colorLabel);
    bar.appendChild(colorInput);
    if (specs.some(function (s) { return s.k === "note"; })) bar.appendChild(noteInput);

    function mount() {
      var f = up.files()[0];
      if (!f) { stageWrap.innerHTML = ""; canvas = null; return; }
      stageWrap.innerHTML = "";
      canvas = pageCanvas(stageWrap, {
        mode: current.k === "note" ? "click" : "drag",
        kind: current.k,
        color: current.color,
        build: current.k === "note" ? function () { return { text: noteInput.value }; } : null
      });
      canvas.load(f).catch(function (err) { stageWrap.innerHTML = ""; stageWrap.appendChild(alertBox("error", err.message)); });
    }
    colorInput.addEventListener("input", function () { if (canvas) { canvas.placements.forEach(function (p) { p.color = colorInput.value; }); canvas.refresh(); } });
    clearBtn.addEventListener("click", function () { if (canvas) canvas.clear(); });

    var origAdd = up.addFiles;
    up.addFiles = function (fl) { origAdd(fl); mount(); };

    var btn = actionButton("Save & Download", function () {
      if (!up.files().length) fail("Please select a PDF file first.");
      if (!canvas || !canvas.placements.length) fail("Draw or click on the page first.");
      var placements = canvas.placements.map(function (p) { return Object.assign({}, p, { color: colorInput.value }); });
      return writePdf(up.files()[0]).then(function (doc) {
        return placements.reduce(function (chain, p) {
          return chain.then(function () { return drawPlacement(doc, p); });
        }, Promise.resolve()).then(function () { return doc.save(); });
      }).then(function (bytes) {
        var blob = pdfBlob(bytes);
        out.innerHTML = "";
        out.appendChild(resultBox("Annotated PDF", blob.size, function () { download(blob, "annotated.pdf"); }));
      });
    });
    qs(".toolbar", root).appendChild(btn);
    qs(".toolbar", root).appendChild(privacyNote(false));
  }
  Object.keys(DRAG_TOOLS).forEach(function (id) {
    HANDLERS[id] = function (root) { dragEditorTool(root, id); };
  });

  HANDLERS["add-watermark"] = function (root) {
    var up = uploader({});
    var controls = h("div", { class: "control-grid cols-3" });
    var text = input({ value: "CONFIDENTIAL" });
    var size = input({ type: "number", min: "8", max: "144", value: "48" });
    var opacity = input({ type: "number", min: "5", max: "100", value: "20" });
    var rotation = input({ type: "number", min: "0", max: "90", value: "45" });
    var position = select([["center", "Center"], ["top-left", "Top left"], ["top-right", "Top right"], ["bottom-left", "Bottom left"], ["bottom-right", "Bottom right"]], "center");
    controls.appendChild(field("Watermark text", text));
    controls.appendChild(field("Font size", size));
    controls.appendChild(field("Opacity (%)", opacity));
    controls.appendChild(field("Rotation (°)", rotation));
    controls.appendChild(field("Position", position));
    var out = h("div");
    root.appendChild(up.node);
    root.appendChild(controls);
    root.appendChild(h("div", { class: "toolbar" }));
    root.appendChild(out);
    var btn = actionButton("Add Watermark", function (prog) {
      if (!up.files().length) fail("Please select a PDF file first.");
      if (!text.value.trim()) fail("Enter watermark text first.");
      return writePdf(up.files()[0]).then(function (doc) {
        return embedFont(doc, "Helvetica-Bold").then(function (font) {
          var count = doc.getPageCount();
          for (var i = 0; i < count; i++) {
            var page = doc.getPage(i);
            var size0 = page.getSize();
            var tw = font.widthOfTextAtSize(text.value, parseFloat(size.value) || 48);
            var th = font.heightAtSize(parseFloat(size.value) || 48);
            var margin = 40;
            var pos = {
              center: [(size0.width - tw) / 2, (size0.height - th) / 2],
              "top-left": [margin, size0.height - margin - th],
              "top-right": [size0.width - tw - margin, size0.height - margin - th],
              "bottom-left": [margin, margin],
              "bottom-right": [size0.width - tw - margin, margin]
            }[position.value] || [(size0.width - tw) / 2, (size0.height - th) / 2];
            page.drawText(text.value, {
              x: pos[0], y: pos[1], size: parseFloat(size.value) || 48, font: font,
              color: window.PDFLib.rgb(0.6, 0.6, 0.65),
              opacity: (parseFloat(opacity.value) || 20) / 100,
              rotate: window.PDFLib.degrees(parseFloat(rotation.value) || 0)
            });
          }
          prog.set(95, "Saving…");
          return doc.save();
        });
      }).then(function (bytes) {
        var blob = pdfBlob(bytes);
        out.innerHTML = "";
        out.appendChild(resultBox("Watermarked PDF", blob.size, function () { download(blob, "watermarked.pdf"); }));
      });
    });
    qs(".toolbar", root).appendChild(btn);
    qs(".toolbar", root).appendChild(privacyNote(false));
  };

  HANDLERS["add-page-numbers"] = function (root) {
    var up = uploader({});
    var controls = h("div", { class: "control-grid" });
    var position = select([
      ["bottom-center", "Bottom center"], ["bottom-right", "Bottom right"], ["bottom-left", "Bottom left"],
      ["top-center", "Top center"], ["top-right", "Top right"], ["top-left", "Top left"]
    ]);
    var start = input({ type: "number", min: "0", value: "1" });
    var fmtSel = select([["plain", "1, 2, 3"], ["dash", "1 - 2 - 3"], ["page-of", "Page 1 of N"]]);
    controls.appendChild(field("Position", position));
    controls.appendChild(field("Start numbering at", start));
    controls.appendChild(field("Format", fmtSel));
    var out = h("div");
    root.appendChild(up.node);
    root.appendChild(controls);
    root.appendChild(h("div", { class: "toolbar" }));
    root.appendChild(out);
    var btn = actionButton("Add Page Numbers", function () {
      if (!up.files().length) fail("Please select a PDF file first.");
      return writePdf(up.files()[0]).then(function (doc) {
        return embedFont(doc, "Helvetica").then(function (font) {
          var count = doc.getPageCount();
          var offset = parseInt(start.value, 10) || 1;
          for (var i = 0; i < count; i++) {
            var page = doc.getPage(i);
            var size0 = page.getSize();
            var n = offset + i;
            var label = fmtSel.value === "dash" ? n + " - " + n : fmtSel.value === "page-of" ? "Page " + n + " of " + (offset + count - 1) : String(n);
            var tw = font.widthOfTextAtSize(label, 11);
            var margin = 28;
            var pos = {
              "bottom-center": [(size0.width - tw) / 2, margin],
              "bottom-right": [size0.width - tw - margin, margin],
              "bottom-left": [margin, margin],
              "top-center": [(size0.width - tw) / 2, size0.height - margin - 8],
              "top-right": [size0.width - tw - margin, size0.height - margin - 8],
              "top-left": [margin, size0.height - margin - 8]
            }[position.value];
            page.drawText(label, { x: pos[0], y: pos[1], size: 11, font: font, color: window.PDFLib.rgb(0.15, 0.15, 0.15) });
          }
          return doc.save();
        });
      }).then(function (bytes) {
        var blob = pdfBlob(bytes);
        out.innerHTML = "";
        out.appendChild(resultBox("Numbered PDF", blob.size, function () { download(blob, "numbered.pdf"); }));
      });
    });
    qs(".toolbar", root).appendChild(btn);
    qs(".toolbar", root).appendChild(privacyNote(false));
  };

  /* ---------------- Security ---------------- */

  HANDLERS["protect-pdf"] = function (root) {
    var up = uploader({});
    var controls = h("div", { class: "control-grid" });
    var user = input({ type: "password", placeholder: "Password to open the PDF" });
    var owner = input({ type: "password", placeholder: "Owner password (optional)" });
    var noCopy = checkboxRow("Prevent copying text", false);
    var noPrint = checkboxRow("Prevent printing", false);
    var noModify = checkboxRow("Prevent modifying", true);
    controls.appendChild(field("Open password (required)", user, "Anyone opening the file must enter this."));
    controls.appendChild(field("Owner password (optional)", owner, "Controls the restrictions below. Random if left empty."));
    var checks = h("div", { class: "field" });
    checks.appendChild(h("span", { class: "hint" }, "Restrictions"));
    checks.appendChild(noCopy); checks.appendChild(noPrint); checks.appendChild(noModify);
    controls.appendChild(checks);
    var out = h("div");
    root.appendChild(up.node);
    root.appendChild(controls);
    root.appendChild(h("div", { class: "toolbar" }));
    root.appendChild(out);
    var btn = actionButton("Protect PDF", function () {
      if (!up.files().length) fail("Please select a PDF file first.");
      if (user.value.length < 4) fail("Enter an open password of at least 4 characters.");
      return writePdf(up.files()[0]).then(function (doc) {
        doc.encrypt({
          userPassword: user.value,
          ownerPassword: owner.value || (Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)),
          permissions: {
            printing: noPrint.input.checked ? false : "highResolution",
            modifying: !noModify.input.checked, copying: !noCopy.input.checked,
            annotating: !noModify.input.checked, fillingForms: true,
            contentAccessibility: true, documentAssembly: !noModify.input.checked
          }
        });
        return doc.save();
      }).then(function (bytes) {
        var blob = pdfBlob(bytes);
        out.innerHTML = "";
        out.appendChild(alertBox("ok", "Encrypted offline in your browser. Remember the password — it cannot be recovered."));
        out.appendChild(resultBox("Protected PDF", blob.size, function () { download(blob, "protected.pdf"); }));
      });
    });
    qs(".toolbar", root).appendChild(btn);
    qs(".toolbar", root).appendChild(privacyNote(false));
  };

  HANDLERS["unlock-pdf"] = function (root) {
    var up = uploader({});
    var pw = input({ type: "password", placeholder: "PDF password (leave empty if only restricted)" });
    var out = h("div");
    root.appendChild(alertBox("warn", "You must know the password. If the PDF is encrypted, the unlocked copy is rebuilt from page images, so its text is no longer selectable."));
    root.appendChild(up.node);
    root.appendChild(h("div", { class: "control-grid" }));
    qs(".control-grid", root).appendChild(field("Password", pw));
    root.appendChild(h("div", { class: "toolbar" }));
    root.appendChild(out);
    var btn = actionButton("Unlock PDF", function (prog) {
      if (!up.files().length) fail("Please select a PDF file first.");
      var file = up.files()[0];
      requirePdfJs(); requirePdfLib();
      return file.arrayBuffer().then(function (buf) {
        var u8 = new Uint8Array(buf);
        return window.pdfjsLib.getDocument({ data: u8.slice(), password: pw.value || undefined }).promise.then(function (pdf) {
          return window.PDFLib.PDFDocument.load(u8.slice()).then(function (d) { return d.save(); }, function () {
            var target = newPdf();
            var chain = Promise.resolve();
            for (var i = 1; i <= pdf.numPages; i++) {
              (function (n) {
                chain = chain.then(function () {
                  return renderPage(pdf, n, 2).then(function (r) {
                    return target.embedJpg(r.canvas.toDataURL("image/jpeg", 0.92)).then(function (img) {
                      var pg = target.addPage([r.width / 2, r.height / 2]);
                      pg.drawImage(img, { x: 0, y: 0, width: r.width / 2, height: r.height / 2 });
                      prog.set((n / pdf.numPages) * 95, "Rebuilding page " + n + " of " + pdf.numPages + "…");
                    });
                  });
                });
              })(i);
            }
            return chain.then(function () { return target.save(); });
          });
        }, function (err) {
          if (err && err.name === "PasswordException") fail(pw.value ? "Wrong password." : "This PDF needs a password to open. Enter it above.");
          fail("Could not read this file. It may be corrupted or not a valid PDF.");
        });
      }).then(function (bytes) {
        var blob = pdfBlob(bytes);
        out.innerHTML = "";
        out.appendChild(alertBox("ok", "Unlocked — the new copy opens without a password."));
        out.appendChild(resultBox("Unlocked PDF", blob.size, function () { download(blob, baseName(file.name) + "-unlocked.pdf"); }));
      });
    });
    qs(".toolbar", root).appendChild(btn);
    qs(".toolbar", root).appendChild(privacyNote(false));
  };

  HANDLERS["remove-metadata"] = function (root) {
    var up = uploader({});
    var out = h("div");
    root.appendChild(up.node);
    root.appendChild(h("p", { class: "muted small" }, "Author, title, subject, keywords, creator, producer, dates and XMP metadata are removed. Page content is untouched."));
    root.appendChild(h("div", { class: "toolbar" }));
    root.appendChild(out);
    var btn = actionButton("Remove Metadata", function () {
      if (!up.files().length) fail("Please select a PDF file first.");
      return writePdf(up.files()[0]).then(function (doc) {
        var N = window.PDFLib.PDFName;
        ["Title", "Author", "Subject", "Keywords", "Creator", "Producer", "CreationDate", "ModDate"].forEach(function (k) { doc.getInfoDict().delete(N.of(k)); });
        doc.catalog.delete(N.of("Metadata"));
        return doc.save();
      }).then(function (bytes) {
        var blob = pdfBlob(bytes);
        out.innerHTML = "";
        out.appendChild(resultBox("Cleaned PDF", blob.size, function () { download(blob, "clean.pdf"); }));
      });
    });
    qs(".toolbar", root).appendChild(btn);
    qs(".toolbar", root).appendChild(privacyNote(false));
  };

  HANDLERS["view-pdf-metadata"] = function (root) {
    var up = uploader({});
    var out = h("div");
    root.appendChild(up.node);
    root.appendChild(h("div", { class: "toolbar" }));
    root.appendChild(out);
    var btn = actionButton("Inspect Metadata", function () {
      if (!up.files().length) fail("Please select a PDF file first.");
      var file = up.files()[0];
      return readPdf(file).then(function (doc) {
        return doc.getMetadata().then(function (meta) {
          var info = meta.info || {};
          var toDate = parsePdfDate;
          var pairs = [
            ["Title", info.Title || "—"],
            ["Author", info.Author || "—"],
            ["Subject", info.Subject || "—"],
            ["Keywords", info.Keywords || "—"],
            ["Creator", info.Creator || "—"],
            ["Producer", info.Producer || "—"],
            ["Creation date", fmtDate(toDate(info.CreationDate))],
            ["Modification date", fmtDate(toDate(info.ModDate))],
            ["Page count", String(doc.numPages)],
            ["File size", fmtBytes(file.size)]
          ];
          out.innerHTML = "";
          out.appendChild(statsBox(pairs));
        });
      });
    });
    qs(".toolbar", root).appendChild(btn);
    qs(".toolbar", root).appendChild(privacyNote(false));
  };

  /* ---------------- Images ---------------- */

  HANDLERS["extract-images"] = function (root) {
    var up = uploader({});
    var out = h("div");
    root.appendChild(up.node);
    root.appendChild(h("div", { class: "toolbar" }));
    root.appendChild(out);
    var btn = actionButton("Extract Images", function (prog) {
      if (!up.files().length) fail("Please select a PDF file first.");
      var file = up.files()[0];
      return readPdf(file).then(function (doc) {
        var base = baseName(file.name);
        var items = [];
        var chain = Promise.resolve();
        for (var i = 1; i <= doc.numPages; i++) {
          (function (n) {
            chain = chain.then(function () {
              return renderPage(doc, n, 2).then(function (r) {
                items.push({ url: r.canvas.toDataURL("image/png"), name: base + "-page" + n + ".png" });
                prog.set((n / doc.numPages) * 95, "Scanning page " + n + " of " + doc.numPages + "…");
              });
            });
          })(i);
        }
        return chain.then(function () { return items; });
      }).then(function (items) {
        out.innerHTML = "";
        out.appendChild(h("p", { class: "muted small" },
          items.length + " image" + (items.length > 1 ? "s" : "") + " extracted as high-resolution page renders (browsers cannot pull raw embedded bitmaps from every PDF format)."));
        var grid = h("div", { class: "img-grid" });
        items.forEach(function (it) {
          var fig = h("figure", { class: "img-card" });
          fig.appendChild(h("img", { alt: it.name, src: it.url }));
          var cap = h("figcaption");
          cap.appendChild(h("span", null, it.name));
          var save = h("button", { class: "btn btn-outline btn-sm", type: "button" }, "Save");
          save.addEventListener("click", function () { downloadDataUrl(it.url, it.name); });
          cap.appendChild(save);
          fig.appendChild(cap);
          grid.appendChild(fig);
        });
        out.appendChild(grid);
      });
    });
    qs(".toolbar", root).appendChild(btn);
    qs(".toolbar", root).appendChild(privacyNote(false));
  };

  HANDLERS["images-to-pdf"] = function (root) {
    var up = uploader({ multiple: true, accept: "image/jpeg,image/png", label: "Drag & Drop JPG or PNG Images Here" });
    var controls = h("div", { class: "control-grid" });
    var marginSel = select([["0", "No margin"], ["24", "Small margin"], ["48", "Large margin"]]);
    controls.appendChild(field("Page margin (pt)", marginSel));
    var out = h("div");
    root.appendChild(up.node);
    root.appendChild(controls);
    root.appendChild(h("div", { class: "toolbar" }));
    root.appendChild(out);
    var btn = actionButton("Combine into PDF", function (prog) {
      var files = up.files();
      if (!files.length) fail("Please choose at least one image.");
      var doc = newPdf();
      var margin = parseFloat(marginSel.value) || 0;
      var chain = Promise.resolve();
      files.forEach(function (f, i) {
        chain = chain.then(function () {
          var dataUrl = URL.createObjectURL(f);
          return new Promise(function (resolve) {
            var img = new Image();
            img.onload = function () {
              var scale = Math.min(1, 2000 / img.width, 2000 / img.height);
              var w = Math.round(img.width * scale), hh = Math.round(img.height * scale);
              var c = document.createElement("canvas");
              c.width = w; c.height = hh;
              var ctx = c.getContext("2d");
              ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, hh);
              ctx.drawImage(img, 0, 0, w, hh);
              resolve(c.toDataURL("image/jpeg", 0.85));
            };
            img.onerror = function () { resolve(null); };
            img.src = dataUrl;
          }).then(function (dataUrl) {
            if (!dataUrl) return;
            return doc.embedJpg(dataUrl).then(function (embedded) {
              var page = doc.addPage([embedded.width + margin * 2, embedded.height + margin * 2]);
              page.drawImage(embedded, { x: margin, y: margin, width: embedded.width, height: embedded.height });
              prog.set(((i + 1) / files.length) * 95, "Adding image " + (i + 1) + " of " + files.length + "…");
            });
          });
        });
      });
      return chain.then(function () { return doc.save(); }).then(function (bytes) {
        var blob = pdfBlob(bytes);
        out.innerHTML = "";
        out.appendChild(resultBox("Combined PDF", blob.size, function () { download(blob, "images.pdf"); }));
      });
    });
    qs(".toolbar", root).appendChild(btn);
    qs(".toolbar", root).appendChild(privacyNote(false));
  };

  HANDLERS["pdf-image-compressor"] = function (root) {
    var up = uploader({});
    var controls = h("div", { class: "control-grid" });
    var level = select([["light", "Light"], ["medium", "Medium"], ["strong", "Strong"]]);
    controls.appendChild(field("Quality", level, "Strong compression rasterizes pages, so text is no longer selectable."));
    var out = h("div");
    root.appendChild(up.node);
    root.appendChild(controls);
    root.appendChild(h("div", { class: "toolbar" }));
    root.appendChild(out);
    var btn = actionButton("Compress Images", function (prog) {
      if (!up.files().length) fail("Please select a PDF file first.");
      var file = up.files()[0];
      var q = level.value === "light" ? 0.75 : level.value === "strong" ? 0.4 : 0.55;
      var scale = level.value === "light" ? 1.6 : level.value === "strong" ? 1.0 : 1.3;
      return readPdf(file).then(function (doc) {
        var target = newPdf();
        var chain = Promise.resolve();
        for (var i = 1; i <= doc.numPages; i++) {
          (function (n) {
            chain = chain.then(function () {
              return renderPage(doc, n, scale).then(function (r) {
                return target.embedJpg(r.canvas.toDataURL("image/jpeg", q)).then(function (img) {
                  var page = target.addPage([r.width / scale, r.height / scale]);
                  page.drawImage(img, { x: 0, y: 0, width: r.width / scale, height: r.height / scale });
                  prog.set((n / doc.numPages) * 95, "Compressing page " + n + " of " + doc.numPages + "…");
                });
              });
            });
          })(i);
        }
        return chain.then(function () { return target.save({ useObjectStreams: true }); });
      }).then(function (bytes) {
        var blob = pdfBlob(bytes);
        var pct = Math.round(((file.size - blob.size) / file.size) * 100);
        out.innerHTML = "";
        out.appendChild(statsBox([
          ["Original", fmtBytes(file.size)],
          ["Compressed", fmtBytes(blob.size)],
          ["Change", (pct > 0 ? "-" : "+") + Math.abs(pct) + "%"]
        ]));
        out.appendChild(resultBox("Compressed PDF", blob.size, function () { download(blob, "compressed-images.pdf"); }));
      });
    });
    qs(".toolbar", root).appendChild(btn);
    qs(".toolbar", root).appendChild(privacyNote(false));
  };

  HANDLERS["pdf-screenshot"] = function (root) {
    var up = uploader({});
    var controls = h("div", { class: "control-grid" });
    var pageInput = input({ type: "number", min: "1", value: "1" });
    var scaleInput = input({ type: "number", min: "1", max: "4", step: "0.5", value: "2.5" });
    controls.appendChild(field("Page", pageInput));
    controls.appendChild(field("Render scale", scaleInput));
    var out = h("div");
    root.appendChild(up.node);
    root.appendChild(controls);
    root.appendChild(h("div", { class: "toolbar" }));
    root.appendChild(out);
    var origAdd = up.addFiles;
    up.addFiles = function (fl) { origAdd(fl); out.innerHTML = ""; };
    var btn = actionButton("Capture Screenshot", function () {
      if (!up.files().length) fail("Please select a PDF file first.");
      var file = up.files()[0];
      return readPdf(file).then(function (doc) {
        pageInput.max = String(doc.numPages);
        var n = Math.min(Math.max(1, parseInt(pageInput.value, 10) || 1), doc.numPages);
        var scale = Math.max(0.5, Math.min(4, parseFloat(scaleInput.value) || 2.5));
        return renderPage(doc, n, scale).then(function (r) {
          var url = r.canvas.toDataURL("image/png");
          var name = baseName(file.name) + "-p" + n + ".png";
          out.innerHTML = "";
          var img = h("img", { alt: "Page screenshot", src: url, style: "max-height:28rem;border:1px solid var(--border);border-radius:12px" });
          out.appendChild(img);
          out.appendChild(resultBox(name, undefined, function () { downloadDataUrl(url, name); }));
        });
      });
    });
    qs(".toolbar", root).appendChild(btn);
    qs(".toolbar", root).appendChild(privacyNote(false));
  };

  HANDLERS["contact-sheet"] = function (root) {
    var up = uploader({});
    var controls = h("div", { class: "control-grid" });
    var cols = select([["3", "3 per row"], ["4", "4 per row"], ["5", "5 per row"], ["6", "6 per row"]], "4");
    controls.appendChild(field("Thumbnails per row", cols));
    var out = h("div");
    root.appendChild(up.node);
    root.appendChild(controls);
    root.appendChild(h("div", { class: "toolbar" }));
    root.appendChild(out);
    var btn = actionButton("Build Contact Sheet", function (prog) {
      if (!up.files().length) fail("Please select a PDF file first.");
      return readPdf(up.files()[0]).then(function (doc) {
        var thumbs = [];
        var chain = Promise.resolve();
        for (var i = 1; i <= doc.numPages; i++) {
          (function (n) {
            chain = chain.then(function () {
              return renderPage(doc, n, 0.4).then(function (r) {
                thumbs.push(r.canvas);
                prog.set((n / doc.numPages) * 70, "Rendering thumbnail " + n + " of " + doc.numPages + "…");
              });
            });
          })(i);
        }
        return chain.then(function () { return { thumbs: thumbs, count: doc.numPages }; });
      }).then(function (data) {
        var perRow = parseInt(cols.value, 10) || 4;
        var outDoc = newPdf();
        var A4 = PAGE_SIZES.A4;
        var margin = 40, gap = 14;
        var cellW = (A4[0] - margin * 2 - gap * (perRow - 1)) / perRow;
        var cellH = cellW * 1.414;
        var perPageRows = Math.max(1, Math.floor((A4[1] - margin * 2) / (cellH + gap)));
        var perPage = perRow * perPageRows;
        var pages = Math.ceil(data.thumbs.length / perPage);
        var chain = Promise.resolve();
        for (var p = 0; p < pages; p++) {
          (function (pi) {
            chain = chain.then(function () {
              var page = outDoc.addPage(A4);
              var jobs = [];
              for (var k = 0; k < perPage; k++) {
                var idx = pi * perPage + k;
                if (idx >= data.thumbs.length) break;
                (function (index, slot) {
                  jobs.push(outDoc.embedPng(data.thumbs[index].toDataURL("image/png")).then(function (img) {
                    var col = slot % perRow;
                    var row = Math.floor(slot / perRow);
                    var x = margin + col * (cellW + gap);
                    var y = A4[1] - margin - (row + 1) * (cellH + gap) + gap;
                    page.drawImage(img, { x: x, y: y, width: cellW, height: cellH });
                    return embedFont(outDoc, "Helvetica").then(function (font) {
                      page.drawText(String(index + 1), { x: x + 2, y: y - 2, size: 8, font: font, color: window.PDFLib.rgb(0.3, 0.3, 0.3) });
                    });
                  }));
                })(idx, k);
              }
              prog.set(70 + (30 * (pi + 1)) / pages, "Composing sheet " + (pi + 1) + " of " + pages + "…");
              return Promise.all(jobs);
            });
          })(p);
        }
        return chain.then(function () { return outDoc.save(); });
      }).then(function (bytes) {
        var blob = pdfBlob(bytes);
        out.innerHTML = "";
        out.appendChild(resultBox("Contact sheet PDF", blob.size, function () { download(blob, "contact-sheet.pdf"); }));
      });
    });
    qs(".toolbar", root).appendChild(btn);
    qs(".toolbar", root).appendChild(privacyNote(false));
  };

  /* ---------------- Text ---------------- */

  HANDLERS["word-counter"] = function (root) {
    var up = uploader({});
    var out = h("div");
    root.appendChild(up.node);
    root.appendChild(h("div", { class: "toolbar" }));
    root.appendChild(out);
    var btn = actionButton("Analyze Text", function (prog) {
      if (!up.files().length) fail("Please select a PDF file first.");
      return readPdf(up.files()[0]).then(function (doc) {
        prog.set(20, "Reading text…");
        return extractTextPages(doc).then(function (pages) {
          var text = pages.join("\n\n");
          prog.set(90, "Counting…");
          var words = text.split(/\s+/).filter(Boolean).length;
          var sentences = (text.match(/[.!?]+(\s|$)/g) || []).length;
          var paragraphs = text.split(/\n{2,}/).filter(function (p) { return p.trim(); }).length;
          out.innerHTML = "";
          out.appendChild(statsBox([
            ["Words", fmtNum(words)],
            ["Characters", fmtNum(text.length)],
            ["Sentences", fmtNum(sentences)],
            ["Paragraphs", fmtNum(paragraphs)],
            ["Pages", fmtNum(doc.numPages)]
          ]));
        });
      });
    });
    qs(".toolbar", root).appendChild(btn);
    qs(".toolbar", root).appendChild(privacyNote(false));
  };

  HANDLERS["find-highlight"] = function (root) {
    var up = uploader({});
    var controls = h("div", { class: "control-grid" });
    var query = input({ placeholder: "Type to highlight matches…" });
    controls.appendChild(field("Find in text", query));
    var out = h("div");
    root.appendChild(up.node);
    root.appendChild(controls);
    root.appendChild(h("div", { class: "toolbar" }));
    root.appendChild(out);
    var pages = null;
    query.addEventListener("input", function () { if (pages) renderMatches(); });
    function renderMatches() {
      var q = query.value.trim();
      out.innerHTML = "";
      if (!pages) return;
      var pre = h("div", { class: "text-preview" });
      var total = 0;
      pages.forEach(function (text, i) {
        var group = h("div", { class: "text-group" });
        group.appendChild(h("p", { class: "page-label" }, "Page " + (i + 1)));
        if (!q) { group.appendChild(h("pre", { class: "text-preview", style: "border:0;padding:0" }, text)); pre.appendChild(group); return; }
        var safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        var parts = text.split(new RegExp("(" + safe + ")", "gi"));
        parts.forEach(function (part) {
          if (part.toLowerCase() === q.toLowerCase()) {
            total++;
            group.appendChild(h("mark", null, part));
          } else group.appendChild(document.createTextNode(part));
        });
        pre.appendChild(group);
      });
      if (q) out.appendChild(h("p", { class: "muted small" }, total + " match" + (total === 1 ? "" : "es") + " for “" + q + "”"));
      out.appendChild(pre);
    }
    var btn = actionButton("Extract Text", function (prog) {
      if (!up.files().length) fail("Please select a PDF file first.");
      return readPdf(up.files()[0]).then(function (doc) {
        prog.set(20, "Extracting…");
        return extractTextPages(doc).then(function (p) {
          pages = p;
          prog.set(90, "Done");
          renderMatches();
        });
      });
    });
    qs(".toolbar", root).appendChild(btn);
    qs(".toolbar", root).appendChild(privacyNote(false));
  };

  HANDLERS["text-extractor"] = function (root) {
    var up = uploader({});
    var out = h("div");
    root.appendChild(up.node);
    root.appendChild(h("div", { class: "toolbar" }));
    root.appendChild(out);
    var btn = actionButton("Extract Text", function (prog) {
      if (!up.files().length) fail("Please select a PDF file first.");
      var file = up.files()[0];
      return readPdf(file).then(function (doc) {
        prog.set(20, "Extracting text…");
        return extractTextPages(doc).then(function (pages) {
          prog.set(90, "Done");
          out.innerHTML = "";
          var bar = h("div", { class: "toolbar" });
          var copy = h("button", { class: "btn btn-ghost", type: "button" }, "Copy all text");
          copy.addEventListener("click", function () { navigator.clipboard && navigator.clipboard.writeText(pages.join("\n\n")); });
          var dl = h("button", { class: "btn btn-primary", type: "button" }, "Download .txt");
          dl.addEventListener("click", function () {
            download(new Blob([pages.join("\n\n")], { type: "text/plain;charset=utf-8" }), baseName(file.name) + ".txt");
          });
          bar.appendChild(copy); bar.appendChild(dl);
          out.appendChild(bar);
          var pre = h("div", { class: "text-preview" });
          pages.forEach(function (text, i) {
            var group = h("div", { class: "text-group" });
            group.appendChild(h("p", { class: "page-label" }, "Page " + (i + 1)));
            group.appendChild(h("pre", { style: "white-space:pre-wrap;margin:0;font:inherit" }, text || "(no text on this page)"));
            pre.appendChild(group);
          });
          out.appendChild(pre);
        });
      });
    });
    qs(".toolbar", root).appendChild(btn);
    qs(".toolbar", root).appendChild(privacyNote(false));
  };

  HANDLERS["pdf-text-cleaner"] = function (root) {
    var up = uploader({});
    var controls = h("div", { class: "control-grid cols-3" });
    var collapse = checkboxRow("Collapse multiple spaces", true);
    var dropEmpty = checkboxRow("Remove empty lines", true);
    var dedupe = checkboxRow("Deduplicate line breaks", true);
    controls.appendChild(collapse);
    controls.appendChild(dropEmpty);
    controls.appendChild(dedupe);
    var grid = h("div", { class: "control-grid" });
    var rawArea = h("div");
    var cleanArea = h("div");
    rawArea.appendChild(field("Extracted text", textarea({ rows: 12 })));
    cleanArea.appendChild(field("Cleaned text", textarea({ rows: 12, readonly: "readonly" })));
    grid.appendChild(rawArea);
    grid.appendChild(cleanArea);
    var cleanBtn = h("button", { class: "btn btn-sm", type: "button" }, "Clean text");
    var out = h("div");
    root.appendChild(up.node);
    root.appendChild(controls);
    root.appendChild(h("div", { class: "toolbar" }));
    root.appendChild(grid);
    root.appendChild(cleanBtn);
    root.appendChild(out);
    var rawTa = qs("textarea", rawArea);
    var cleanTa = qs("textarea", cleanArea);
    cleanBtn.addEventListener("click", function () {
      var t = rawTa.value;
      if (collapse.input.checked) t = t.replace(/[ \t]{2,}/g, " ");
      if (dropEmpty.input.checked) t = t.split("\n").filter(function (l) { return l.trim().length; }).join("\n");
      if (dedupe.input.checked) t = t.replace(/\n{3,}/g, "\n\n");
      cleanTa.value = t.trim();
    });
    var btn = actionButton("Extract from PDF", function (prog) {
      if (!up.files().length) fail("Please select a PDF file first.");
      return readPdf(up.files()[0]).then(function (doc) {
        prog.set(20, "Extracting…");
        return extractTextPages(doc).then(function (pages) {
          rawTa.value = pages.join("\n\n");
          prog.set(90, "Done");
        });
      });
    });
    qs(".toolbar", root).appendChild(btn);
    qs(".toolbar", root).appendChild(privacyNote(false));
    var dl = h("button", { class: "btn btn-outline", type: "button" }, "Download cleaned .txt");
    dl.addEventListener("click", function () {
      if (!cleanTa.value) fail("Clean the text first.");
      download(new Blob([cleanTa.value], { type: "text/plain;charset=utf-8" }), "cleaned.txt");
    });
    root.appendChild(dl);
  };

  /* ---------------- Utilities ---------------- */

  HANDLERS["pdf-viewer"] = function (root) {
    var up = uploader({});
    var stage = h("div", { class: "canvas-stage" });
    var img = h("img", { alt: "" });
    stage.appendChild(img);
    var controls = h("div", { class: "toolbar" });
    var prev = h("button", { class: "btn btn-ghost btn-sm", type: "button" }, "← Previous");
    var label = h("span", { class: "muted small" }, "Page — of —");
    var next = h("button", { class: "btn btn-ghost btn-sm", type: "button" }, "Next →");
    var zoomOut = h("button", { class: "btn btn-ghost btn-sm", type: "button" }, "−");
    var zoomLabel = h("span", { class: "muted small" }, "100%");
    var zoomIn = h("button", { class: "btn btn-ghost btn-sm", type: "button" }, "+");
    var full = h("button", { class: "btn btn-ghost btn-sm", type: "button" }, "Fullscreen");
    var dl = h("button", { class: "btn btn-ghost btn-sm", type: "button" }, "Download");
    controls.appendChild(prev); controls.appendChild(label); controls.appendChild(next);
    controls.appendChild(zoomOut); controls.appendChild(zoomLabel); controls.appendChild(zoomIn);
    controls.appendChild(full); controls.appendChild(dl);
    root.appendChild(up.node);
    root.appendChild(controls);
    root.appendChild(stage);

    var state = { doc: null, page: 1, zoom: 1.2 };
    function draw() {
      if (!state.doc) return;
      renderPage(state.doc, state.page, state.zoom).then(function (r) {
        img.src = r.canvas.toDataURL("image/png");
        label.textContent = "Page " + state.page + " of " + state.doc.numPages;
        zoomLabel.textContent = Math.round(state.zoom * 100) + "%";
        prev.disabled = state.page <= 1;
        next.disabled = state.page >= state.doc.numPages;
      });
    }
    prev.addEventListener("click", function () { state.page = Math.max(1, state.page - 1); draw(); });
    next.addEventListener("click", function () { state.page = Math.min(state.doc ? state.doc.numPages : 1, state.page + 1); draw(); });
    zoomOut.addEventListener("click", function () { state.zoom = Math.max(0.5, state.zoom - 0.25); draw(); });
    zoomIn.addEventListener("click", function () { state.zoom = Math.min(3, state.zoom + 0.25); draw(); });
    full.addEventListener("click", function () {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (stage.requestFullscreen) stage.requestFullscreen().catch(function () {});
    });
    dl.addEventListener("click", function () {
      if (!up.files().length) return;
      download(up.files()[0], up.files()[0].name);
    });
    var origAdd = up.addFiles;
    up.addFiles = function (fl) {
      origAdd(fl);
      var f = up.files()[0];
      if (!f) { state.doc = null; stage.removeAttribute("src"); img.removeAttribute("src"); return; }
      readPdf(f).then(function (doc) { state.doc = doc; state.page = 1; draw(); })
        .catch(function (err) { stage.innerHTML = ""; stage.appendChild(alertBox("error", err.message)); });
    };
  };

  HANDLERS["pdf-file-info"] = function (root) {
    var up = uploader({});
    var out = h("div");
    root.appendChild(up.node);
    root.appendChild(h("div", { class: "toolbar" }));
    root.appendChild(out);
    var btn = actionButton("Inspect File", function () {
      if (!up.files().length) fail("Please select a PDF file first.");
      var file = up.files()[0];
      return readPdf(file).then(function (doc) {
        return doc.getMetadata().then(function (meta) {
          var info = meta.info || {};
          var toDate = parsePdfDate;
          out.innerHTML = "";
          out.appendChild(statsBox([
            ["File name", file.name],
            ["File type", file.type || "application/pdf"],
            ["File size", fmtBytes(file.size)],
            ["Page count", String(doc.numPages)],
            ["Created", fmtDate(toDate(info.CreationDate))],
            ["Modified", fmtDate(toDate(info.ModDate))]
          ]));
        });
      });
    });
    qs(".toolbar", root).appendChild(btn);
    qs(".toolbar", root).appendChild(privacyNote(false));
  };

  HANDLERS["pdf-page-counter"] = function (root) {
    var up = uploader({});
    var out = h("div");
    root.appendChild(up.node);
    root.appendChild(h("div", { class: "toolbar" }));
    root.appendChild(out);
    var btn = actionButton("Count Pages", function () {
      if (!up.files().length) fail("Please select a PDF file first.");
      return readPdf(up.files()[0]).then(function (doc) {
        out.innerHTML = "";
        out.appendChild(statsBox([["Total pages", fmtNum(doc.numPages)]]));
      });
    });
    qs(".toolbar", root).appendChild(btn);
    qs(".toolbar", root).appendChild(privacyNote(false));
  };

  HANDLERS["pdf-size-analyzer"] = function (root) {
    var up = uploader({});
    var out = h("div");
    root.appendChild(up.node);
    root.appendChild(h("div", { class: "toolbar" }));
    root.appendChild(out);
    var btn = actionButton("Analyze Size", function () {
      if (!up.files().length) fail("Please select a PDF file first.");
      var file = up.files()[0];
      return readPdf(file).then(function (doc) {
        var size = file.size;
        var category = size < 100 * 1024 ? "Tiny (under 100 KB)"
          : size < 1024 * 1024 ? "Small (under 1 MB)"
          : size < 10 * 1024 * 1024 ? "Medium (1–10 MB)"
          : size < 50 * 1024 * 1024 ? "Large (10–50 MB)" : "Very large (over 50 MB)";
        out.innerHTML = "";
        out.appendChild(statsBox([
          ["File size", fmtBytes(size)],
          ["Category", category],
          ["Pages", String(doc.numPages)],
          ["Avg. per page", fmtBytes(doc.numPages ? size / doc.numPages : 0)]
        ]));
      });
    });
    qs(".toolbar", root).appendChild(btn);
    qs(".toolbar", root).appendChild(privacyNote(false));
  };

  HANDLERS["pdf-print-optimizer"] = function (root) {
    var up = uploader({});
    var controls = h("div", { class: "control-grid cols-3" });
    var size = select(Object.keys(PAGE_SIZES).map(function (k) { return [k, k]; }), "A4");
    var orientation = select([["portrait", "Portrait"], ["landscape", "Landscape"]]);
    var margin = input({ type: "number", min: "0", max: "144", value: "36" });
    var scalePct = input({ type: "number", min: "25", max: "200", value: "100" });
    controls.appendChild(field("Page size", size));
    controls.appendChild(field("Orientation", orientation));
    controls.appendChild(field("Margins (pt)", margin));
    controls.appendChild(field("Scale (%)", scalePct));
    var out = h("div");
    root.appendChild(up.node);
    root.appendChild(controls);
    root.appendChild(h("div", { class: "toolbar" }));
    root.appendChild(out);
    var btn = actionButton("Prepare for Printing", function (prog) {
      if (!up.files().length) fail("Please select a PDF file first.");
      var file = up.files()[0];
      return writePdf(file).then(function (doc) {
        var base = PAGE_SIZES[size.value];
        var target = orientation.value === "landscape" ? [base[1], base[0]] : base;
        var marginPt = parseFloat(margin.value) || 0;
        var outDoc = newPdf();
        var count = doc.getPageCount();
        var chain = Promise.resolve();
        for (var i = 0; i < count; i++) {
          (function (n) {
            chain = chain.then(function () {
              var orig = doc.getPage(n);
              return outDoc.embedPage(orig).then(function (emb) {
                var s0 = orig.getSize();
                var boxW = target[0] - marginPt * 2;
                var boxH = target[1] - marginPt * 2;
                var s = Math.min(boxW / s0.width, boxH / s0.height) * ((parseFloat(scalePct.value) || 100) / 100);
                var w = s0.width * s, hh = s0.height * s;
                var page = outDoc.addPage(target);
                page.drawPage(emb, { x: (target[0] - w) / 2, y: (target[1] - hh) / 2, width: w, height: hh });
                prog.set(((n + 1) / count) * 95, "Preparing page " + (n + 1) + " of " + count + "…");
              });
            });
          })(i);
        }
        return chain.then(function () { return outDoc.save(); });
      }).then(function (bytes) {
        var blob = pdfBlob(bytes);
        out.innerHTML = "";
        out.appendChild(resultBox("Print-ready PDF", blob.size, function () { download(blob, baseName(file.name) + "-print.pdf"); }));
        var print = h("button", { class: "btn btn-ghost", type: "button" }, "Open print dialog");
        print.addEventListener("click", function () {
          var url = URL.createObjectURL(blob);
          var w = window.open(url);
          if (!w) fail("Your browser blocked the print window — allow pop-ups to print.");
        });
        out.appendChild(print);
      });
    });
    qs(".toolbar", root).appendChild(btn);
    qs(".toolbar", root).appendChild(privacyNote(false));
  };

  /* ======================================================================
     9. Router
     ====================================================================== */
  function showTool(id) {
    var tool = toolById(id);
    var page = qs("#toolPage");
    if (!tool) { window.location.hash = "#tools"; return; }
    document.body.classList.add("tool-open");
    qs("#tools").style.display = "none";
    page.removeAttribute("hidden");
    document.title = tool.name + " — PDFMaster Tools";

    qs("#toolTitle").textContent = tool.name;
    qs("#toolDesc").textContent = tool.desc;
    qs("#toolCat").textContent = catName(tool.cat);
    var badge = qs("#toolBadge");
    badge.className = "badge badge-local";
    badge.innerHTML = svg("cpu", 13) + " Works offline";

    var body = qs("#toolBody");
    body.innerHTML = "";
    var handler = HANDLERS[tool.id];
    if (handler) handler(body);
    else body.appendChild(alertBox("error", "This tool is not available yet."));

    var related = TOOLS.filter(function (t) { return t.cat === tool.cat && t.id !== tool.id; }).slice(0, 4);
    var rel = qs("#toolRelated");
    if (related.length) {
      rel.removeAttribute("hidden");
      qs("#relatedTitle").textContent = "More " + catName(tool.cat) + " tools";
      qs("#relatedGrid").innerHTML = related.map(function (t) {
        return '<a href="#tool/' + t.id + '">' + t.name + "</a>";
      }).join("");
    } else rel.setAttribute("hidden", "");

    window.scrollTo({ top: 0, behavior: "auto" });

    // A file chosen on the landing dropzone arrives here.
    if (window.PDFMASTER_PENDING && window.PDFMASTER_PENDING.length) {
      var files = window.PDFMASTER_PENDING;
      window.PDFMASTER_PENDING = null;
      var uploaderNode = body;
      if (uploaderNode) {
        var inputEl = qs("input[type=file]", uploaderNode);
        if (inputEl) {
          // Re-dispatch by simulating a drop with a DataTransfer
          try {
            var dt = new DataTransfer();
            files.forEach(function (f) { dt.items.add(f); });
            inputEl.files = dt.files;
            inputEl.dispatchEvent(new Event("change", { bubbles: true }));
          } catch (e) { /* browsers without DataTransfer assignment: user can re-pick */ }
        }
      }
    }
  }

  function showHome(hash) {
    document.body.classList.remove("tool-open");
    qs("#toolPage").setAttribute("hidden", "");
    qs("#tools").style.display = "";
    document.title = "PDFMaster Tools — " + TOOLS.length + " Powerful PDF Tools";
    var target = hash && hash !== "home" ? qs("#" + hash) : null;
    if (target) setTimeout(function () { target.scrollIntoView({ behavior: "smooth" }); }, 30);
  }

  function route() {
    var hash = location.hash.replace(/^#/, "");
    if (hash.indexOf("tool/") === 0) showTool(hash.slice(5));
    else showHome(hash);
  }

  /* ======================================================================
     10. Init
     ====================================================================== */
  function init() {
    initTheme();
    initNav();
    initSearch();
    renderChips();
    renderCategories();
    renderStatic();
    renderFaq();
    window.addEventListener("hashchange", route);
    route();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
