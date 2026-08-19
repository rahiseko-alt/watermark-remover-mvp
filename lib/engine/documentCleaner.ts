import JSZip from "jszip";
import { PDFDocument, PDFName } from "pdf-lib";
import { cleanText, inspectText } from "./textCleaner";

export interface DocumentInspectionResult {
  hasMetadata: boolean;
  format: "docx" | "pdf" | "unknown";
  details: string[];
  detectedItems: {
    coreProperties: boolean;
    customProperties: boolean;
    appProperties: boolean;
    commentsOrRevisions: boolean;
    invisibleTextWatermarks: boolean;
    pdfInfoDictionary: boolean;
    pdfXmpMetadata: boolean;
    pdfActionsOrScripts: boolean;
  };
  clean: boolean;
}

export interface DocumentCleanResult {
  cleanedBuffer: Buffer;
  format: "docx" | "pdf";
  inspectionBefore: DocumentInspectionResult;
  inspectionAfter: DocumentInspectionResult;
  status: "success" | "partial" | "unchanged";
  stats: {
    originalSize: number;
    cleanedSize: number;
    strippedItems: string[];
    remainingItems: string[];
  };
}

// Security limits for DOCX / Zip Bomb defense
const MAX_ZIP_TOTAL_UNCOMPRESSED_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_ZIP_SINGLE_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_ZIP_FILE_COUNT = 500;

function isSafeZipPath(filename: string): boolean {
  if (!filename || filename.startsWith("/") || filename.startsWith("\\")) return false;
  const parts = filename.split(/[/\\]/);
  return !parts.includes("..");
}

/**
 * Inspect DOCX archive for metadata & invisible characters
 */
async function inspectDocx(buffer: Buffer): Promise<DocumentInspectionResult> {
  const details: string[] = [];
  const detected = {
    coreProperties: false,
    customProperties: false,
    appProperties: false,
    commentsOrRevisions: false,
    invisibleTextWatermarks: false,
    pdfInfoDictionary: false,
    pdfXmpMetadata: false,
    pdfActionsOrScripts: false,
  };

  try {
    const zip = await JSZip.loadAsync(buffer);
    const fileEntries = Object.entries(zip.files);

    if (fileEntries.length > MAX_ZIP_FILE_COUNT) {
      throw new Error(`DOCX file count exceeded security limit (${fileEntries.length} > ${MAX_ZIP_FILE_COUNT})`);
    }

    for (const [filename, file] of fileEntries) {
      if (!isSafeZipPath(filename)) {
        throw new Error("Malicious DOCX file structure detected (Zip Slip)");
      }

      if (filename === "docProps/core.xml") {
        const content = await file.async("text");
        if (
          content.includes("<dc:creator>") ||
          content.includes("<cp:lastModifiedBy>") ||
          content.includes("<dc:title>") ||
          content.includes("<cp:revision>")
        ) {
          detected.coreProperties = true;
          details.push("DOCX Core Document Properties (Author, Title, Revision history)");
        }
      }

      if (filename === "docProps/custom.xml") {
        detected.customProperties = true;
        details.push("DOCX Custom Metadata Properties (AI metadata, custom tags)");
      }

      if (filename === "docProps/app.xml") {
        const content = await file.async("text");
        if (content.includes("<Company>") || content.includes("<Application>") || content.includes("<Manager>")) {
          detected.appProperties = true;
          details.push("DOCX Application & Company Metadata");
        }
      }

      if (
        filename.includes("comments") ||
        filename.includes("revision") ||
        filename.includes("people.xml")
      ) {
        detected.commentsOrRevisions = true;
        details.push("DOCX Comments / Revision Tracking History");
      }

      if (filename === "word/document.xml") {
        const content = await file.async("text");
        const textInspection = inspectText(content);
        if (textInspection.hasInvisibleCharacters) {
          detected.invisibleTextWatermarks = true;
          details.push(`DOCX In-document Invisible Text Characters (${textInspection.totalDetected} chars)`);
        }

        if (content.includes("<w:ins") || content.includes("<w:del")) {
          detected.commentsOrRevisions = true;
          details.push("DOCX Tracked Changes in document text");
        }
      }
    }
  } catch (err: any) {
    details.push(`DOCX Parse notice: ${err.message}`);
  }

  const hasMetadata =
    detected.coreProperties ||
    detected.customProperties ||
    detected.appProperties ||
    detected.commentsOrRevisions ||
    detected.invisibleTextWatermarks;

  return {
    hasMetadata,
    format: "docx",
    details,
    detectedItems: detected,
    clean: !hasMetadata,
  };
}

/**
 * Inspect PDF document for metadata, XMP, & scripts
 */
