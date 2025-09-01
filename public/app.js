// app.js – versão compatível com renderer/schema/prompt (JSON-only)
// Mantém seus elementos (chat/preview) e fala com backends antigo ou novo.

const inputText = document.getElementById('input-text');
const sendBtn = document.getElementById('send-btn');
const chatSection = document.getElementById('chat-section');
const codePreview = document.getElementById('code-preview');

// Ajuste o endpoint conforme ambiente:
//const endpoint = "http://localhost:3001/api/generate";
const endpoint = "https://webcraft-ai-0wkz.onrender.com/api/generate";

// Aplica o tema assim que a página carregar
window.addEventListener('DOMContentLoaded', () => {
  try { window.applyTheme?.(window.THEME); } catch (e) { console.warn('applyTheme falhou', e); }

  // Garante que existe um #preview (necessário pelo renderer.js)
  let preview = document.getElementById('preview');
  if (!preview) {
    const el = document.createElement('div');
    el.id = 'preview';
    el.className = 'preview';
    codePreview?.appendChild(el);
  }
});

// Handlers
sendBtn?.addEventListener('click', handleGenerate);
inputText?.addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    handleGenerate();
  }
});

// Utilidades de chat (mantidas)
function appendMessage(sender, message) {
  if (!chatSection) return;
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message');
  messageDiv.innerHTML = `<strong>${sender}:</strong> <pre style="white-space:pre-wrap">${message}</pre>`;
  chatSection.appendChild(messageDiv);
  chatSection.scrollTop = chatSection.scrollHeight;
}

// Fluxo principal
async function handleGenerate() {
  const userInput = (inputText?.value || '').trim();
  if (!userInput) return;

  appendMessage('User', userInput);
  inputText.value = '';

  try {
    // Monta prompt com trilhos (usa preset default se não houver seletor)
    const preset = window.DEFAULT_PRESET || 'TopHeaderFixed';
    const prompt = window.buildPrompt(userInput, preset);

    appendMessage('AI', '⏳ Gerando tela padronizada…');

    // Payload compatível (manda ambos formatos: novo e legado)
    const payload = {
      // Novo (Chat Completions)
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Você retorna apenas JSON válido conforme o schema. Sem markdown.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 1800,
      // Legado (caso seu backend espere isso)
      prompt: prompt
    };

    // Chamada ao backend
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(`Erro da API: ${res.status} ${res.statusText}`);

    // Tenta primeiro como texto puro (novo backend recomendado retorna text/plain com JSON puro)
    let raw = await res.text();

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

    // Validação do schema + renderizador
    const { valid, errors } = window.validateScreen?.(screenObj) || { valid: false, errors: [{ message: 'validator ausente' }] };
    if (!valid) {
      const msg = '❌ JSON inválido: ' + errors.map(e => e.message + (e.path?.length ? ` @${e.path.join('.')}` : '')).join('; ');
      appendMessage('AI', msg);
      return;
    }

    // Render
    // Garante container #preview presente (caso a página tenha sido alterada)
    let preview = document.getElementById('preview');
    if (!preview) {
      const el = document.createElement('div');
      el.id = 'preview';
      el.className = 'preview';
      codePreview?.appendChild(el);
    } else {
      preview.innerHTML = '';
    }

    window.renderScreen(screenObj);
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
