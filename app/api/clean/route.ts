import { NextRequest, NextResponse } from "next/server";
import { cleanUnified } from "@/lib/engine/orchestrator";

// SaaS Security Limits
const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_DOCX_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_PDF_SIZE = 30 * 1024 * 1024; // 30MB
const MAX_TEXT_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      const text = body.text;

      if (typeof text !== "string") {
        return NextResponse.json({ error: "Text field must be a string" }, { status: 400 });
      }

      if (Buffer.byteLength(text, "utf8") > MAX_TEXT_SIZE) {
        return NextResponse.json(
          { error: `Text exceeds maximum allowed size (${MAX_TEXT_SIZE / (1024 * 1024)}MB)` },
          { status: 413 }
        );
      }

      const result = await cleanUnified({ text });
      return NextResponse.json(result);
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const text = formData.get("text") as string | null;

      if (file) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "";
        const maxAllowed =
          ext === "pdf"
            ? MAX_PDF_SIZE
            : ext === "docx"
            ? MAX_DOCX_SIZE
            : ["png", "jpg", "jpeg", "webp"].includes(ext)
            ? MAX_IMAGE_SIZE
            : MAX_TEXT_SIZE;

        if (file.size > maxAllowed) {
          return NextResponse.json(
            { error: `File size exceeds security limit of ${maxAllowed / (1024 * 1024)}MB for ${ext.toUpperCase()}` },
            { status: 413 }
          );
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const result = await cleanUnified({
          fileBuffer: buffer,
          filename: file.name,
          mimeType: file.type,
        });
        return NextResponse.json(result);
      } else if (text !== null) {
        if (Buffer.byteLength(text, "utf8") > MAX_TEXT_SIZE) {
          return NextResponse.json(
            { error: `Text exceeds maximum allowed size (${MAX_TEXT_SIZE / (1024 * 1024)}MB)` },
            { status: 413 }
          );
        }
        const result = await cleanUnified({ text });
        return NextResponse.json(result);
      } else {
        return NextResponse.json({ error: "No file or text provided in formData" }, { status: 400 });
      }
    } else {
      const text = await req.text();
      if (Buffer.byteLength(text, "utf8") > MAX_TEXT_SIZE) {
        return NextResponse.json(
          { error: `Text exceeds maximum allowed size (${MAX_TEXT_SIZE / (1024 * 1024)}MB)` },
          { status: 413 }
        );
      }
      const result = await cleanUnified({ text });
      return NextResponse.json(result);
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to clean content" },
      { status: 500 }
    );
  }
}
