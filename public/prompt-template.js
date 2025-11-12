// prompt-template.js
// Gera o prompt com trilhos para o modelo retornar apenas JSON válido no schema esperado.

window.buildPrompt = function buildPrompt(userInstruction, presetName){
  const preset = window.PRESETS[presetName] || window.PRESETS[window.DEFAULT_PRESET];
  const theme = window.THEME;

  const components = [
    { name: "PageHeader", props: ["title","subtitle","actions"] },
    { name: "FilterBar",  props: ["fields","actions"] },
    { name: "Form",       props: ["id","fields","submit"] },
    { name: "Field",      props: ["name","label","type","required","placeholder","min","max","accept","options"] },
    { name: "DataTable",  props: ["columns","rows","pagination","actions","rowSelection"] },
    { name: "EmptyState", props: ["title","description"] },
    { name: "Button",     props: ["id","label","kind","ariaLabel"] },
    { name: "Image",      props: ["src","alt","width","height","radius","fit"] }
  ];

  const schemaHint = {
    meta: { preset: preset.id, title: "string" },
    layout: {
      header:  { title: "string", subtitle: "string?", actions: "Button[]?" },
      toolbar: "Node[]?",
      content: "Node[]",   // OBRIGATÓRIO
      footer:  "Node[]?"
    },
    Node: { component: "(PageHeader|FilterBar|Form|DataTable|EmptyState|Button|Image)", props: "object" }
  };

  const canonicalOutput = {
    meta:   { preset: preset.id, title: "Tela" },
    layout: { header: { title: "string", subtitle: "string?", actions: [] }, toolbar: [], content: [], footer: [] }
  };

  return (
`Você é um gerador de telas padronizadas para um ERP.

REGRAS OBRIGATÓRIAS:
- NUNCA gere HTML, CSS, JavaScript ou markdown. NADA fora do JSON.
- Retorne APENAS um JSON puro e válido, começando com "{" e terminando com "}".
- O objeto DEVE conter "meta" e "layout" (conforme o contrato canônico abaixo). NÃO use "ui".
- "layout.content" É OBRIGATÓRIO e DEVE ter pelo menos 1 nó visível.
  • Priorize incluir um "Form" (com "Field" em "Form.fields") e/ou um "DataTable".
  • Se o pedido envolver listagens, inclua "DataTable" com "columns", "rows" (≥ 8) e "pagination".
  • Se houver filtros/ações, inclua "FilterBar" em "toolbar".
- "Field" só pode aparecer dentro de "Form.fields".
- PageHeader (se usado) com "actions": [] (sempre vazio).
- Imagens devem usar caminhos locais (ex.: "assets/imagem-exemplo.png").
- Textos em pt-BR.
- Respeite o PRESET ${preset.id} e suas regiões: [${preset.regions.join(', ')}].

TEMA ATIVO: ${theme.name} — brandPrimary=${theme.colors.brandPrimary}, bg=${theme.colors.bgPage}, font=${theme.typography.fontFamily}

COMPONENTES:
${components.map(c => `- ${c.name} (props: ${c.props.join(', ')})`).join('\n')}

SCHEMA (dica): ${JSON.stringify(schemaHint)}
CONTRATO CANÔNICO: ${JSON.stringify(canonicalOutput)}

EXEMPLO DE SAÍDA VÁLIDA:
{
  "meta": { "preset": "${preset.id}", "title": "Catálogo de Produtos" },
  "layout": {
    "header": { "title": "Catálogo de Produtos", "subtitle": "Gerencie itens do catálogo", "actions": [] },
    "toolbar": [
      { "component": "FilterBar", "props": {
        "fields": [{ "component":"Field", "props": { "name":"q", "label":"Buscar", "type":"text" } }],
        "actions": [{ "component":"Button", "props": { "id":"novo", "label":"Novo", "kind":"primary", "ariaLabel":"Criar novo" } }]
      } }
    ],
    "content": [
      { "component": "Form", "props": {
        "id": "produtoForm",
        "fields": [
          { "component":"Field", "props": { "name":"nome", "label":"Nome", "type":"text", "required": true } },
          { "component":"Field", "props": { "name":"preco", "label":"Preço", "type":"number" } }
        ],
        "submit": { "id":"salvar", "label":"Salvar", "kind":"primary" }
      } },
      { "component": "DataTable", "props": {
        "columns": [
          { "id":"id", "header":"ID" },
          { "id":"nome", "header":"Nome" },
          { "id":"preco", "header":"Preço" }
        ],
        "rows": [
          { "id": 1, "nome": "Item 1", "preco": 149.9 },
          { "id": 2, "nome": "Item 2", "preco": 99.0 },
          { "id": 3, "nome": "Item 3", "preco": 249.0 },
          { "id": 4, "nome": "Item 4", "preco": 75.5 },
          { "id": 5, "nome": "Item 5", "preco": 199.0 },
          { "id": 6, "nome": "Item 6", "preco": 120.0 },
          { "id": 7, "nome": "Item 7", "preco": 89.0 },
          { "id": 8, "nome": "Item 8", "preco": 310.0 }
        ],
        "pagination": { "page": 1, "pageSize": 10, "total": 8 }
      } }
    ],
    "footer": []
  }
}

INSTRUÇÃO DO USUÁRIO:
"""${userInstruction}"""

SAÍDA:
JSON puro, válido, sem markdown e com "layout.content" NÃO VAZIO.`
  );
};
