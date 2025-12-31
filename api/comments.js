import { kv } from "@vercel/kv";

export const config = {
  runtime: "edge", // Use Edge runtime for speed
};

export default async function handler(req) {
  // CORS Headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*", // Replace with specific domain in prod
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // Handle OPTIONS (Preflight)
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);

    // --- GET: Fetch Comments ---
    if (req.method === "GET") {
      const postId = url.searchParams.get("postId");
      if (!postId) {
        return new Response(JSON.stringify({ error: "Missing postId" }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      // Fetch from Redis (Sorted Set: score=timestamp)
      // Range 0 to -1 gets all, assuming acceptable volume. Limit if needed.
      // We store simple JSON strings.
      const comments = await kv.zrange(`comments:${postId}`, 0, -1);

      return new Response(JSON.stringify({ comments }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- POST: Submit Comment ---
    if (req.method === "POST") {
      const body = await req.json();
      const { postId, name, isAnonymous, content, honeypot } = body;

      // Anti-Spam (Honeypot)
      if (honeypot) {
        // Silently succeed
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: corsHeaders,
        });
      }

      // Validation
      if (!postId || !content || content.length < 2 || content.length > 1000) {
        return new Response(JSON.stringify({ error: "Invalid input" }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      // Prepare Comment Object
      const newComment = {
        id: crypto.randomUUID(),
        postId,
        name: isAnonymous ? "Anonymous" : name || "Anonymous",
        isAnonymous: !!isAnonymous,
        body: content.slice(0, 1000), // Enforce limit
        createdAt: new Date().toISOString(),
      };

      // Store in Redis Sorted Set (Score = current timestamp)
      // Key: comments:{postId}
      // Value: JSON string
      const score = Date.now();
      await kv.zadd(`comments:${postId}`, { score, member: newComment });

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
