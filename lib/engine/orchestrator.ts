import { cleanImage, inspectImage } from "./imageCleaner";
import { cleanDocument, inspectDocument } from "./documentCleaner";
import { cleanText, inspectText } from "./textCleaner";

export type InputMode = "text" | "file";

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
  };
  details: string[];
  rawInspection: any;
}

export interface UnifiedCleanResult {
  mode: InputMode;
  filename?: string;
  outputFilename?: string;
  format: string;
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
  };
}

/**
 * Detect file category based on filename or MIME type
 */
export function detectFileCategory(filename: string, mimeType?: string): "image" | "document" | "text" {
  const ext = filename.split(".").pop()?.toLowerCase() || "";

  if (["png", "jpg", "jpeg", "webp"].includes(ext) || (mimeType && mimeType.startsWith("image/"))) {
    return "image";
  }
  if (["docx", "pdf"].includes(ext) || mimeType === "application/pdf" || mimeType?.includes("wordprocessingml")) {
    return "document";
  }
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
      },
      details: textRes.details.map((d) => `${d.name} (${d.codePoint})`),
      rawInspection: textRes,
    };
  }

  if (data.fileBuffer && data.filename) {
    const category = detectFileCategory(data.filename, data.mimeType);

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
      // Plain text / markdown / html file
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
      inspectionBefore: beforeUnified,
      inspectionAfter: afterUnified,
      cleanedText: textRes.cleanedText,
      stats: {
        removedCount: textRes.stats.removedCount,
        removedCategories: Object.keys(textRes.stats.removedByType),
        originalSize: textRes.stats.originalLength,
        cleanedSize: textRes.stats.cleanedLength,
      },
    };
  }

  if (data.fileBuffer && data.filename) {
    const category = detectFileCategory(data.filename, data.mimeType);
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
        inspectionBefore: beforeUnified,
        inspectionAfter: afterUnified,
        cleanedBufferBase64: imgRes.cleanedBuffer.toString("base64"),
        mimeType,
        stats: {
          removedCount: imgRes.stats.strippedItems.length,
          removedCategories: imgRes.stats.strippedItems,
          originalSize: imgRes.stats.originalSize,
          cleanedSize: imgRes.stats.cleanedSize,
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
        inspectionBefore: beforeUnified,
        inspectionAfter: afterUnified,
        cleanedBufferBase64: docRes.cleanedBuffer.toString("base64"),
        mimeType,
        stats: {
          removedCount: docRes.stats.strippedItems.length,
          removedCategories: docRes.stats.strippedItems,
          originalSize: docRes.stats.originalSize,
          cleanedSize: docRes.stats.cleanedSize,
        },
      };
    } else {
      // Plain text file (e.g. .txt, .md, .html)
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
        inspectionBefore: beforeUnified,
        inspectionAfter: afterUnified,
        cleanedBufferBase64: cleanedBuffer.toString("base64"),
        mimeType: "text/plain; charset=utf-8",
        stats: {
          removedCount: textRes.stats.removedCount,
          removedCategories: Object.keys(textRes.stats.removedByType),
          originalSize: data.fileBuffer.length,
          cleanedSize: cleanedBuffer.length,
        },
      };
    }
  }

  throw new Error("Invalid request payload for cleanUnified");
}
