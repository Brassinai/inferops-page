---
title: Prerequisites
description: Set up Kubernetes, container tooling, and storage before installing InferOps.
order: 10
---

# Prerequisites

InferOps runs inside a Kubernetes cluster. Before you install it, you need a working cluster with `kubectl` and `helm`, a container runtime that can run your chosen inference engines, and a node-local path where model caches can be stored.

## Quick checklist

- [ ] A Kubernetes cluster (k3s, OrbStack, kind, minikube, or a managed cluster).
- [ ] `kubectl` configured to talk to the cluster.
- [ ] `helm` 3.15 or newer.
- [ ] A node-local cache directory such as `/var/lib/inferops/models`.
- [ ] For GPU runtimes: NVIDIA drivers, the NVIDIA Container Toolkit, and the NVIDIA Device Plugin.
- [ ] (Optional) A Tailscale tailnet if you want private remote access.

## Choose a cluster

### k3s on a single GPU node

[k3s](https://k3s.io/) is the recommended starting point for a homelab.

1. **Install k3s with the NVIDIA runtime**

```bash
curl -sfL https://get.k3s.io | sh -s - \
  --kubeconfig-mode 644 \
  --default-runtime nvidia
```

2. **Install Helm**

```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

3. **Create the cache directory**

Model caches use a `hostPath` directory. The downloader runs as UID `65532`,
so create the directory with that ownership before installing InferOps.
InferOps will not create a root-owned directory that the downloader cannot
write.

```bash
sudo install -d -o 65532 -g 65532 -m 0750 /var/lib/inferops/models
```

4. **Install the NVIDIA Container Toolkit**

GPU runtimes such as `vllm` and `sglang` need the NVIDIA
Container Toolkit configured for containerd.

```bash
sudo apt-get install -y nvidia-container-toolkit
sudo nvidia-ctk runtime configure --runtime=containerd
sudo systemctl restart k3s
```

5. **Install the NVIDIA Device Plugin**

```bash
kubectl apply -f https://raw.githubusercontent.com/NVIDIA/k8s-device-plugin/v0.17.0/nvidia-device-plugin.yml
```

6. **Verify the GPU is allocatable**

Get the node name first:

```bash
kubectl get nodes -o name
```

Example output:

```text
node/gpu-node-1
```

Then check the GPU resource:

```bash
NODE=$(kubectl get nodes -o jsonpath='{.items[0].metadata.name}')
kubectl describe node "$NODE" | grep nvidia.com/gpu
```

Expected output:

```text
nvidia.com/gpu: 1
```

For a detailed walkthrough, see the [Homelab setup](/docs/platform/homelab/) guide.

### OrbStack (macOS local cluster)

[OrbStack](https://orbstack.dev/) provides a lightweight local Kubernetes cluster for CPU-only smoke tests. macOS does not expose NVIDIA GPUs to the cluster, so use the `llama-cpp` runtime here.

1. **Start the cluster**

```bash
orb start k8s
kubectl config use-context orbstack
```

2. **Install Helm**

```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

3. **Create the cache directory**

Model caches use a `hostPath` directory. The downloader runs as UID `65532`,
so create the directory with that ownership before installing InferOps.
InferOps will not create a root-owned directory that the downloader cannot
write.

```bash
orb sudo install -d -o 65532 -g 65532 -m 0750 /var/lib/inferops/models
```

If that fails, create it from inside the OrbStack node:

```bash
orb sh
sudo install -d -o 65532 -g 65532 -m 0750 /var/lib/inferops/models
exit
```

4. **Install InferOps**

```bash
inferops install \
  --context orbstack \
  --profile homelab \
  --cache-path /var/lib/inferops/models \
  --cache-capacity 2Gi
```

### Other one-node Kubernetes options

You can also use **kind**, **minikube**, or a small **managed cluster**. The requirements are the same: a working Kubernetes API, `kubectl`, `helm`, and a writable node-local path for the cache. GPU passthrough depends on the tool you choose.

## Install kubectl and helm

If you prefer a package manager:

```bash
# macOS
brew install kubectl helm

# Ubuntu/Debian
sudo apt-get install -y kubectl helm
```

Verify:

```bash
kubectl version --client
helm version
```

## (Optional) Tailscale private access

If you want to reach the gateway from outside your local network without public ingress, install the [Tailscale Kubernetes Operator](https://tailscale.com/docs/kubernetes-operator) in your cluster. InferOps can then expose the gateway through a Tailscale Ingress.

## Next step

Once the cluster and storage are ready, [install InferOps](/docs/install/install-inferops/).
