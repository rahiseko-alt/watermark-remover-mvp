import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    version: "0.5.0",
    capabilityMatrix: {
      text: {
        zeroWidthSpaces: { detect: true, remove: true, verify: true, confidence: "high" },
        unicodeTags: { detect: true, remove: true, verify: true, confidence: "high" },
        bidiControls: { detect: true, remove: true, verify: true, confidence: "medium" },
        softHyphenAndSpaces: { detect: true, remove: true, verify: true, confidence: "informational" },
        privateUseArea: { detect: true, remove: true, verify: true, confidence: "informational" },
      },
      images: {
        exif: { detect: true, remove: true, verify: true },
        xmp: { detect: true, remove: true, verify: true },
        iptc: { detect: true, remove: true, verify: true },
        pngPromptChunks: { detect: true, remove: true, verify: true },
        c2paManifest: { detect: "partial", remove: "partial", verify: "partial", note: "Removes standard JUMBF/c2pa boxes; deep signature parsing is experimental." },
        jpegLossless: { supported: false, note: "JPEG is re-encoded with high-quality settings. Exact pixel bit-match is not guaranteed due to lossy nature." },
        pngLossless: { supported: true, note: "RGB/RGBA pixel integrity is 100% preserved." },
      },
      documents: {
        docxProperties: { detect: true, remove: true, verify: true },
        docxCommentsAndRevisions: { detect: true, remove: true, verify: true },
        pdfInfoDictionary: { detect: true, remove: true, verify: true },
        pdfXmpStream: { detect: true, remove: true, verify: true },
        pdfScriptsAndActions: { detect: true, remove: true, verify: true },
      },
      unsupported: {
        synthidPixelWatermark: false,
        treeRingWatermark: false,
        statisticalLlmRewrite: false,
        aiGenerationDetection: false,
      },
    },
    safetyGuarantees: [
      "Emoji ZWJ sequences preserved (e.g. 👩‍👩‍👧‍👦, 🏳️‍🌈)",
      "Japanese IVS selectors preserved (e.g. 葛󠄀, 辻󠄀)",
      "Zero-Retention in-memory streaming",
      "Passthrough unchanged data when 0 items detected",
    ],
  });
}
