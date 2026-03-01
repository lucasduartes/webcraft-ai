// Mantém seus elementos (chat/preview) e fala com backends antigo ou novo.

const inputText = document.getElementById('input-text');
const sendBtn = document.getElementById('send-btn');
const chatSection = document.getElementById('chat-section');
const codePreview = document.getElementById('code-preview');
const copyHtmlBtn = document.getElementById('copy-html-btn');
const copyCssBtn = document.getElementById('copy-css-btn');
const copyJsBtn = document.getElementById('copy-js-btn');
const downloadAllBtn = document.getElementById('download-all-btn');
const clearPreviewBtn = document.getElementById('clear-preview-btn');



const endpoint = "http://localhost:3001/api/generate";
//const endpoint = "https://webcraft-ai-0wkz.onrender.com/api/generate";


function normalizeScreen(screen) {
  if (!screen || typeof screen !== 'object') return screen;

 
  const s = JSON.parse(JSON.stringify(screen));
  const layout = s.layout || {};
  const content = Array.isArray(layout.content) ? layout.content : [];

  const out = [];
  let fieldBuffer = [];



  const coerceToFieldNode = (node) => {
    
    if (node && node.component === "Field") return node;
    
    return { component: "Field", props: node?.props || node || {} };
  };

  const flushFields = () => {
    if (!fieldBuffer.length) return;
    out.push({
      component: "Form",
      props: {
        id: "autoForm",
        fields: fieldBuffer.map(coerceToFieldNode),
        submit: { id: "submit", label: "Enviar", kind: "primary" }
      }
    });
    fieldBuffer = [];
  };

  for (const node of content) {
    if (!node) continue;
    if (node.component === "Field") {
      fieldBuffer.push(node);
    } else {
      flushFields();
      out.push(node);
    }
  }
  flushFields();

  s.layout = { ...layout, content: out };
  return s;
}


function enforceLocalImages(screen, localSrc = 'assets/imagem-exemplo.png') {
  if (!screen || typeof screen !== 'object') return screen;
  const s = JSON.parse(JSON.stringify(screen)); // clone

  const fixNode = (node) => {
    if (!node || typeof node !== 'object') return;
  
    if (node.component === 'Image') {
      node.props = node.props || {};
      node.props.src = localSrc;
    }
    
    if (node.component === 'DataTable' && Array.isArray(node.props?.columns) && Array.isArray(node.props?.rows)) {
      const imageCols = node.props.columns.filter(c => (c.type || '').toLowerCase() === 'image');
      if (imageCols.length) {
        const ids = imageCols.map(c => c.id);
        node.props.rows = node.props.rows.map(r => {
          const nr = { ...r };
          ids.forEach(id => { nr[id] = localSrc; });
          return nr;
        });
      }
    }
  };

  if (s.layout?.header) fixNode(s.layout.header);

  
  ['toolbar', 'content', 'footer'].forEach(region => {
    const arr = s.layout?.[region];
    if (Array.isArray(arr)) {
      arr.forEach(n => {
        
        fixNode(n);
       
        if (n.component === 'Form' && Array.isArray(n.props?.fields)) {
          n.props.fields.forEach(f => fixNode(f));
        }
      });
    }
  });

  return s;
}

// ===== Remove botões do cabeçalho (HEADER e PageHeader em qualquer região) =====
function enforceHeaderRules(screen) {
  if (!screen || typeof screen !== 'object') return screen;
  const s = JSON.parse(JSON.stringify(screen));

  // Zera ações no layout.header (topo fixo)
  if (s.layout && s.layout.header) {
    s.layout.header.props = s.layout.header.props || {};
    s.layout.header.props.actions = [];
  }

  // Zera ações em qualquer PageHeader que apareça nas regiões
  ['toolbar', 'content', 'footer'].forEach(region => {
    const arr = s.layout?.[region];
    if (Array.isArray(arr)) {
      s.layout[region] = arr.map(node => {
        if (node && node.component === 'PageHeader') {
          const nn = { ...node, props: { ...(node.props || {}) } };
          nn.props.actions = [];
          return nn;
        }
        return node;
      });
    }
  });

  return s;
}


window.addEventListener('DOMContentLoaded', () => {
  try { window.applyTheme?.(window.THEME); } catch (e) { console.warn('applyTheme falhou', e); }

  let preview = document.getElementById('preview');
  if (!preview) {
    const el = document.createElement('div');
    el.id = 'preview';
    el.className = 'preview';
    codePreview?.appendChild(el);
  }
});


sendBtn?.addEventListener('click', handleGenerate);
inputText?.addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    handleGenerate();
  }
});


