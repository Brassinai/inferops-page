---
title: Routing
description: How the InferOps gateway routes requests and handles model lifecycle states.
order: 32
---

# Routing

The InferOps gateway is the stable OpenAI-compatible endpoint. For a `ModelDeployment` named `qwen-chat`, it accepts `/models/qwen-chat/v1/...`, removes `/models/qwen-chat`, and proxies `/v1/...` to the `qwen-chat-runtime` Service on port `8000`.

## When traffic is admitted

The gateway routes only when:

- The deployment phase is `Active`.
- Runtime readiness is true for the current `ModelDeployment` generation.
- Ready replicas exist.
- The operator-owned runtime Service matches the expected selector.
- An EndpointSlice contains a ready, non-terminating endpoint.

It stops admitting new requests as soon as discovery observes `Draining`. Inactive, waiting, activating, draining, and failed models remain addressable at their stable route but receive an explicit lifecycle response.

## Route policy

Each deployment can declare a routing policy:

```yaml
spec:
  routing:
    enabled: true
    path: /models/qwen-chat
    openAICompatible: true
    policy:
      routingStrategy: LeastLoaded
      weight: 100
      rateLimit:
        requestsPerMinute: 600
        burst: 60
      requestLogging:
        enabled: false
```

- `LeastLoaded` sends the next request to the ready backend with the fewest in-flight requests.
- `Weighted` uses smooth weighted round-robin. A weight of `0` keeps a backend discoverable but prevents new traffic.
- `rateLimit` enables a per-gateway-process token bucket. It is not a globally consistent quota.
- `requestLogging` writes sanitized metadata; it never logs bodies or credentials.

## Lifecycle responses

| State | HTTP status | Error code |
| --- | ---: | --- |
| Unknown route | `404` | `model_not_found` |
| Cached / inactive | `409` | `model_inactive` |
| Pending, downloading, or waiting for capacity/GPU | `503` | `model_activating` |
| Activating | `503` | `model_activating` |
| Draining | `503` | `model_draining` |
| Failed, stale, or unready | `503` | `model_unavailable` |
| Runtime connection failure | `502` | `upstream_error` |

`503` responses include `Retry-After`.

## Authentication

Gateway bearer authentication is optional and fails closed. Create a Secret and enable auth in the gateway chart:

```bash
kubectl create secret generic inferops-gateway-token \
  --namespace inferops-system \
  --from-literal=token='<random bearer token>'

helm upgrade --install inferops-gateway ./deploy/helm/inferops-gateway \
  --namespace inferops-system \
  --set auth.enabled=true \
  --set auth.secretName=inferops-gateway-token
```

Clients send `Authorization: Bearer <token>`. The Secret is reloaded on a bounded interval without restarting the gateway.

## Next steps

- [Cluster ingress](/docs/platform/ingress/)
- [CRD reference](/docs/reference/crds/)
