---
title: Namespace tenancy
description: Share InferOps across teams using namespaces, RBAC, and NetworkPolicy.
order: 44
---

# Namespace tenancy

InferOps uses Kubernetes namespaces as its tenancy boundary. Every `ModelDeployment`, `ModelCache`, runtime workload, Service, gateway, credential reference, and replacement candidate stays in one namespace.

## Recommended layout

- Install the CRDs and operator once in a platform namespace such as `inferops-system`.
- Create one namespace and one gateway release per team.
- Create approved `ModelRuntime` objects in each team namespace.
- Bind an identity-provider group to the generated team Role.
- Size `ResourceQuota` values from actual GPU, CPU, memory, and cache budgets.
- Keep model credentials in same-namespace Secrets.

## Team gateway values

The gateway chart can create namespace-scoped access, quota, and limit ranges:

```yaml
tenancy:
  access:
    enabled: true
    subjects:
      - kind: Group
        apiGroup: rbac.authorization.k8s.io
        name: inference-team-a
    allowModelRuntimeWrite: false
    allowCacheDelete: false
  quota:
    enabled: true
    hard:
      pods: "20"
      requests.cpu: "16"
      requests.memory: 64Gi
      limits.cpu: "32"
      limits.memory: 128Gi
      requests.nvidia.com/gpu: "2"
      limits.nvidia.com/gpu: "2"
      count/modeldeployments.inference.inferops.dev: "10"
      count/modelcaches.inference.inferops.dev: "20"
```

Install:

```bash
helm upgrade --install team-a-gateway deploy/helm/inferops-gateway \
  --namespace team-a \
  --create-namespace \
  --values team-a-values.yaml \
  --atomic --wait
```

## Network isolation

The operator and gateway charts create NetworkPolicies by default:

- The gateway accepts traffic only on its HTTP port.
- The gateway may reach same-namespace runtime pods, cluster DNS, and the Kubernetes API.
- Runtime pods accept traffic from their namespace gateway and have no egress.
- The operator exposes only metrics, health, and webhook ports.

Before installation, replace `networkPolicy.gateway.apiServerCIDRs` and `networkPolicy.apiServerCIDRs` with the exact Kubernetes API Service IP exposed to Pods as `KUBERNETES_SERVICE_HOST`.

## Audit trail

Use individual User or identity-provider Group subjects so Kubernetes audit events retain the actor. Lifecycle changes use the `inferops-cli` field manager, and the operator emits namespaced Events for major transitions.

## Next steps

- [Production notes](/docs/platform/production/)
- [Backup and disaster recovery](/docs/platform/disaster-recovery/)