function appendMessage(sender, message) {
  if (!chatSection) return;
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message');
  messageDiv.innerHTML = `<strong>${sender}:</strong> <pre style="white-space:pre-wrap">${message}</pre>`;
  chatSection.appendChild(messageDiv);
  chatSection.scrollTop = chatSection.scrollHeight;
}


async function handleGenerate() {
  const userInput = (inputText?.value || '').trim();
  if (!userInput) return;

  appendMessage('User', userInput);
  inputText.value = '';

  try {
    
    const preset = window.DEFAULT_PRESET || 'TopHeaderFixed';
    const prompt = window.buildPrompt(userInput, preset);

    appendMessage('AI', '⏳ Gerando tela padronizada…');

    
    const payload = {
      
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Você retorna apenas JSON válido conforme o schema. Sem markdown.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 1800,
     
      prompt: prompt
    };

   
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(`Erro da API: ${res.status} ${res.statusText}`);

    // Tenta primeiro como texto puro (novo backend recomendado retorna text/plain com JSON puro)
    let raw = await res.text();
        // LOG de diagnóstico (1x)
    if (!window.__loggedRawOnce) {
      console.debug('[IA RAW ≤1000 chars]', raw.slice(0, 1000));
      window.__loggedRawOnce = true;
    }


    // Se o servidor devolveu JSON (application/json), raw será uma string JSON. Tente parsear.
    let contentText = raw;
    try {
      const maybeObj = JSON.parse(raw);

      // Caso antigo: formato OpenAI { choices[0].message.content }
      if (maybeObj && maybeObj.choices?.[0]?.message?.content) {
        contentText = String(maybeObj.choices[0].message.content);
      } else {
        // Talvez o servidor tenha devolvido diretamente o objeto de tela
        contentText = raw; // manter como string JSON do schema
      }
    } catch {
      // raw já é texto (provável text/plain). Seguimos com contentText = raw
    }

    // Agora precisamos obter um OBJETO de tela do contentText:
    // 1) Tenta JSON direto
    let screenObj = null;
    try {
      screenObj = JSON.parse(contentText);
    } catch {
      // 2) Extrai primeiro bloco {...} do conteúdo (se vier com ruído)
      const m = contentText.match(/\{[\s\S]*\}$/);
      if (m) {
        screenObj = JSON.parse(m[0]);
      }
    }

    // Se ainda não temos objeto, pode ser que o backend antigo tenha devolvido blocos de código.
    if (!screenObj) {
      appendMessage('AI', '⚠️ A resposta não está em JSON de tela. Vou tentar renderizar como código (modo legado).');

      // Modo legado (se vier HTML/CSS/JS em blocos markdown)
      const blocks = extractCodeBlocks(contentText);
      const combinedCode = {
        html: blocks.find(b => b.language === 'HTML')?.content || '',
        css: blocks.find(b => b.language === 'CSS')?.content || '',
        js: blocks.find(b => b.language === 'JAVASCRIPT')?.content || ''
      };
      if (!combinedCode.html.trim()) {
        appendMessage('AI', '⚠️ Nenhum HTML encontrado. Ajuste o backend para retornar JSON-only segundo o novo schema.');
        return;
      }
      renderGeneratedCodeLegacy(combinedCode);
      appendMessage('AI', '✅ Renderizei em modo legado (HTML/CSS/JS). Recomendo migrar o backend para JSON-only.');
      return;
    }

    // ✅ NORMALIZA ANTES DE VALIDAR (agrupa Fields soltos em Form)
    screenObj = normalizeScreen(screenObj);
    screenObj = enforceLocalImages(screenObj);
    screenObj = enforceHeaderRules(screenObj); 

    // Validação do schema + renderizador
    const { valid, errors } = window.validateScreen?.(screenObj) || { valid: false, errors: [{ message: 'validator ausente' }] };
    if (!valid) {
      const msg = '❌ JSON inválido: ' + errors.map(e => e.message + (e.path?.length ? ` @${e.path.join('.')}` : '')).join('; ');
      appendMessage('AI', msg);
      return;
    }

    // Render
    let preview = document.getElementById('preview');
    if (!preview) {
      const el = document.createElement('div');
      el.id = 'preview';
      el.className = 'preview';
      codePreview?.appendChild(el);
    } else {
      preview.innerHTML = '';
    }

    console.debug('check:', {
      arity: window.renderScreen?.length,
      meta: screenObj?.meta,
      hasLayout: !!screenObj?.layout,
      sizes: {
        header: screenObj?.layout?.header ? 1 : 0,
        toolbar: Array.isArray(screenObj?.layout?.toolbar) ? screenObj.layout.toolbar.length : 0,
        content: Array.isArray(screenObj?.layout?.content) ? screenObj.layout.content.length : 0,
        footer: Array.isArray(screenObj?.layout?.footer) ? screenObj.layout.footer.length : 0,
      }
    });

    console.debug('[IA OBJ sizes]', {
      header: screenObj?.layout?.header ? 1 : 0,
      toolbar: Array.isArray(screenObj?.layout?.toolbar) ? screenObj.layout.toolbar.length : 0,
      content: Array.isArray(screenObj?.layout?.content) ? screenObj.layout.content.length : 0,
      footer: Array.isArray(screenObj?.layout?.footer) ? screenObj.layout.footer.length : 0,
    });



    window.renderScreen(screenObj);
    window.__lastScreen__ = screenObj;
    appendMessage('AI', '✅ Tela padronizada gerada e renderizada.');

  } catch (error) {
    console.error(error);
    appendMessage('AI', `Erro ao gerar: ${error.message}`);
  }
}

