const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

// Middleware para JSON e CORS
app.use(cors());
app.use(express.json());

// Serve os arquivos estáticos da pasta "public"
app.use(express.static(path.join(__dirname, 'public')));

// Rota principal (opcional)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota protegida para comunicação com OpenAI
app.post('/api/generate', async (req, res) => {
  const userInput = req.body.prompt;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: userInput }],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Erro ao chamar OpenAI:", error);
    res.status(500).json({ error: "Erro ao chamar a OpenAI" });
  }
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
