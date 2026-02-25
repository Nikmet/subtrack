import { randomUUID } from "node:crypto";

import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

import { DEFAULT_BAN_REASON } from "@/app/constants/auth";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const allowedMimeToExt: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isBanned: true, banReason: true },
  });

  if (user?.isBanned) {
    return NextResponse.json({ error: user.banReason?.trim() || DEFAULT_BAN_REASON }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не передан." }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: "Размер файла должен быть не более 10MB." }, { status: 400 });
  }

  const extension = allowedMimeToExt[file.type];
  if (!extension) {
    return NextResponse.json(
      { error: "Поддерживаются только PNG, JPG, WEBP и SVG." },
      { status: 400 },
    );
  }

  try {
    const fileName = `subscriptions/${userId}/${randomUUID()}.${extension}`;
    const blob = await put(fileName, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type,
    });

    return NextResponse.json({
      url: blob.url,
    });
  } catch (error) {
    console.error("Failed to upload subscription icon to Vercel Blob", error);
    return NextResponse.json(
      {
        error:
          "Не удалось загрузить иконку. Проверьте BLOB_READ_WRITE_TOKEN и подключение Vercel Blob.",
      },
      { status: 500 },
    );
  }
}
