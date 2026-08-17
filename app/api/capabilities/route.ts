import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    version: "0.5.0",
    mvpScope: {
      layer1_metadata: true,
      layer2_invisible_characters: true,
      layer3_statistical_text: false, // Phase 2
      layer4_image_pixel_synthid: false, // Phase 3
    },
    supportedInputs: {
      text: ["plain_text", "markdown", "html"],
      images: ["image/png", "image/jpeg", "image/webp"],
      documents: [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/pdf",
      ],
    },
    supportedRemovals: [
      "C2PA / Content Credentials (JUMBF boxes)",
      "EXIF / XMP / IPTC / GPS Metadata",
      "PNG AI Prompt Chunks (tEXt, zTXt, iTXt)",
      "DOCX Document Properties (Core, App, Custom XML)",
      "DOCX Comments & Revision Tracking History",
      "PDF Info Dictionary & XMP Metadata Streams",
      "Zero-Width Characters (ZWSP, ZWNJ, ZWNBSP)",
      "Unicode Tag Steganography Characters (U+E0000 - U+E007F)",
      "Bi-directional Override Controls",
      "Private Use Area (PUA) Watermarks",
      "Soft Hyphens & Hidden Space Artifacts",
    ],
    protections: [
      "Emoji ZWJ Sequences Preserved (e.g. 👩‍👩‍👧‍👦, 🏳️‍🌈)",
      "Japanese IVS / Variation Selectors Preserved (e.g. 葛󠄀, 辻󠄀)",
      "Accented Diacritics Preserved (NFC Normalization)",
      "Lossless Pixel RGB/RGBA Integrity Guarantee",
      "Zero-Retention In-Memory Processing",
    ],
  });
}
