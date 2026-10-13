---
title: Autoscaling
description: How InferOps scales runtimes based on pending requests and idle timeouts.
order: 35
---

# Autoscaling

InferOps supports conservative controller-owned scaling on `ModelDeployment.spec.scaling`.

## Scaling fields

```yaml
spec:
  scaling:
    minReplicas: 0
    maxReplicas: 1
    targetPendingRequests: 4
    idleTimeout: 10m
```

- `minReplicas` and `maxReplicas` are hard bounds.
- `targetPendingRequests` uses runtime Prometheus metrics to scale up when pending requests are observed.
- `idleTimeout` scales an active deployment with `minReplicas: 0` down to zero after the runtime reports no pending or running requests for the timeout.

## Pending-request scaling

For vLLM-compatible runtimes, the operator reads `vllm:num_requests_waiting` and `vllm:num_requests_running` from the runtime Service's metrics path. If metrics cannot be scraped, the operator keeps the safe replica floor and records `ScalingMetricsUnavailable` instead of guessing demand.

## GPU capacity cap

GPU workloads are capped by compatible free whole-GPU slots before the runtime Deployment is created or patched. The cap is visible through `status.scaling.capacityLimited` and `status.scaling.reason`.

## External autoscalers

HPA and KEDA are optional integrations, but they must respect the same capacity checks. Scale-from-zero requires an external activation signal or spec update because a zero-replica runtime has no metrics endpoint to scrape.

## Next steps

- [CRD reference](/docs/reference/crds/)
- [Production notes](/docs/platform/production/)
