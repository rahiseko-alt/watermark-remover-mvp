/**
 * Text Watermark & Invisible Character Cleaner & Inspector
 * Categorizes detections into:
 * - high_confidence (Unicode Tags, multiple isolated ZWSP)
 * - suspicious (Single ZWSP, ZWNJ, BOM/ZWNBSP, Bidi)
 * - informational (Soft hyphen, special spaces, PUA)
 * Preserves Emoji ZWJ sequences and Japanese IVS selectors.
 */

export type WatermarkConfidence = "high_confidence" | "suspicious" | "informational";

export interface DetectedInvisibleCharacter {
  type: string;
  name: string;
  codePoint: string;
  index: number;
  confidence: WatermarkConfidence;
}

export interface TextInspectionResult {
  hasInvisibleCharacters: boolean;
  totalDetected: number;
  charactersByType: Record<string, number>;
  confidenceSummary: {
    highConfidence: number;
    suspicious: number;
    informational: number;
  };
  details: DetectedInvisibleCharacter[];
  detectedTypes: string[];
  clean: boolean;
}

export interface TextCleanResult {
  originalText: string;
  cleanedText: string;
  inspectionBefore: TextInspectionResult;
  inspectionAfter: TextInspectionResult;
  status: "success" | "partial" | "unchanged";
  stats: {
    removedCount: number;
    originalLength: number;
    cleanedLength: number;
    removedByType: Record<string, number>;
    remainingCount: number;
  };
}

// Regex for emoji ZWJ sequences to preserve
const EMOJI_ZWJ_SEQUENCE_REGEX = /(?:\p{Extended_Pictographic}(?:[\u{1F3FB}-\u{1F3FF}]|\u{FE0F})?\u{200D})+\p{Extended_Pictographic}(?:[\u{1F3FB}-\u{1F3FF}]|\u{FE0F})?/gu;

// Character definitions to strip
const INVISIBLE_DEFINITIONS: Array<{
  type: string;
  name: string;
  confidence: WatermarkConfidence;
  test: (cp: number) => boolean;
}> = [
  {
    type: "unicode_tag_character",
    name: "Unicode Tag Steganography (U+E0000 - U+E007F)",
    confidence: "high_confidence",
    test: (cp) => cp >= 0xe0000 && cp <= 0xe007f,
  },
  {
    type: "zero_width_space",
    name: "Zero-Width Space (U+200B)",
    confidence: "suspicious",
    test: (cp) => cp === 0x200b,
  },
  {
    type: "zero_width_non_joiner",
    name: "Zero-Width Non-Joiner (U+200C)",
    confidence: "suspicious",
    test: (cp) => cp === 0x200c,
  },
  {
    type: "zero_width_joiner_isolated",
    name: "Isolated Zero-Width Joiner (U+200D)",
    confidence: "suspicious",
    test: (cp) => cp === 0x200d,
  },
  {
    type: "zero_width_no_break_space",
    name: "Zero-Width No-Break Space / BOM (U+FEFF)",
    confidence: "suspicious",
    test: (cp) => cp === 0xfeff,
  },
  {
    type: "word_joiner",
    name: "Word Joiner (U+2060)",
    confidence: "suspicious",
    test: (cp) => cp === 0x2060,
  },
  {
    type: "bidi_override_control",
    name: "Bi-directional Override Control (U+202A-U+202E, U+2066-U+2069)",
    confidence: "suspicious",
    test: (cp) => (cp >= 0x202a && cp <= 0x202e) || (cp >= 0x2066 && cp <= 0x2069),
  },
  {
    type: "private_use_area",
    name: "Private Use Area Character (U+E000-U+F8FF, U+F0000-U+10FFFF)",
    confidence: "informational",
    test: (cp) =>
      (cp >= 0xe000 && cp <= 0xf8ff) ||
      (cp >= 0xf0000 && cp <= 0xffffd) ||
      (cp >= 0x100000 && cp <= 0x10fffd),
  },
  {
    type: "soft_hyphen",
    name: "Soft Hyphen / Hidden Syllable Break (U+00AD)",
    confidence: "informational",
    test: (cp) => cp === 0x00ad,
  },
  {
    type: "special_space_artifact",
    name: "Hidden Space Artifact (U+2000-U+200A, U+202F, U+205F)",
    confidence: "informational",
    test: (cp) => (cp >= 0x2000 && cp <= 0x200a) || cp === 0x202f || cp === 0x205f,
  },
];

