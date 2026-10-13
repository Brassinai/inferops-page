---
title: Activate, call, and deactivate
description: Start the runtime, send an OpenAI-compatible request, and release compute while keeping the cache.
order: 21
---

# Activate, call, and deactivate

A deployed model starts in the `Inactive` state. This page shows how to activate it, send a request, and then deactivate it to release the GPU while keeping the cache on disk.

## Activate

```bash
inferops activate qwen-chat
```

Activation is the moment InferOps acquires compute, starts the runtime pod, waits for it to report ready, and enables gateway routing. You can watch the transition:

```bash
inferops status qwen-chat --watch
```

If no GPU is available, the deployment enters `WaitingForGPU` and stays queued. You can change the full-capacity behavior:

```bash
inferops activate qwen-chat --when-full Reject
inferops activate qwen-chat --when-full ReplaceOldest
```

| Policy | Behavior |
| --- | --- |
| `Queue` | Wait for a free slot (default). |
| `Reject` | Fail immediately if no slot is free. |
| `ReplaceOldest` | Evict the oldest active compatible model. |
| `ReplaceLowestPriority` | Evict a lower-priority active model. |

Replacement is always explicit. It has unavoidable downtime on a single GPU because the old runtime must release the device before the new one can start.

## Forward the gateway locally

For local testing, port-forward the gateway Service:

```bash
inferops gateway forward
```

Then call `http://127.0.0.1:8080/models/qwen-chat/v1/chat/completions`.

## Call the model

Once the model is `Active`, send an OpenAI-compatible request through the gateway:

```bash
curl -X POST http://<gateway-host>/models/qwen-chat/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen-chat","messages":[{"role":"user","content":"Hello"}]}'
```

Or use the Python client:

```python
import inferops

client = inferops.Client(base_url="http://<gateway-host>")
resp = client.chat.completions.create(
    model="qwen-chat",
    messages=[{"role": "user", "content": "Hello"}],
)
print(resp.choices[0].message.content)
```

The gateway strips `/models/qwen-chat` and forwards `/v1/...` to the stable `qwen-chat-runtime` Service on port `8000`.

## Deactivate

When you are done serving traffic, deactivate the model:

```bash
inferops deactivate qwen-chat
```

Deactivation:

- Stops admitting new requests.
- Drains in-flight requests up to `drainTimeout`.
- Stops the runtime pod.
- Releases the GPU.
- Keeps the node-local cache intact.

Re-activation later will skip the download because the cache is still ready.

## Delete

To remove the deployment and its managed runtime resources:

```bash
inferops delete qwen-chat
```

This preserves the `ModelCache` and on-disk files. To clean up cache objects explicitly:

```bash
inferops cache list
inferops cache delete <cache-name>
```

## Next steps

- [Operate models day-to-day](/docs/guides/operations/)
- [Read the CLI reference](/docs/reference/cli/)
