import { getAssetFromKV } from "@cloudflare/kv-asset-handler";

export default {
  async fetch(request, env, ctx) {

    // 1. 尝试获取请求的静态文件 (例如: /style.css, /images/logo.png)
    try {
      return await getAssetFromKV(
        { request, waitUntil: ctx.waitUntil },
        { ASSET_NAMESPACE: env.__STATIC_CONTENT, ASSET_MANIFEST: env.__STATIC_CONTENT_MANIFEST }
      );
    } catch (e) {

      // 2. 捕获错误：如果请求的文件路径在 KV 中不存在 (例如: /about)
      const url = new URL(request.url);

      // 如果是文件找不到，执行回退逻辑
      if (e.name === "NotFoundError") {

        // 3. 执行 SPA 回退：强制 Worker 查找 index.html
        try {
          // mapRequestToAsset 是核心：它修改了请求，使其指向 index.html
          return await getAssetFromKV(
            {
              request,
              waitUntil: ctx.waitUntil,
            },
            {
              ASSET_NAMESPACE: env.__STATIC_CONTENT,
              ASSET_MANIFEST: env.__STATIC_CONTENT_MANIFEST,
              // *** 关键的回退逻辑 ***
              mapRequestToAsset: (req) => new Request(`${url.origin}/index.html`, req),
            }
          );
        } catch (e) {
          // 如果连 index.html 都找不到，则返回 404
          return new Response("Not Found", { status: 404 });
        }
      }

      // 4. 处理其他类型的错误 (如内部服务器错误 500)
      return new Response(e.message || "Internal Server Error", { status: 500 });
    }
  },
};