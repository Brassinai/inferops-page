import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { load as loadYaml } from "js-yaml";
import { marked } from "marked";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const contentDir = path.resolve(rootDir, "content", "docs");
const outputDir = path.resolve(rootDir, "docs");

const basePath = (process.env.BASE_PATH || "").replace(/\/$/, "");

function withBase(url) {
  if (typeof url !== "string") return url;
  if (url.startsWith("/") && !url.startsWith("//")) {
    return `${basePath}${url}`;
  }
  return url;
}

function rewriteAbsolutePaths(html) {
  return html
    .replace(/href="\//g, `href="${basePath}/`)
    .replace(/href='\//g, `href='${basePath}/`)
    .replace(/src="\//g, `src="${basePath}/`)
    .replace(/src='\//g, `src='${basePath}/`);
}

function parseFrontMatter(raw) {
  const cleaned = raw.replace(/^\uFEFF/, "");
  if (!cleaned.startsWith("---")) {
    return { data: {}, content: cleaned };
  }
  const end = cleaned.indexOf("\n---", 3);
  if (end === -1) {
    return { data: {}, content: cleaned };
  }
  const front = cleaned.slice(3, end).trim();
  const content = cleaned.slice(end + 4).replace(/^\n/, "");
  return {
    data: front ? loadYaml(front) : {},
    content
  };
}

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }
  return files;
}

function slugFromBase(base) {
  if (base === "index") return "";
  return base.replace(/\/index$/, "");
}

function urlPathFromSlug(slug) {
  return slug ? `/docs/${slug}/` : "/docs/";
}

function outputPathFromSlug(slug) {
  return slug ? path.join(outputDir, slug, "index.html") : path.join(outputDir, "index.html");
}

