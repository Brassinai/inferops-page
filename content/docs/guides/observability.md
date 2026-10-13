---
title: Observability
description: Monitor InferOps with Prometheus and Grafana.
order: 33
---

# Observability

InferOps exposes platform metrics from the operator and gateway, and it scrapes runtime-native metrics from the inference engines. You can install Prometheus and Grafana through the CLI or use your existing monitoring stack.

## Install the monitoring stack

```bash
inferops observability setup \
  --namespace inferops-system \
  --monitoring-namespace monitoring \
  --grafana-admin-password admin
```

Subcommands:

| Command | Use case |
| --- | --- |
| `observability setup` | Install kube-prometheus-stack and enable InferOps ServiceMonitors and dashboards. |
| `observability install` | Install only Prometheus and Grafana. |
| `observability enable` | Enable InferOps ServiceMonitors and dashboards against an existing stack. |
| `observability open` | Port-forward Grafana locally. |

## Access Grafana

After the monitoring stack is installed, open Grafana to view the live dashboards:

```bash
inferops observability open
```

This port-forwards Grafana locally and opens it in your browser. The bundled dashboards include the **InferOps Uptime** dashboard, which shows real-time model availability, gateway request rates, GPU slot usage, and activation latency.

## Platform metrics

| Metric | Meaning |
| --- | --- |
| `inferops_modelcache_phase_count` | ModelCache availability by phase. |
| `inferops_cache_download_duration_seconds` | Cache download duration. |
| `inferops_cache_download_failures_total` | Terminal cache failures. |
| `inferops_model_activation_duration_seconds` | Activation-to-ready duration. |
| `inferops_activation_queue_depth` | Deployments waiting for GPU capacity. |
| `inferops_gpu_slots_total` | Scheduler-visible GPU slots. |
| `inferops_gpu_slots_occupied` | Occupied InferOps GPU slots. |
| `inferops_gpu_slots_available` | Available InferOps GPU slots. |
| `inferops_gateway_requests_total` | Gateway request rate. |
| `inferops_gateway_request_duration_seconds` | Gateway latency. |
| `inferops_gateway_active_requests` | In-flight gateway requests. |
| `inferops_gateway_upstream_errors_total` | Upstream runtime failures. |

## Runtime metrics

Runtime dashboards use engine-native metrics. For vLLM-compatible runtimes, useful signals include:

- `vllm:num_requests_waiting`
- `vllm:num_requests_running`
- `vllm:time_to_first_token_seconds`
- `vllm:generation_tokens_total`
- `vllm:kv_cache_usage_perc`

Dashboards should clearly mark metrics that are not exported by the current runtime.

## Next steps

- [Production notes](/docs/platform/production/)
