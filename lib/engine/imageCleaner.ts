import sharp from "sharp";

export interface ImageInspectionResult {
  hasMetadata: boolean;
  format: "png" | "jpeg" | "webp" | "unknown";
  dimensions?: { width: number; height: number };
  detectedTags: {
    c2pa: boolean;
    exif: boolean;
    xmp: boolean;
    iptc: boolean;
    aiPromptChunks: boolean;
    pngTextChunks: string[];
    otherMetadataCount: number;
  };
  details: string[];
  clean: boolean;
}

export interface ImageCleanResult {
  cleanedBuffer: Buffer;
  format: "png" | "jpeg" | "webp";
  inspectionBefore: ImageInspectionResult;
  inspectionAfter: ImageInspectionResult;
  status: "success" | "partial" | "unchanged";
  stats: {
    originalSize: number;
    cleanedSize: number;
    strippedItems: string[];
    remainingItems: string[];
  };
}

/**
 * Inspection for PNG text chunks and C2PA markers from binary buffer
 */
function inspectPngBinary(buffer: Buffer) {
  const textChunks: string[] = [];
  let hasC2PA = false;

  // PNG Signature: 89 50 4E 47 0D 0A 1A 0A
  if (buffer.length < 8 || buffer.readUInt32BE(0) !== 0x89504e47) {
    return { textChunks, hasC2PA };
  }

  let offset = 8;
  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);

    if (type === "tEXt" || type === "zTXt" || type === "iTXt") {
      const dataOffset = offset + 8;
      const dataEnd = Math.min(dataOffset + length, buffer.length);
      let nullIndex = -1;
      for (let i = dataOffset; i < dataEnd; i++) {
        if (buffer[i] === 0) {
          nullIndex = i;
          break;
        }
      }
      const keyword =
        nullIndex !== -1
          ? buffer.toString("utf8", dataOffset, nullIndex)
          : `chunk-${type}`;
      textChunks.push(`${type}: ${keyword}`);
    } else if (
      type === "c2pa" ||
      type === "caIx" ||
      type === "jumb" ||
      type === "JUMB"
    ) {
      hasC2PA = true;
    }

    offset += 8 + length + 4;
    if (type === "IEND") break;
  }

  return { textChunks, hasC2PA };
}

/**
 * Inspection for JPEG APP markers and C2PA JUMBF markers
 */
function inspectJpegBinary(buffer: Buffer) {
  let hasExif = false;
  let hasXmp = false;
  let hasIptc = false;
  let hasC2PA = false;
  let otherCount = 0;

  // JPEG SOI: FF D8
  if (buffer.length < 2 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return { hasExif, hasXmp, hasIptc, hasC2PA, otherCount };
  }

  let offset = 2;
  while (offset + 4 <= buffer.length) {
    if (buffer[offset] !== 0xff) break;
    const marker = buffer[offset + 1];

    if (marker === 0xd9 || marker === 0xda) break; // EOI or SOS
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }

    const length = buffer.readUInt16BE(offset + 2);
    const dataStart = offset + 4;
    const dataEnd = offset + 2 + length;

    if (marker === 0xe1) {
      // APP1: EXIF or XMP
      const str = buffer.toString("utf8", dataStart, Math.min(dataStart + 30, dataEnd));
      if (str.startsWith("Exif")) hasExif = true;
      if (str.includes("http://ns.adobe.com/xap/1.0/") || str.includes("<x:xmpmeta")) hasXmp = true;
    } else if (marker === 0xed) {
      // APP13: IPTC / Photoshop
      hasIptc = true;
    } else if (marker === 0xeb) {
      // APP11 (JUMBF / C2PA Manifest Box)
      const app11Header = buffer.toString("utf8", dataStart, Math.min(dataStart + 16, dataEnd));
      if (app11Header.includes("JP") || app11Header.includes("jumb") || app11Header.includes("c2pa")) {
        hasC2PA = true;
      }
    } else if (marker === 0xfe) {
      otherCount++;
    } else if (marker >= 0xe2 && marker <= 0xef) {
      otherCount++;
    }

    offset += 2 + length;
  }

  return { hasExif, hasXmp, hasIptc, hasC2PA, otherCount };
}

/**
 * Inspection for WebP chunks
 */
function inspectWebpBinary(buffer: Buffer) {
  let hasExif = false;
  let hasXmp = false;
  let hasC2PA = false;

  // WebP Signature: RIFF .... WEBP
  if (
    buffer.length < 12 ||
    buffer.toString("ascii", 0, 4) !== "RIFF" ||
    buffer.toString("ascii", 8, 12) !== "WEBP"
  ) {
    return { hasExif, hasXmp, hasC2PA };
  }

  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);

    if (chunkId === "EXIF") hasExif = true;
    if (chunkId === "XMP ") hasXmp = true;
    if (chunkId === "C2PA" || chunkId === "JUMB") hasC2PA = true;

    offset += 8 + chunkSize + (chunkSize % 2);
  }

  return { hasExif, hasXmp, hasC2PA };
}

/**
 * Inspect image buffer for metadata tags (EXIF, XMP, IPTC, PNG prompt chunks, C2PA)
 */
