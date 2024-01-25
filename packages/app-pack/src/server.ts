import crypto from "crypto";
import Fastify, { FastifyInstance, FastifyServerOptions } from "fastify";
import { sleep } from "@unkjd/utils";
import { FastifyWithNotReadyStatus, installHealthzRoutes, setNotReadyStatus } from "./healthz-routes";

type ServerOptions = {
  host: string;
  port: number;
  gracefulShutdownDelay?: number;
  fastifyOptions: FastifyServerOptions;
};

type ServerConfig = Required<ServerOptions>;

const fastifyDefaultOptions: FastifyServerOptions = {
  logger: {
    level: "info",
  },
  genReqId: () => crypto.randomUUID(),
  trustProxy: true,
};

export class Server {
  readonly config: ServerConfig;
  readonly fastify: FastifyWithNotReadyStatus;
  readonly abortController = new AbortController();

  constructor(options: ServerOptions) {
    this.config = this.configWithDefaults(options);
    const fastify = Fastify(this.config.fastifyOptions);
    this.fastify = installHealthzRoutes(fastify);
  }

  async start() {
    const { host, port } = this.config;
    await this.fastify.listen({ host, port });
  }

  async stop(reason?: string) {
    setNotReadyStatus(this.fastify, reason || "shutting down");
    await sleep(this.config.gracefulShutdownDelay);
    await this.fastify.close();
  }

  private configWithDefaults(options: ServerOptions): ServerConfig {
    return {
      ...options,
      gracefulShutdownDelay: options.gracefulShutdownDelay ?? 1000,
      fastifyOptions: this.fastifyOptionsWithDefaults(options.fastifyOptions),
    };
  }

  private fastifyOptionsWithDefaults(fastifyOptions: FastifyServerOptions): FastifyServerOptions {
    return { ...fastifyDefaultOptions, ...fastifyOptions };
  }
}
