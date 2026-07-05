import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireUser } from "@/lib/session";

const ALLOWED_PREFIXES = ["paprika-imports/", "meal-photos/"];

/**
 * Issues short-lived client tokens for direct browser -> Vercel Blob uploads.
 * This bypasses the ~4.5MB request body limit on serverless functions —
 * the file bytes never pass through our API routes at all.
 */
export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const body = (await req.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        if (!ALLOWED_PREFIXES.some((p) => pathname.startsWith(p))) {
          throw new Error("Invalid upload path");
        }
        return {
          allowedContentTypes: [
            "application/zip",
            "application/x-zip-compressed",
            "application/gzip",
            "application/octet-stream",
            "image/jpeg",
            "image/png",
            "image/webp",
          ],
          addRandomSuffix: true,
          maximumSizeInBytes: 50 * 1024 * 1024, // 50MB
        };
      },
      onUploadCompleted: async () => {
        // No-op: the caller POSTs the resulting blob URL to the relevant
        // processing route itself once the client-side upload resolves.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    console.error("[blob-upload] error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Upload failed" },
      { status: 400 }
    );
  }
}
