// Validação leve do JSON da tela (sem libs externas).

(function(){
  const PRESETS = window.PRESETS || {};
  const PRESET_KEYS = Object.keys(PRESETS);
  const DEFAULT_PRESET = window.DEFAULT_PRESET || (PRESET_KEYS[0] || 'default');

  const ALLOWED_COMPONENTS = new Set(["PageHeader","FilterBar","Form","DataTable","EmptyState","Button","Image"]);

  function err(msg, path){ return { message: msg, path: path || [] }; }

  function validateNode(node, path){
    const errors = [];
    if (typeof node !== "object" || node == null) return [err("Node inválido", path)];
    if (!node.component || !ALLOWED_COMPONENTS.has(node.component)) {
      errors.push(err(`Componente não permitido: ${node.component}`, path.concat(["component"])));
    }
    return errors;
  }

  // 🔧 Nova: garante meta válido SEM acusar erro
  function ensureMeta(screen){
    if (!screen || typeof screen !== 'object') return;

    const incomingPreset = screen?.meta?.preset;
    const hasValidPreset = typeof incomingPreset === 'string' && PRESET_KEYS.includes(incomingPreset);
    const preset = hasValidPreset ? incomingPreset : DEFAULT_PRESET;

    const title = (screen && screen.meta && typeof screen.meta.title === 'string')
      ? screen.meta.title
      : (typeof screen?.title === 'string' ? screen.title : 'Screen');

    screen.meta = { preset, title };
  }

  window.validateScreen = function validateScreen(screen){
    const errors = [];
    if (!screen || typeof screen !== "object") return { valid: false, errors: [err("Objeto raiz inválido")] };

    // ✅ Só injeta meta; NÃO gera erro por meta ausente
    ensureMeta(screen);

    // meta coerente
    const preset = screen.meta.preset;
    if (!PRESET_KEYS.includes(preset)) {
      // não invalidamos — apenas sinalizamos
      errors.push(err(`preset inválido: ${preset} (usando ${DEFAULT_PRESET})`, ["meta","preset"]));
    }

    const layout = screen.layout || {};
    const regions = (PRESETS[preset]?.regions) || (PRESETS[DEFAULT_PRESET]?.regions) || [];

    regions.forEach(r => {
      if (r === "header") {
        if (layout.header && typeof layout.header !== "object") {
          errors.push(err("header deve ser objeto",["layout","header"]));
        }
      } else if (["toolbar","content","footer"].includes(r)) {
        const arr = layout[r];
        if (arr && !Array.isArray(arr)) {
          errors.push(err(`${r} deve ser array`,["layout",r]));
        }
        if (Array.isArray(arr)) {
          arr.forEach((n,i)=> errors.push(...validateNode(n,["layout",r,i])));
        }
      } else if (r === "leftnav") {
        // sem regras específicas
      }
    });

    return { valid: errors.length === 0, errors };
  };

  // schema.js — substitua APENAS a ensureMeta por esta versão
  function ensureMeta(screen){
    if (!screen || typeof screen !== 'object') return;

    const PRESETS = window.PRESETS || {};
    const PRESET_KEYS = Object.keys(PRESETS);
    const DEFAULT_PRESET = window.DEFAULT_PRESET || (PRESET_KEYS[0] || 'default');

    const incoming = (screen.meta && typeof screen.meta === 'object') ? screen.meta : {};
    const incomingPreset = incoming.preset;
    const hasValidPreset = typeof incomingPreset === 'string' && PRESET_KEYS.includes(incomingPreset);
    const preset = hasValidPreset ? incomingPreset : DEFAULT_PRESET;

    const title =
      typeof incoming.title === 'string'
        ? incoming.title
        : (typeof screen.title === 'string' ? screen.title : 'Screen');

    // 🔧 Mescla: preserva quaisquer outras chaves de meta que já existam
    screen.meta = { ...incoming, preset, title };
  }

})();
