import http from "node:http";

import { getLogger } from "../../../lib/logger";

const logger = getLogger("HttpServer");

export class HttpServer {
    private constructor(
        private config: IHttpServerConfig,
        public server: http.Server,
    ) {}

    listen() {
        this.server = this.server.listen(this.config.port);
    }

    async close(): Promise<void> {
        this.server.close((err) => {
            if (err !== undefined) {
                logger.warn(`closing error ${err.message}`);
            }
        });
    }

    static new(config: IHttpServerConfig, endpoints: {[key in string]: Endpoint}) {
        const server = http.createServer(async (req, res) => {
            const handler = req.url !== undefined ? endpoints[req.url] ?? null : null;
            if (handler === null) {
                logger.warning(`bad request ${req.method} ${req.url}`);
                res.statusCode = 404;
                res.end();
                return;
            }
            let buffersByteLength = 0;
            const buffers: Uint8Array[] = [];

            for await (const chunk of req) {
                buffers.push(chunk);

                buffersByteLength += (<Uint8Array>chunk).byteLength;
                if (buffersByteLength > config.maxRequestBodySizeBytes) {
                    logger.warning(`request length exceed limit ${config.maxRequestBodySizeBytes} MB`);
                    res.statusCode = 403;
                    res.end();
                    return;
                }
            }

            if (buffersByteLength === 0) {
                logger.warning("http request has 0 length");
                res.statusCode = 403;
                res.end();
                return;
            }

            Object.defineProperties(req, {
                body: JSON.parse(Buffer.concat(buffers).toString()),
            });
            logger.info("run handler");
            await handler(req, res);
        });

        return new HttpServer(config, server);
    }
}

export interface IHttpServerConfig {
    port: number;
    maxRequestBodySizeBytes: number;
}

type Endpoint = (req: http.IncomingMessage, res: http.ServerResponse) => Promise<void>
