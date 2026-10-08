const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { URL } = require("node:url");

const root = path.resolve(__dirname, "..", "dist");
const port = Number(process.env.PORT || 4173);

const types = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".mp4", "video/mp4"],
]);

const server = http.createServer((request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  let target = path.resolve(root, `.${decodeURIComponent(url.pathname)}`);
  if (!isInside(root, target)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    target = path.join(target, "index.html");
  }
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }
  response.writeHead(200, { "content-type": types.get(path.extname(target).toLowerCase()) || "application/octet-stream" });
  fs.createReadStream(target).pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Local: http://127.0.0.1:${port}/`);
});

function isInside(parent, child) {
  const rel = path.relative(parent, child);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}
