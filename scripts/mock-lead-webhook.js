const http = require("node:http");

const port = Number(process.env.MOCK_LEAD_PORT || 8787);

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders());
    res.end();
    return;
  }
  if (req.method !== "POST" || req.url.split("?")[0] !== "/leads") {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8", ...corsHeaders() });
    res.end("Not found");
    return;
  }
  let body = "";
  req.setEncoding("utf8");
  req.on("data", (chunk) => { body += chunk; });
  req.on("end", () => {
    console.log("--- lead received ---");
    try {
      console.log(JSON.stringify(JSON.parse(body), null, 2));
    } catch {
      console.log(body);
    }
    res.writeHead(200, { "content-type": "application/json; charset=utf-8", ...corsHeaders() });
    res.end(JSON.stringify({ ok: true }));
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Mock lead webhook: http://127.0.0.1:${port}/leads`);
});

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type, x-source",
  };
}
