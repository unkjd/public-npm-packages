import { FastifyInstance } from "fastify";

export type FastifyWithNotReadyStatus = FastifyInstance & { notReadyStatus: string };

export function setNotReadyStatus(fastify: FastifyInstance, reason: string) {
  (fastify as FastifyWithNotReadyStatus).notReadyStatus = reason;
}

export function installHealthzRoutes(fastify: FastifyInstance) {
  fastify.decorate("notReadyStatus", "");
  fastify.get("/healthz/readiness", async (_request, reply) => {
    const status = (fastify as FastifyWithNotReadyStatus).notReadyStatus;
    if (status) {
      return reply.code(503).send({ status });
    }
    return { status: "ok" };
  });

  fastify.get("/healthz/liveness", async () => {
    return { status: "ok" };
  });
  return fastify as FastifyWithNotReadyStatus;
}
