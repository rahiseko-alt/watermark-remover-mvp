import { cleanImage, inspectImage } from "./imageCleaner";
import { cleanDocument, inspectDocument } from "./documentCleaner";
import { cleanText, inspectText } from "./textCleaner";

export type InputMode = "text" | "file";
export type ProcessingStatus = "success" | "partial" | "unchanged";

export interface UnifiedInspectResult {
  mode: InputMode;
  filename?: string;
  format: string;
  hasWatermarks: boolean;
  clean: boolean;
  summary: {
    invisibleCharactersCount?: number;
    metadataItemsCount?: number;
    categoriesDetected: string[];
    confidenceSummary?: {
      highConfidence: number;
      suspicious: number;
      informational: number;
    };
  };
  details: string[];
  rawInspection: any;
}

export interface UnifiedCleanResult {
  mode: InputMode;
  filename?: string;
  outputFilename?: string;
  format: string;
  status: ProcessingStatus;
  inspectionBefore: UnifiedInspectResult;
  inspectionAfter: UnifiedInspectResult;
  cleanedText?: string;
  cleanedBufferBase64?: string;
  mimeType?: string;
  stats: {
    removedCount: number;
    removedCategories: string[];
    originalSize: number;
    cleanedSize: number;
    remainingItems: string[];
  };
}

/**
 * Verify Magic Bytes to prevent extension spoofing
 */
export function verifyMagicBytes(buffer: Buffer, filename: string): "image" | "document" | "text" {
  const ext = filename.split(".").pop()?.toLowerCase() || "";

  // PNG: 89 50 4E 47
  if (buffer.length >= 8 && buffer.readUInt32BE(0) === 0x89504e47) return "image";
  // JPEG: FF D8 FF
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image";
  // WebP: RIFF ... WEBP
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return "image";

  // PDF: %PDF
  if (buffer.length >= 4 && buffer.toString("ascii", 0, 4) === "%PDF") return "document";
  // DOCX: PK (Zip)
  if (buffer.length >= 4 && buffer.readUInt32BE(0) === 0x504b0304 && ext === "docx") return "document";

  if (["png", "jpg", "jpeg", "webp"].includes(ext)) return "image";
  if (["docx", "pdf"].includes(ext)) return "document";
  return "text";
}

/**
 * Unified Inspector
 */
export async function inspectUnified(
  data: { text?: string; fileBuffer?: Buffer; filename?: string; mimeType?: string }
): Promise<UnifiedInspectResult> {
  if (data.text !== undefined && data.text !== null) {
    const textRes = inspectText(data.text);
    return {
      mode: "text",
      format: "text/plain",
      hasWatermarks: textRes.hasInvisibleCharacters,
      clean: textRes.clean,
      summary: {
        invisibleCharactersCount: textRes.totalDetected,
        categoriesDetected: textRes.detectedTypes,
        confidenceSummary: textRes.confidenceSummary,
      },
      details: textRes.details.map((d) => `${d.name} (${d.codePoint})`),
      rawInspection: textRes,
    };
  }

  if (data.fileBuffer && data.filename) {
    const category = verifyMagicBytes(data.fileBuffer, data.filename);

    if (category === "image") {
      const imgRes = await inspectImage(data.fileBuffer);
      const categories: string[] = [];
      if (imgRes.detectedTags.c2pa) categories.push("C2PA / Content Credentials");
      if (imgRes.detectedTags.exif) categories.push("EXIF Tags");
      if (imgRes.detectedTags.xmp) categories.push("XMP Packet");
      if (imgRes.detectedTags.aiPromptChunks) categories.push("AI Prompt Chunks");
      if (imgRes.detectedTags.iptc) categories.push("IPTC Data");

      return {
        mode: "file",
        filename: data.filename,
        format: imgRes.format,
        hasWatermarks: imgRes.hasMetadata,
        clean: imgRes.clean,
        summary: {
          metadataItemsCount: imgRes.details.length,
          categoriesDetected: categories,
        },
        details: imgRes.details,
        rawInspection: imgRes,
      };
    } else if (category === "document") {
      const docRes = await inspectDocument(data.fileBuffer, data.filename);
      const categories: string[] = [];
      if (docRes.detectedItems.coreProperties) categories.push("Core Document Properties");
      if (docRes.detectedItems.customProperties) categories.push("Custom / AI Metadata");
      if (docRes.detectedItems.appProperties) categories.push("Application Metadata");
      if (docRes.detectedItems.commentsOrRevisions) categories.push("Comments & Revisions");
      if (docRes.detectedItems.invisibleTextWatermarks) categories.push("In-document Invisible Characters");
      if (docRes.detectedItems.pdfInfoDictionary) categories.push("PDF Info Dictionary");
      if (docRes.detectedItems.pdfXmpMetadata) categories.push("PDF XMP Metadata");
      if (docRes.detectedItems.pdfActionsOrScripts) categories.push("PDF Executable Actions");

      return {
        mode: "file",
        filename: data.filename,
        format: docRes.format,
        hasWatermarks: docRes.hasMetadata,
        clean: docRes.clean,
        summary: {
          metadataItemsCount: docRes.details.length,
          categoriesDetected: categories,
        },
        details: docRes.details,
        rawInspection: docRes,
      };
    } else {
      // Plain text file
      const textContent = data.fileBuffer.toString("utf8");
      const textRes = inspectText(textContent);
      return {
        mode: "file",
        filename: data.filename,
        format: data.filename.split(".").pop() || "text",
        hasWatermarks: textRes.hasInvisibleCharacters,
        clean: textRes.clean,
        summary: {
          invisibleCharactersCount: textRes.totalDetected,
          categoriesDetected: textRes.detectedTypes,
          confidenceSummary: textRes.confidenceSummary,
        },
        details: textRes.details.map((d) => `${d.name} (${d.codePoint})`),
        rawInspection: textRes,
      };
    }
  }

  throw new Error("No text or fileBuffer provided for inspection");
}