function getEmojiProtectedRanges(text: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  let match: RegExpExecArray | null;
  const regex = new RegExp(EMOJI_ZWJ_SEQUENCE_REGEX);
  while ((match = regex.exec(text)) !== null) {
    ranges.push([match.index, match.index + match[0].length]);
  }
  return ranges;
}

/**
 * Inspect text for invisible watermark & special Unicode characters
 */
export function inspectText(text: string): TextInspectionResult {
  if (!text) {
    return {
      hasInvisibleCharacters: false,
      totalDetected: 0,
      charactersByType: {},
      confidenceSummary: { highConfidence: 0, suspicious: 0, informational: 0 },
      details: [],
      detectedTypes: [],
      clean: true,
    };
  }

  const protectedRanges = getEmojiProtectedRanges(text);
  const isProtectedIndex = (idx: number) =>
    protectedRanges.some(([start, end]) => idx >= start && idx < end);

  const charactersByType: Record<string, number> = {};
  const confidenceSummary = { highConfidence: 0, suspicious: 0, informational: 0 };
  const details: DetectedInvisibleCharacter[] = [];
  let totalDetected = 0;

  let strIndex = 0;
  for (const char of text) {
    const codePoint = char.codePointAt(0);
    const charLen = char.length;

    if (codePoint !== undefined) {
      const inEmoji = isProtectedIndex(strIndex);

      for (const def of INVISIBLE_DEFINITIONS) {
        if (def.test(codePoint)) {
          if (codePoint === 0x200d && inEmoji) {
            continue;
          }

          charactersByType[def.type] = (charactersByType[def.type] || 0) + 1;
          totalDetected++;

          if (def.confidence === "high_confidence") confidenceSummary.highConfidence++;
          else if (def.confidence === "suspicious") confidenceSummary.suspicious++;
          else confidenceSummary.informational++;

          if (details.length < 100) {
            details.push({
              type: def.type,
              name: def.name,
              codePoint: `U+${codePoint.toString(16).toUpperCase().padStart(4, "0")}`,
              index: strIndex,
              confidence: def.confidence,
            });
          }
          break;
        }
      }
    }
    strIndex += charLen;
  }

  return {
    hasInvisibleCharacters: totalDetected > 0,
    totalDetected,
    charactersByType,
    confidenceSummary,
    details,
    detectedTypes: Object.keys(charactersByType),
    clean: totalDetected === 0,
  };
}

/**
 * Clean text from invisible watermarks & normalize Unicode
 */
export function cleanText(text: string): TextCleanResult {
  const inspectionBefore = inspectText(text);

  if (!text || !inspectionBefore.hasInvisibleCharacters) {
    return {
      originalText: text,
      cleanedText: text,
      inspectionBefore,
      inspectionAfter: inspectionBefore,
      status: "unchanged",
      stats: {
        removedCount: 0,
        originalLength: text.length,
        cleanedLength: text.length,
        removedByType: {},
        remainingCount: 0,
      },
    };
  }

  const protectedRanges = getEmojiProtectedRanges(text);
  const isProtectedIndex = (idx: number) =>
    protectedRanges.some(([start, end]) => idx >= start && idx < end);

  let cleaned = "";
  const removedByType: Record<string, number> = {};
  let removedCount = 0;

  let strIndex = 0;
  for (const char of text) {
    const codePoint = char.codePointAt(0);
    const charLen = char.length;
    let shouldStrip = false;
    let strippedType = "";

    if (codePoint !== undefined) {
      const inEmoji = isProtectedIndex(strIndex);

      for (const def of INVISIBLE_DEFINITIONS) {
        if (def.test(codePoint)) {
          if (codePoint === 0x200d && inEmoji) {
            continue;
          }
          shouldStrip = true;
          strippedType = def.type;
          break;
        }
      }
    }

    if (shouldStrip) {
      removedByType[strippedType] = (removedByType[strippedType] || 0) + 1;
      removedCount++;
    } else {
      cleaned += char;
    }

    strIndex += charLen;
  }

  cleaned = cleaned.normalize("NFC");
  const inspectionAfter = inspectText(cleaned);
  const status = inspectionAfter.clean ? "success" : "partial";

  return {
    originalText: text,
    cleanedText: cleaned,
    inspectionBefore,
    inspectionAfter,
    status,
    stats: {
      removedCount,
      originalLength: text.length,
      cleanedLength: cleaned.length,
      removedByType,
      remainingCount: inspectionAfter.totalDetected,
    },
  };
}