async function inspectPdf(buffer: Buffer): Promise<DocumentInspectionResult> {
  const details: string[] = [];
  const detected = {
    coreProperties: false,
    customProperties: false,
    appProperties: false,
    commentsOrRevisions: false,
    invisibleTextWatermarks: false,
    pdfInfoDictionary: false,
    pdfXmpMetadata: false,
    pdfActionsOrScripts: false,
  };

  try {
    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const title = pdfDoc.getTitle();
    const author = pdfDoc.getAuthor();
    const subject = pdfDoc.getSubject();
    const creator = pdfDoc.getCreator();
    const keywords = pdfDoc.getKeywords();

    const isDefaultGenerator = (val?: string) =>
      !val || val.includes("pdf-lib") || val.trim().length === 0;

    const hasCustomInfo =
      (title && title.trim().length > 0) ||
      (author && author.trim().length > 0) ||
      (subject && subject.trim().length > 0) ||
      (creator && !isDefaultGenerator(creator)) ||
      (keywords && keywords.length > 0);

    if (hasCustomInfo) {
      detected.pdfInfoDictionary = true;
      details.push("PDF Document Info Dictionary (Author, Title, Creator, Keywords)");
    }

    const catalog = pdfDoc.catalog;
    if (catalog.has(PDFName.of("Metadata"))) {
      detected.pdfXmpMetadata = true;
      details.push("PDF XMP XML Metadata Stream (/Metadata catalog entry)");
    }

    if (catalog.has(PDFName.of("Names"))) {
      const namesObj = catalog.lookup(PDFName.of("Names"));
      if (namesObj && namesObj.toString().includes("JavaScript")) {
        detected.pdfActionsOrScripts = true;
        details.push("PDF Executable Actions (/Names /JavaScript)");
      }
    }
    if (catalog.has(PDFName.of("OpenAction")) || catalog.has(PDFName.of("AA"))) {
      detected.pdfActionsOrScripts = true;
      details.push("PDF Executable Launch / Open Actions");
    }
  } catch (err: any) {
    details.push(`PDF Parse notice: ${err.message}`);
  }

  const hasMetadata =
    detected.pdfInfoDictionary ||
    detected.pdfXmpMetadata ||
    detected.pdfActionsOrScripts;

  return {
    hasMetadata,
    format: "pdf",
    details,
    detectedItems: detected,
    clean: !hasMetadata,
  };
}

/**
 * Inspect DOCX or PDF document
 */
export async function inspectDocument(buffer: Buffer, originalFilename: string): Promise<DocumentInspectionResult> {
  const ext = originalFilename.split(".").pop()?.toLowerCase();

  if (ext === "docx" || (buffer.length > 4 && buffer.readUInt32BE(0) === 0x504b0304)) {
    return inspectDocx(buffer);
  } else if (ext === "pdf" || (buffer.length > 4 && buffer.toString("ascii", 0, 4) === "%PDF")) {
    return inspectPdf(buffer);
  }

  return {
    hasMetadata: false,
    format: "unknown",
    details: ["Unknown document format"],
    detectedItems: {
      coreProperties: false,
      customProperties: false,
      appProperties: false,
      commentsOrRevisions: false,
      invisibleTextWatermarks: false,
      pdfInfoDictionary: false,
      pdfXmpMetadata: false,
      pdfActionsOrScripts: false,
    },
    clean: true,
  };
}

/**
 * Clean DOCX document
 */
async function cleanDocx(buffer: Buffer): Promise<DocumentCleanResult> {
  const inspectionBefore = await inspectDocx(buffer);

  if (!inspectionBefore.hasMetadata) {
    return {
      cleanedBuffer: buffer,
      format: "docx",
      inspectionBefore,
      inspectionAfter: inspectionBefore,
      status: "unchanged",
      stats: {
        originalSize: buffer.length,
        cleanedSize: buffer.length,
        strippedItems: [],
        remainingItems: [],
      },
    };
  }

  const strippedItems: string[] = [];
  const zip = await JSZip.loadAsync(buffer);

  // 1. Clean core.xml
  if (zip.file("docProps/core.xml")) {
    zip.file(
      "docProps/core.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
</cp:coreProperties>`
    );
    strippedItems.push("DOCX Core Properties (Author/Title/Dates)");
  }

  // 2. Remove custom.xml if exists
  if (zip.file("docProps/custom.xml")) {
    zip.remove("docProps/custom.xml");
    strippedItems.push("DOCX Custom Metadata");
  }

  // 3. Clean app.xml
  if (zip.file("docProps/app.xml")) {
    zip.file(
      "docProps/app.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
  <Application>Cleaned Document</Application>
</Properties>`
    );
    strippedItems.push("DOCX Application Properties");
  }

  // 4. Remove comments / revisions / people XML
  zip.remove("word/comments.xml");
  zip.remove("word/commentsExtended.xml");
  zip.remove("word/commentsIds.xml");
  zip.remove("word/people.xml");
  if (inspectionBefore.detectedItems.commentsOrRevisions) {
    strippedItems.push("DOCX Comments & People Metadata");
  }

  // 5. Clean word/document.xml for invisible text characters & sanitize tracked changes
  const docFile = zip.file("word/document.xml");
  if (docFile) {
    let docXml = await docFile.async("text");

    docXml = cleanText(docXml).cleanedText;
    docXml = docXml.replace(/<w:del[\s\S]*?<\/w:del>/gi, "");
    docXml = docXml.replace(/<w:ins[^>]*>([\s\S]*?)<\/w:ins>/gi, "$1");

    zip.file("word/document.xml", docXml);
    if (inspectionBefore.detectedItems.invisibleTextWatermarks) {
      strippedItems.push("DOCX In-document Invisible Characters");
    }
  }

  const cleanedBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });

  const inspectionAfter = await inspectDocx(cleanedBuffer);
  const remainingItems = inspectionAfter.details;
  const status = inspectionAfter.clean ? "success" : "partial";

  return {
    cleanedBuffer,
    format: "docx",
    inspectionBefore,
    inspectionAfter,
    status,
    stats: {
      originalSize: buffer.length,
      cleanedSize: cleanedBuffer.length,
      strippedItems,
      remainingItems,
    },
  };
}

