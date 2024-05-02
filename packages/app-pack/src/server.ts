import crypto from "crypto";
import Fastify, { FastifyInstance, FastifyServerOptions } from "fastify";
import { sleep } from "@unkjd/utils";
import { installHealthzRoutes } from "./healthz-routes";

export type ReadinessCheckFn = () => Promise<[boolean, string | null]>;

export type ServerOptions = {
  host: string;
  port: number;
  gracefulShutdownDelay?: number;
  fastifyOptions: FastifyServerOptions;
  readinessCheck?: ReadinessCheckFn;
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
  readonly fastify: FastifyInstance;
  readonly abortController = new AbortController();

  constructor(options: ServerOptions) {
    this.config = this.configWithDefaults(options);
    const fastify = Fastify(this.config.fastifyOptions);
    this.fastify = installHealthzRoutes(fastify, this.readinessCheck.bind(this));
  }

  async start() {
    const { host, port } = this.config;
    await this.fastify.listen({ host, port });
  }

  async stop(reason?: string) {
    this.abortController.abort(reason || "shutting down");
    await sleep(this.config.gracefulShutdownDelay);
    await this.fastify.close();
  }

  async readinessCheck(): Promise<[boolean, string | null]> {
    if (this.abortController.signal.aborted) {
      return [false, this.abortController.signal.reason];
    }
    return this.config.readinessCheck();
  }

  private configWithDefaults(options: ServerOptions): ServerConfig {
    return {
      ...options,
      gracefulShutdownDelay: options.gracefulShutdownDelay ?? 1000,
      fastifyOptions: this.fastifyOptionsWithDefaults(options.fastifyOptions),
      readinessCheck: options.readinessCheck ?? (() => Promise.resolve([true, null])),
    };
  }

  private fastifyOptionsWithDefaults(fastifyOptions: FastifyServerOptions): FastifyServerOptions {
    return { ...fastifyDefaultOptions, ...fastifyOptions };
  }
}
