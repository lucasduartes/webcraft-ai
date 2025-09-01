// Validação leve do JSON da tela (sem libs externas).

(function(){
  const PRESET_KEYS = Object.keys(window.PRESETS);
  const ALLOWED_COMPONENTS = new Set(["PageHeader","FilterBar","Form","DataTable","EmptyState","Button"]);

  function err(msg, path){ return { message: msg, path: path || [] }; }

  function validateNode(node, path){
    const errors = [];
    if (typeof node !== "object" || node == null) return [err("Node inválido", path)];
    if (!node.component || !ALLOWED_COMPONENTS.has(node.component)) {
      errors.push(err(`Componente não permitido: ${node.component}`, path.concat(["component"])));
    }
    // props é livre por enquanto (validações específicas podem ser adicionadas aqui)
    return errors;
  }

  window.validateScreen = function validateScreen(screen){
    const errors = [];
    if (!screen || typeof screen !== "object") return { valid: false, errors: [err("Objeto raiz inválido")] };

    // meta
    if (!screen.meta || typeof screen.meta !== "object") errors.push(err("meta ausente"));
    else {
      if (!PRESET_KEYS.includes(screen.meta.preset)) errors.push(err(`preset inválido: ${screen.meta.preset}`,["meta","preset"]));
      if (screen.meta.title && typeof screen.meta.title !== "string") errors.push(err("meta.title deve ser string",["meta","title"]));
    }

    // layout
    const layout = screen.layout || {};
    const regions = window.PRESETS[screen.meta?.preset || window.DEFAULT_PRESET].regions;
    regions.forEach(r => {
      if (r === "header") {
        if (layout.header && typeof layout.header !== "object") errors.push(err("header deve ser objeto",["layout","header"]));
      } else if (["toolbar","content","footer"].includes(r)) {
        const arr = layout[r];
        if (arr && !Array.isArray(arr)) errors.push(err(`${r} deve ser array`,["layout",r]));
        if (Array.isArray(arr)) arr.forEach((n,i)=> errors.push(...validateNode(n,["layout",r,i])));
      } else if (r === "leftnav") {
        // opcional, mas se existir futuramente pode validar aqui
      }
    });

    return { valid: errors.length === 0, errors };
  }
})();