/**
 * Unified Cleaner
 */
export async function cleanUnified(
  data: { text?: string; fileBuffer?: Buffer; filename?: string; mimeType?: string }
): Promise<UnifiedCleanResult> {
  if (data.text !== undefined && data.text !== null) {
    const textRes = cleanText(data.text);
    const beforeUnified = await inspectUnified({ text: data.text });
    const afterUnified = await inspectUnified({ text: textRes.cleanedText });

    return {
      mode: "text",
      format: "text/plain",
      status: textRes.status,
      inspectionBefore: beforeUnified,
      inspectionAfter: afterUnified,
      cleanedText: textRes.cleanedText,
      stats: {
        removedCount: textRes.stats.removedCount,
        removedCategories: Object.keys(textRes.stats.removedByType),
        originalSize: textRes.stats.originalLength,
        cleanedSize: textRes.stats.cleanedLength,
        remainingItems: afterUnified.details,
      },
    };
  }

  if (data.fileBuffer && data.filename) {
    const category = verifyMagicBytes(data.fileBuffer, data.filename);
    const ext = data.filename.split(".").pop() || "";
    const baseName = data.filename.substring(0, data.filename.lastIndexOf(".")) || data.filename;
    const outputFilename = `${baseName}.cleaned.${ext}`;

    if (category === "image") {
      const imgRes = await cleanImage(data.fileBuffer);
      const beforeUnified = await inspectUnified({ fileBuffer: data.fileBuffer, filename: data.filename });
      const afterUnified = await inspectUnified({ fileBuffer: imgRes.cleanedBuffer, filename: outputFilename });

      const mimeType =
        imgRes.format === "png"
          ? "image/png"
          : imgRes.format === "jpeg"
          ? "image/jpeg"
          : "image/webp";

      return {
        mode: "file",
        filename: data.filename,
        outputFilename,
        format: imgRes.format,
        status: imgRes.status,
        inspectionBefore: beforeUnified,
        inspectionAfter: afterUnified,
        cleanedBufferBase64: imgRes.cleanedBuffer.toString("base64"),
        mimeType,
        stats: {
          removedCount: imgRes.stats.strippedItems.length,
          removedCategories: imgRes.stats.strippedItems,
          originalSize: imgRes.stats.originalSize,
          cleanedSize: imgRes.stats.cleanedSize,
          remainingItems: imgRes.stats.remainingItems,
        },
      };
    } else if (category === "document") {
      const docRes = await cleanDocument(data.fileBuffer, data.filename);
      const beforeUnified = await inspectUnified({ fileBuffer: data.fileBuffer, filename: data.filename });
      const afterUnified = await inspectUnified({ fileBuffer: docRes.cleanedBuffer, filename: outputFilename });

      const mimeType =
        docRes.format === "docx"
          ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          : "application/pdf";

      return {
        mode: "file",
        filename: data.filename,
        outputFilename,
        format: docRes.format,
        status: docRes.status,
        inspectionBefore: beforeUnified,
        inspectionAfter: afterUnified,
        cleanedBufferBase64: docRes.cleanedBuffer.toString("base64"),
        mimeType,
        stats: {
          removedCount: docRes.stats.strippedItems.length,
          removedCategories: docRes.stats.strippedItems,
          originalSize: docRes.stats.originalSize,
          cleanedSize: docRes.stats.cleanedSize,
          remainingItems: docRes.stats.remainingItems,
        },
      };
    } else {
      // Plain text file
      const textContent = data.fileBuffer.toString("utf8");
      const textRes = cleanText(textContent);
      const cleanedBuffer = Buffer.from(textRes.cleanedText, "utf8");

      const beforeUnified = await inspectUnified({ fileBuffer: data.fileBuffer, filename: data.filename });
      const afterUnified = await inspectUnified({ fileBuffer: cleanedBuffer, filename: outputFilename });

      return {
        mode: "file",
        filename: data.filename,
        outputFilename,
        format: ext,
        status: textRes.status,
        inspectionBefore: beforeUnified,
        inspectionAfter: afterUnified,
        cleanedBufferBase64: cleanedBuffer.toString("base64"),
        mimeType: "text/plain; charset=utf-8",
        stats: {
          removedCount: textRes.stats.removedCount,
          removedCategories: Object.keys(textRes.stats.removedByType),
          originalSize: data.fileBuffer.length,
          cleanedSize: cleanedBuffer.length,
          remainingItems: afterUnified.details,
        },
      };
    }
  }

  throw new Error("Invalid request payload for cleanUnified");
}
