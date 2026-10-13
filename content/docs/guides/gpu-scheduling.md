---
title: GPU scheduling
description: How InferOps reserves whole GPUs and handles cache locality.
order: 34
---

# GPU scheduling

InferOps reserves whole Kubernetes extended resources before creating a runtime Deployment. Kubernetes and the vendor device plugin still perform the final physical device assignment.

## Eligibility and ordering

A candidate node must:

- Be `Ready` and schedulable.
- Match `scheduling.gpuNodeSelector` if set.
- Advertise enough allocatable vendor GPU resources.
- Match `resources.gpu.type` through `scheduling.gpuTypeLabel` when a type is requested.
- Contain the deployment's verified node-local cache.

Reservations include `Activating` and `Active` ModelDeployments. The controller also inspects managed runtime Deployments so a status-write interruption cannot make an existing GPU workload invisible.

Candidates are ordered by ready cache locality, unreserved capacity, and then node name. With node-local caches, locality is a hard constraint.

## Full-capacity behavior

- `Queue` sets `WaitingForGPU` and retries through controller backoff.
- `Reject` sets `Failed` with reason `InsufficientGPUCapacity`.
- `ReplaceOldest` and `ReplaceLowestPriority` opt into deterministic single-GPU replacement with rollback on failure.

`ReplaceLowestPriority` only displaces a workload with strictly lower priority. Replacement candidates are namespace-scoped.

## Helm configuration

```yaml
scheduling:
  gpuNodeSelector:
    inferops.dev/gpu-node: "true"
  gpuTypeLabel: inferops.dev/gpu-type
```

Label typed nodes explicitly:

```bash
kubectl label node gpu-node-1 inferops.dev/gpu-node=true
kubectl label node gpu-node-1 inferops.dev/gpu-type=a100
```

Do not enable device-plugin sharing or time slicing when relying on the exclusive whole-slot model.

## Rollout capacity validation

`Rolling`, `BlueGreen`, and `Canary` rollouts are blocked unless the cache-local node has enough compatible slots for the old runtime plus the configured surge. `Queue` leaves the current runtime serving and reports `RolloutWaitingForCapacity`; `Reject` reports `RolloutRejected`.

Single-GPU replacement is not an implicit fallback for advanced rollouts.

## Next steps

- [Autoscaling](/docs/guides/autoscaling/)
- [Production notes](/docs/platform/production/)
