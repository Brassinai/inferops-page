(function () {
  const trigger = document.getElementById("docs-search-trigger");
  const kbar = document.getElementById("docs-kbar");
  const input = document.getElementById("docs-kbar-input");
  const results = document.getElementById("docs-kbar-results");
  const index = Array.isArray(window.__DOCS_INDEX) ? window.__DOCS_INDEX : [];

  let activeIndex = 0;
  let currentQuery = "";

  function normalize(text) {
    return (text || "").toLowerCase().trim();
  }

  function score(item, query) {
    const t = normalize(item.title);
    const g = normalize(item.group);
    const d = normalize(item.description);
    const q = normalize(query);
    if (!q) return 1;
    if (t === q) return 100;
    if (t.startsWith(q)) return 80;
    if (t.includes(q)) return 60;
    if (g.includes(q)) return 40;
    if (d.includes(q)) return 20;
    const parts = q.split(/\s+/).filter(Boolean);
    if (parts.length > 1 && parts.every((p) => t.includes(p) || g.includes(p) || d.includes(p))) {
      return 30;
    }
    return 0;
  }

  function filterItems(query) {
    return index
      .map((item) => ({ item, score: score(item, query) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
      .map((entry) => entry.item);
  }

  function render(items) {
    results.innerHTML = "";
    if (items.length === 0) {
      results.innerHTML = '<li class="docs-kbar-empty">No pages found.</li>';
      activeIndex = 0;
      return;
    }
    items.slice(0, 12).forEach((item, i) => {
      const li = document.createElement("li");
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", i === activeIndex ? "true" : "false");
      li.className = i === activeIndex ? "docs-kbar-result active" : "docs-kbar-result";
      li.dataset.path = item.path;
      li.innerHTML = `<span class="docs-kbar-result-title">${escapeHtml(item.title)}</span><span class="docs-kbar-result-group">${escapeHtml(item.group)}</span>`;
      li.addEventListener("click", () => {
        window.location.href = item.path;
      });
      results.appendChild(li);
    });
  }

  function escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function openKbar() {
    kbar.hidden = false;
    document.body.classList.add("docs-kbar-open");
    input.value = "";
    currentQuery = "";
    activeIndex = 0;
    render(index);
    input.focus();
  }

  function closeKbar() {
    kbar.hidden = true;
    document.body.classList.remove("docs-kbar-open");
  }

  function updateActive(delta) {
    const items = results.querySelectorAll(".docs-kbar-result");
    if (items.length === 0) return;
    activeIndex = (activeIndex + delta + items.length) % items.length;
    items.forEach((el, i) => {
      el.classList.toggle("active", i === activeIndex);
      el.setAttribute("aria-selected", i === activeIndex ? "true" : "false");
    });
    items[activeIndex].scrollIntoView({ block: "nearest" });
  }

  function selectActive() {
    const active = results.querySelector(".docs-kbar-result.active");
    if (active && active.dataset.path) {
      window.location.href = active.dataset.path;
    }
  }

  trigger?.addEventListener("click", openKbar);

  document.addEventListener("keydown", (e) => {
    const isMac = navigator.platform.toUpperCase().includes("MAC");
    const kbarOpen = !kbar.hidden;

    if (!kbarOpen && ((isMac && e.metaKey && e.key.toLowerCase() === "k") || (!isMac && e.ctrlKey && e.key.toLowerCase() === "k") || (e.key === "/" && document.activeElement?.tagName !== "INPUT"))) {
      e.preventDefault();
      openKbar();
      return;
    }

    if (kbarOpen) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeKbar();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        updateActive(1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        updateActive(-1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        selectActive();
      }
    }
  });

  input.addEventListener("input", (e) => {
    currentQuery = e.target.value;
    activeIndex = 0;
    render(filterItems(currentQuery));
  });

  kbar.querySelector("[data-kbar-close]").addEventListener("click", closeKbar);

  // On-page heading links
  const article = document.querySelector(".docs-content");
  if (article) {
    const headings = Array.from(article.querySelectorAll("h2, h3"));
    headings.forEach((heading) => {
      if (!heading.id) {
        const id = heading.textContent.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        heading.id = id;
      }
      const anchor = document.createElement("a");
      anchor.className = "docs-heading-anchor";
      anchor.href = "#" + heading.id;
      anchor.setAttribute("aria-hidden", "true");
      anchor.textContent = "#";
      heading.appendChild(anchor);
    });
  }

  // Copy buttons for code blocks
  const codeBlocks = document.querySelectorAll(".prose-docs pre");
  codeBlocks.forEach((pre) => {
    const code = pre.querySelector("code");
    if (!code) return;

    const wrapper = document.createElement("div");
    wrapper.className = "docs-code-block";
    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "docs-copy-button";
    button.setAttribute("aria-label", "Copy code to clipboard");
    button.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;

    button.addEventListener("click", async () => {
      const text = code.textContent || "";
      try {
        await navigator.clipboard.writeText(text);
        button.classList.add("copied");
        button.setAttribute("aria-label", "Copied!");
        setTimeout(() => {
          button.classList.remove("copied");
          button.setAttribute("aria-label", "Copy code to clipboard");
        }, 1500);
      } catch (err) {
        button.classList.add("failed");
        setTimeout(() => button.classList.remove("failed"), 1500);
      }
    });

    wrapper.appendChild(button);
  });
})();
