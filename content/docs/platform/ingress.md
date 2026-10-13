---
title: Cluster ingress
description: Expose the InferOps gateway with Ingress, Gateway API, LoadBalancer, or Tailscale.
order: 43
---

# Cluster ingress

InferOps keeps the gateway workload independent of the cluster's north-south traffic implementation. The gateway chart can expose the same HTTP Service through Ingress, Gateway API, or a LoadBalancer Service. The default remains `ClusterIP`.

## Support matrix

| Target | InferOps resource | Required cluster component |
| --- | --- | --- |
| NGINX | `networking.k8s.io/v1` Ingress | NGINX `IngressClass` |
| Traefik | `networking.k8s.io/v1` Ingress | Traefik `IngressClass` |
| Istio | `gateway.networking.k8s.io/v1` HTTPRoute | Gateway API CRDs, Istio, and an accepting Gateway |
| Managed load balancer | `v1` LoadBalancer Service | A Service load-balancer implementation |
| Homelab private access | Tailscale Ingress | Tailscale Kubernetes Operator |

## Standard Ingress

Create the gateway bearer-token Secret first:

```bash
kubectl create secret generic inferops-gateway-token \
  --namespace inferops-system \
  --from-literal=token='<random bearer token>'
```

Then install with the CLI:

```bash
inferops install \
  --namespace inferops-system \
  --exposure ingress \
  --ingress-class nginx \
  --ingress-hostname models.example.com \
  --gateway-auth-secret inferops-gateway-token
```

## Gateway API and Istio

```bash
inferops install \
  --namespace inferops-system \
  --exposure gateway-api \
  --gateway-name public \
  --gateway-hostname models.example.com \
  --gateway-auth-secret inferops-gateway-token
```

InferOps creates an `HTTPRoute` attached to an existing Gateway. The parent Gateway must allow routes from the InferOps namespace.

## LoadBalancer Services

```bash
inferops install \
  --namespace inferops-system \
  --exposure load-balancer \
  --gateway-auth-secret inferops-gateway-token
```

## Multi-node gateway placement

For gateway availability across nodes, use the checked-in profile:

```bash
helm upgrade --install inferops-gateway deploy/helm/inferops-gateway \
  --namespace inferops-system \
  --values deploy/helm/inferops-gateway/values-multinode.yaml \
  --atomic --wait
```

## Acceptance checks

After enabling exposure:

```bash
kubectl rollout status deployment/inferops-gateway -n inferops-system
kubectl get service,ingress,httproute -n inferops-system
inferops doctor --namespace inferops-system --check gateway
curl --fail --show-error https://models.example.com/readyz
```

## Next steps

- [Cloud mesh connect](/docs/platform/cloud-mesh/)
- [Namespace tenancy](/docs/platform/tenancy/)
