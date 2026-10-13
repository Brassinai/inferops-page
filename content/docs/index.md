---
title: Overview
description: What InferOps is, why it exists, and how the pieces fit together.
order: 1
---

# Overview

InferOps is a self-hosted orchestration layer for inference servers and runtimes. It makes provisioning, operating, and exposing them simple and effective. We are starting with a Kubernetes-native layer you install into your own cluster to provision runtimes and route their endpoints.

## Why InferOps exists

Running inference on your own hardware should feel as simple as calling an API, but the real work is mostly operational:

- You need the right container runtime, GPU drivers, and device plugin before a model can start.
- Models are large, so downloading weights every time a pod restarts is expensive.
- GPUs are scarce, so you want inactive models to release compute while keeping cached weights ready.
- Endpoints should stay stable across rollouts, drains, and replacements.
- Teams need to share capacity without sharing credentials or accidentally evicting each other.

InferOps handles that operational layer for you. You describe what you want — a model, a runtime, and the resources it needs — and the operator reconciles the rest: cache placement, activation, routing, draining, and status.

## What you can do with InferOps

- **Deploy from Python, YAML, or the CLI.** The same CRD shapes are used everywhere.
- **Keep the data plane in your cluster.** No hosted control plane is required.
- **Run on GPU or CPU.** Choose `vllm`, `sglang`, or the portable `llama-cpp` runtime.
- **Activate and deactivate on demand.** Release GPUs without throwing away cached model state.
- **Expose a stable OpenAI-compatible route.** The gateway keeps `/models/<name>/v1/...` working across pod restarts.
- **Connect to InferCloud later.** Start private, then optionally share approved capacity through a managed federation layer.

## Architecture at a glance

```txt
┌─────────────────────────────────────────────────────────────────┐
│  Python SDK  │  CLI  │  kubectl / YAML                          │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
              Kubernetes API
                       │
                       ▼
           ModelDeployment CRD
                       │
                       ▼
            InferOps operator
                       │
       ┌───────────────┼───────────────┐
       ▼               ▼               ▼
  ModelCache   runtime workload   stable Service
       │               │               │
       └───────────────┴───────────────┘
                       │
                       ▼
            InferOps gateway
                       │
                       ▼
      selected runtime's OpenAI-compatible API
```

## Core concepts

| Concept | What it does |
| --- | --- |
| `ModelDeployment` | Your declaration of a model endpoint: source, runtime, resources, activation policy, and routing. |
| `ModelRuntime` | A reusable runtime contract: image, protocol, port, health, metrics, and arguments. |
| `ModelCache` | A persisted model revision at a node-local location. Deactivation keeps the cache; deletion is explicit. |
| Gateway | The stable client-facing endpoint. It admits traffic only when the model is `Active` and ready. |

## Lifecycle in three commands

```bash
inferops deploy app.py           # declare model, prepare cache, create Service
inferops activate qwen-chat      # acquire compute, start runtime, enable routing
inferops deactivate qwen-chat    # drain traffic, stop runtime, release GPU, keep cache
```

Deploy creates the desired state. Activate runs it. Deactivate pauses it
while keeping the cache warm — so a large model stays on disk without paying
for GPU time when idle.

## Next steps

- [Prepare your cluster](/docs/install/prerequisites/)
- [Install InferOps](/docs/install/install-inferops/)
- [Deploy your first model](/docs/getting-started/first-model/)
