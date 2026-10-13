---
title: Deploy your first model
description: Declare a model with the Python SDK or YAML and let InferOps reconcile it.
order: 20
---

# Deploy your first model

A `ModelDeployment` captures the model source, runtime, resources, cache, activation policy, and routing shape in one object. You can create it from Python, raw YAML, or the CLI.

## Option A: Python SDK

Create `app.py`:

```python
import inferops

app = inferops.App("quickstart")

@app.model(name="qwen-chat", model="Qwen/Qwen2.5-0.5B-Instruct")
class QwenChat:
    pass
```

Deploy it:

```bash
inferops deploy app.py
```

The SDK generates a `ModelDeployment` manifest and applies it. The operator immediately begins preparing the cache.

## Option B: Raw YAML

Create `qwen.yaml`:

```yaml
apiVersion: inference.inferops.dev/v1alpha1
kind: ModelDeployment
metadata:
  name: qwen-chat
spec:
  model:
    name: qwen-chat
    source: huggingface
    repo: Qwen/Qwen2.5-0.5B-Instruct
    revision: main
  runtime:
    ref: vllm
    maxModelLen: 4096
  resources:
    cpu: "4"
    memory: 16Gi
    gpu:
      count: 1
      vendor: nvidia
  activation:
    desiredState: Inactive
    whenFull: Queue
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
    size: 50Gi
    path: /var/lib/inferops/models
```

Apply it:

```bash
kubectl apply -f qwen.yaml
```

## Option C: CPU-only with llama.cpp

For a cluster without GPUs, use the portable `llama-cpp` runtime and omit the GPU request:

```python
import inferops

app = inferops.App("cpu-quickstart")

@app.model(
    name="cpu-smollm",
    engine="llama-cpp",
    model="jc-builds/SmolLM2-135M-Instruct-Q4_K_M-GGUF",
    gpu=None,
    cpu="4",
    memory="2Gi",
    max_model_len=512,
)
class CPUSmolLM:
    pass
```

```bash
inferops deploy cpu_app.py
```

## Check status

```bash
inferops status qwen-chat
inferops status qwen-chat --watch
```

The deployment moves through phases such as `Pending`, `Downloading`, `Cached`, and eventually `Active` after you activate it. While it is `Inactive`, no GPU is used and no runtime pod is running.

## Common phases

| Phase | Meaning |
| --- | --- |
| `Cached` | Cache is ready; the model is inactive and uses no compute. |
| `WaitingForGPU` | Activation requested, but no compatible GPU slot is free. |
| `Activating` | Runtime pod is starting and loading the model. |
| `Active` | Ready for traffic. |
| `Failed` | Check `inferops logs` and `inferops diagnose`. |

## Next step

[Activate the model and send a request](/docs/getting-started/lifecycle/).
