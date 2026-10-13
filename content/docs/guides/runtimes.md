---
title: Runtimes
description: Choose and configure an InferOps ModelRuntime for your inference engine.
order: 31
---

# Runtimes

InferOps does not hard-code an engine. It relies on a `ModelRuntime` contract that declares the image, protocol, port, health path, metrics path, command, arguments, and environment. A `ModelDeployment` selects a runtime by reference.

## Packaged runtimes

InferOps ships with these runtime definitions:

| Runtime | Compute path | Notes |
| --- | --- | --- |
| `vllm` | NVIDIA GPU | Default packaged runtime; OpenAI-compatible LLM serving. |
| `sglang` | NVIDIA GPU | Specialized serving engine; readiness uses `/health_generate`. |
| `llama-cpp` | Portable CPU | Local testing and small GGUF models. |

The SDK defaults to `vllm`. Select another with `engine=` or `spec.runtime.ref`.

## Runtime contract

A conforming `ModelRuntime` looks like this:

```yaml
apiVersion: inference.inferops.dev/v1alpha1
kind: ModelRuntime
metadata:
  name: vllm
spec:
  engine: vllm
  protocol: openai
  defaultImage: ghcr.io/brassinai/inferops-runtime:vllm
  port: 8000
  healthPath: /health
  readinessPath: /health
  metricsPath: /metrics
```

The operator translates a `ModelDeployment` into that container contract. Runtime-specific adapters keep the same stable Service, gateway route, readiness, drain, status, and lifecycle contracts while using engine-specific images, arguments, and model formats.

## CPU vs GPU

CPU-only workloads omit `spec.resources.gpu`. GPU workloads include it explicitly:

```yaml
resources:
  cpu: "8"
  memory: 32Gi
  gpu:
    count: 1
    vendor: nvidia
```

CPU-only is a compute selection, not a reduced feature tier. Caching, activation, deactivation, scaling, routing, health checks, metrics, draining, and stable endpoints behave the same.

## Custom runtime images

You can override the image on a deployment:

```yaml
spec:
  runtime:
    ref: vllm
    image: registry.example.com/vllm:v0.2.0
```

The image must include a tag or digest. Mutable `:latest` is rejected.

## Next steps

- [Runtime conformance](/docs/reference/runtime-conformance/)
- [CRD reference](/docs/reference/crds/)
