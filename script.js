const snippets = {
  homelab: {
    title: "Homelab install",
    code: `# Install InferOps into a single-node GPU cluster
inferops install --profile homelab \\
  --cache-path /var/lib/inferops/models \\
  --tailscale-hostname inferops

# Validate Kubernetes, cache, gateway, and GPU inventory
inferops doctor
inferops gpu list`,
  },
  python: {
    title: "Python model declaration",
    code: `import inferops

app = inferops.App("customer-support-llm")

@app.model(
    name="qwen-chat",
    model="Qwen/Qwen2.5-7B-Instruct",
    gpu="L4",
    min_replicas=0,
    max_replicas=4,
    max_model_len=4096,
)
class QwenChat:
    pass

inferops deploy app.py`,
  },
  yaml: {
    title: "Kubernetes-native ModelDeployment",
    code: `apiVersion: inference.inferops.dev/v1alpha1
kind: ModelDeployment
metadata:
  name: gpu-vllm-qwen
spec:
  model:
    repo: Qwen/Qwen2.5-7B-Instruct
  runtime:
    ref: vllm
    maxModelLen: 4096
  resources:
    cpu: "8"
    memory: 32Gi
    gpu:
      count: 1
      vendor: nvidia
  activation:
    desiredState: Inactive
    whenFull: Queue`,
  },
  operate: {
    title: "Activate, route, drain, and reuse cache",
    code: `kubectl apply -f modeldeployment-vllm-gpu.yaml

inferops activate gpu-vllm-qwen --timeout 20m
inferops status gpu-vllm-qwen --watch

curl http://gateway/models/gpu-vllm-qwen/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{"model":"gpu-vllm-qwen","messages":[{"role":"user","content":"GPU scheduling tip?"}]}'

inferops deactivate gpu-vllm-qwen
inferops cache list`,
  },
};

const codeElement = document.querySelector("#snippet-code");
const titleElement = document.querySelector("#snippet-title");
const tabs = Array.from(document.querySelectorAll(".entry-tab"));

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function highlight(code) {
  const placeholders = [];
  const stash = (value) => {
    placeholders.push(value);
    return `@@TOKEN_${placeholders.length - 1}@@`;
  };

  return escapeHtml(code)
    .replace(/(".*?"|'.*?')/g, (match) => stash(`<span class="token-string">${match}</span>`))
    .replace(/(^|\n)(#[^\n]*)/g, (_, prefix, comment) => `${prefix}${stash(`<span class="token-comment">${comment}</span>`)}`)
    .replace(
      /\b(inferops|kubectl|curl|class|import|pass|apiVersion|kind|metadata|spec|runtime|resources|activation|model)\b/g,
      '<span class="token-key">$1</span>',
    )
    .replace(
      /\b(install|doctor|gpu|list|deploy|apply|activate|status|deactivate|cache)\b/g,
      '<span class="token-command">$1</span>',
    )
    .replace(/@@TOKEN_(\d+)@@/g, (_, index) => placeholders[Number(index)]);
}

function selectTab(name) {
  const snippet = snippets[name] || snippets.homelab;
  titleElement.textContent = snippet.title;
  codeElement.innerHTML = highlight(snippet.code);

  tabs.forEach((tab) => {
    const isActive = tab.dataset.tab === name;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => selectTab(tab.dataset.tab));
});

selectTab("homelab");
