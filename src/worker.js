export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // API routes → handled by Worker
    if (url.pathname.startsWith("/api/")) {
      return new Response(JSON.stringify({ message: "API works" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Static assets + SPA fallback will be served automatically
    return env.ASSETS.fetch(request);
  }
}
