---
title: Homelab setup
description: Set up single-node k3s with an NVIDIA GPU for InferOps.
order: 41
---

# Homelab setup

This guide covers a single-node k3s cluster with one NVIDIA GPU, verified on Ubuntu 22.04/24.04.

## Node requirements

- NVIDIA GPU with compute capability 7.0+
- 32GB+ RAM
- 100GB+ NVMe for model cache
- Docker or containerd already running

## 1. Install k3s with NVIDIA runtime

```bash
curl -sfL https://get.k3s.io | sh -s - \
  --kubeconfig-mode 644 \
  --default-runtime nvidia
```

Verify:

```bash
kubectl get nodes -o wide
kubectl describe node <node> | grep -i nvidia
```

## 2. Install the NVIDIA Container Toolkit

If the runtime is not present:

```bash
sudo nvidia-ctk runtime configure --runtime=containerd
sudo systemctl restart k3s
```

## 3. Install the NVIDIA Device Plugin

```bash
kubectl apply -f https://raw.githubusercontent.com/NVIDIA/k8s-device-plugin/v0.17.0/nvidia-device-plugin.yml
```

Verify allocatable GPUs:

```bash
kubectl describe node <node> | grep nvidia.com/gpu
```

## 4. Prepare storage

```bash
sudo install -d -o 65532 -g 65532 -m 0750 /var/lib/inferops/models
df -h /var/lib/inferops/models
```

## 5. Install InferOps

```bash
inferops install --profile homelab \
  --compute-profile nvidia-gpu \
  --cache-path /var/lib/inferops/models \
  --cache-capacity 500Gi
```

## 6. Verify

```bash
inferops doctor
inferops gpu list
```

## 7. Run the acceptance workflow

```bash
scripts/homelab_acceptance.py \
  --manifest examples/yaml-deploy/modeldeployment.yaml \
  --model-name qwen-chat \
  --gateway-url http://<gateway-host> \
  --namespace inferops-system \
  --output homelab-acceptance.md
```

The script validates install, doctor, GPU inventory, deploy, cache, activation, streaming inference, deactivation, GPU release, re-activation, and cache reuse.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `nvidia.com/gpu` not allocatable | Check device plugin logs and `nvidia-smi` on the host. |
| Image pull errors | Verify image tag and registry credentials. |
| Cache download stuck | Check HF token, disk space, and path permissions. |
| Activation stays `WaitingForGPU` | Deactivate another model or use `--when-full ReplaceOldest`. |
| Gateway 503 | Deployment not `Active`; check `inferops status` and operator logs. |

## Next steps

- [Production notes](/docs/platform/production/)
- [Cluster ingress](/docs/platform/ingress/)
