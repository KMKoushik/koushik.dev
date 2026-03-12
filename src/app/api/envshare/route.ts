import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { generateId, storeSecret } from "~/lib/envshare";
import {
  TTL_OPTIONS,
  READ_OPTIONS,
  type CreateSecretRequest,
  type EnvShareSecret,
} from "~/lib/envshare-shared";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateSecretRequest;

    // Validate required fields
    if (!body.encrypted || !body.iv) {
      return NextResponse.json(
        { error: "Missing encrypted content or IV" },
        { status: 400 }
      );
    }

    // Validate TTL
    const validTtl = TTL_OPTIONS.some((opt) => opt.value === body.ttl);
    if (!validTtl) {
      return NextResponse.json({ error: "Invalid TTL value" }, { status: 400 });
    }

    // Validate reads
    const validReads = READ_OPTIONS.some((opt) => opt.value === body.reads);
    if (!validReads) {
      return NextResponse.json(
        { error: "Invalid reads value" },
        { status: 400 }
      );
    }

    const id = generateId();
    const now = Date.now();

    const secret: EnvShareSecret = {
      encrypted: body.encrypted,
      iv: body.iv,
      reads: body.reads,
      createdAt: now,
      expiresAt: now + body.ttl * 1000,
    };

    await storeSecret(id, secret, body.ttl);

    return NextResponse.json({ id });
  } catch (error) {
    console.error("Error creating secret:", error);
    return NextResponse.json(
      { error: "Failed to create secret" },
      { status: 500 }
    );
  }
}
