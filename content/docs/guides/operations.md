---
title: Operations
description: Activate, deactivate, inspect, and troubleshoot InferOps models.
order: 30
---

# Operations

Once models are deployed, the day-to-day work is activating and deactivating capacity, inspecting status, reading logs, and managing cache.

## Activation and deactivation

```bash
inferops activate qwen-chat
inferops activate qwen-chat --timeout 10m --verbose
inferops deactivate qwen-chat
```

Activation waits up to five minutes by default. Use `--timeout` to extend that, or `--no-wait` to return immediately after the Kubernetes patch is accepted.

## Status and diagnosis

```bash
inferops status qwen-chat
inferops status qwen-chat --watch --timeout 10m
inferops diagnose qwen-chat
inferops diagnose qwen-chat --verbose -o json
```

`diagnose` is read-only and deployment-specific. It inspects the `ModelDeployment`, related `ModelCache`, cache download Jobs/Pods, runtime Deployment, logs, events, Service routing, and node GPU signals, then prints a focused incident report with suggested fixes.

## Logs

```bash
inferops logs qwen-chat
inferops logs qwen-chat --tail 100
```

## Listing models, endpoints, and cache

```bash
inferops models list
inferops endpoints
inferops cache list
inferops gpu list
```

`inferops cache list` shows whether each cache is `mode=shared` (artifact-scoped and reusable across deployments) or `mode=legacy` (older deployment-scoped records). `inferops gpu list` reports GPU capacity, occupancy, and availability per node.

## Cache management

Delete a `ModelCache` object when it is no longer needed:

```bash
inferops cache delete <cache-name>
```

The command refuses if the cache is referenced by a live deployment or mounted by a live Pod. Use `--force` only when you understand the risk.

Cache deletion removes the Kubernetes object, not the on-disk files. Host filesystem cleanup is intentionally left to the cache controller.

## Doctor

```bash
inferops doctor
inferops doctor --check kubernetes-api --check gateway
```

`doctor` validates:

- Kubernetes API connectivity
- Device plugin readiness
- GPU capacity
- Cache path reachability
- Runtime class definitions
- Gateway readiness
- Tailscale ingress when configured

## Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Success |
| `1` | General error |
| `2` | Invalid input |
| `3` | Requested resource not found |

Activation also uses stable exit codes: `10` rejected, `11` failed, `12` timeout, `13` superseded.

## Next steps

- [Runtimes](/docs/guides/runtimes/)
- [GPU scheduling](/docs/guides/gpu-scheduling/)
- [CLI reference](/docs/reference/cli/)
