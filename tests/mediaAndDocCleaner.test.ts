import { describe, it, expect } from "vitest";
import sharp from "sharp";
import JSZip from "jszip";
import { PDFDocument, PDFName, PDFString } from "pdf-lib";
import { inspectImage, cleanImage } from "../lib/engine/imageCleaner";
import { inspectDocument, cleanDocument } from "../lib/engine/documentCleaner";

describe("Image & Document Cleaner - Adversarial & Verification Test Suite", () => {
  it("IMG-02: Strips PNG AI metadata & prompt chunks while preserving image pixels", async () => {
    const baseImg = await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 3,
        background: { r: 50, g: 150, b: 250 },
      },
    })
      .withMetadata({
        exif: {
          IFD0: {
            ImageDescription: "AI Generated Prompt: Masterpiece landscape",
            Software: "Stable Diffusion ComfyUI",
          },
        },
      })
      .png()
      .toBuffer();

    const inspectionBefore = await inspectImage(baseImg);
    expect(inspectionBefore.hasMetadata).toBe(true);

    const cleanRes = await cleanImage(baseImg);
    expect(cleanRes.format).toBe("png");
    expect(cleanRes.status).toBe("success");
    expect(cleanRes.inspectionAfter.clean).toBe(true);

    const cleanedMeta = await sharp(cleanRes.cleanedBuffer).metadata();
    expect(cleanedMeta.width).toBe(10);
    expect(cleanedMeta.height).toBe(10);
  });

  it("IMG-03: Passthrough clean images without re-encoding", async () => {
    const cleanPng = await sharp({
      create: { width: 8, height: 8, channels: 3, background: { r: 100, g: 100, b: 100 } },
    })
      .png()
      .toBuffer();

    const cleanRes = await cleanImage(cleanPng);
    expect(cleanRes.status).toBe("unchanged");
    expect(cleanRes.cleanedBuffer.length).toBe(cleanPng.length);
  });

  it("DOC-01: Cleans DOCX properties, custom AI metadata, invisible text, and tracked changes", async () => {
    const zip = new JSZip();
    zip.file(
      "docProps/core.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <dc:creator>AI Author Bot</dc:creator>
  <dc:title>Generated Report</dc:title>
</cp:coreProperties>`
    );
    zip.file("docProps/custom.xml", `<Properties><Property name="AI_Model">GPT-4</Property></Properties>`);
    zip.file(
      "word/document.xml",
      `<w:document><w:body><w:p><w:ins><w:r><w:t>Secret\u200BDocument</w:t></w:r></w:ins><w:del><w:r><w:t>DeletedText</w:t></w:r></w:del></w:p></w:body></w:document>`
    );

    const docxBuffer = await zip.generateAsync({ type: "nodebuffer" });

    const inspection = await inspectDocument(docxBuffer, "sample.docx");
    expect(inspection.hasMetadata).toBe(true);
    expect(inspection.detectedItems.coreProperties).toBe(true);
    expect(inspection.detectedItems.customProperties).toBe(true);
    expect(inspection.detectedItems.invisibleTextWatermarks).toBe(true);

    const cleanRes = await cleanDocument(docxBuffer, "sample.docx");
    expect(cleanRes.format).toBe("docx");
    expect(cleanRes.status).toBe("success");

    const afterZip = await JSZip.loadAsync(cleanRes.cleanedBuffer);
    expect(afterZip.file("docProps/custom.xml")).toBeNull();
    const cleanedDocXml = await afterZip.file("word/document.xml")!.async("text");
    expect(cleanedDocXml.includes("\u200B")).toBe(false);
    expect(cleanedDocXml.includes("SecretDocument")).toBe(true);
    expect(cleanedDocXml.includes("<w:del")).toBe(false);
    expect(cleanedDocXml.includes("DeletedText")).toBe(false);
  });

  it("DOC-04: Physically strips PDF Info Dictionary, /Metadata (XMP), and /JavaScript actions", async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([200, 200]);
    pdfDoc.setTitle("Confidential AI Paper");
    pdfDoc.setAuthor("AI Generator");

    // Add dummy XMP metadata stream object to catalog
    const xmpStream = pdfDoc.context.flateStream("<x:xmpmeta>AI Metadata</x:xmpmeta>");
    const xmpStreamRef = pdfDoc.context.register(xmpStream);
    pdfDoc.catalog.set(PDFName.of("Metadata"), xmpStreamRef);

    // Add dummy OpenAction
    pdfDoc.catalog.set(PDFName.of("OpenAction"), PDFString.of("app.alert('malicious')"));

    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    const inspectionBefore = await inspectDocument(pdfBuffer, "paper.pdf");
    expect(inspectionBefore.hasMetadata).toBe(true);
    expect(inspectionBefore.detectedItems.pdfInfoDictionary).toBe(true);
    expect(inspectionBefore.detectedItems.pdfXmpMetadata).toBe(true);
    expect(inspectionBefore.detectedItems.pdfActionsOrScripts).toBe(true);

    const cleanRes = await cleanDocument(pdfBuffer, "paper.pdf");
    expect(cleanRes.format).toBe("pdf");
    expect(cleanRes.status).toBe("success");
    expect(cleanRes.inspectionAfter.clean).toBe(true);

    // Verify low-level catalog structure on cleaned PDF
    const verifiedDoc = await PDFDocument.load(cleanRes.cleanedBuffer);
    expect(verifiedDoc.getTitle()).toBeFalsy();
    expect(verifiedDoc.getAuthor()).toBeFalsy();
    expect(verifiedDoc.catalog.has(PDFName.of("Metadata"))).toBe(false);
    expect(verifiedDoc.catalog.has(PDFName.of("OpenAction"))).toBe(false);
    expect(verifiedDoc.catalog.has(PDFName.of("Names"))).toBe(false);
  });
});
