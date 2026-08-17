import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "watermarks-remover-mvp",
    version: "0.5.0",
    engine: "deterministic-layer1-layer2",
    privacy: "zero-retention-in-memory",
    timestamp: new Date().toISOString(),
  });
}
