import { del, get, put } from "@vercel/blob";
import { promises as fs } from "node:fs";
import path from "node:path";
import { appEnv, isBlobStorageConfigured } from "./env";

export type AttachmentStorageKind = "blob" | "filesystem" | "legacy-db";

export type SavedAttachment = {
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  storageKind: AttachmentStorageKind;
  storageRef: string;
  blobUrl?: string;
  relativePath?: string;
};

const htmlEscapes: Record<string, string> = {
  "\\": "\\\\",
  '"': '\\"',
};

const defaultDataDir = path.join(process.cwd(), "data");

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
}

function buildStoredName(id: string, fileName: string) {
  return `${id}-${sanitizeFileName(fileName)}`;
}

async function ensureAttachmentDir(baseDir: string) {
  const uploadDir = path.join(baseDir, "uploads");
  await fs.mkdir(uploadDir, { recursive: true });
  return uploadDir;
}

function formatContentDisposition(filename: string) {
  const escaped = filename.replace(/[\\"]/g, (character) => htmlEscapes[character] ?? character);
  return `attachment; filename="${escaped}"`;
}

export function normalizeSavedAttachment(value: unknown): SavedAttachment | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const attachment = value as Record<string, unknown>;
  const originalName = typeof attachment.originalName === "string" ? attachment.originalName : null;
  const storedName = typeof attachment.storedName === "string" ? attachment.storedName : null;
  const mimeType = typeof attachment.mimeType === "string" ? attachment.mimeType : null;
  const size = typeof attachment.size === "number" ? attachment.size : null;

  if (!originalName || !storedName || !mimeType || size === null) {
    return null;
  }

  const storageKind =
    attachment.storageKind === "blob" ||
    attachment.storageKind === "filesystem" ||
    attachment.storageKind === "legacy-db"
      ? attachment.storageKind
      : typeof attachment.url === "string"
        ? "blob"
        : typeof attachment.relativePath === "string"
          ? attachment.relativePath === "stored-in-database"
            ? "legacy-db"
            : "filesystem"
          : "legacy-db";

  const storageRef =
    typeof attachment.storageRef === "string"
      ? attachment.storageRef
      : storageKind === "blob"
        ? typeof attachment.pathname === "string"
          ? attachment.pathname
          : typeof attachment.url === "string"
            ? attachment.url
            : ""
        : typeof attachment.relativePath === "string"
          ? attachment.relativePath
          : storageKind === "legacy-db"
            ? "stored-in-database"
            : "";

  if (!storageRef) {
    return null;
  }

  const normalized: SavedAttachment = {
    originalName,
    storedName,
    mimeType,
    size,
    storageKind,
    storageRef,
  };

  if (storageKind === "blob" && typeof attachment.url === "string") {
    normalized.blobUrl = attachment.url;
  }

  if (storageKind !== "blob" && typeof attachment.relativePath === "string") {
    normalized.relativePath = attachment.relativePath;
  }

  return normalized;
}

export async function saveAttachment(
  id: string,
  file: File | null | undefined,
  baseDir = defaultDataDir,
) {
  if (!file || file.size === 0) {
    return null;
  }

  const storedName = buildStoredName(id, file.name);

  if (isBlobStorageConfigured()) {
    const pathname = `attachments/${storedName}`;
    const blob = await put(pathname, file, {
      access: "private",
      addRandomSuffix: false,
      token: appEnv.blobReadWriteToken ?? undefined,
    });

    return {
      originalName: file.name,
      storedName,
      mimeType: file.type,
      size: file.size,
      storageKind: "blob" as const,
      storageRef: blob.pathname,
      blobUrl: blob.url,
    } satisfies SavedAttachment;
  }

  const uploadDir = await ensureAttachmentDir(baseDir);
  const relativePath = path.join("uploads", storedName);
  const absolutePath = path.join(uploadDir, storedName);
  const buffer = Buffer.from(await file.arrayBuffer());

  await fs.writeFile(absolutePath, buffer);

  return {
    originalName: file.name,
    storedName,
    mimeType: file.type,
    size: file.size,
    storageKind: "filesystem" as const,
    storageRef: relativePath,
    relativePath,
  } satisfies SavedAttachment;
}

export async function deleteAttachment(
  attachment: SavedAttachment | null | undefined,
  baseDir = defaultDataDir,
) {
  if (!attachment) {
    return;
  }

  if (attachment.storageKind === "blob") {
    try {
      await del(attachment.blobUrl ?? attachment.storageRef, {
        token: appEnv.blobReadWriteToken ?? undefined,
      });
    } catch (error) {
      console.warn("attachment_blob_delete_failed", {
        storageRef: attachment.storageRef,
        message: error instanceof Error ? error.message : String(error),
      });
    }
    return;
  }

  if (attachment.storageKind === "legacy-db") {
    return;
  }

  const attachmentPath = path.join(baseDir, attachment.relativePath ?? attachment.storageRef);
  try {
    await fs.rm(attachmentPath, { force: true });
  } catch {
    // Best-effort cleanup.
  }
}

export async function createAttachmentDownloadResponse(
  attachment: SavedAttachment | null | undefined,
  legacyDbAttachmentContentBase64?: string | null,
  baseDir = defaultDataDir,
) {
  if (!attachment) {
    return null;
  }

  const headers = new Headers();
  headers.set("X-Content-Type-Options", "nosniff");

  if (attachment.storageKind === "blob") {
    const blob = await get(attachment.blobUrl ?? attachment.storageRef, {
      access: "private",
      useCache: false,
      token: appEnv.blobReadWriteToken ?? undefined,
    });

    if (!blob || blob.statusCode !== 200) {
      return null;
    }

    blob.headers.forEach((value, key) => {
      headers.set(key, value);
    });
    headers.set("Content-Disposition", formatContentDisposition(attachment.originalName));

    return new Response(blob.stream, {
      status: 200,
      headers,
    });
  }

  if (attachment.storageKind === "legacy-db") {
    if (!legacyDbAttachmentContentBase64) {
      return null;
    }

    headers.set("Content-Disposition", formatContentDisposition(attachment.originalName));
    headers.set("Content-Type", attachment.mimeType || "application/octet-stream");
    const buffer = Buffer.from(legacyDbAttachmentContentBase64, "base64");
    headers.set("Content-Length", String(buffer.byteLength));

    return new Response(buffer, {
      status: 200,
      headers,
    });
  }

  const attachmentPath = path.join(baseDir, attachment.relativePath ?? attachment.storageRef);

  try {
    const buffer = await fs.readFile(attachmentPath);
    headers.set("Content-Disposition", formatContentDisposition(attachment.originalName));
    headers.set("Content-Type", attachment.mimeType || "application/octet-stream");
    headers.set("Content-Length", String(buffer.byteLength));

    return new Response(buffer, {
      status: 200,
      headers,
    });
  } catch {
    return null;
  }
}
