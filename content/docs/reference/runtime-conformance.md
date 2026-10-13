---
title: Runtime conformance
description: The contract every InferOps runtime adapter must satisfy.
order: 53
---

# Runtime conformance

Every InferOps runtime adapter must expose the same observable contract so the operator and gateway can treat engines as interchangeable.

## Contract

| Behavior | Requirement |
| --- | --- |
| Protocol | OpenAI-compatible HTTP under `/v1`. |
| Liveness | `ModelRuntime.spec.healthPath` returns `2xx`. |
| Readiness | `readinessPath` returns `2xx` only when the model accepts traffic. |
| Metrics | `metricsPath` returns Prometheus text. |
| Models | `GET /v1/models` advertises the configured model name. |
| Inference | Non-streaming and incrementally flushed streaming chat completions. |
| Errors | OpenAI `error` envelope for an unknown model. |
| Lifecycle | Container entrypoint uses `exec`; server handles `SIGTERM` within the pod grace period. |

## Running the suite

Run a runtime locally or port-forward its Service, then execute:

```bash
make runtime-conformance \
  RUNTIME_BASE_URL=http://127.0.0.1:8000 \
  RUNTIME_MODEL=<served-model-name>
```

The suite checks liveness, readiness, Prometheus output, model discovery, non-streaming completions, and streaming SSE termination. It never prints request bodies or credentials.

## Packaged runtime profiles

| Runtime | Health | Readiness | Metrics |
| --- | --- | --- | --- |
| vLLM | `/health` | `/health` | `/metrics` |
| SGLang | `/health` | `/health_generate` | `/metrics` |
| llama.cpp | `/health` | `/health` | `/metrics` |

Do not mark a new runtime image supported solely because its container starts. Run the suite against the exact immutable image and model format that will be published.

## Next steps

- [Runtimes](/docs/guides/runtimes/)
- [Production notes](/docs/platform/production/)
