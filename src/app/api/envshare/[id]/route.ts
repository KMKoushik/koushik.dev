import { NextResponse } from "next/server";
import { getSecret, decrementReads } from "~/lib/envshare";
import type { GetSecretResponse } from "~/lib/envshare";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const secret = await getSecret(id);
    if (!secret) {
      return NextResponse.json(
        { error: "Secret not found or expired" },
        { status: 404 }
      );
    }

    // Decrement read count (this may delete the secret if reads hit 0)
    const remainingReads = await decrementReads(id);

    const response: GetSecretResponse = {
      encrypted: secret.encrypted,
      iv: secret.iv,
      reads: remainingReads ?? 0,
      expiresAt: secret.expiresAt,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error retrieving secret:", error);
    return NextResponse.json(
      { error: "Failed to retrieve secret" },
      { status: 500 }
    );
  }
}
