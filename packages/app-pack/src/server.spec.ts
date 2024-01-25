import { describe, expect, test } from "@jest/globals";
import { Server } from "./server";
import exp from "constants";

describe("Server", () => {
  test("should start and stop", async () => {
    const server = createServer();
    await server.start();
    await server.stop();
  });

  test("should start and stop with custom graceful shutdown delay", async () => {
    const delay = 500;
    const server = createServer({ gracefulShutdownDelay: delay });
    await server.start();
    const now = Date.now();
    expect(await server.fastify.inject("/healthz/readiness")).toMatchObject({ statusCode: 200 });
    await Promise.all([server.stop(), testHealthzEndpointsDuringShutdown(server)]);
    expect(Date.now() - now).toBeGreaterThanOrEqual(delay);
  });

  function createServer(opts = {}) {
    return new Server({
      host: "localhost",
      port: 0,
      gracefulShutdownDelay: 0,
      fastifyOptions: { logger: { level: "error" } },
      ...opts,
    });
  }

  async function testHealthzEndpointsDuringShutdown(server: Server) {
    expect(await server.fastify.inject("/healthz/readiness")).toMatchObject({ statusCode: 503 });
    expect(await server.fastify.inject("/healthz/liveness")).toMatchObject({ statusCode: 200 });
  }
});
