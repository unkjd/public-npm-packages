import { FastifyInstance, RouteShorthandOptions } from "fastify";

export type FastifyWithNotReadyStatus = FastifyInstance & { notReadyStatus: string };

export function setNotReadyStatus(fastify: FastifyInstance, reason: string) {
  (fastify as FastifyWithNotReadyStatus).notReadyStatus = reason;
}

export const healthzRouteOpts: RouteShorthandOptions = {
  logLevel: "silent",
};

export function installHealthzRoutes(fastify: FastifyInstance) {
  fastify.decorate("notReadyStatus", "");
  fastify.get("/healthz/readiness", healthzRouteOpts, async (_request, reply) => {
    const status = (fastify as FastifyWithNotReadyStatus).notReadyStatus;
    if (status) {
      return reply.code(503).send({ status });
    }
    return { status: "ok" };
  });

  fastify.get("/healthz/liveness", healthzRouteOpts, async () => {
    return { status: "ok" };
  });
  return fastify as FastifyWithNotReadyStatus;
}
