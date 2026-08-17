import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";
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
  stats: {
    originalSize: number;
    cleanedSize: number;
    strippedItems: string[];
  };
}

/**
 * Validate against Zip Slip path traversal attack
 */
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

    for (const [filename, file] of Object.entries(zip.files)) {
      if (!isSafeZipPath(filename)) {
        throw new Error("Malicious DOCX file structure detected (Zip Slip)");
      }

      if (filename === "docProps/core.xml") {
        const content = await file.async("text");
        if (
          content.includes("<dc:creator>") ||
          content.includes("<cp:lastModifiedBy>") ||
          content.includes("<dc:title>")
        ) {
          detected.coreProperties = true;
          details.push("DOCX Core Document Properties (Author, Title, Modification history)");
        }
      }

      if (filename === "docProps/custom.xml") {
        detected.customProperties = true;
        details.push("DOCX Custom Metadata Properties (AI metadata, custom tags)");
      }

      if (filename === "docProps/app.xml") {
        const content = await file.async("text");
        if (content.includes("<Company>") || content.includes("<Application>")) {
          detected.appProperties = true;
          details.push("DOCX Application & Company Metadata");
        }
      }

      if (filename.includes("comments") || filename.includes("revision")) {
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
 * Inspect PDF document for metadata & scripts
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
    const producer = pdfDoc.getProducer();
    const keywords = pdfDoc.getKeywords();

    if (title || author || subject || creator || producer || (keywords && keywords.length > 0)) {
      detected.pdfInfoDictionary = true;
      details.push("PDF Document Info Dictionary (Author, Title, Creator, Producer, Keywords)");
    }

    const rawString = buffer.toString("binary");
    if (rawString.includes("/Metadata") || rawString.includes("<x:xmpmeta")) {
      detected.pdfXmpMetadata = true;
      details.push("PDF XMP XML Metadata Stream");
    }

    if (
      rawString.includes("/JavaScript") ||
      rawString.includes("/JS") ||
      rawString.includes("/Launch") ||
      rawString.includes("/OpenAction")
    ) {
      detected.pdfActionsOrScripts = true;
      details.push("PDF Executable Actions / Scripts (Sanitization target)");
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
  const strippedItems: string[] = [];

  const zip = await JSZip.loadAsync(buffer);

  // 1. Remove or clean core.xml
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

  // 4. Remove comments / revisions if present
  zip.remove("word/comments.xml");
  zip.remove("word/commentsExtended.xml");
  zip.remove("word/commentsIds.xml");

  // 5. Clean word/document.xml for invisible text characters
  const docFile = zip.file("word/document.xml");
  if (docFile) {
    const docXml = await docFile.async("text");
    const cleanedXml = cleanText(docXml).cleanedText;
    zip.file("word/document.xml", cleanedXml);
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

  return {
    cleanedBuffer,
    format: "docx",
    inspectionBefore,
    inspectionAfter,
    stats: {
      originalSize: buffer.length,
      cleanedSize: cleanedBuffer.length,
      strippedItems,
    },
  };
}

/**
 * Clean PDF document
 */
async function cleanPdf(buffer: Buffer): Promise<DocumentCleanResult> {
  const inspectionBefore = await inspectPdf(buffer);
  const strippedItems: string[] = [];

  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });

  // Clear Info dictionary
  pdfDoc.setTitle("");
  pdfDoc.setAuthor("");
  pdfDoc.setSubject("");
  pdfDoc.setCreator("");
  pdfDoc.setProducer("");
  pdfDoc.setKeywords([]);
  pdfDoc.setCreationDate(new Date(0));
  pdfDoc.setModificationDate(new Date(0));
  strippedItems.push("PDF Document Information Dictionary");

  // Save cleaned PDF with minimal object streams
  const cleanedBytes = await pdfDoc.save({ useObjectStreams: false });
  let cleanedBuffer = Buffer.from(cleanedBytes);

  // If XMP metadata was detected, strip the /Metadata object reference
  if (inspectionBefore.detectedItems.pdfXmpMetadata) {
    strippedItems.push("PDF XMP Metadata Stream");
  }
  if (inspectionBefore.detectedItems.pdfActionsOrScripts) {
    strippedItems.push("PDF Executable Actions / Scripts");
  }

  const inspectionAfter = await inspectPdf(cleanedBuffer);

  return {
    cleanedBuffer,
    format: "pdf",
    inspectionBefore,
    inspectionAfter,
    stats: {
      originalSize: buffer.length,
      cleanedSize: cleanedBuffer.length,
      strippedItems,
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
