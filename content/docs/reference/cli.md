---
title: CLI reference
description: Common InferOps CLI commands for installing, deploying, and operating models.
order: 50
---

# CLI reference

All commands target the `default` namespace unless overridden. Use `--namespace`, `--context`, or `--kubeconfig` as needed.

## Global flags

```
--namespace    Kubernetes namespace (default: default)
--context      Kubeconfig context
--kubeconfig   Path to kubeconfig file
--output       text | json | yaml (default: text)
```

## install

Install or upgrade the CRDs, operator, gateway, and packaged runtimes:

```bash
inferops install --profile homelab \
  --cache-path /var/lib/inferops/models \
  --cache-capacity 500Gi
```

For NVIDIA GPU clusters:

```bash
inferops install --profile homelab \
  --compute-profile nvidia-gpu \
  --cache-path /var/lib/inferops/models \
  --cache-capacity 500Gi
```

## deploy

Load an SDK `app.py`, generate manifests, and apply them:

```bash
inferops deploy app.py
inferops deploy app.py --activate
inferops deploy app.py --activate --when-full ReplaceOldest
```

## activate

Start the runtime and route traffic:

```bash
inferops activate qwen-chat
inferops activate qwen-chat --timeout 10m --verbose
inferops activate qwen-chat --when-full Reject
```

## deactivate

Drain traffic, stop the runtime, and release the GPU:

```bash
inferops deactivate qwen-chat
```

## status

Show current phase, conditions, and assigned node:

```bash
inferops status qwen-chat
inferops status qwen-chat --watch --timeout 10m
```

## diagnose

Explain why a deployment is not ready:

```bash
inferops diagnose qwen-chat
inferops diagnose qwen-chat --verbose -o json
```

## logs

Show runtime pod logs:

```bash
inferops logs qwen-chat
inferops logs qwen-chat --tail 100
```

## models

List ModelDeployments:

```bash
inferops models list
inferops models list --output json
```

## endpoints

List stable routes:

```bash
inferops endpoints
```

## cache

List or delete caches:

```bash
inferops cache list
inferops cache delete <cache-name>
```

## gpu

Show GPU capacity and occupancy:

```bash
inferops gpu list
```

## doctor

Run cluster health diagnostics:

```bash
inferops doctor
inferops doctor --check kubernetes-api --check gateway
```

## gateway forward

Forward the gateway Service to localhost:

```bash
inferops gateway forward
inferops gateway forward --namespace inferops-system --local-port 8081
```

## upgrade

Upgrade installed platform images:

```bash
inferops upgrade --namespace inferops-system --tag v0.2.0
```

## uninstall

Remove InferOps platform Helm releases:

```bash
inferops uninstall --namespace inferops-system
```

Add `--crds` to also remove InferOps CRDs and custom resources. Add `--purge-cache-files` only when you intentionally want to delete node-local model files.

## cloud

Connect to InferCloud:

```bash
inferops cloud connect --token <bootstrap-token> --namespace inferops-system
inferops cloud status --namespace inferops-system
inferops cloud disconnect --namespace inferops-system
```

## Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Success |
| `1` | General error |
| `2` | Invalid input / validation failed |
| `3` | Requested Kubernetes resource not found |

Activation failure codes: `10` rejected, `11` failed, `12` timeout, `13` superseded.

## Next steps

- [SDK reference](/docs/reference/sdk/)
- [CRD reference](/docs/reference/crds/)
