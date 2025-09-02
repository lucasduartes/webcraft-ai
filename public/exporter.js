// exporter.js
// Exporta o preview para HTML/CSS/JS (cópia e download).
(function () {
  // ===== CSS base (igual ao usado no preview) =====
  const CSS_TEMPLATE = `
:root{
  --color-brand-primary:#1E3A8A; --color-brand-secondary:#22C55E;
  --color-bg-page:#FFFFFF; --color-bg-surface:#111827;
  --color-text-primary:#E5E7EB; --color-text-secondary:#9CA3AF; --color-border:#293041;
  --radius-sm:4px; --radius-md:8px; --radius-lg:12px;
  --space-xs:4px; --space-sm:8px; --space-md:12px; --space-lg:16px; --space-xl:24px;
  --shadow-sm:0 1px 2px rgba(0,0,0,.2); --shadow-md:0 4px 12px rgba(0,0,0,.25);
  --font: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  --fs-xs:12px; --fs-sm:14px; --fs-md:16px; --fs-lg:18px; --fs-xl:22px; --fs-2xl:28px;
}
*{box-sizing:border-box}
body{margin:0;font-family:var(--font);color:#0e1013;background:#fff}
.preview{display:grid;gap:var(--space-lg);padding:var(--space-lg);max-width:1280px;margin:0 auto}
.region{display:grid;gap:var(--space-md)}
.region-fixed-header{position:sticky;top:0;z-index:10}
.card{background:var(--color-bg-surface);border:1px solid var(--color-border);border-radius:var(--radius-lg);box-shadow:var(--shadow-sm);padding:var(--space-md);color:var(--color-text-primary)}
.field-label{display:block;margin:var(--space-sm) 0 var(--space-xs);color:var(--color-text-secondary);font-size:var(--fs-sm)}
.input{width:100%;padding:10px 12px;border-radius:var(--radius-md);border:1px solid var(--color-border);background:#0d1424;color:var(--color-text-primary)}
.btn{padding:10px 14px;border-radius:var(--radius-md);border:1px solid transparent;cursor:pointer;font-weight:600;font-size:var(--fs-sm)}
.btn:hover{opacity:.95}.btn:active{transform:translateY(1px)}
.btn-primary{background:var(--color-brand-primary);color:#fff}
.btn-default{background:#0d1424;color:var(--color-text-primary);border-color:var(--color-border)}
.btn-ghost{background:transparent;color:var(--color-text-secondary)}
.page-header{display:flex;align-items:center;justify-content:space-between;padding:var(--space-md) var(--space-lg)}
.ph-title{font-size:var(--fs-xl);margin:0}.ph-subtitle{color:var(--color-text-secondary)}
.ph-actions{display:flex;gap:var(--space-sm)}
.toolbar{display:flex;align-items:flex-end;justify-content:space-between;gap:var(--space-md);padding:var(--space-md)}
.toolbar-fields{display:grid;grid-template-columns:repeat(2,1fr);gap:var(--space-md);width:100%}
.form{display:grid;gap:var(--space-md);padding:var(--space-lg)}
.field{display:grid;gap:6px}.form-actions{display:flex;justify-content:flex-end}
.table-wrap{overflow:hidden}.table{width:100%;border-collapse:collapse}
.table th,.table td{padding:10px 12px;border-bottom:1px solid var(--color-border);text-align:left}
.table thead th{color:var(--color-text-secondary);font-weight:600;font-size:var(--fs-sm)}
.table-footer{padding:10px 12px;color:var(--color-text-secondary);font-size:var(--fs-sm)}
.empty{text-align:center;padding:28px}.empty-title{font-weight:700;margin-bottom:6px}.empty-desc{color:var(--color-text-secondary)}
img{display:block}
`;

  // ===== JS base (opcional). Hoje é mínimo; coloque aqui futuros handlers. =====
  const JS_TEMPLATE = `
// app.js (exportado)
// Espaço para interações específicas caso você adicione hooks nos componentes.
// Hoje o preview não precisa de JS para funcionar.
console.log('App inline carregado.');
`;

  function getPreviewInnerHTML() {
    const preview = document.getElementById('preview');
    if (!preview) throw new Error('#preview não encontrado');
    return preview.innerHTML;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // HTML inline (usa CSS embutido) — útil para abrir rápido
  function buildInlineHTML(inner, title = 'Preview') {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>${CSS_TEMPLATE}</style>
</head>
<body>
  <div class="preview">
    ${inner}
  </div>
<script>${JS_TEMPLATE}<\/script>
</body>
</html>`;
  }

  // HTML esqueleto externo (referencia style.css e app.js) — para “pacote separado”
  function buildExternalHTML(title = 'Preview') {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="style.css" />
</head>
<body>
  <div class="preview">
    <!-- O conteúdo será colado aqui -->
${indentHTML(getPreviewInnerHTML(), 4)}
  </div>
<script src="app.js"><\/script>
</body>
</html>`;
  }

  function indentHTML(html, spaces) {
    const pad = ' '.repeat(spaces || 2);
    return html.split('\n').map(l => pad + l).join('\n');
  }

  function downloadText(filename, mime, text) {
    const blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 0);
  }

  async function copyToClipboard(text) {
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }

  window.Exporter = {
    // ===== GETTERS =====
    getHTMLInline(lastScreen) {
      const title = lastScreen?.meta?.title || 'Preview';
      return buildInlineHTML(getPreviewInnerHTML(), title);
    },
    getHTMLExternal(lastScreen) {
      const title = lastScreen?.meta?.title || 'Preview';
      return buildExternalHTML(title);
    },
    getCSS() { return CSS_TEMPLATE.trim(); },
    getJS() { return JS_TEMPLATE.trim(); },

    // ===== COPY =====
    async copyHTML(lastScreen) {
      const html = this.getHTMLExternal(lastScreen);
      await copyToClipboard(html);
    },
    async copyCSS() {
      await copyToClipboard(this.getCSS());
    },
    async copyJS() {
      await copyToClipboard(this.getJS());
    },

    // ===== DOWNLOAD (separados) =====
    downloadHTML(lastScreen, filename = 'index.html') {
      downloadText(filename, 'text/html;charset=utf-8', this.getHTMLExternal(lastScreen));
    },
    downloadCSS(filename = 'style.css') {
      downloadText(filename, 'text/css;charset=utf-8', this.getCSS());
    },
    downloadJS(filename = 'app.js') {
      downloadText(filename, 'application/javascript;charset=utf-8', this.getJS());
    },

    // ===== DOWNLOAD TUDO (3 arquivos) =====
    downloadAll(lastScreen) {
      this.downloadHTML(lastScreen, 'index.html');
      this.downloadCSS('style.css');
      this.downloadJS('app.js');
    }
  };
})();
