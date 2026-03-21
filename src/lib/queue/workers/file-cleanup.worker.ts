import type { Job } from "bullmq";
import fs from "fs/promises";
import path from "path";
import { db } from "@/lib/db";

async function collectFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const nested = await collectFiles(fullPath);
        files.push(...nested);
      } else {
        files.push(fullPath);
      }
    }
  } catch {
    // Directory may not exist — that's fine
  }
  return files;
}

async function removeEmptyDirs(dir: string): Promise<void> {
  try {
    const entries = await fs.readdir(dir);
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stat = await fs.stat(fullPath);
      if (stat.isDirectory()) {
        await removeEmptyDirs(fullPath);
      }
    }
    const remaining = await fs.readdir(dir);
    if (remaining.length === 0) {
      await fs.rmdir(dir);
    }
  } catch {
    // Ignore errors
  }
}

export default async function fileCleanupProcessor(_job: Job) {
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  const allFiles = await collectFiles(uploadsDir);

  let cleanedCount = 0;

  for (const filePath of allFiles) {
    const relativePath = filePath.replace(path.join(process.cwd(), "public"), "");
    const normalizedUrl = relativePath.replace(/\\/g, "/");

    const record = await db.ticketAttachment.findFirst({
      where: { fileUrl: normalizedUrl },
      select: { id: true },
    });

    if (!record) {
      try {
        await fs.unlink(filePath);
        cleanedCount++;
      } catch {
        console.warn(`[FileCleanup] Could not delete ${filePath}`);
      }
    }
  }

  await removeEmptyDirs(uploadsDir);

  console.log(`Cleaned up ${cleanedCount} orphaned files`);
}
