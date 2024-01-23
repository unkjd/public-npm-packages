import crypto from "crypto";
import Fastify, { FastifyInstance, FastifyServerOptions } from "fastify";

type ServerOptions = {
  host: string;
  port: number;
  fastifyOptions: FastifyServerOptions;
};

const fastifyDefaultOptions: FastifyServerOptions = {
  logger: {
    level: "info",
  },
  genReqId: () => crypto.randomUUID(),
  trustProxy: true,
};

export class Server {
  readonly options: ServerOptions;
  readonly fastify: FastifyInstance;

  constructor(options: ServerOptions) {
    this.options = {
      ...options,
      fastifyOptions: this.fastifyOptionsWithDefaults(options.fastifyOptions),
    };
    this.fastify = Fastify(this.options.fastifyOptions);
  }

  private fastifyOptionsWithDefaults(fastifyOptions: FastifyServerOptions): FastifyServerOptions {
    return { ...fastifyDefaultOptions, ...fastifyOptions };
  }

  async start() {
    const { host, port } = this.options;
    await this.fastify.listen({ host, port });
  }

  async stop() {
    await this.fastify.close();
  }
}
