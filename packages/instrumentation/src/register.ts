/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as opentelemetry from "@opentelemetry/sdk-node";
import { diag, DiagConsoleLogger } from "@opentelemetry/api";
import { getNodeAutoInstrumentations, getResourceDetectorsFromEnv, InstrumentationConfigMap } from "./utils";
import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";

const { UNKJD_METRICS } = process.env;

export type RegisterConfig = {
  instrumentationConfigs?: InstrumentationConfigMap;
  sampler?: opentelemetry.node.Sampler;
};

export function register({ instrumentationConfigs, sampler }: RegisterConfig) {
  diag.setLogger(new DiagConsoleLogger(), opentelemetry.core.getEnv().OTEL_LOG_LEVEL);

  const sdk = new opentelemetry.NodeSDK({
    instrumentations: getNodeAutoInstrumentations(instrumentationConfigs),
    resourceDetectors: getResourceDetectorsFromEnv(),
    sampler,
    metricReader: UNKJD_METRICS ? new PrometheusExporter() : undefined,
  });

  try {
    sdk.start();
    diag.info("OpenTelemetry automatic instrumentation started successfully");
  } catch (error) {
    diag.error(
      "Error initializing OpenTelemetry SDK. Your application is not instrumented and will not produce telemetry",
      error,
    );
  }

  return openTelemetryShutdown;

  function openTelemetryShutdown(): Promise<void> {
    return sdk
      .shutdown()
      .then(() => diag.debug("OpenTelemetry SDK terminated"))
      .catch(error => diag.error("Error terminating OpenTelemetry SDK", error));
  }
}
