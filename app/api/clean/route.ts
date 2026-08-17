import { NextRequest, NextResponse } from "next/server";
import { cleanUnified } from "@/lib/engine/orchestrator";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      const text = body.text;

      if (typeof text !== "string") {
        return NextResponse.json({ error: "Text field must be a string" }, { status: 400 });
      }

      const result = await cleanUnified({ text });
      return NextResponse.json(result);
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const text = formData.get("text") as string | null;

      if (file) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const result = await cleanUnified({
          fileBuffer: buffer,
          filename: file.name,
          mimeType: file.type,
        });
        return NextResponse.json(result);
      } else if (text !== null) {
        const result = await cleanUnified({ text });
        return NextResponse.json(result);
      } else {
        return NextResponse.json({ error: "No file or text provided in formData" }, { status: 400 });
      }
    } else {
      const text = await req.text();
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
