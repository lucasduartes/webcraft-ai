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
    { name: "Button", props: ["id","label","kind","ariaLabel"] }
  ];

  const schemaHint = {
    meta: { preset: preset.id, title: "string" },
    layout: {
      header: { title: "string", subtitle: "string?", actions: "Button[]?" },
      toolbar: "Node[]?",
      content: "Node[]",
      footer: "Node[]?"
    },
    Node: { component: "(PageHeader|FilterBar|Form|DataTable|EmptyState|Button)", props: "object" }
  };

  return `Você é um gerador de telas padronizadas para um ERP.\n\n` +
  `REGRAS:\n` +
  `- NUNCA gere HTML, CSS ou JavaScript.\n` +
  `- SEMPRE retorne APENAS um JSON puro e válido, sem markdown, sem comentários.\n` +
  `- O JSON deve validar no schema indicado (dica resumida abaixo).\n` +
  `- Use APENAS os componentes listados e suas props conhecidas.\n` +
  `- Textos/labels em pt-BR.\n` +
  `- Para tabelas inclua pagination; para formulários use Field adequadamente.\n\n` +
  `TEMA ATIVO: ${theme.name}. Tokens básicos: cores(brandPrimary=${theme.colors.brandPrimary}, bg=${theme.colors.bgPage}), tipografia base ${theme.typography.fontFamily}.\n` +
  `PRESET OBRIGATÓRIO: ${preset.id} com regiões ${preset.regions.join(', ')}.\n\n` +
  `COMPONENTES DISPONÍVEIS: ${components.map(c=>c.name+"(props:"+c.props.join(',')+")").join('; ')}.\n\n` +
  `SCHEMA (dica): ${JSON.stringify(schemaHint)}\n\n` +
  `INSTRUÇÃO DO USUÁRIO: """${userInstruction}"""\n` +
  `SAÍDA: JSON puro, válido, começando com { e terminando com }. `;
};
