import { describe, it, expect } from "vitest";
import { inspectText, cleanText } from "../lib/engine/textCleaner";

describe("Text Cleaner - Adversarial & Safety Test Suite", () => {
  it("TXT-01: strips zero-width spaces (ZWSP, ZWNJ, ZWNBSP, Word Joiner) from AI text", () => {
    const input = "AI生成テキスト\u200Bに\u200C埋め込まれた\uFEFF不可視透かし\u2060完了";
    const inspection = inspectText(input);
    expect(inspection.hasInvisibleCharacters).toBe(true);
    expect(inspection.totalDetected).toBe(4);

    const res = cleanText(input);
    expect(res.cleanedText).toBe("AI生成テキストに埋め込まれた不可視透かし完了");
    expect(res.inspectionAfter.hasInvisibleCharacters).toBe(false);
    expect(res.stats.removedCount).toBe(4);
  });

  it("TXT-02: completely removes Unicode Tag characters (U+E0001 - U+E007F) steganography", () => {
    const input = "Secret\u{E0061}\u{E0069}\u{E002D}\u{E0067}\u{E0065}\u{E006E}Message";
    const inspection = inspectText(input);
    expect(inspection.hasInvisibleCharacters).toBe(true);
    expect(inspection.totalDetected).toBe(6);

    const res = cleanText(input);
    expect(res.cleanedText).toBe("SecretMessage");
    expect(res.inspectionAfter.hasInvisibleCharacters).toBe(false);
  });

  it("TXT-03: strips Bi-directional override control characters", () => {
    const input = "NormalText\u202Ereversed\u202Cend";
    const res = cleanText(input);
    expect(res.cleanedText).toBe("NormalTextreversedend");
  });

  it("TXT-05 (CRITICAL FALSE-POSITIVE): PRESERVES Emoji ZWJ sequences without breaking them", () => {
    // Family emoji (👩‍👩‍👧‍👦) contains ZWJs: U+1F469 U+200D U+1F469 U+200D U+1F467 U+200D U+1F466
    const familyEmoji = "👩‍👩‍👧‍👦";
    const rainbowFlag = "🏳️‍🌈";
    const inputWithHidden = `家族 ${familyEmoji} \u200Bと 虹 ${rainbowFlag} \uFEFFの旅行`;

    const inspection = inspectText(inputWithHidden);
    expect(inspection.hasInvisibleCharacters).toBe(true);
    // Should detect the 2 isolated/stego watermarks, NOT the emoji ZWJs
    expect(inspection.totalDetected).toBe(2);

    const res = cleanText(inputWithHidden);
    expect(res.cleanedText).toBe(`家族 ${familyEmoji} と 虹 ${rainbowFlag} の旅行`);
    expect(res.inspectionAfter.hasInvisibleCharacters).toBe(false);
  });

  it("TXT-06 (CRITICAL FALSE-POSITIVE): PRESERVES Japanese Ideographic Variation Selectors (IVS)", () => {
    // 葛󠄀 (U+845B U+E0100) and 辻󠄀 (U+8FBB U+E0100)
    const ivsText = "葛󠄀飾区と辻󠄀堂駅";
    const inputWithWatermark = `${ivsText}\u200B`;

    const res = cleanText(inputWithWatermark);
    expect(res.cleanedText).toBe(ivsText);
    expect(res.cleanedText.includes("\u{E0100}")).toBe(true);
  });

  it("TXT-07: PRESERVES Accented Combining Diacritics and normalizes to NFC", () => {
    // café with decomposed e + ́ (U+0065 U+0301)
    const nfdText = "cafe\u0301";
    const input = `${nfdText}\u200B`;

    const res = cleanText(input);
    expect(res.cleanedText).toBe("café");
    expect(res.inspectionAfter.hasInvisibleCharacters).toBe(false);
  });

  it("SEC-03: IDEMPOTENCE GUARANTEE - f(f(x)) === f(x)", () => {
    const input = "Complex\u200B text\u{E0061} with 👩‍👩‍👧‍👦 and 葛󠄀\uFEFF";
    const pass1 = cleanText(input);
    const pass2 = cleanText(pass1.cleanedText);

    expect(pass2.cleanedText).toBe(pass1.cleanedText);
    expect(pass2.stats.removedCount).toBe(0);
    expect(pass2.inspectionAfter.clean).toBe(true);
  });

  it("SEC-02: ReDoS Defense - Processes large text without exponential backtracking", () => {
    const largeText = "AI Text sample ".repeat(10000) + "\u200B" + " End";
    const startTime = Date.now();
    const res = cleanText(largeText);
    const elapsed = Date.now() - startTime;

    expect(elapsed).toBeLessThan(1000); // Must be under 1s for 150k characters
    expect(res.inspectionAfter.clean).toBe(true);
  });
});