/**
 * Clean PDF document - Pure Page Reconstruction Pipeline
 */
async function cleanPdf(buffer: Buffer): Promise<DocumentCleanResult> {
  const inspectionBefore = await inspectPdf(buffer);

  if (!inspectionBefore.hasMetadata) {
    return {
      cleanedBuffer: buffer,
      format: "pdf",
      inspectionBefore,
      inspectionAfter: inspectionBefore,
      status: "unchanged",
      stats: {
        originalSize: buffer.length,
        cleanedSize: buffer.length,
        strippedItems: [],
        remainingItems: [],
      },
    };
  }

  const strippedItems: string[] = [];
  const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });

  // Create a brand new clean PDF document
  const cleanDoc = await PDFDocument.create();

  // Copy all visual pages
  const pageCount = srcDoc.getPageCount();
  const pageIndices = Array.from({ length: pageCount }, (_, i) => i);
  const copiedPages = await cleanDoc.copyPages(srcDoc, pageIndices);

  for (const page of copiedPages) {
    const pageDict = page.node;
    if (pageDict.has(PDFName.of("AA"))) {
      pageDict.delete(PDFName.of("AA"));
    }
    cleanDoc.addPage(page);
  }

  // Reset public Info properties on cleanDoc
  cleanDoc.setTitle("");
  cleanDoc.setAuthor("");
  cleanDoc.setSubject("");
  cleanDoc.setCreator("");
  cleanDoc.setProducer("");
  cleanDoc.setKeywords([]);
  cleanDoc.setCreationDate(new Date(0));
  cleanDoc.setModificationDate(new Date(0));

  // If Info dictionary exists in trailer context, purge custom entries
  try {
    const rawInfo = (cleanDoc as any).getInfoDict?.();
    if (rawInfo) {
      rawInfo.delete(PDFName.of("Title"));
      rawInfo.delete(PDFName.of("Author"));
      rawInfo.delete(PDFName.of("Subject"));
      rawInfo.delete(PDFName.of("Creator"));
      rawInfo.delete(PDFName.of("Producer"));
      rawInfo.delete(PDFName.of("Keywords"));
      rawInfo.delete(PDFName.of("CreationDate"));
      rawInfo.delete(PDFName.of("ModDate"));
    }
  } catch {
    // Safe fallback
  }

  if (inspectionBefore.detectedItems.pdfInfoDictionary) {
    strippedItems.push("PDF Document Information Dictionary");
  }
  if (inspectionBefore.detectedItems.pdfXmpMetadata) {
    strippedItems.push("PDF XMP Metadata Stream");
  }
  if (inspectionBefore.detectedItems.pdfActionsOrScripts) {
    strippedItems.push("PDF Executable Actions / Scripts");
  }

  const cleanedBytes = await cleanDoc.save({ useObjectStreams: false });
  const cleanedBuffer = Buffer.from(cleanedBytes);

  // Independent re-inspection of the newly reconstructed PDF
  const inspectionAfter = await inspectPdf(cleanedBuffer);
  const remainingItems = inspectionAfter.details;
  const status = inspectionAfter.clean ? "success" : "partial";

  return {
    cleanedBuffer,
    format: "pdf",
    inspectionBefore,
    inspectionAfter,
    status,
    stats: {
      originalSize: buffer.length,
      cleanedSize: cleanedBuffer.length,
      strippedItems,
      remainingItems,
    },
  };
}

/**
 * Clean DOCX or PDF document
 */
export async function cleanDocument(buffer: Buffer, originalFilename: string): Promise<DocumentCleanResult> {
  const ext = originalFilename.split(".").pop()?.toLowerCase();
  if (ext === "docx" || (buffer.length > 4 && buffer.readUInt32BE(0) === 0x504b0304)) {
    return cleanDocx(buffer);
  } else {
    return cleanPdf(buffer);
  }
}
