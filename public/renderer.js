// Converte o JSON (schema) em DOM usando a biblioteca de componentes.

(function(){
  const ALLOWED = new Set(Object.keys(window.Components));

  function renderNode(node){
    if (!node || !node.component) return null;
    const Comp = window.Components[node.component];
    if (!Comp) return null;
    try {
      return Comp(node.props || {});
    } catch(e) {
      console.error("Erro component render:", e);
      return window.Components.EmptyState({ title: `Erro renderizando ${node.component}` });
    }
  }

  function regionWrap(name, children){
    const el = document.createElement("section");
    el.className = `region region-${name}`;
    (children||[]).forEach(c => c && el.appendChild(c));
    return el;
  }

  window.renderScreen = function renderScreen(screen){
    const root = document.getElementById("preview");
    if (!root) throw new Error("#preview não encontrado");
    root.innerHTML = "";

    const preset = window.PRESETS[screen?.meta?.preset] || window.PRESETS[window.DEFAULT_PRESET];
    root.dataset.preset = preset.id;

    // HEADER
    if (screen?.layout?.header) {
      const header = window.Components.PageHeader(screen.layout.header);
      header.classList.add("region-fixed-header");
      root.appendChild(regionWrap("header", [header]));
    }

    // LEFT NAV (apenas se o preset tiver)
    if (preset.regions.includes("leftnav")) {
      const nav = document.createElement("aside");
      nav.className = "leftnav card";
      nav.style.width = (preset.rules.leftNavWidth || 240) + "px";
      nav.textContent = "(Navegação)"; // placeholder – pode vir como componente no futuro
      root.appendChild(regionWrap("leftnav", [nav]));
    }

    // TOOLBAR
    if (Array.isArray(screen?.layout?.toolbar)) {
      const nodes = screen.layout.toolbar.map(renderNode).filter(Boolean);
      root.appendChild(regionWrap("toolbar", nodes));
    }

    // CONTENT
    const contentNodes = (screen?.layout?.content || []).map(renderNode).filter(Boolean);
    root.appendChild(regionWrap("content", contentNodes));

    // FOOTER
    if (Array.isArray(screen?.layout?.footer)) {
      const nodes = screen.layout.footer.map(renderNode).filter(Boolean);
      root.appendChild(regionWrap("footer", nodes));
    }

    // Ajustes pós-render (ex.: scroll, etc.)
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
})();
