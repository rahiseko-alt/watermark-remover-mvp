import { describe, it, expect } from "vitest";
import sharp from "sharp";
import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";
import { inspectImage, cleanImage } from "../lib/engine/imageCleaner";
import { inspectDocument, cleanDocument } from "../lib/engine/documentCleaner";

describe("Image & Document Cleaner - Adversarial Test Suite", () => {
  it("IMG-02: Strips PNG AI metadata & prompt chunks while preserving image pixels", async () => {
    // Create a 10x10 PNG image with sharp and embed custom text metadata
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
    expect(cleanRes.inspectionAfter.hasMetadata).toBe(false);

    // Verify cleaned image dimensions and pixel content are preserved
    const cleanedMeta = await sharp(cleanRes.cleanedBuffer).metadata();
    expect(cleanedMeta.width).toBe(10);
    expect(cleanedMeta.height).toBe(10);
  });

  it("DOC-01: Cleans DOCX properties, custom AI metadata and internal invisible characters", async () => {
    const zip = new JSZip();
    // docProps/core.xml with creator
    zip.file(
      "docProps/core.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <dc:creator>AI Author Bot</dc:creator>
  <dc:title>Generated Report</dc:title>
</cp:coreProperties>`
    );
    // docProps/custom.xml
    zip.file("docProps/custom.xml", `<Properties><Property name="AI_Model">GPT-4</Property></Properties>`);
    // word/document.xml with invisible text
    zip.file(
      "word/document.xml",
      `<w:document><w:body><w:p><w:r><w:t>Secret\u200BDocument</w:t></w:r></w:p></w:body></w:document>`
    );

    const docxBuffer = await zip.generateAsync({ type: "nodebuffer" });

    const inspection = await inspectDocument(docxBuffer, "sample.docx");
    expect(inspection.hasMetadata).toBe(true);
    expect(inspection.detectedItems.coreProperties).toBe(true);
    expect(inspection.detectedItems.customProperties).toBe(true);
    expect(inspection.detectedItems.invisibleTextWatermarks).toBe(true);

    const cleanRes = await cleanDocument(docxBuffer, "sample.docx");
    expect(cleanRes.format).toBe("docx");

    // Verify after cleaning
    const afterZip = await JSZip.loadAsync(cleanRes.cleanedBuffer);
    expect(afterZip.file("docProps/custom.xml")).toBeNull();
    const cleanedDocXml = await afterZip.file("word/document.xml")!.async("text");
    expect(cleanedDocXml.includes("\u200B")).toBe(false);
    expect(cleanedDocXml.includes("SecretDocument")).toBe(true);
  });

  it("DOC-04: Strips PDF Info Dictionary and metadata", async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([200, 200]);
    pdfDoc.setTitle("Confidential AI Paper");
    pdfDoc.setAuthor("AI Generator");
    pdfDoc.setSubject("Automated Research");
    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    const inspection = await inspectDocument(pdfBuffer, "paper.pdf");
    expect(inspection.hasMetadata).toBe(true);
    expect(inspection.detectedItems.pdfInfoDictionary).toBe(true);

    const cleanRes = await cleanDocument(pdfBuffer, "paper.pdf");
    expect(cleanRes.format).toBe("pdf");

    // Verify cleaned PDF
    const verifiedDoc = await PDFDocument.load(cleanRes.cleanedBuffer);
    expect(verifiedDoc.getTitle()).toBeFalsy();
    expect(verifiedDoc.getAuthor()).toBeFalsy();
  });
});
