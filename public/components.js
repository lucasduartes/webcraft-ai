// Biblioteca mínima de componentes. Cada função retorna um elemento DOM.

(function(){
  const h = (tag, opts = {}, children = []) => {
    const el = document.createElement(tag);
    if (opts.class) el.className = opts.class;
    if (opts.style) Object.assign(el.style, opts.style);
    if (opts.attrs) Object.entries(opts.attrs).forEach(([k,v]) => el.setAttribute(k, v));
    if (opts.text != null) el.textContent = opts.text;
    (Array.isArray(children) ? children : [children]).forEach(c => {
      if (c == null) return;
      if (typeof c === "string") el.appendChild(document.createTextNode(c));
      else el.appendChild(c);
    });
    return el;
  };

  const escape = (s) => (s==null?"":String(s))
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

  function Button(props={}){
    const { id, label = "OK", kind = "default", ariaLabel } = props;
    const el = h("button", { class: `btn btn-${kind}`, attrs: { "data-id": id || "", "aria-label": ariaLabel || label } , text: label });
    return el;
  }

  function PageHeader(props={}){
    const { title = "", subtitle = "", actions = [] } = props;
    return h("div", { class: "page-header card" }, [
      h("div", { class: "ph-texts" }, [
        h("h1", { class: "ph-title", text: title }),
        subtitle ? h("div", { class: "ph-subtitle", text: subtitle }) : null
      ]),
      actions?.length ? h("div", { class: "ph-actions" }, actions.map(Button)) : null
    ]);
  }

  function FieldControl(def){
    const { name, label, type = "text", placeholder, required, min, max, accept, options = [] } = def || {};
    const wrap = h("div", { class: "field" });
    const lab = h("label", { attrs: { for: name }, class: "field-label", text: label || name });
    let input;
    if (type === "select") {
      input = h("select", { class: "input", attrs: { name, id: name, required: required?"":null } },
        [h("option", { attrs: { value: "" }, text: "Selecione..." })].concat(
          (options||[]).map(opt => h("option", { attrs: { value: opt.value } , text: opt.label }))
        ));
    } else if (type === "file") {
      input = h("input", { class: "input", attrs: { type: "file", name, id: name, accept: accept || "*/*" } });
    } else if (type === "currency") {
      input = h("input", { class: "input", attrs: { type: "number", step: "0.01", name, id: name, placeholder: placeholder||"0,00", required: required?"":null, min, max } });
    } else {
      input = h("input", { class: "input", attrs: { type, name, id: name, placeholder: placeholder||"", required: required?"":null, min, max } });
    }
    wrap.appendChild(lab);
    wrap.appendChild(input);
    return wrap;
  }

  function FilterBar(props={}){
    const { fields = [], actions = [] } = props;
    return h("div", { class: "toolbar card" }, [
      h("div", { class: "toolbar-fields" }, fields.map(FieldControl)),
      h("div", { class: "toolbar-actions" }, actions.map(Button))
    ]);
  }

  function Form(props={}){
    const { id = "form", fields = [], submit } = props;
    const form = h("form", { class: "card form", attrs: { id } }, fields.map(f => {
      if (f?.component === "Field") return FieldControl(f.props);
      // fallback: permitir definição direta
      return FieldControl(f);
    }));
    if (submit) form.appendChild(h("div", { class: "form-actions" }, [Button(submit)]));
    form.addEventListener("submit", (e)=>{ e.preventDefault(); /* hook de envio */ });
    return form;
  }

  function EmptyState(props={}){
    const { title = "Sem dados", description = "Nenhum registro encontrado." } = props;
    return h("div", { class: "empty card" }, [
      h("div", { class: "empty-title", text: title }),
      h("div", { class: "empty-desc", text: description })
    ]);
  }

  function DataTable(props={}){
    const { columns = [], rows = [], pagination, actions = [], rowSelection } = props;
    const wrap = h("div", { class: "card table-wrap" });

    if (!columns.length) return EmptyState({ title: "Tabela sem colunas" });

    const table = h("table", { class: "table" });
    const thead = h("thead");
    const trh = h("tr");
    if (rowSelection) trh.appendChild(h("th", { text: "" }));
    columns.forEach(c => trh.appendChild(h("th", { text: c.label || c.id })));
    if (actions?.length) trh.appendChild(h("th", { text: "Ações" }));
    thead.appendChild(trh);

    const tbody = h("tbody");
    if (!rows.length) {
      const tr = h("tr");
      const td = h("td", { attrs: { colspan: String(columns.length + (rowSelection?1:0) + (actions?.length?1:0)) } });
      td.appendChild(EmptyState({ description: "" }));
      tr.appendChild(td);
      tbody.appendChild(tr);
    } else {
      rows.forEach(r => {
        const tr = h("tr");
        if (rowSelection) {
          const sel = h("input", { attrs: { type: rowSelection === "multiple" ? "checkbox" : "radio", name: "rowSel" } });
          tr.appendChild(h("td", {}, sel));
        }
        columns.forEach(c => tr.appendChild(h("td", { text: r[c.id] != null ? String(r[c.id]) : "" })));
        if (actions?.length) {
          const td = h("td");
          actions.forEach(a => td.appendChild(Button(a)));
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      });
    }

    table.appendChild(thead);
    table.appendChild(tbody);

    const footer = h("div", { class: "table-footer" }, [
      pagination ? h("span", { text: `Página ${pagination.page} • ${pagination.pageSize}/p • Total ${pagination.total}` }) : null
    ]);

    wrap.appendChild(table);
    wrap.appendChild(footer);
    return wrap;
  }

  window.Components = {
    PageHeader,
    FilterBar,
    Form,
    DataTable,
    EmptyState,
    Button
  };
})();