/* =========================
   Utilidades – modo legado
   ========================= */

function extractCodeBlocks(text) {
  const blocks = [];
  const markdownRegex = /```(html|css|javascript)\s*([\s\S]*?)```/gi;
  let m;
  while ((m = markdownRegex.exec(text)) !== null) {
    blocks.push({ language: m[1].toUpperCase(), content: m[2].trim() });
  }
  if (!blocks.length) {
    const fallbackRegex = /(HTML|CSS|JavaScript)\s*:\s*\n([\s\S]*?)(?=\n[A-Z]{2,10}\s*:|\n*$)/gi;
    let fm;
    while ((fm = fallbackRegex.exec(text)) !== null) {
      blocks.push({ language: fm[1].toUpperCase(), content: fm[2].trim() });
    }
  }
  return blocks;
}

function renderGeneratedCodeLegacy(code) {
  const container = document.getElementById('preview') || codePreview;
  if (!container) return;

  container.innerHTML = "";

  const fallbackStyle = `
    body { font-family: sans-serif; padding: 20px; }
    input, button { margin: 10px 0; padding: 8px; }
  `;
  const finalCSS = code.css && code.css.trim() ? code.css : fallbackStyle;

  const cleanedHTML = (code.html || "")
    .replace(/<link[^>]+href=["'][^"']+\.css["'][^>]*>/gi, '')
    .replace(/<script[^>]+src=["'][^"']+\.js["'][^>]*><\/script>/gi, '');

  const completeCode = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Preview</title>
      <style>${finalCSS}</style>
    </head>
    <body>
      ${cleanedHTML}
      <script>${code.js || ""}<\/script>
    </body>
    </html>
  `;

  const iframe = document.createElement('iframe');
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.setAttribute("sandbox", "allow-scripts");
  iframe.srcdoc = completeCode;

  container.appendChild(iframe);
}

// ===== Export (HTML/CSS/JS) – integra com exporter.js =====
copyHtmlBtn?.addEventListener('click', async () => {
  try {
    await window.Exporter.copyHTML(window.__lastScreen__);
    appendMessage('AI', '📋 HTML (externo) copiado.');
  } catch (e) {
    appendMessage('AI', 'Erro ao copiar HTML: ' + e.message);
  }
});

copyCssBtn?.addEventListener('click', async () => {
  try {
    await window.Exporter.copyCSS();
    appendMessage('AI', '📋 CSS copiado.');
  } catch (e) {
    appendMessage('AI', 'Erro ao copiar CSS: ' + e.message);
  }
});

copyJsBtn?.addEventListener('click', async () => {
  try {
    await window.Exporter.copyJS();
    appendMessage('AI', '📋 JS copiado.');
  } catch (e) {
    appendMessage('AI', 'Erro ao copiar JS: ' + e.message);
  }
});

downloadAllBtn?.addEventListener('click', () => {
  try {
    window.Exporter.downloadAll(window.__lastScreen__);
    appendMessage('AI', '⬇️ index.html, style.css e app.js baixados.');
  } catch (e) {
    appendMessage('AI', 'Erro ao baixar: ' + e.message);
  }
});

clearPreviewBtn?.addEventListener('click', () => {
  try {
    const preview = document.getElementById('preview') || codePreview;
    if (!preview) throw new Error('Preview não encontrado.');
    preview.innerHTML = '';
    window.__lastScreen__ = null; // zera a última tela exportável
    appendMessage('AI', '🧼 Preview limpo.');
  } catch (e) {
    appendMessage('AI', 'Erro ao limpar preview: ' + e.message);
  }
});
