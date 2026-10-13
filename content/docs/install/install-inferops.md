---
title: Install InferOps
description: Install the InferOps CLI, CRDs, operator, gateway, and packaged runtimes.
order: 11
---

# Install InferOps

The fastest way to install InferOps is with the `inferops` CLI. It applies the CRDs, installs the operator and gateway with Helm, and registers the packaged `vllm`, `sglang`, and `llama-cpp` runtimes.

## Install the CLI

```bash
curl -fsSL https://get.inferops.dev | sh
```

The CLI uses your local `kubectl` and `helm` to talk to the cluster. All commands target the `default` namespace unless you pass `--namespace`, `--context`, or `--kubeconfig`.

## Install into a homelab

```bash
inferops install --profile homelab \
  --cache-path /var/lib/inferops/models \
  --cache-capacity 500Gi
```

What this does:

- Applies the packaged CRDs with server-side apply.
- Installs or upgrades the `inferops-operator` Helm release.
- Installs or upgrades the `inferops-gateway` Helm release.
- Registers packaged `ModelRuntime` definitions.
- Annotates cache-capable nodes with `inferops.dev/cache-capacity`.

The default profile is CPU-safe and works for the `llama-cpp` CPU path. For NVIDIA GPU clusters, make the assumption explicit:

```bash
inferops install --profile homelab \
  --compute-profile nvidia-gpu \
  --cache-path /var/lib/inferops/models \
  --cache-capacity 500Gi
```

## Equivalent Helm commands

If you prefer to run Helm directly:

```bash
kubectl apply --server-side -f ./deploy/manifests/crds

helm upgrade --install inferops-operator ./deploy/helm/inferops-operator \
  --namespace default \
  --values ./deploy/helm/inferops-operator/values-homelab.yaml

helm upgrade --install inferops-gateway ./deploy/helm/inferops-gateway \
  --namespace default \
  --values ./deploy/helm/inferops-gateway/values-homelab.yaml
```

## Verify the installation

```bash
kubectl get pods
kubectl get modelruntime
inferops doctor
inferops gpu list
```

`inferops doctor` runs a set of health checks covering Kubernetes API access, device plugins, GPU capacity, cache path reachability, runtime classes, gateway readiness, and Tailscale status when configured.

## Tailscale private access

After the Tailscale Kubernetes Operator is installed, expose the gateway privately:

```bash
inferops install --profile homelab \
  --cache-path /var/lib/inferops/models \
  --cache-capacity 500Gi \
  --tailscale-hostname inferops
```

## What InferOps does not install

InferOps does not install or guess:

- k3s or any Kubernetes distribution
- Host NVIDIA drivers or the NVIDIA Container Toolkit
- The NVIDIA Device Plugin
- The Tailscale Kubernetes Operator or tailnet credentials
- Ingress controllers, load balancers, or DNS

These prerequisites must already be present and verified on the cluster.

## Next step

[Deploy your first model](/docs/getting-started/first-model/).
