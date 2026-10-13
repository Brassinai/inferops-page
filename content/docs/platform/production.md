---
title: Production notes
description: Run InferOps in production with RBAC, monitoring, upgrades, and disaster recovery.
order: 42
---

# Production notes

## Cluster requirements

- Kubernetes 1.28+
- NVIDIA device plugin for GPU workloads
- Container runtime with NVIDIA support for GPU workloads
- `local` or `hostPath` storage for node-local cache, or a fast shared filesystem

## Capacity assumptions

- GPU workloads: equal requests and limits for `nvidia.com/gpu`.
- CPU-only: explicit `cpu` and `memory` requests/limits.
- Cache: size to the largest model and plan 2x model size for extraction workspace.

## RBAC

The operator needs:

- Read `ModelDeployment` and write its status.
- Read `ModelRuntime` and write its status.
- Create/read/update `ModelCache` and write its status.
- Create/read/update/delete `Deployment`, `Service`, `ConfigMap`, `Job`, and `PodDisruptionBudget`.
- Get referenced Secrets only.
- Read Nodes for scheduling.
- Emit Events.

The gateway only needs read access to `ModelDeployment` and `Service`; it receives its auth Secret through a projected volume.

## Network

- The gateway exposes the OpenAI-compatible endpoint.
- Helm charts enable NetworkPolicies by default.
- Use Tailscale or an ingress controller for external access; never expose runtime pods directly.
- Set the exact Kubernetes API Service IP and narrow gateway ingress peers as described in [Namespace tenancy](/docs/platform/tenancy/).

## Monitoring

Enable Prometheus Operator integration:

```bash
helm upgrade --install inferops-operator deploy/helm/inferops-operator \
  --set serviceMonitor.enabled=true \
  --set dashboards.enabled=true

helm upgrade --install inferops-gateway deploy/helm/inferops-gateway \
  --set serviceMonitor.enabled=true
```

Key metrics include deployment phase, GPU slots, activation queue depth, cache download duration, gateway request latency, and runtime-native signals such as TTFT and token throughput.

## Upgrades

1. Back up custom resources and referenced Secrets.
2. Run `make verify` and server-side dry-run the new CRDs.
3. Apply CRDs before upgrading the operator; Helm does not upgrade files from `crds/`.
4. Helm upgrade the operator and gateway independently with `--atomic --wait`.
5. Re-activate models explicitly after image changes.

## Known limitations

- GPU slicing is not supported.
- No hosted InferOps control plane; all components run in-cluster.
- Single-GPU replacement has unavoidable downtime.
- Advanced rollouts require spare compatible GPU capacity.
- The self-hosted dashboard is read-only.

## Next steps

- [Backup and disaster recovery](/docs/platform/disaster-recovery/)
- [Namespace tenancy](/docs/platform/tenancy/)
