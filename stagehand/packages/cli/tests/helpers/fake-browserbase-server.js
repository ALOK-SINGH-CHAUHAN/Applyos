import { createServer, } from "node:http";
export async function startFakeBrowserbaseServer(handler) {
    const requests = [];
    const server = createServer(async (request, response) => {
        const bodyBuffer = await readBody(request);
        const bodyText = bodyBuffer.toString("utf8");
        let jsonBody;
        if (bodyText) {
            try {
                jsonBody = JSON.parse(bodyText);
            }
            catch {
                jsonBody = undefined;
            }
        }
        const captured = {
            method: request.method ?? "GET",
            path: request.url ?? "/",
            headers: request.headers,
            bodyBuffer,
            bodyText,
            jsonBody,
        };
        requests.push(captured);
        await handler(captured, response);
    });
    await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", () => resolve());
    });
    const address = server.address();
    return {
        baseUrl: `http://127.0.0.1:${address.port}`,
        requests,
        close: async () => {
            await new Promise((resolve, reject) => {
                server.close((error) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve();
                });
            });
        },
    };
}
async function readBody(request) {
    const chunks = [];
    for await (const chunk of request) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
}
export function jsonResponse(response, statusCode, body) {
    response.writeHead(statusCode, {
        "content-type": "application/json",
    });
    response.end(JSON.stringify(body));
}
export function textResponse(response, statusCode, body) {
    response.writeHead(statusCode, {
        "content-type": "text/plain",
    });
    response.end(body);
}
export function binaryResponse(response, statusCode, body, contentType = "application/octet-stream") {
    response.writeHead(statusCode, {
        "content-type": contentType,
    });
    response.end(body);
}
