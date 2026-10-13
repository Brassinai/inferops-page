---
title: CRD reference
description: Field reference for ModelDeployment, ModelRuntime, and ModelCache.
order: 52
---

# CRD reference

API group: `inference.inferops.dev/v1alpha1`. All resources are namespaced.

## Quick reference

```yaml
apiVersion: inference.inferops.dev/v1alpha1
kind: ModelDeployment
metadata:
  name: qwen-chat
spec:
  model:
    name: qwen-chat
    source: huggingface
    repo: Qwen/Qwen2.5-7B-Instruct
    revision: main
  runtime:
    ref: vllm
    maxModelLen: 4096
  resources:
    cpu: "8"
    memory: 32Gi
    gpu:
      count: 1
      vendor: nvidia
  activation:
    desiredState: Inactive
    whenFull: Queue
    priority: 50
    drainTimeout: 5m
  scaling:
    minReplicas: 0
    maxReplicas: 1
  routing:
    enabled: true
    path: /models/qwen-chat
    openAICompatible: true
  cache:
    enabled: true
    type: nodeLocal
    size: 100Gi
    path: /var/lib/inferops/models
  secrets:
    huggingFaceTokenSecretName: hf-token
```

## ModelDeployment

### Required fields

| Field | Description |
| --- | --- |
| `spec.model.repo` | Model identifier, e.g. `Qwen/Qwen2.5-7B-Instruct`. |
| `spec.runtime.ref` | `ModelRuntime` name, e.g. `vllm`, `sglang`, `llama-cpp`. |

### Defaults

| Field | Default |
| --- | --- |
| `model.source` | `huggingface` |
| `model.revision` | `main` |
| `activation.desiredState` | `Inactive` |
| `activation.whenFull` | `Queue` |
| `activation.drainTimeout` | `5m` |
| `scaling.minReplicas` | `0` |
| `scaling.maxReplicas` | `1` |
| `routing.enabled` | `true` |
| `routing.openAICompatible` | `true` |
| `cache.enabled` | `true` |
| `cache.type` | `nodeLocal` |

### Activation policies

| Policy | Behavior |
| --- | --- |
| `Queue` | Wait for a free GPU slot. |
| `Reject` | Fail immediately if no slot is free. |
| `ReplaceOldest` | Evict the oldest active compatible model. |
| `ReplaceLowestPriority` | Evict a lower-priority active model. |

### Phases

| Phase | Meaning |
| --- | --- |
| `Pending` | Accepted, not yet reconciled. |
| `Downloading` | Cache download in progress. |
| `Cached` | Cache ready, inactive. |
| `WaitingForCapacity` | Active desired, no CPU/memory capacity. |
| `WaitingForGPU` | Active desired, no free GPU slot. |
| `Activating` | Runtime starting. |
| `Active` | Ready, routed. |
| `Draining` | Stopping new traffic, finishing in-flight. |
| `Deactivating` | Runtime stopping, releasing capacity. |
| `Failed` | Check conditions and logs. |

### Stable names

For a `ModelDeployment` named `<name>` in namespace `<namespace>`:

- Runtime Service: `<name>-runtime`
- Gateway route: `/models/<name>/v1/...`
- ModelCache: `model-<artifact-hash>-cache`

## ModelRuntime

Reusable runtime definition:

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

Required: `engine`, `protocol`, `defaultImage`, `port`, `healthPath`.

## ModelCache

Tracks one model artifact at one location. Caches are artifact-scoped: two deployments with the same namespace, source, repository, revision, cache root, storage type, and `secretRef` share the same `ModelCache`.

Phases: `Pending`, `Downloading`, `Ready`, `Failed`.

To retry a failed download, set `inferops.dev/retry` to a new non-empty token on the cache object.

## Next steps

- [Runtime conformance](/docs/reference/runtime-conformance/)
- [GPU scheduling](/docs/guides/gpu-scheduling/)
