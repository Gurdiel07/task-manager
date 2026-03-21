import { mkdir, unlink, writeFile } from "fs/promises";
import { join } from "path";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { getSessionUser, userSummarySelect } from "@/lib/ticket-api";

type TicketRouteContext = {
  params: Promise<{ id: string }>;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  "application/json",
  "application/xml",
  "text/xml",
  "application/zip",
  "application/x-tar",
  "application/gzip",
  "application/x-gzip",
]);

export async function GET(_request: Request, context: TicketRouteContext) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", {
      status: 401,
      message: "You must be signed in to view attachments",
    });
  }

  try {
    const { id } = await context.params;

    const ticket = await db.ticket.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });

    if (!ticket) {
      return apiError("Not found", {
        status: 404,
        message: "Ticket not found",
      });
    }

    const attachments = await db.ticketAttachment.findMany({
      where: { ticketId: id },
      include: {
        uploadedBy: {
          select: userSummarySelect,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(attachments);
  } catch (error) {
    console.error("Failed to fetch attachments:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to fetch ticket attachments",
    });
  }
}

export async function POST(request: Request, context: TicketRouteContext) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", {
      status: 401,
      message: "You must be signed in to upload attachments",
    });
  }

  try {
    const { id } = await context.params;

    const ticket = await db.ticket.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });

    if (!ticket) {
      return apiError("Not found", {
        status: 404,
        message: "Ticket not found",
      });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return apiError("Bad request", {
        status: 400,
        message: "No file provided",
      });
    }

    if (file.size > MAX_FILE_SIZE) {
      return apiError("Bad request", {
        status: 400,
        message: "File size exceeds the 10 MB limit",
      });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return apiError("Bad request", {
        status: 400,
        message: `File type "${file.type}" is not allowed`,
      });
    }

    const uuid = crypto.randomUUID();
    const safeOriginalName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storedFileName = `${uuid}-${safeOriginalName}`;

    const uploadDir = join(process.cwd(), "public", "uploads", id);
    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    await writeFile(join(uploadDir, storedFileName), Buffer.from(bytes));

    const fileUrl = `/uploads/${id}/${storedFileName}`;

    const attachment = await db.ticketAttachment.create({
      data: {
        ticketId: id,
        uploadedById: user.id,
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        mimeType: file.type,
      },
      include: {
        uploadedBy: {
          select: userSummarySelect,
        },
      },
    });

    return apiSuccess(attachment, { status: 201 });
  } catch (error) {
    console.error("Failed to upload attachment:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to upload attachment",
    });
  }
}

export async function DELETE(request: Request, context: TicketRouteContext) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", {
      status: 401,
      message: "You must be signed in to delete attachments",
    });
  }

  try {
    const { id } = await context.params;
    const url = new URL(request.url);
    const attachmentId = url.searchParams.get("attachmentId");

    if (!attachmentId) {
      return apiError("Bad request", {
        status: 400,
        message: "attachmentId is required",
      });
    }

    const attachment = await db.ticketAttachment.findFirst({
      where: { id: attachmentId, ticketId: id },
    });

    if (!attachment) {
      return apiError("Not found", {
        status: 404,
        message: "Attachment not found",
      });
    }

    if (
      attachment.uploadedById !== user.id &&
      user.role !== "ADMIN" &&
      user.role !== "MANAGER"
    ) {
      return apiError("Forbidden", {
        status: 403,
        message: "You don't have permission to delete this attachment",
      });
    }

    try {
      const filePath = join(process.cwd(), "public", attachment.fileUrl);
      await unlink(filePath);
    } catch {
      // File may already be missing from disk; proceed with DB cleanup
    }

    await db.ticketAttachment.delete({ where: { id: attachmentId } });

    return apiSuccess(null, { message: "Attachment deleted successfully" });
  } catch (error) {
    console.error("Failed to delete attachment:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to delete attachment",
    });
  }
}
