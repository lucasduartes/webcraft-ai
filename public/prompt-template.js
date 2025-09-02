// prompt-template.js
// Gera o prompt com trilhos para o modelo retornar apenas JSON válido no schema esperado.

window.buildPrompt = function buildPrompt(userInstruction, presetName){
  const preset = window.PRESETS[presetName] || window.PRESETS[window.DEFAULT_PRESET];
  const theme = window.THEME;

  const components = [
    { name: "PageHeader", props: ["title","subtitle","actions"] },
    { name: "FilterBar", props: ["fields","actions"] },
    { name: "Form", props: ["id","fields","submit"] },
    { name: "Field", props: ["name","label","type","required","placeholder","min","max","accept","options"] },
    { name: "DataTable", props: ["columns","rows","pagination","actions","rowSelection"] },
    { name: "EmptyState", props: ["title","description"] },
    { name: "Button", props: ["id","label","kind","ariaLabel"] },
    { name: "Image", props: ["src","alt","width","height","radius","fit"] }
  ];

  // Dica de schema para orientar o modelo (não é o validador real)
  const schemaHint = {
    meta: { preset: preset.id, title: "string" },
    layout: {
      header: { title: "string", subtitle: "string?", actions: "Button[]?" },
      toolbar: "Node[]?",
      content: "Node[]",
      footer: "Node[]?"
    },
    // Importante: Node inclui Image (Field não entra aqui; Field só dentro de Form.fields)
    Node: { component: "(PageHeader|FilterBar|Form|DataTable|EmptyState|Button|Image)", props: "object" }
  };

  return (
`Você é um gerador de telas padronizadas para um ERP.

REGRAS:
- NUNCA gere HTML, CSS ou JavaScript.
- SEMPRE retorne APENAS um JSON puro e válido, sem markdown, sem comentários.
- O JSON deve validar no schema indicado (dica resumida abaixo).
- Use APENAS os componentes listados e suas props conhecidas.
- Textos/labels em pt-BR.
- Para tabelas inclua pagination; para formulários use Field adequadamente.
- NUNCA coloque "Field" diretamente em layout.content; "Field" só pode aparecer dentro de "Form.fields" (component: "Field", props: {...}).
- Para imagem grande de produto, use o componente "Image" com props {src, alt, width, height}.
- Se a instrução pedir lista ou catálogo e NÃO houver fonte de dados indicada, crie dados de exemplo coerentes (pelo menos 8 itens).
- Para preços, use número (ex.: 149.9) para permitir formatação local.
- PARA IMAGENS DE EXEMPLO: use SEMPRE caminhos locais do projeto, NUNCA links externos.
  • Ex.: "assets/imagem-exemplo.png" (não usar https://picsum.photos).

TEMA ATIVO: ${theme.name}. Tokens básicos: cores(brandPrimary=${theme.colors.brandPrimary}, bg=${theme.colors.bgPage}), tipografia base ${theme.typography.fontFamily}.
PRESET OBRIGATÓRIO: ${preset.id} com regiões ${preset.regions.join(', ')}.

COMPONENTES DISPONÍVEIS: ${components.map(c=>c.name+"(props:"+c.props.join(',')+")").join('; ')}.

SCHEMA (dica): ${JSON.stringify(schemaHint)}

INSTRUÇÃO DO USUÁRIO: """${userInstruction}"""
SAÍDA: JSON puro, válido, começando com { e terminando com }. `
  );
};
