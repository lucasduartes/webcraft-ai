const inputText = document.getElementById('input-text');
const sendBtn = document.getElementById('send-btn');
const chatSection = document.getElementById('chat-section');
const codePreview = document.getElementById('code-preview');

const endpoint = "https://webcraft-ai-0wkz.onrender.com/api/generate";



sendBtn.addEventListener('click', sendMessage);
inputText.addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    sendMessage();
  }
});

function sendMessage() {
  const userInput = inputText.value.trim();
  if (userInput === "") return;

  appendMessage("User", userInput);

  fetchAIResponse(userInput);

  inputText.value = "";
}

function appendMessage(sender, message, isCode = false) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message');

  if (isCode) {
    const codeBlocks = extractCodeBlocks(message);
    codeBlocks.forEach(block => {
      const codeContainer = document.createElement('div');
      codeContainer.classList.add('code-container');

      const pre = document.createElement('pre');
      pre.style.whiteSpace = 'pre-wrap';
      pre.style.overflow = 'auto';
      pre.textContent = block.content;


      const copyButton = document.createElement('button');
      copyButton.textContent = `Copiar ${block.language}`;
      copyButton.classList.add('copy-btn');
      copyButton.onclick = () => copyToClipboard(block.content);

      codeContainer.appendChild(copyButton);
      codeContainer.appendChild(pre);
      messageDiv.appendChild(codeContainer);
    });
  } else {
    messageDiv.innerHTML = `<strong>${sender}:</strong> <pre>${message}</pre>`;
  }

  chatSection.appendChild(messageDiv);
  chatSection.scrollTop = chatSection.scrollHeight;
}


function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert("Código copiado para a área de transferência!");
  }).catch(err => {
    console.error("Erro ao copiar para a área de transferência:", err);
  });
}

async function fetchAIResponse(userInput) {
  const requestOptions = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ prompt: userInput })
};


  try {
    const response = await fetch(endpoint, requestOptions);

    if (!response.ok) {
      throw new Error(`Erro: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const aiMessage = data.choices[0].message.content.trim();

    // Exibe a mensagem da IA no chat
    appendMessage("AI", aiMessage, true);

    // Extrai os blocos de código da resposta
    const codeBlocks = extractCodeBlocks(aiMessage);
    const combinedCode = {
      html: codeBlocks.find(block => block.language === 'HTML')?.content || "",
      css: codeBlocks.find(block => block.language === 'CSS')?.content || "",
      js: codeBlocks.find(block => block.language === 'JavaScript')?.content || ""
    };

    console.log("Código combinado extraído:", combinedCode);

    // Verifica se ao menos o HTML foi retornado
    if (!combinedCode.html.trim()) {
      appendMessage("AI", "⚠️ Nenhum bloco de HTML foi encontrado na resposta da IA. Tente reformular seu prompt.");
      return;
    }

    // Adiciona CSS fallback se estiver vazio
    const fallbackStyle = `
      body { font-family: sans-serif; padding: 20px; }
      input, button { margin: 10px 0; padding: 8px; }
    `;
    const finalCSS = combinedCode.css.trim() ? combinedCode.css : fallbackStyle;

    // Remove links e scripts externos do HTML
    const cleanedHTML = combinedCode.html
      .replace(/<link[^>]+href=["'][^"']+\.css["'][^>]*>/gi, '')
      .replace(/<script[^>]+src=["'][^"']+\.js["'][^>]*><\/script>/gi, '');

    // Constrói o código final para renderização
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
        <script>${combinedCode.js}</script>
      </body>
      </html>
    `;

    // Renderiza no iframe
    codePreview.innerHTML = "";
    const iframe = document.createElement('iframe');
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.setAttribute("sandbox", "allow-scripts");
    iframe.srcdoc = completeCode;

    codePreview.innerHTML = "";
    codePreview.appendChild(iframe);


  } catch (error) {
    appendMessage("AI", `Erro ao obter resposta da IA: ${error.message}`);
    console.error("Erro ao buscar resposta da IA:", error);
  }
}


function extractCodeBlocks(text) {
  const blocks = [];

  // 1. Extrai blocos markdown corretamente formatados
  const markdownRegex = /```(html|css|javascript)\s*([\s\S]*?)```/gi;
  let match;
  while ((match = markdownRegex.exec(text)) !== null) {
    blocks.push({
      language: match[1].toUpperCase(),
      content: match[2].trim()
    });
  }

  // 2. Fallback: tenta capturar blocos sem markdown, com rótulos tipo "CSS:"
  if (!blocks.length) {
    const fallbackRegex = /(HTML|CSS|JavaScript)\s*:\s*\n([\s\S]*?)(?=\n[A-Z]{2,10}\s*:|\n*$)/gi;
    let fallbackMatch;
    while ((fallbackMatch = fallbackRegex.exec(text)) !== null) {
      blocks.push({
        language: fallbackMatch[1].toUpperCase(),
        content: fallbackMatch[2].trim()
      });
    }
  }

  return blocks;
}



function renderGeneratedCode(code) {
  // Limpa o contêiner de visualização
  codePreview.innerHTML = "";

  // CSS fallback mínimo para evitar layout totalmente cru
  const fallbackStyle = `
    body { font-family: sans-serif; padding: 20px; }
    input, button { margin: 10px 0; padding: 8px; }
  `;

  const finalCSS = code.css && code.css.trim() ? code.css : fallbackStyle;

  // Remove links e scripts externos do HTML retornado pela IA
  const cleanedHTML = (code.html || "")
    .replace(/<link[^>]+href=["'][^"']+\.css["'][^>]*>/gi, '')
    .replace(/<script[^>]+src=["'][^"']+\.js["'][^>]*><\/script>/gi, '');

  // Constrói o HTML completo para o iframe
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
      <script>${code.js || ""}</script>
    </body>
    </html>
  `;

  // Cria o iframe com srcdoc para evitar problemas de origem
  const iframe = document.createElement('iframe');
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.setAttribute("sandbox", "allow-scripts");
  iframe.srcdoc = completeCode;

  codePreview.appendChild(iframe);
}