export async function inspectImage(buffer: Buffer): Promise<ImageInspectionResult> {
  const details: string[] = [];
  let format: "png" | "jpeg" | "webp" | "unknown" = "unknown";
  let dimensions: { width: number; height: number } | undefined;

  let hasC2pa = false;
  let hasExif = false;
  let hasXmp = false;
  let hasIptc = false;
  let pngTextChunks: string[] = [];
  let otherMetadataCount = 0;

  // Detect format by magic bytes
  if (buffer.length >= 8 && buffer.readUInt32BE(0) === 0x89504e47) {
    format = "png";
    const pngInfo = inspectPngBinary(buffer);
    pngTextChunks = pngInfo.textChunks;
    hasC2pa = pngInfo.hasC2PA;
  } else if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    format = "jpeg";
    const jpegInfo = inspectJpegBinary(buffer);
    hasExif = jpegInfo.hasExif;
    hasXmp = jpegInfo.hasXmp;
    hasIptc = jpegInfo.hasIptc;
    hasC2pa = jpegInfo.hasC2PA;
    otherMetadataCount = jpegInfo.otherCount;
  } else if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    format = "webp";
    const webpInfo = inspectWebpBinary(buffer);
    hasExif = webpInfo.hasExif;
    hasXmp = webpInfo.hasXmp;
    hasC2pa = webpInfo.hasC2PA;
  }

  // Cross-verify with Sharp metadata parser
  try {
    const metadata = await sharp(buffer).metadata();
    if (metadata.width && metadata.height) {
      dimensions = { width: metadata.width, height: metadata.height };
    }
    if (metadata.exif) hasExif = true;
    if (metadata.xmp) hasXmp = true;
    if (metadata.iptc) hasIptc = true;
  } catch {
    // Safe fallback if sharp cannot parse corrupted header
  }

  if (hasC2pa) details.push("C2PA / Content Credentials manifest segment");
  if (hasExif) details.push("EXIF metadata tags");
  if (hasXmp) details.push("XMP XML metadata packet");
  if (hasIptc) details.push("IPTC / Photoshop metadata");
  if (pngTextChunks.length > 0) {
    details.push(`PNG text metadata chunks (${pngTextChunks.length} items: ${pngTextChunks.slice(0, 4).join(", ")})`);
  }
  if (otherMetadataCount > 0) {
    details.push(`Additional comment / header markers (${otherMetadataCount} items)`);
  }

  const hasMetadata =
    hasC2pa ||
    hasExif ||
    hasXmp ||
    hasIptc ||
    pngTextChunks.length > 0 ||
    otherMetadataCount > 0;

  return {
    hasMetadata,
    format,
    dimensions,
    detectedTags: {
      c2pa: hasC2pa,
      exif: hasExif,
      xmp: hasXmp,
      iptc: hasIptc,
      aiPromptChunks: pngTextChunks.length > 0,
      pngTextChunks,
      otherMetadataCount,
    },
    details,
    clean: !hasMetadata,
  };
}

/**
 * Clean image metadata:
 * - PNG: Lossless metadata strip (RGB/RGBA pixels preserved)
 * - WebP: Lossless metadata strip
 * - JPEG: High-quality re-encoding strip (Note: Lossy compression, exact pixel bit-match is not guaranteed)
 * - Unchanged Passthrough: If no metadata is detected, returns the original buffer without re-encoding
 */
export async function cleanImage(buffer: Buffer): Promise<ImageCleanResult> {
  const inspectionBefore = await inspectImage(buffer);

  // Passthrough: If already clean, avoid re-encoding completely
  if (!inspectionBefore.hasMetadata) {
    return {
      cleanedBuffer: buffer,
      format: inspectionBefore.format === "unknown" ? "png" : inspectionBefore.format,
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
  if (inspectionBefore.detectedTags.c2pa) strippedItems.push("C2PA / Content Credentials");
  if (inspectionBefore.detectedTags.exif) strippedItems.push("EXIF Tags");
  if (inspectionBefore.detectedTags.xmp) strippedItems.push("XMP Metadata");
  if (inspectionBefore.detectedTags.iptc) strippedItems.push("IPTC Metadata");
  if (inspectionBefore.detectedTags.pngTextChunks.length > 0) {
    strippedItems.push(`PNG Text Chunks (${inspectionBefore.detectedTags.pngTextChunks.length})`);
  }

  let imagePipeline = sharp(buffer, { failOnError: false });
  let cleanedBuffer: Buffer;
  const targetFormat = inspectionBefore.format === "unknown" ? "png" : inspectionBefore.format;

  if (targetFormat === "png") {
    // Lossless PNG strip
    cleanedBuffer = await imagePipeline
      .png({
        compressionLevel: 9,
        palette: false,
      })
      .toBuffer();
  } else if (targetFormat === "jpeg") {
    // High-quality JPEG re-encode (Lossy metadata strip)
    cleanedBuffer = await imagePipeline
      .jpeg({
        quality: 98,
        chromaSubsampling: "4:4:4",
        mozjpeg: true,
      })
      .toBuffer();
  } else {
    // Lossless WebP strip
    cleanedBuffer = await imagePipeline
      .webp({
        lossless: true,
      })
      .toBuffer();
  }

  const inspectionAfter = await inspectImage(cleanedBuffer);
  const remainingItems = inspectionAfter.details;
  const status = inspectionAfter.clean ? "success" : "partial";

  return {
    cleanedBuffer,
    format: targetFormat,
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
