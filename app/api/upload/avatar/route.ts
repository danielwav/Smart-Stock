import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No se recibió ninguna imagen." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split(".").pop() || "png";
    const filename = `avatar_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
    const filepath = path.join(uploadDir, filename);

    await mkdir(uploadDir, { recursive: true });
    await writeFile(filepath, buffer);

    const url = `/uploads/avatars/${filename}`;
    return NextResponse.json({ success: true, url });
  } catch (error: any) {
    console.error("Error subiendo avatar:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
