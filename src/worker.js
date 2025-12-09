import { getAssetFromKV } from "@cloudflare/kv-asset-handler";

export default {
  async fetch(request, env, ctx) {

    // --- 静态资产处理逻辑 ---
    try {
      return await getAssetFromKV(
        { request, waitUntil: ctx.waitUntil },
        { ASSET_NAMESPACE: env.__STATIC_CONTENT, ASSET_MANIFEST: env.__STATIC_CONTENT_MANIFEST }
      );
    } catch (e) {
      // 如果资产未找到，可以回退到 Worker 逻辑或 404
      return new Response("Not Found", { status: 404 });
    }
  }
}