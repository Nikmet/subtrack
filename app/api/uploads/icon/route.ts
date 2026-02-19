import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { auth } from "@/auth";

export const runtime = "nodejs";

const allowedMimeToExt: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не передан." }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: "Размер файла должен быть не более 2MB." }, { status: 400 });
  }

  const extension = allowedMimeToExt[file.type];
  if (!extension) {
    return NextResponse.json(
      { error: "Поддерживаются только PNG, JPG, WEBP и SVG." },
      { status: 400 },
    );
  }

  const uploadDir = join(process.cwd(), "public", "uploads", "subscriptions");
  await mkdir(uploadDir, { recursive: true });

  const fileName = `${randomUUID()}.${extension}`;
  const filePath = join(uploadDir, fileName);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, bytes);

  return NextResponse.json({
    url: `/uploads/subscriptions/${fileName}`,
  });
}