function titleCase(str) {
  return str
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function layout({ title, description, contentHtml, sidebarHtml, prevHtml, nextHtml, searchIndexJson }) {
  return rewriteAbsolutePaths(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)} | InferOps Docs</title>
    <meta name="description" content="${escapeHtml(description || "InferOps documentation")}" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="/styles.css" />
    <link rel="stylesheet" href="/docs.css" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css" />
  </head>
  <body>
    <svg class="svg-filters" aria-hidden="true" focusable="false">
      <filter id="sketch-map" x="-6%" y="-6%" width="112%" height="112%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.012 0.038"
          numOctaves="2"
          seed="12"
          result="paper-noise"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="paper-noise"
          scale="2.2"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>

    <div class="site-shell">
      <header class="topbar">
        <a class="brand" href="/" aria-label="InferOps home">
          <span class="brand-mark"></span>
          inferops
        </a>
        <nav class="nav-links" aria-label="Primary navigation">
          <a href="/#entrypoints">Entrypoints</a>
          <a href="/#provisioning">Provisioning</a>
          <a href="/#network">Network</a>
          <a href="/#articles">Articles</a>
          <a class="active" href="/docs/" aria-current="page">Docs</a>
        </nav>
        <a class="nav-cta" href="/#entrypoints">Get started</a>
      </header>

      <main>
        <div class="docs-main">
          <aside class="docs-sidebar">
            <div class="docs-search-bar">
              <button id="docs-search-trigger" type="button" aria-label="Open search">
                <span class="docs-search-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
                </span>
                <span class="docs-search-label">Search docs</span>
                <span class="docs-search-shortcut"><kbd>⌘</kbd><kbd>K</kbd></span>
              </button>
            </div>
            <nav aria-label="Documentation table of contents">
              ${sidebarHtml}
            </nav>
          </aside>

          <article class="docs-content prose-docs">
            ${contentHtml}

            <nav class="docs-pagination" aria-label="Documentation pagination">
              ${prevHtml}
              ${nextHtml}
            </nav>
          </article>
        </div>
      </main>

      <footer class="footer">
        <span>created by BrassinAi</span>
      </footer>
    </div>

    <div id="docs-kbar" class="docs-kbar" role="dialog" aria-modal="true" aria-label="Search documentation" hidden>
      <div class="docs-kbar-overlay" data-kbar-close></div>
      <div class="docs-kbar-modal">
        <div class="docs-kbar-input-wrap">
          <input id="docs-kbar-input" type="text" placeholder="Search pages…" autocomplete="off" aria-label="Search pages" />
        </div>
        <ul id="docs-kbar-results" class="docs-kbar-results" role="listbox"></ul>
        <div class="docs-kbar-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> select</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    </div>

    <script>
      window.__DOCS_INDEX = ${searchIndexJson};
    </script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-bash.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-yaml.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-python.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-json.min.js"></script>
    <script src="/docs.js"></script>
  </body>
</html>
`);
}

function groupLabelFor(page) {
  if (page.group) return page.group;
  const rest = page.path.replace("/docs/", "");
  if (!rest) return "Overview";
  const segment = rest.split("/")[0];
  return titleCase(segment);
}

function renderSidebar(manifest, currentPath) {
  const groups = new Map();

  for (const page of manifest) {
    const label = groupLabelFor(page);
    if (!groups.has(label)) {
      groups.set(label, { label, pages: [] });
    }
    groups.get(label).pages.push(page);
  }

  let html = '<ul class="docs-toc">';
  for (const { label, pages } of groups.values()) {
    html += `<li><span class="docs-toc-group">${escapeHtml(label)}</span><ul>`;
    for (const page of pages) {
      const isActive = page.path === currentPath;
      html += `<li><a class="${isActive ? "active" : ""}" href="${page.path}">${escapeHtml(page.title)}</a></li>`;
    }
    html += "</ul></li>";
  }
  html += "</ul>";
  return html;
}

function renderPaginationLink(link, direction) {
  if (!link) {
    return `<span class="docs-pagination-link docs-pagination-link--disabled"></span>`;
  }
  const label = direction === "prev" ? "Previous" : "Next";
  const arrow = direction === "prev" ? "&larr;" : "&rarr;";
  return `<a class="docs-pagination-link docs-pagination-link--${direction}" href="${link.path}"><span class="docs-pagination-label">${arrow} ${label}</span><span class="docs-pagination-title">${escapeHtml(link.title)}</span></a>`;
}

function main() {
  if (!fs.existsSync(contentDir)) {
    throw new Error(`Docs content directory not found: ${contentDir}`);
  }

  fs.rmSync(outputDir, { recursive: true, force: true });

  const files = walk(contentDir);

  const pages = files
    .map((file) => {
      const relativePath = path.relative(contentDir, file).replace(/\\/g, "/");
      const raw = fs.readFileSync(file, "utf-8");
      const parsed = parseFrontMatter(raw);
      const base = relativePath.replace(/\.md$/, "");
      const slug = slugFromBase(base);
      const outputPath = outputPathFromSlug(slug);

      return {
        slug,
        path: urlPathFromSlug(slug),
        outputPath,
        title: String(parsed.data.title ?? "Untitled"),
        description: String(parsed.data.description ?? ""),
        group: parsed.data.group ? String(parsed.data.group) : undefined,
        order: Number(parsed.data.order ?? Infinity),
        html: marked.parse(parsed.content, { async: false })
      };
    })
    .sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.path.localeCompare(b.path);
    });

  const manifest = pages.map((page, index) => ({
    ...page,
    prev: index > 0 ? { title: pages[index - 1].title, path: pages[index - 1].path } : undefined,
    next: index < pages.length - 1 ? { title: pages[index + 1].title, path: pages[index + 1].path } : undefined
  }));

  const searchIndex = manifest.map((p) => ({
    title: p.title,
    path: withBase(p.path),
    group: groupLabelFor(p),
    description: p.description
  }));
  const searchIndexJson = JSON.stringify(searchIndex);

  for (const page of manifest) {
    fs.mkdirSync(path.dirname(page.outputPath), { recursive: true });

    const sidebarHtml = renderSidebar(manifest, page.path);
    const prevHtml = renderPaginationLink(page.prev, "prev");
    const nextHtml = renderPaginationLink(page.next, "next");

    const html = layout({
      title: page.title,
      description: page.description,
      contentHtml: page.html,
      sidebarHtml,
      prevHtml,
      nextHtml,
      searchIndexJson
    });

    fs.writeFileSync(page.outputPath, html);
  }

  console.log(`Generated ${pages.length} documentation page(s).`);
}

main();
