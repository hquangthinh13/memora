// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.4";

type DeleteRequestBody = {
  deckId?: string;
  publicId?: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function getRequiredEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

async function sha1Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-1", bytes);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function destroyCloudinaryImage(publicId: string) {
  const cloudName = getRequiredEnv("CLOUDINARY_CLOUD_NAME");
  const apiKey = getRequiredEnv("CLOUDINARY_API_KEY");
  const apiSecret = getRequiredEnv("CLOUDINARY_API_SECRET");
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const invalidate = "true";
  const signature = await sha1Hex(
    `invalidate=${invalidate}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`,
  );
  const body = new URLSearchParams({
    public_id: publicId,
    timestamp,
    api_key: apiKey,
    invalidate,
    signature,
  });

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  );
  const payload = await response.json().catch(() => null);

  if (!response.ok || payload?.result === "error") {
    const message =
      typeof payload?.error?.message === "string"
        ? payload.error.message
        : "Cloudinary deletion failed.";
    throw new Error(message);
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization) {
      return jsonResponse({ error: "Missing authorization header." }, 401);
    }

    const supabaseUrl = getRequiredEnv("SUPABASE_URL");
    const anonKey = getRequiredEnv("SUPABASE_ANON_KEY");
    const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { deckId, publicId } = (await request.json()) as DeleteRequestBody;

    if (!deckId || !publicId) {
      return jsonResponse({ error: "deckId and publicId are required." }, 400);
    }

    if (!publicId.startsWith("memora/deck/")) {
      return jsonResponse({ error: "Only deck cover images can be deleted." }, 400);
    }

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: "Unauthorized." }, 401);
    }

    const { data: deck, error: deckError } = await adminClient
      .from("decks")
      .select("id, owner_id, cover_image_public_id")
      .eq("id", deckId)
      .maybeSingle();

    if (deckError) throw deckError;

    let canDelete = deck?.owner_id === user.id;

    if (!canDelete) {
      const { data: collaborator, error: collaboratorError } = await adminClient
        .from("deck_collaborators")
        .select("id")
        .eq("deck_id", deckId)
        .eq("user_id", user.id)
        .eq("status", "accepted")
        .in("role", ["owner", "editor"])
        .maybeSingle();

      if (collaboratorError) throw collaboratorError;
      canDelete = Boolean(collaborator);
    }

    if (!canDelete) {
      return jsonResponse({ error: "You do not have permission to delete this image." }, 403);
    }

    await destroyCloudinaryImage(publicId);

    return jsonResponse({ success: true });
  } catch (error) {
    console.error(error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Could not delete image." },
      500,
    );
  }
});
