---
title: Backup and disaster recovery
description: Back up and restore InferOps custom resources and model caches.
order: 46
---

# Backup and disaster recovery

InferOps stores desired state in Kubernetes custom resources and model bytes in the configured cache storage. Back up both layers.

## Backup scope

- InferOps CRDs and all `ModelDeployment`, `ModelRuntime`, and `ModelCache` objects.
- Every Secret referenced by `spec.secrets.huggingFaceTokenSecretName` or `ModelCache.spec.secretRef`.
- Helm values and exact image digests.
- Cache data when avoiding a full model re-download is required.

## Logical backup

```bash
set -eu
namespace=default
backup_dir="inferops-backup-$(date -u +%Y%m%dT%H%M%SZ)"
umask 077
mkdir "$backup_dir"

for resource in modelruntimes modelcaches modeldeployments; do
  kubectl get "$resource" -n "$namespace" -o json \
    | python3 scripts/sanitize_kubernetes_export.py \
    > "$backup_dir/$resource.json"
done

kubectl get crd \
  modeldeployments.inference.inferops.dev \
  modelruntimes.inference.inferops.dev \
  modelcaches.inference.inferops.dev \
  -o json \
  | python3 scripts/sanitize_kubernetes_export.py \
  > "$backup_dir/crds.json"

helm get values inferops-operator -n "$namespace" --all -o yaml \
  > "$backup_dir/operator-values.yaml"
helm get values inferops-gateway -n "$namespace" --all -o yaml \
  > "$backup_dir/gateway-values.yaml"
```

Export referenced Secrets separately through your organization's secret backup process.

## Restore order

1. Restore the Kubernetes datastore or create a clean compatible cluster.
2. Install storage classes, GPU device plugins, ingress, and Secret-management controllers.
3. Apply backed-up CRDs, then apply current additive CRD upgrades.
4. Restore referenced Secrets.
5. Install operator and gateway with recorded values and pinned images.
6. Restore node-local cache data when preserving it is required.
7. Restore `ModelRuntime`, then `ModelCache`, then `ModelDeployment` objects.

```bash
kubectl apply -f inferops-backup/crds.json
kubectl apply --server-side -f deploy/manifests/crds

helm upgrade --install inferops-operator ./deploy/helm/inferops-operator \
  --namespace "$namespace" --values inferops-backup/operator-values.yaml \
  --atomic --wait
helm upgrade --install inferops-gateway ./deploy/helm/inferops-gateway \
  --namespace "$namespace" --values inferops-backup/gateway-values.yaml \
  --atomic --wait

kubectl apply -f inferops-backup/modelruntimes.json
kubectl apply -f inferops-backup/modelcaches.json
kubectl apply -f inferops-backup/modeldeployments.json
```

Never restore `status`: controllers must reconstruct it from the recovered cluster.

## Next steps

- [Production notes](/docs/platform/production/)
