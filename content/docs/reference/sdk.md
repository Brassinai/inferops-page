---
title: SDK reference
description: Declare models and custom endpoints with the InferOps Python SDK.
order: 51
---

# SDK reference

The Python SDK compiles decorated classes into `ModelDeployment` manifests. The decorated class is metadata only; the runtime image owns inference.

## Install

```bash
pip install inferops
```

## Declare a model

```python
import inferops

app = inferops.App("my-app")

@app.model(name="qwen-chat", model="Qwen/Qwen2.5-7B-Instruct")
class QwenChat:
    pass
```

Generate or deploy:

```bash
inferops generate app.py > manifests.yaml
inferops deploy app.py
inferops deploy app.py --activate
```

## Call the model

```python
client = inferops.Client(base_url="https://api.example.com", api_key="...")

resp = client.chat.completions.create(
    model="qwen-chat",
    messages=[{"role": "user", "content": "Hello"}],
)
```

Or use any OpenAI-compatible HTTP client against `/models/qwen-chat/v1/chat/completions`.

## Custom endpoints

Add app logic around the model:

```python
import inferops

app = inferops.App("my-app")

@app.model(name="qwen-chat", model="Qwen/Qwen2.5-7B-Instruct")
class QwenChat:
    @inferops.web_endpoint(method="POST", path="/chat")
    async def chat(self, request):
        return await self.generate(request["prompt"])

    @inferops.web_endpoint(method="POST", path="/chat/stream")
    async def stream_chat(self, request):
        async for chunk in self.generate_stream(request["prompt"]):
            yield chunk
```

Deploy and activate the model first, then serve the endpoints:

```bash
inferops deploy app.py
inferops activate qwen-chat
inferops serve app.py --gateway-url http://127.0.0.1:8080 --port 9000
```

To run those endpoints inside the cluster:

```bash
inferops deploy-endpoints app.py \
  --image ghcr.io/brassinai/my-endpoint-app:v0.1.0 \
  --build
```

## Decorator options

```python
@app.model(
    name="qwen-chat",
    engine="vllm",               # ModelRuntime ref; default: vllm
    model="Qwen/Qwen2.5-7B-Instruct",
    gpu=1,                        # int = count; str = type; None = CPU-only
    gpu_vendor="nvidia",
    cpu="8",
    memory="32Gi",
    activation="Inactive",        # Inactive | Active
    when_full="Queue",            # Queue | Reject | ReplaceOldest | ReplaceLowestPriority
    priority=50,
    drain_timeout="5m",
    min_replicas=0,
    max_replicas=1,
    max_model_len=4096,
    route_path="/models/qwen-chat",
    openai_compatible=True,
    cache_enabled=True,
    cache_type="nodeLocal",
    cache_size="100Gi",
    cache_path="/var/lib/inferops/models",
    hugging_face_token_secret_name="hf-token",
)
class QwenChat:
    pass
```

Invalid inputs fail before YAML is generated.

## Next steps

- [CRD reference](/docs/reference/crds/)
- [Runtime conformance](/docs/reference/runtime-conformance/)
