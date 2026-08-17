/**
 * Text Watermark & Invisible Character Cleaner & Inspector
 * Compliant with Adversarial QA Specs:
 * - Removes steganographic invisible characters & zero-width artifacts
 * - Preserves Emoji ZWJ sequences (e.g. 👩‍👩‍👧‍👦, 🏳️‍🌈)
 * - Preserves Japanese IVS / SVS Variation Selectors (e.g. 葛󠄀, 辻󠄀)
 * - Preserves accented combining diacritics
 * - Normalizes Unicode securely without ReDoS vulnerability
 */

export interface DetectedInvisibleCharacter {
  type: string;
  name: string;
  codePoint: string;
  index: number;
  count: number;
}

export interface TextInspectionResult {
  hasInvisibleCharacters: boolean;
  totalDetected: number;
  charactersByType: Record<string, number>;
  details: DetectedInvisibleCharacter[];
  detectedTypes: string[];
  clean: boolean;
}

export interface TextCleanResult {
  originalText: string;
  cleanedText: string;
  inspectionBefore: TextInspectionResult;
  inspectionAfter: TextInspectionResult;
  stats: {
    removedCount: number;
    originalLength: number;
    cleanedLength: number;
    removedByType: Record<string, number>;
  };
}

// Regex for emoji ZWJ sequences to preserve
// E.g. Emoji + (Skin Tone)? + ZWJ + Emoji ...
const EMOJI_ZWJ_SEQUENCE_REGEX = /(?:\p{Extended_Pictographic}(?:[\u{1F3FB}-\u{1F3FF}]|\u{FE0F})?\u{200D})+\p{Extended_Pictographic}(?:[\u{1F3FB}-\u{1F3FF}]|\u{FE0F})?/gu;

// Standard Variation Selectors to preserve (SVS U+FE00-U+FE0F, IVS U+E0100-U+E01EF)
const VARIATION_SELECTOR_REGEX = /(?:[\u4E00-\u9FFF\u3400-\u4DBF\u{20000}-\u{2A6DF}\u{2A700}-\u{2B73F}\u{2B740}-\u{2B81F}\u{2B820}-\u{2CEAF}\u{2CEB0}-\u{2EBEF}\u{30000}-\u{3134F}]\u{E0100}-\u{E01EF}|[\u0000-\u{10FFFF}][\u{FE00}-\u{FE0F}])/gu;

// Character definitions to strip
const INVISIBLE_DEFINITIONS: Array<{
  type: string;
  name: string;
  test: (cp: number) => boolean;
}> = [
  {
    type: "zero_width_space",
    name: "Zero-Width Space (U+200B)",
    test: (cp) => cp === 0x200b,
  },
  {
    type: "zero_width_non_joiner",
    name: "Zero-Width Non-Joiner (U+200C)",
    test: (cp) => cp === 0x200c,
  },
  {
    type: "zero_width_joiner_isolated",
    name: "Isolated Zero-Width Joiner (U+200D)",
    test: (cp) => cp === 0x200d,
  },
  {
    type: "zero_width_no_break_space",
    name: "Zero-Width No-Break Space / BOM (U+FEFF)",
    test: (cp) => cp === 0xfeff,
  },
  {
    type: "word_joiner",
    name: "Word Joiner (U+2060)",
    test: (cp) => cp === 0x2060,
  },
  {
    type: "unicode_tag_character",
    name: "Unicode Tag Steganography (U+E0000 - U+E007F)",
    test: (cp) => cp >= 0xe0000 && cp <= 0xe007f,
  },
  {
    type: "bidi_override_control",
    name: "Bi-directional Override Control (U+202A-U+202E, U+2066-U+2069)",
    test: (cp) => (cp >= 0x202a && cp <= 0x202e) || (cp >= 0x2066 && cp <= 0x2069),
  },
  {
    type: "private_use_area",
    name: "Private Use Area Character (U+E000-U+F8FF, U+F0000-U+10FFFF)",
    test: (cp) =>
      (cp >= 0xe000 && cp <= 0xf8ff) ||
      (cp >= 0xf0000 && cp <= 0xffffd) ||
      (cp >= 0x100000 && cp <= 0x10fffd),
  },
  {
    type: "soft_hyphen",
    name: "Soft Hyphen / Hidden Syllable Break (U+00AD)",
    test: (cp) => cp === 0x00ad,
  },
  {
    type: "special_space_artifact",
    name: "Hidden Space Artifact (U+2000-U+200A, U+202F, U+205F)",
    test: (cp) => (cp >= 0x2000 && cp <= 0x200a) || cp === 0x202f || cp === 0x205f,
  },
];

/**
 * Finds all emoji ZWJ safe ranges in the string to protect from stripping
 */
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
 * Inspect text for invisible watermark characters
 */
export function inspectText(text: string): TextInspectionResult {
  if (!text) {
    return {
      hasInvisibleCharacters: false,
      totalDetected: 0,
      charactersByType: {},
      details: [],
      detectedTypes: [],
      clean: true,
    };
  }

  const protectedRanges = getEmojiProtectedRanges(text);
  const isProtectedIndex = (idx: number) =>
    protectedRanges.some(([start, end]) => idx >= start && idx < end);

  const charactersByType: Record<string, number> = {};
  const details: DetectedInvisibleCharacter[] = [];
  let totalDetected = 0;

  let strIndex = 0;
  for (const char of text) {
    const codePoint = char.codePointAt(0);
    const charLen = char.length;

    if (codePoint !== undefined) {
      // Check if this character is an isolated ZWJ that is part of a valid emoji sequence
      const inEmoji = isProtectedIndex(strIndex);

      for (const def of INVISIBLE_DEFINITIONS) {
        if (def.test(codePoint)) {
          // If it's a ZWJ (U+200D) and it's inside an emoji sequence, protect it!
          if (codePoint === 0x200d && inEmoji) {
            continue;
          }

          // If it's an IVS tag (U+E0100-U+E01EF) or SVS (U+FE00-U+FE0F), it shouldn't match tag chars (U+E0000-E007F)
          charactersByType[def.type] = (charactersByType[def.type] || 0) + 1;
          totalDetected++;

          details.push({
            type: def.type,
            name: def.name,
            codePoint: `U+${codePoint.toString(16).toUpperCase().padStart(4, "0")}`,
            index: strIndex,
            count: 1,
          });
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
    details: details.slice(0, 100), // Cap details at 100 for performance
    detectedTypes: Object.keys(charactersByType),
    clean: totalDetected === 0,
  };
}

/**
 * Clean text from invisible watermarks while preserving Emoji ZWJ, IVS, and standard formatting
 */
export function cleanText(text: string): TextCleanResult {
  const inspectionBefore = inspectText(text);

  if (!text || !inspectionBefore.hasInvisibleCharacters) {
    return {
      originalText: text,
      cleanedText: text,
      inspectionBefore,
      inspectionAfter: inspectionBefore,
      stats: {
        removedCount: 0,
        originalLength: text.length,
        cleanedLength: text.length,
        removedByType: {},
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
            // Protected emoji ZWJ
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

  // Normalize Unicode securely (NFC: Canonical Decomposition, followed by Canonical Composition)
  cleaned = cleaned.normalize("NFC");

  const inspectionAfter = inspectText(cleaned);

  return {
    originalText: text,
    cleanedText: cleaned,
    inspectionBefore,
    inspectionAfter,
    stats: {
      removedCount,
      originalLength: text.length,
      cleanedLength: cleaned.length,
      removedByType,
    },
  };
}
