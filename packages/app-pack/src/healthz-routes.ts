import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { ReadinessCheckFn } from "./server";

export const healthzRouteOpts: RouteShorthandOptions = {
  logLevel: "silent",
};

export function installHealthzRoutes(fastify: FastifyInstance, readinessCheckFn: ReadinessCheckFn) {
  fastify.get("/healthz/readiness", healthzRouteOpts, async (_request, reply) => {
    const [isReady, reason] = await readinessCheckFn();
    if (!isReady) {
      return reply.code(503).send({ status: "not ready", reason: reason });
    }
    return { status: "ok" };
  });

  fastify.get("/healthz/liveness", healthzRouteOpts, async () => {
    return { status: "ok" };
  });
  return fastify;
}
