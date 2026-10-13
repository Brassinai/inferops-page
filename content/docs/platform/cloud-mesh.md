---
title: Cloud mesh connect
description: Connect a self-hosted InferOps cluster to InferCloud.
order: 45
---

# Cloud mesh connect

InferOps can optionally connect a self-hosted cluster to InferCloud through a private mesh endpoint. Local Kubernetes operation remains the source of truth: deployments, caches, runtimes, and gateway routing continue to work without a cloud connection.

## Connect

Use a short-lived bootstrap token from the cloud dashboard:

```bash
inferops cloud connect --token <bootstrap-token> \
  --namespace inferops-system \
  --cluster-name homelab-a
```

For shell-history safety:

```bash
printf '%s' "$INFEROPS_CLOUD_TOKEN" | \
  inferops cloud connect --token-stdin --namespace inferops-system
```

`connect` verifies that InferOps is installed, redeems the token, writes persistent connection state to Kubernetes, enables authenticated mesh gateway exposure, and installs the persistent cloud agent.

## Stored state

| Resource | Contents |
| --- | --- |
| `Secret/inferops-cloud-connection` | provider agent credential |
| `Secret/inferops-gateway-auth` | gateway bearer token used by the mesh-facing gateway |
| `ConfigMap/inferops-cloud-connection` | cloud API URL, account ID, cluster ID, mesh hostname, heartbeat interval |

## Persistent agent

The `inferops-cloud-agent` Helm release runs in-cluster and:

- sends authenticated heartbeats to the cloud API;
- reports deployment counts, offerings, and node capacity evidence;
- scrapes managed runtime metrics when available;
- optionally benchmarks newly discovered active runtimes with `--benchmark-offerings`.

## Status and disconnect

```bash
inferops cloud status --namespace inferops-system
inferops cloud disconnect --namespace inferops-system
```

`disconnect` removes the cloud agent and connection state while preserving the operator, gateway, CRDs, model deployments, and caches.

## Next steps

- [Backup and disaster recovery](/docs/platform/disaster-recovery/)
