/**
 * NsForm
 * ui/components/ns-form.js
 *
 * Formulário em bloco (card) renderizado acima da tabela.
 * Suporta campos simples e compostos, validação por campo e no submit,
 * e integração direta com NsHttp.
 *
 * ── USO BÁSICO ──────────────────────────────────────────────────
 *
 *   const form = new NsForm(document.getElementById('form-container'), {
 *       title: 'Novo pedido',
 *       fields: [
 *           { key: 'cliente',    label: 'Cliente',     type: 'text',     required: true },
 *           { key: 'status',     label: 'Status',      type: 'select',   required: true,
 *             options: [{ value: 'aberto', label: 'Aberto' }, { value: 'fechado', label: 'Fechado' }] },
 *           { key: 'data',       label: 'Data',        type: 'date'      },
 *           { key: 'valor',      label: 'Valor (R$)',  type: 'number'    },
 *           { key: 'preco',      label: 'Preço',       type: 'currency', currency: 'BRL' },
 *           { key: 'ativo',      label: 'Ativo',       type: 'checkbox'  },
 *           { key: 'descricao',  label: 'Descrição',   type: 'textarea'  },
 *           { key: 'tags',       label: 'Tags',        type: 'tags'      },
 *           { key: 'arquivo',    label: 'Anexo',       type: 'file',
 *             accept: '.pdf,.xlsx', hint: 'PDF ou Excel, máx. 5MB' },
 *           { key: 'produto',    label: 'Produto',     type: 'autocomplete',
 *             source: function(query, done) {
 *                 produtosHttp.get({ parameters: { q: query } }).then(done);
 *             }
 *           },
 *       ],
 *       columns: 2,          // campos por linha (padrão: 2)
 *       onSubmit: async function(data) {
 *           await pedidosHttp.post({ data });
 *       },
 *       onCancel: function() {
 *           form.hide();
 *       }
 *   });
 *
 * ── PREENCHENDO PARA EDIÇÃO ──────────────────────────────────────
 *
 *   form.setData({ cliente: 'Ambev', status: 'aberto', valor: 1500 });
 *   form.show();
 *
 * ── LIMPANDO ────────────────────────────────────────────────────
 *
 *   form.reset();   // limpa todos os campos
 *   form.hide();    // colapsa o bloco
 *   form.show();    // expande o bloco
 *
 * ── TIPOS DE CAMPO ───────────────────────────────────────────────
 *
 *   text               — input texto livre
 *   number             — input numérico
 *   currency           — input monetário com máscara (ver seção própria abaixo)
 *   date               — date picker nativo
 *   select             — dropdown (requer options: [{ value, label }])
 *   checkbox           — toggle booleano
 *   textarea           — texto longo
 *   tags               — múltiplos valores livres (Enter ou vírgula para adicionar)
 *   file               — upload de arquivo (retorna FileList no getData())
 *   autocomplete       — busca assíncrona genérica (requer source: fn(query, done))
 *   restlet-autocomplete — busca via RESTlet NetSuite com suporte a filtros entre
 *                          campos e multi-select com badges
 *   listbox            — lista estática (options) sempre visível, com checkbox por
 *                         item (ou radio se multi:false) e busca opcional
 *
 * ── LISTBOX ────────────────────────────────────────────────────
 *
 *   Lista fixa de opções (sem busca em servidor), com checkbox por item —
 *   diferente de autocomplete/restlet-autocomplete, que são "digite para
 *   buscar, selecione, vira badge". No listbox todas as opções ficam
 *   visíveis o tempo todo.
 *
 *   Propriedades do campo (type: 'listbox'):
 *
 *     options       {Array<{value,label}>} — opções estáticas        (obrigatório)
 *     multi         {boolean}   — múltipla seleção via checkbox       (padrão: true)
 *     searchable    {boolean}   — exibe input de busca acima da lista (padrão: true)
 *     placeholder   {string}    — texto do input de busca             (padrão: 'Buscar…')
 *     emptyText     {string}    — texto quando a busca não acha nada  (padrão: 'Nenhum item encontrado.')
 *
 *   getData() retorna:
 *     — multi: true   → { key: ['1', '2'] }  (array de values, string)
 *     — multi: false  → { key: '1' }         (value único, string)
 *
 * ── ONCHANGE POR CAMPO ───────────────────────────────────────────
 *
 *   Qualquer campo aceita `onChange: function(value, allData) {}`, disparado
 *   a cada mudança de valor (campos simples, tags e listbox). Útil para
 *   forms sem botão Salvar (filtros que aplicam ao vivo — ver `footer: false`).
 *
 * ── FORM SEM BOTÃO SALVAR (filtro embutido) ──────────────────────
 *
 *   new NsForm(container, {
 *       footer: false,             // não renderiza o footer (Salvar/Cancelar)
 *       columns: 1,
 *       fields: [
 *           { key: 'status', label: 'Status', type: 'select', options: [...],
 *             onChange: function(value) { recarregarLista(value); } },
 *       ],
 *   });
 *
 * ── RESTLET-AUTOCOMPLETE ─────────────────────────────────────────
 *
 *   Busca via NsHttp (new NsHttp({ script, deployment }).get({ parameters })) —
 *   o RESTlet deve retornar um array `[{ id, name }]`.
 *
 *   Propriedades do campo (type: 'restlet-autocomplete'):
 *
 *     restletScriptId      {string}   — ID do script RESTlet          (obrigatório)
 *     restletDeploymentId  {string}   — ID do deployment RESTlet      (obrigatório)
 *     filterKeys           {string[]} — keys de outros campos do mesmo form cujos
 *                                       valores serão enviados como parâmetros extra
 *                                       na requisição ao RESTlet.    (opcional)
 *     multi                {boolean}  — permite selecionar múltiplos itens como
 *                                       badges clicáveis.            (padrão: false)
 *     placeholder          {string}   — texto do input               (padrão: 'Buscar…')
 *
 *   Exemplo:
 *
 *   fields: [
 *       { key: 'subsidiaria', label: 'Subsidiária', type: 'restlet-autocomplete',
 *         restletScriptId: '123', restletDeploymentId: '1' },
 *
 *       { key: 'produto', label: 'Produto', type: 'restlet-autocomplete',
 *         restletScriptId: '124', restletDeploymentId: '1',
 *         filterKeys: ['subsidiaria'],   // recarrega ao mudar subsidiaria
 *         multi: true },
 *   ]
 *
 *   getData() retorna:
 *     — campo simples  → { produto: '42' }               (id como string)
 *     — campo multi    → { produto: ['42', '7', '15'] }  (array de ids)
 *
 * ── CURRENCY ─────────────────────────────────────────────────────
 *
 *   Input monetário com máscara "digite da direita pra esquerda" (padrão
 *   caixa eletrônico/e-commerce BR): cada dígito digitado entra como centavo
 *   e empurra os demais para a esquerda, formatando ao vivo com separador de
 *   milhar e símbolo da moeda via Intl.NumberFormat (mesma lógica de
 *   NsTable._formatCurrency, para exibição idêntica entre tabela e form).
 *
 *   Propriedades do campo (type: 'currency'):
 *
 *     currency   {string}  — código ISO 4217               (padrão: 'BRL')
 *     locale     {string}  — locale BCP 47                  (padrão: 'pt-BR')
 *
 *   Exemplo:
 *
 *   { key: 'valorUnitario', label: 'Valor Unitário', type: 'currency',
 *     currency: 'BRL', required: true }
 *
 *   getData() retorna o valor como **number** (não string, diferente do tipo
 *   'number') — `null` quando o campo está vazio, nunca uma string formatada.
 *   setData({ valorUnitario: 1234.5 }) aceita number e já exibe formatado.
 *
 * ── GRUPOS DE CAMPOS ─────────────────────────────────────────────
 *
 *   Propriedade opcional `group: string` em qualquer field. Sempre que o
 *   `group` mudar em relação ao campo anterior, um header full-width é
 *   inserido antes dele no grid. Campos sem `group` (ou forms onde nenhum
 *   field declara `group`) renderizam exatamente como antes — sem headers.
 *
 *   Exemplo:
 *
 *   fields: [
 *       { key: 'operationType', label: 'Tipo de Operação', type: 'select',
 *         options: [...], group: 'Classificação' },
 *       { key: 'clientType',    label: 'Tipo de Cliente',  type: 'select',
 *         options: [...], group: 'Classificação' },
 *       { key: 'marginPercent', label: 'Margem (%)',       type: 'number',
 *         group: 'Margem' },
 *   ]
 *
 * ── VALIDAÇÃO ────────────────────────────────────────────────────
 *
 *   required: true                          — campo obrigatório
 *   validate: function(value) {             — validador customizado
 *       if (value < 0) return 'Valor negativo não permitido';
 *       return null;  // null = válido
 *   }
 *   validateOn: 'blur' | 'submit'           — padrão: 'blur' para campos
 *                                             simples, 'submit' para compostos
 *
 * ── ESTILO DO HINT (texto fixo vs. popover sob demanda) ───────────
 *
 *   Por padrão, `field.hint` renderiza como texto fixo abaixo do input
 *   (`.ns-form-hint`). Opção de form `hintStyle: 'tooltip'` troca, PARA TODOS
 *   os campos do form que tiverem `hint`, esse texto fixo por um botão "?" ao
 *   lado do label — clicar abre um popover com o texto, clicar de novo (ou
 *   fora) fecha. Útil para forms densos onde o texto fixo ocupa espaço demais.
 *   Sem `hintStyle` (ou `hintStyle: 'below'`, o padrão), nada muda.
 *
 *   new NsForm(container, {
 *       hintStyle: 'tooltip',
 *       fields: [
 *           { key: 'margem', label: 'Margem (%)', type: 'number',
 *             hint: 'Percentual de lucro líquido sobre o faturamento.' },
 *       ],
 *   });
 */
class NsForm {

    /**
     * @param {HTMLElement} container
     * @param {object}      options
     * @param {string}      [options.title]         — título do card
     * @param {Array}       options.fields           — definição dos campos
     * @param {number}      [options.columns=2]      — colunas no grid
     * @param {Function}    options.onSubmit         — async fn(data) chamado no submit
     * @param {Function}    [options.onCancel]       — fn() chamado no cancelar
     * @param {boolean}     [options.visible=true]   — começa visível
     * @param {string}      [options.submitLabel]    — texto do botão primário
     * @param {string}      [options.cancelLabel]    — texto do botão secundário
     */
    constructor(container, options) {
        this._container   = container;
        this._options     = Object.assign({
            columns:      2,
            visible:      true,
            submitLabel:  'Salvar',
            cancelLabel:  'Cancelar',
            footer:       true,
            hintStyle:    'below', // 'below' (padrão, texto fixo) | 'tooltip' (botão "?" + popover)
        }, options);
        this._errors      = {};
        this._tagValues   = {};     // estado interno dos campos tipo 'tags'
        this._currencyValues = {}; // estado interno (number) dos campos tipo 'currency'
        this._acTimer     = {};     // timers de debounce do autocomplete
        this._raState     = {};     // estado interno dos campos tipo 'restlet-autocomplete'
        this._listeners   = [];
        this.render();
    }

    /* ── API pública ─────────────────────────────────────────────── */

    /** Preenche os campos com um objeto de dados (modo edição) */
    setData(data) {
        if (!data) return;
        this._options.fields.forEach(function(field) {
            if (data[field.key] === undefined) return;
            this._setFieldValue(field, data[field.key]);
        }, this);
    }

    /** Retorna objeto com os valores atuais de todos os campos */
    getData() {
        var data = {};
        this._options.fields.forEach(function(field) {
            data[field.key] = this._getFieldValue(field);
        }, this);
        return data;
    }

    /** Limpa todos os campos e erros */
    reset() {
        this._errors    = {};
        this._tagValues = {};
        this._options.fields.forEach(function(field) {
            this._setFieldValue(field, field.type === 'checkbox' ? false : '');
            this._clearError(field.key);
        }, this);
        this._setSubmitting(false);
    }

    /** Exibe o bloco do formulário */
    show() {
        var card = this._container.querySelector('.ns-form-card');
        if (card) card.style.display = '';
    }

    /** Oculta o bloco do formulário */
    hide() {
        var card = this._container.querySelector('.ns-form-card');
        if (card) card.style.display = 'none';
    }

    /** Exibe erro em um campo específico (ex: erro vindo do servidor) */
    setError(key, message) {
        this._errors[key] = message;
        this._showError(key, message);
    }

    /** Remove o erro de um campo */
    clearError(key) {
        delete this._errors[key];
        this._clearError(key);
    }

    destroy() {
        this._listeners.forEach(function(l) {
            l.el.removeEventListener(l.type, l.fn);
        });
        this._container.innerHTML = '';
    }

    /* ── Renderização ────────────────────────────────────────────── */

    render() {
        var opts    = this._options;
        var visible = opts.visible !== false;

        var footerHtml = opts.footer === false ? '' : [
            '<div class="ns-form-footer">',
            '<div class="ns-form-footer-left" id="ns-form-global-error-' + this._uid() + '"></div>',
            '<div class="ns-form-footer-actions">',
            opts.onCancel
                ? '<button class="ns-btn ns-btn-ghost ns-form-cancel">' + opts.cancelLabel + '</button>'
                : '',
            '<button class="ns-btn ns-btn-primary ns-form-submit">',
            '<span class="ns-form-submit-label">' + opts.submitLabel + '</span>',
            '<span class="ns-form-submit-spinner" style="display:none">',
            '<svg class="ns-icon ns-form-spin" viewBox="0 0 16 16"><path d="M8 2a6 6 0 1 0 6 6"/></svg>',
            '</span>',
            '</button>',
            '</div>',
            '</div>',
        ].join('');

        this._container.innerHTML = [
            '<div class="ns-form-card" style="' + (visible ? '' : 'display:none') + '">',
            opts.title ? '<div class="ns-form-header"><span class="ns-form-title">' + opts.title + '</span></div>' : '',
            '<div class="ns-form-body">',
            '<div class="ns-form-grid" style="--ns-form-cols:' + opts.columns + '">',
            opts.fields.map(function(f, i) {
                var prevGroup  = i > 0 ? opts.fields[i - 1].group : null;
                var groupHtml  = (f.group && f.group !== prevGroup) ? this._renderGroupHeader(f.group, i === 0) : '';
                return groupHtml + this._renderField(f);
            }, this).join(''),
            '</div>',
            '</div>',
            footerHtml,
            '</div>',
        ].join('');

        this._bindFormEvents();
        this._bindFieldEvents();
        if (this._options.hintStyle === 'tooltip') this._bindHintEvents();
        this._injectStyles();
    }

    /* ── HTML de cada tipo de campo ─────────────────────────────── */

    _renderField(field) {
        var id          = 'ns-field-' + field.key;
        var isWide      = field.wide || field.type === 'textarea';
        var input       = this._renderInput(field, id);
        var useTooltip  = this._options.hintStyle === 'tooltip' && !!field.hint;

        return [
            '<div class="ns-form-field' + (isWide ? ' ns-form-field--wide' : '') + '" data-field-key="' + field.key + '">',
            '<span class="ns-form-label-row">',
            '<label class="ns-form-label" for="' + id + '">',
            field.label,
            field.required ? '<span class="ns-form-required" aria-hidden="true">*</span>' : '',
            '</label>',
            useTooltip ? this._renderHintTrigger(field) : '',
            '</span>',
            input,
            (!useTooltip && field.hint) ? '<div class="ns-form-hint">' + field.hint + '</div>' : '',
            '<div class="ns-form-error" id="ns-error-' + field.key + '" role="alert"></div>',
            '</div>',
        ].join('');
    }

    /**
     * Botão "?" + popover do hint em modo `hintStyle: 'tooltip'` (ver cabeçalho
     * da classe) — substitui o `.ns-form-hint` fixo abaixo do input. Popover
     * começa fechado; `_bindHintEvents` cuida de abrir/fechar por clique.
     * @param {object} field
     * @returns {string}
     */
    _renderHintTrigger(field) {
        return [
            '<span class="ns-form-hint-wrap">',
            '<button type="button" class="ns-form-hint-trigger" data-hint-key="' + field.key + '" aria-label="Ajuda: ' + field.label + '">?</button>',
            '<div class="ns-form-hint-popover" role="tooltip" data-hint-key="' + field.key + '">' + field.hint + '</div>',
            '</span>',
        ].join('');
    }

    /**
     * Header full-width de um grupo de campos (propriedade `field.group`).
     * Inserido antes do primeiro campo de cada grupo, sempre que `group`
     * muda em relação ao campo anterior. O primeiro grupo do form não tem
     * borda superior, para não duplicar a borda do header do card.
     * @param {string}  label
     * @param {boolean} isFirst
     * @returns {string}
     */
    _renderGroupHeader(label, isFirst) {
        return [
            '<div class="ns-form-group-header' + (isFirst ? ' ns-form-group-header--first' : '') + '">',
            label,
            '</div>',
        ].join('');
    }

    _renderInput(field, id) {
        switch (field.type) {

            case 'select':
                return [
                    '<select class="ns-select ns-form-input" id="' + id + '" name="' + field.key + '">',
                    '<option value="">Selecione…</option>',
                    (field.options || []).map(function(o) {
                        return '<option value="' + o.value + '">' + o.label + '</option>';
                    }).join(''),
                    '</select>',
                ].join('');

            case 'textarea':
                return '<textarea class="ns-input ns-form-input ns-form-textarea" id="' + id + '" name="' + field.key + '" rows="3" placeholder="' + (field.placeholder || '') + '"></textarea>';

            case 'checkbox':
                return [
                    '<label class="ns-form-toggle">',
                    '<input type="checkbox" class="ns-form-input" id="' + id + '" name="' + field.key + '">',
                    '<span class="ns-form-toggle-track">',
                    '<span class="ns-form-toggle-thumb"></span>',
                    '</span>',
                    field.checkboxLabel
                        ? '<span class="ns-form-toggle-label">' + field.checkboxLabel + '</span>'
                        : '',
                    '</label>',
                ].join('');

            case 'tags':
                return [
                    '<div class="ns-form-tags" id="' + id + '" data-field-key="' + field.key + '" tabindex="0">',
                    '<span class="ns-form-tags-placeholder">' + (field.placeholder || 'Digite e pressione Enter…') + '</span>',
                    '<input type="text" class="ns-form-tags-input" autocomplete="off" aria-label="' + field.label + '">',
                    '</div>',
                    '<input type="hidden" class="ns-form-input" name="' + field.key + '">',
                ].join('');

            case 'file':
                return [
                    '<label class="ns-form-file" for="' + id + '">',
                    '<svg class="ns-icon" viewBox="0 0 16 16"><path d="M8 1v8M5 6l3-3 3 3"/><path d="M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2"/></svg>',
                    '<span class="ns-form-file-label">Selecionar arquivo</span>',
                    '<input type="file" class="ns-form-input" id="' + id + '" name="' + field.key + '"',
                    field.accept   ? ' accept="'   + field.accept   + '"' : '',
                    field.multiple ? ' multiple'                          : '',
                    '>',
                    '</label>',
                    '<div class="ns-form-file-name"></div>',
                ].join('');

            case 'autocomplete':
                return [
                    '<div class="ns-form-ac-wrap">',
                    '<input type="text" class="ns-input ns-form-input ns-form-ac-input" id="' + id + '" name="' + field.key + '" autocomplete="off" placeholder="' + (field.placeholder || 'Buscar…') + '">',
                    '<input type="hidden" class="ns-form-ac-value" name="' + field.key + '-id">',
                    '<div class="ns-form-ac-dropdown" style="display:none"></div>',
                    '</div>',
                ].join('');

            case 'restlet-autocomplete':
                return [
                    '<div class="ns-form-ra-wrap" data-field-key="' + field.key + '">',
                    // Status bar: loading/error
                    '<div class="ns-form-ra-status" style="display:none"></div>',
                    // Badge container (multi only)
                    field.multi
                        ? '<div class="ns-form-ra-badges" id="' + id + '-badges"></div>'
                        : '',
                    // Text input
                    '<input type="text"',
                    '  class="ns-input ns-form-ra-input"',
                    '  id="' + id + '"',
                    '  autocomplete="off"',
                    '  placeholder="' + (field.placeholder || 'Buscar…') + '"',
                    '>',
                    // Hidden value storage (single: string, multi: JSON array)
                    '<input type="hidden" class="ns-form-input ns-form-ra-value" name="' + field.key + '">',
                    // Dropdown
                    '<div class="ns-form-ra-dropdown" style="display:none"></div>',
                    '</div>',
                ].join('');

            case 'listbox': {
                var isMulti      = field.multi !== false;
                var searchable   = field.searchable !== false;
                var inputType    = isMulti ? 'checkbox' : 'radio';
                var groupName    = isMulti ? (id + '-opt') : field.key;
                var options      = field.options || [];

                return [
                    '<div class="ns-form-listbox" data-field-key="' + field.key + '">',
                    searchable
                        ? '<input type="text" class="ns-input ns-form-listbox-search" id="' + id + '" autocomplete="off" placeholder="' + (field.placeholder || 'Buscar…') + '">'
                        : '',
                    '<div class="ns-form-listbox-list" role="listbox">',
                    options.map(function(o) {
                        return [
                            '<label class="ns-form-listbox-option">',
                            '<input type="' + inputType + '" name="' + groupName + '" value="' + o.value + '">',
                            '<span class="ns-form-listbox-option-label">' + o.label + '</span>',
                            '</label>',
                        ].join('');
                    }).join(''),
                    options.length === 0 ? '<div class="ns-form-listbox-empty">' + (field.emptyText || 'Nenhum item encontrado.') + '</div>' : '',
                    '<div class="ns-form-listbox-empty ns-form-listbox-no-match" style="display:none">' + (field.emptyText || 'Nenhum item encontrado.') + '</div>',
                    '</div>',
                    '</div>',
                    '<input type="hidden" class="ns-form-input" name="' + field.key + '">',
                ].join('');
            }

            case 'number':
                return '<input type="number" class="ns-input ns-form-input" id="' + id + '" name="' + field.key + '" placeholder="' + (field.placeholder || '0') + '" ' + (field.min != null ? 'min="' + field.min + '"' : '') + ' ' + (field.max != null ? 'max="' + field.max + '"' : '') + '>';

            case 'currency':
                return '<input type="text" inputmode="decimal" class="ns-input ns-form-input ns-mono" id="' + id + '" name="' + field.key + '" placeholder="' + (field.placeholder || this._formatCurrencyDisplay(0, field.currency, field.locale)) + '" autocomplete="off">';

            case 'date':
                return '<input type="date" class="ns-input ns-form-input" id="' + id + '" name="' + field.key + '">';

            default: // 'text'
                return '<input type="text" class="ns-input ns-form-input" id="' + id + '" name="' + field.key + '" placeholder="' + (field.placeholder || '') + '">';
        }
    }

    /* ── Eventos do formulário ───────────────────────────────────── */

    _bindFormEvents() {
        var self = this;

        // Submit
        var submitBtn = this._container.querySelector('.ns-form-submit');
        if (submitBtn) {
            var submitFn = function() { self._handleSubmit(); };
            submitBtn.addEventListener('click', submitFn);
            this._listeners.push({ el: submitBtn, type: 'click', fn: submitFn });
        }

        // Cancelar
        var cancelBtn = this._container.querySelector('.ns-form-cancel');
        if (cancelBtn) {
            var cancelFn = function() {
                if (typeof self._options.onCancel === 'function') {
                    self._options.onCancel();
                }
            };
            cancelBtn.addEventListener('click', cancelFn);
            this._listeners.push({ el: cancelBtn, type: 'click', fn: cancelFn });
        }
    }

    _bindFieldEvents() {
        var self = this;

        this._options.fields.forEach(function(field) {
            switch (field.type) {
                case 'tags':                 return self._bindTagsEvents(field);
                case 'file':                 return self._bindFileEvents(field);
                case 'autocomplete':         return self._bindAutocompleteEvents(field);
                case 'restlet-autocomplete': return self._bindRestletAutocompleteEvents(field);
                case 'currency':             return self._bindCurrencyEvents(field);
                case 'listbox':              return self._bindListboxEvents(field);
                default:                     return self._bindSimpleFieldEvents(field);
            }
        });
    }

    _bindSimpleFieldEvents(field) {
        var self  = this;
        var input = this._getInput(field.key);
        if (!input) return;

        // validação no blur (padrão para campos simples)
        var validateOn = field.validateOn || 'blur';
        if (validateOn === 'blur') {
            var blurFn = function() { self._validateField(field); };
            input.addEventListener('blur', blurFn);
            this._listeners.push({ el: input, type: 'blur', fn: blurFn });
        }

        // limpa erro enquanto digita
        var inputFn = function() { self._clearError(field.key); };
        input.addEventListener('input', inputFn);
        this._listeners.push({ el: input, type: 'input', fn: inputFn });

        // valor "comitado" (select/date/checkbox mudam aqui; texto no blur/enter)
        var changeFn = function() { self._fireOnChange(field); };
        input.addEventListener('change', changeFn);
        this._listeners.push({ el: input, type: 'change', fn: changeFn });
    }

    /**
     * Abre/fecha o popover do hint (modo `hintStyle: 'tooltip'`, ver cabeçalho
     * da classe) — um único listener delegado no container (clique no botão
     * "?" alterna o próprio popover e fecha qualquer outro aberto no mesmo
     * form) + um listener no `document` pra fechar ao clicar fora do form.
     */
    _bindHintEvents() {
        var self = this;

        var clickFn = function(e) {
            var trigger = e.target.closest('.ns-form-hint-trigger');
            self._container.querySelectorAll('.ns-form-hint-popover.is-open').forEach(function(p) {
                if (!trigger || p.dataset.hintKey !== trigger.dataset.hintKey) p.classList.remove('is-open');
            });
            if (!trigger) return;
            var popover = self._container.querySelector('.ns-form-hint-popover[data-hint-key="' + trigger.dataset.hintKey + '"]');
            if (popover) popover.classList.toggle('is-open');
        };
        this._container.addEventListener('click', clickFn);
        this._listeners.push({ el: this._container, type: 'click', fn: clickFn });

        var outsideFn = function(e) {
            if (self._container.contains(e.target)) return;
            self._container.querySelectorAll('.ns-form-hint-popover.is-open').forEach(function(p) { p.classList.remove('is-open'); });
        };
        document.addEventListener('click', outsideFn);
        this._listeners.push({ el: document, type: 'click', fn: outsideFn });
    }

    /** Dispara field.onChange(value, allData), se definido. */
    _fireOnChange(field) {
        if (typeof field.onChange === 'function') {
            field.onChange(this._getFieldValue(field), this.getData());
        }
    }

    /* ── Listbox (lista fixa com checkbox/radio) ────────────────── */

    _bindListboxEvents(field) {
        var self = this;
        var wrap = this._container.querySelector('.ns-form-listbox[data-field-key="' + field.key + '"]');
        if (!wrap) return;

        var search = wrap.querySelector('.ns-form-listbox-search');
        var list   = wrap.querySelector('.ns-form-listbox-list');
        var hidden = this._container.querySelector('input[name="' + field.key + '"]');
        var isMulti = field.multi !== false;

        var changeFn = function() {
            var checked = Array.prototype.slice.call(
                list.querySelectorAll('input[type="checkbox"]:checked, input[type="radio"]:checked')
            ).map(function(inp) { return inp.value; });

            if (hidden) hidden.value = isMulti ? JSON.stringify(checked) : (checked[0] || '');

            self._clearError(field.key);
            self._fireOnChange(field);
        };
        list.addEventListener('change', changeFn);
        this._listeners.push({ el: list, type: 'change', fn: changeFn });

        if (search) {
            var noMatch = list.querySelector('.ns-form-listbox-no-match');
            var searchFn = function() {
                var query   = search.value.trim().toLowerCase();
                var visible = 0;
                list.querySelectorAll('.ns-form-listbox-option').forEach(function(option) {
                    var label = option.querySelector('.ns-form-listbox-option-label').textContent.toLowerCase();
                    var match = !query || label.indexOf(query) !== -1;
                    option.style.display = match ? '' : 'none';
                    if (match) visible++;
                });
                if (noMatch) noMatch.style.display = visible === 0 ? '' : 'none';
            };
            search.addEventListener('input', searchFn);
            this._listeners.push({ el: search, type: 'input', fn: searchFn });
        }
    }

    /* ── Currency ────────────────────────────────────────────────── */

    /**
     * Máscara "da direita pra esquerda": cada dígito digitado entra como
     * centavo, empurrando os demais. O valor numérico real fica em
     * `_currencyValues[field.key]` — o input só mostra o texto formatado.
     */
    _bindCurrencyEvents(field) {
        var self  = this;
        var input = this._getInput(field.key);
        if (!input) return;

        this._currencyValues[field.key] = null;

        var inputFn = function() {
            var digits = input.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');

            if (!digits) {
                self._currencyValues[field.key] = null;
                input.value = '';
            } else {
                var num = parseInt(digits, 10) / 100;
                self._currencyValues[field.key] = num;
                input.value = self._formatCurrencyDisplay(num, field.currency, field.locale);
            }
            self._clearError(field.key);
            self._fireOnChange(field);
        };
        input.addEventListener('input', inputFn);
        this._listeners.push({ el: input, type: 'input', fn: inputFn });

        // cursor sempre no fim — evita edição no meio do valor formatado
        var caretFn = function() {
            var pos = input.value.length;
            setTimeout(function() { input.setSelectionRange(pos, pos); }, 0);
        };
        input.addEventListener('click', caretFn);
        input.addEventListener('keyup', caretFn);
        this._listeners.push({ el: input, type: 'click', fn: caretFn });
        this._listeners.push({ el: input, type: 'keyup', fn: caretFn });

        var validateOn = field.validateOn || 'blur';
        if (validateOn === 'blur') {
            var blurFn = function() { self._validateField(field); };
            input.addEventListener('blur', blurFn);
            this._listeners.push({ el: input, type: 'blur', fn: blurFn });
        }
    }

    /**
     * @param {number} num
     * @param {string} [currencyCode='BRL']
     * @param {string} [locale='pt-BR']
     * @returns {string}
     */
    _formatCurrencyDisplay(num, currencyCode, locale) {
        return new Intl.NumberFormat(locale || 'pt-BR', {
            style:    'currency',
            currency: currencyCode || 'BRL',
        }).format(num || 0);
    }

    /* ── Tags ────────────────────────────────────────────────────── */

    _bindTagsEvents(field) {
        var self      = this;
        var wrap      = this._container.querySelector('[data-field-key="' + field.key + '"].ns-form-tags');
        var textInput = wrap && wrap.querySelector('.ns-form-tags-input');
        if (!wrap || !textInput) return;

        this._tagValues[field.key] = [];

        var keyFn = function(e) {
            if (e.key !== 'Enter' && e.key !== ',') return;
            e.preventDefault();
            var val = textInput.value.trim().replace(/,$/, '');
            if (!val) return;
            self._addTag(field.key, val, wrap, textInput);
            textInput.value = '';
            self._fireOnChange(field);
        };
        textInput.addEventListener('keydown', keyFn);
        this._listeners.push({ el: textInput, type: 'keydown', fn: keyFn });

        // delegação para remoção de tags
        var clickFn = function(e) {
            var btn = e.target.closest('.ns-form-tag-remove');
            if (!btn) return;
            var tag = btn.dataset.tag;
            self._removeTag(field.key, tag, wrap);
            self._fireOnChange(field);
        };
        wrap.addEventListener('click', clickFn);
        this._listeners.push({ el: wrap, type: 'click', fn: clickFn });

        // foca o input ao clicar no wrapper
        var focusFn = function() { textInput.focus(); };
        wrap.addEventListener('click', focusFn);
        this._listeners.push({ el: wrap, type: 'click', fn: focusFn });
    }

    _addTag(key, value, wrap, textInput) {
        if (this._tagValues[key].indexOf(value) !== -1) return;
        this._tagValues[key].push(value);
        this._syncTagsHidden(key);

        var placeholder = wrap.querySelector('.ns-form-tags-placeholder');
        if (placeholder) placeholder.style.display = 'none';

        var tag = document.createElement('span');
        tag.className = 'ns-form-tag';
        tag.innerHTML = value + '<button type="button" class="ns-form-tag-remove" data-tag="' + value + '" aria-label="Remover ' + value + '">×</button>';
        wrap.insertBefore(tag, textInput);
    }

    _removeTag(key, value, wrap) {
        this._tagValues[key] = this._tagValues[key].filter(function(t) { return t !== value; });
        this._syncTagsHidden(key);

        var tag = wrap.querySelector('[data-tag="' + value + '"]');
        if (tag) tag.closest('.ns-form-tag').remove();

        if (this._tagValues[key].length === 0) {
            var placeholder = wrap.querySelector('.ns-form-tags-placeholder');
            if (placeholder) placeholder.style.display = '';
        }
    }

    _syncTagsHidden(key) {
        var hidden = this._container.querySelector('input[name="' + key + '"]');
        if (hidden) hidden.value = JSON.stringify(this._tagValues[key]);
    }

    /* ── File ────────────────────────────────────────────────────── */

    _bindFileEvents(field) {
        var self  = this;
        var input = this._getInput(field.key);
        if (!input) return;

        var changeFn = function() {
            var nameEl = input.closest('.ns-form-field').querySelector('.ns-form-file-name');
            if (!nameEl) return;
            var files = Array.from(input.files).map(function(f) { return f.name; });
            nameEl.textContent = files.length ? files.join(', ') : '';
        };
        input.addEventListener('change', changeFn);
        this._listeners.push({ el: input, type: 'change', fn: changeFn });
    }

    /* ── Autocomplete (genérico) ─────────────────────────────────── */

    _bindAutocompleteEvents(field) {
        var self     = this;
        var wrap     = this._container.querySelector('#ns-field-' + field.key).closest('.ns-form-ac-wrap');
        if (!wrap) return;

        var textInput = wrap.querySelector('.ns-form-ac-input');
        var dropdown  = wrap.querySelector('.ns-form-ac-dropdown');

        var inputFn = function() {
            clearTimeout(self._acTimer[field.key]);
            var query = textInput.value.trim();

            if (!query) { dropdown.style.display = 'none'; return; }

            self._acTimer[field.key] = setTimeout(function() {
                if (typeof field.source !== 'function') return;

                dropdown.innerHTML = '<div class="ns-form-ac-loading">Buscando…</div>';
                dropdown.style.display = '';

                field.source(query, function(results) {
                    if (!results || !results.length) {
                        dropdown.innerHTML = '<div class="ns-form-ac-empty">Nenhum resultado</div>';
                        return;
                    }
                    dropdown.innerHTML = results.map(function(item) {
                        var label = typeof item === 'string' ? item : (item.label || item.name || item.text || '');
                        var value = typeof item === 'string' ? item : (item.value || item.id || label);
                        return '<div class="ns-form-ac-option" data-value="' + value + '" data-label="' + label + '">' + label + '</div>';
                    }).join('');
                });
            }, 280);
        };
        textInput.addEventListener('input', inputFn);
        this._listeners.push({ el: textInput, type: 'input', fn: inputFn });

        // seleção de opção
        var clickFn = function(e) {
            var option = e.target.closest('.ns-form-ac-option');
            if (!option) return;
            textInput.value = option.dataset.label;
            wrap.querySelector('.ns-form-ac-value').value = option.dataset.value;
            dropdown.style.display = 'none';
            self._clearError(field.key);
        };
        dropdown.addEventListener('click', clickFn);
        this._listeners.push({ el: dropdown, type: 'click', fn: clickFn });

        // fecha ao perder foco
        var blurFn = function() {
            setTimeout(function() { dropdown.style.display = 'none'; }, 180);
        };
        textInput.addEventListener('blur', blurFn);
        this._listeners.push({ el: textInput, type: 'blur', fn: blurFn });
    }

    /* ── Restlet Autocomplete ────────────────────────────────────── */

    /**
     * Inicializa o estado interno e registra todos os event listeners
     * para um campo do tipo 'restlet-autocomplete'.
     *
     * Fluxo:
     *  1. Na montagem, dispara _raFetch() para popular o dropdown.
     *  2. Cada campo listado em filterKeys registra um listener de mudança
     *     (via evento customizado 'ns-ra-changed') que re-dispara _raFetch().
     *  3. Ao selecionar um item, emite 'ns-ra-changed' no próprio campo,
     *     permitindo que outros campos que o usem como filtro se atualizem.
     */
    _bindRestletAutocompleteEvents(field) {
        var self = this;

        var wrap      = this._container.querySelector('.ns-form-ra-wrap[data-field-key="' + field.key + '"]');
        if (!wrap) return;

        var textInput = wrap.querySelector('.ns-form-ra-input');
        var dropdown  = wrap.querySelector('.ns-form-ra-dropdown');
        var hidden    = wrap.querySelector('.ns-form-ra-value');
        var statusEl  = wrap.querySelector('.ns-form-ra-status');
        var badgesEl  = field.multi ? wrap.querySelector('.ns-form-ra-badges') : null;

        // Estado deste campo
        this._raState[field.key] = {
            allItems:     [],   // todos os itens retornados pelo RESTlet
            selectedIds:  [],   // ids selecionados (multi) ou [id] (single)
        };

        // ── Busca inicial ──────────────────────────────────────────
        this._raFetch(field, wrap, textInput, dropdown, hidden, statusEl, badgesEl);

        // ── Digitação no input: filtra o dropdown localmente ───────
        var inputFn = function() {
            self._raFilterDropdown(field, wrap, textInput, dropdown, hidden, badgesEl);
        };
        textInput.addEventListener('input', inputFn);
        this._listeners.push({ el: textInput, type: 'input', fn: inputFn });

        // ── Clique em opção do dropdown ────────────────────────────
        var clickFn = function(e) {
            var option = e.target.closest('.ns-form-ra-option');
            if (!option) return;
            self._raSelectItem(field, option.dataset.id, option.dataset.name,
                wrap, textInput, dropdown, hidden, badgesEl);
        };
        dropdown.addEventListener('click', clickFn);
        this._listeners.push({ el: dropdown, type: 'click', fn: clickFn });

        // ── Remoção de badge (multi) ───────────────────────────────
        if (badgesEl) {
            var badgeClickFn = function(e) {
                var btn = e.target.closest('.ns-form-ra-badge-remove');
                if (!btn) return;
                self._raRemoveItem(field, btn.dataset.id, wrap, textInput, dropdown, hidden, badgesEl);
            };
            badgesEl.addEventListener('click', badgeClickFn);
            this._listeners.push({ el: badgesEl, type: 'click', fn: badgeClickFn });
        }

        // ── Fecha dropdown ao perder foco ─────────────────────────
        var blurFn = function() {
            // Delay para permitir que o clique no dropdown seja processado primeiro
            setTimeout(function() {
                dropdown.style.display = 'none';
                // Restaura o label do item selecionado se o usuário apagou sem selecionar
                if (!field.multi) {
                    var state = self._raState[field.key];
                    var selectedId = state.selectedIds[0] || null;
                    if (selectedId) {
                        var item = state.allItems.find(function(i) { return String(i.id) === String(selectedId); });
                        textInput.value = item ? item.name : '';
                    } else {
                        textInput.value = '';
                    }
                } else {
                    textInput.value = '';
                }
            }, 200);
        };
        textInput.addEventListener('blur', blurFn);
        this._listeners.push({ el: textInput, type: 'blur', fn: blurFn });

        // ── Abre dropdown ao focar (mostra opções disponíveis) ─────
        var focusFn = function() {
            self._raFilterDropdown(field, wrap, textInput, dropdown, hidden, badgesEl);
        };
        textInput.addEventListener('focus', focusFn);
        this._listeners.push({ el: textInput, type: 'focus', fn: focusFn });

        // ── Escuta mudanças nos campos de filtro ───────────────────
        if (field.filterKeys && field.filterKeys.length) {
            field.filterKeys.forEach(function(filterKey) {
                var refetch = function() {
                    // Limpa seleção atual ao recarregar por mudança de filtro
                    self._raClearSelection(field, textInput, hidden, badgesEl);
                    self._raFetch(field, wrap, textInput, dropdown, hidden, statusEl, badgesEl);
                };
                // Evento customizado emitido por outros campos restlet-autocomplete
                self._container.addEventListener('ns-ra-changed:' + filterKey, refetch);
                self._listeners.push({ el: self._container, type: 'ns-ra-changed:' + filterKey, fn: refetch });

                // Compatibilidade: campos select/input nativos do form
                var filterInput = self._container.querySelector('[name="' + filterKey + '"]');
                if (filterInput) {
                    filterInput.addEventListener('change', refetch);
                    self._listeners.push({ el: filterInput, type: 'change', fn: refetch });
                }
            });
        }
    }

    /**
     * Faz a requisição ao RESTlet via NsHttp e popula _raState[field.key].allItems.
     */
    _raFetch(field, wrap, textInput, dropdown, hidden, statusEl, badgesEl) {
        var self = this;

        if (!field.restletScriptId || !field.restletDeploymentId) {
            console.error('[NsForm] restlet-autocomplete "' + field.key + '": restletScriptId e restletDeploymentId são obrigatórios.');
            return;
        }

        // Coleta parâmetros de filtro de outros campos do form
        var parameters = {};
        if (field.filterKeys && field.filterKeys.length) {
            field.filterKeys.forEach(function(filterKey) {
                var filterField = self._options.fields.find(function(f) { return f.key === filterKey; });
                if (!filterField) return;

                var value = self._getFieldValue(filterField);
                // Para campos multi, envia o array como JSON
                parameters[filterKey] = Array.isArray(value) ? JSON.stringify(value) : (value || '');
            });
        }

        // UI: loading
        self._raSetStatus(statusEl, 'loading', 'Carregando…');
        textInput.disabled = true;

        var http = new NsHttp({ script: field.restletScriptId, deployment: field.restletDeploymentId });

        http.get({ parameters: parameters }).then(function(data) {
            // data deve ser Array<{ id, name }>
            self._raState[field.key].allItems = Array.isArray(data) ? data : [];
            textInput.disabled = false;
            self._raSetStatus(statusEl, null);
            // Valida se o item selecionado ainda existe na nova lista
            self._raRevalidateSelection(field, textInput, hidden, badgesEl);
            // Atualiza dropdown se estiver visível
            if (dropdown.style.display !== 'none') {
                self._raFilterDropdown(field, wrap, textInput, dropdown, hidden, badgesEl);
            }
        }).catch(function(err) {
            textInput.disabled = false;
            self._raSetStatus(statusEl, 'error', (err && err.message) || 'Erro ao carregar');
        });
    }

    /** Filtra _raState.allItems pelo texto digitado e renderiza o dropdown */
    _raFilterDropdown(field, wrap, textInput, dropdown, hidden, badgesEl) {
        var state     = this._raState[field.key];
        var query     = textInput.value.trim().toLowerCase();
        var selectedIds = state.selectedIds;

        // Remove itens já selecionados (multi) ou o item corrente (single)
        var available = state.allItems.filter(function(item) {
            return selectedIds.indexOf(String(item.id)) === -1;
        });

        // Filtra pelo texto digitado
        var filtered = query
            ? available.filter(function(item) {
                return item.name.toLowerCase().indexOf(query) !== -1;
            })
            : available;

        if (!filtered.length) {
            dropdown.innerHTML = '<div class="ns-form-ra-empty">' +
                (query ? 'Nenhum resultado para "' + query + '"' : 'Nenhum item disponível') +
                '</div>';
        } else {
            dropdown.innerHTML = filtered.map(function(item) {
                // Destaca o trecho digitado no nome
                var label = item.name;
                if (query) {
                    var idx = label.toLowerCase().indexOf(query);
                    label = label.slice(0, idx)
                        + '<mark class="ns-form-ra-highlight">' + label.slice(idx, idx + query.length) + '</mark>'
                        + label.slice(idx + query.length);
                }
                return '<div class="ns-form-ra-option" data-id="' + item.id + '" data-name="' + item.name + '">' + label + '</div>';
            }).join('');
        }

        dropdown.style.display = '';
    }

    /** Seleciona um item: atualiza estado, hidden, input e emite evento */
    _raSelectItem(field, id, name, wrap, textInput, dropdown, hidden, badgesEl) {
        var state = this._raState[field.key];

        if (field.multi) {
            // Evita duplicata
            if (state.selectedIds.indexOf(String(id)) !== -1) return;

            state.selectedIds.push(String(id));
            this._raSyncHidden(field, hidden);
            this._raRenderBadges(field, badgesEl);
            textInput.value = '';
            dropdown.style.display = 'none';
        } else {
            state.selectedIds = [String(id)];
            this._raSyncHidden(field, hidden);
            textInput.value = name;
            dropdown.style.display = 'none';
        }

        this._clearError(field.key);

        // Notifica outros campos que usam este como filtro
        var event = new CustomEvent('ns-ra-changed:' + field.key, { bubbles: true });
        this._container.dispatchEvent(event);
    }

    /** Remove um item selecionado (multi) */
    _raRemoveItem(field, id, wrap, textInput, dropdown, hidden, badgesEl) {
        var state = this._raState[field.key];
        state.selectedIds = state.selectedIds.filter(function(sid) { return sid !== String(id); });
        this._raSyncHidden(field, hidden);
        this._raRenderBadges(field, badgesEl);

        // Notifica dependentes
        var event = new CustomEvent('ns-ra-changed:' + field.key, { bubbles: true });
        this._container.dispatchEvent(event);
    }

    /** Limpa toda a seleção do campo */
    _raClearSelection(field, textInput, hidden, badgesEl) {
        this._raState[field.key].selectedIds = [];
        this._raSyncHidden(field, hidden);
        if (textInput) textInput.value = '';
        if (badgesEl)  badgesEl.innerHTML = '';
    }

    /**
     * Após recarregar a lista, verifica se os ids selecionados ainda existem.
     * Remove os que sumiram e atualiza o label do single.
     */
    _raRevalidateSelection(field, textInput, hidden, badgesEl) {
        var state = this._raState[field.key];
        var validIds = state.allItems.map(function(i) { return String(i.id); });

        state.selectedIds = state.selectedIds.filter(function(sid) {
            return validIds.indexOf(sid) !== -1;
        });

        this._raSyncHidden(field, hidden);

        if (field.multi) {
            this._raRenderBadges(field, badgesEl);
        } else {
            var selectedId = state.selectedIds[0] || null;
            if (selectedId) {
                var item = state.allItems.find(function(i) { return String(i.id) === selectedId; });
                textInput.value = item ? item.name : '';
            } else {
                textInput.value = '';
            }
        }
    }

    /** Renderiza os badges de itens selecionados no modo multi */
    _raRenderBadges(field, badgesEl) {
        if (!badgesEl) return;
        var state = this._raState[field.key];

        badgesEl.innerHTML = state.selectedIds.map(function(id) {
            var item = state.allItems.find(function(i) { return String(i.id) === id; });
            var name = item ? item.name : id;
            return [
                '<span class="ns-form-ra-badge">',
                '<span class="ns-form-ra-badge-label">' + name + '</span>',
                '<button type="button" class="ns-form-ra-badge-remove" data-id="' + id + '" aria-label="Remover ' + name + '">',
                '<svg viewBox="0 0 10 10" width="10" height="10"><path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
                '</button>',
                '</span>',
            ].join('');
        }).join('');
    }

    /** Sincroniza o campo hidden com os ids selecionados */
    _raSyncHidden(field, hidden) {
        var state = this._raState[field.key];
        if (field.multi) {
            hidden.value = JSON.stringify(state.selectedIds);
        } else {
            hidden.value = state.selectedIds[0] || '';
        }
    }

    /** Exibe ou oculta a barra de status (loading/error) */
    _raSetStatus(statusEl, type, message) {
        if (!statusEl) return;
        if (!type) {
            statusEl.style.display = 'none';
            statusEl.textContent   = '';
            return;
        }
        statusEl.className   = 'ns-form-ra-status ns-form-ra-status--' + type;
        statusEl.textContent = message || '';
        statusEl.style.display = '';
    }

    /* ── Submit ──────────────────────────────────────────────────── */

    _handleSubmit() {
        var self = this;

        if (!this._validateAll()) return;

        var data = this.getData();
        this._setSubmitting(true);
        this._clearGlobalError();

        var result = this._options.onSubmit(data);

        // suporta onSubmit síncrono e assíncrono (Promise)
        if (result && typeof result.then === 'function') {
            result.then(function() {
                self._setSubmitting(false);
            }).catch(function(err) {
                self._setSubmitting(false);
                var message = err && err.message ? err.message : 'Erro ao salvar. Tente novamente.';
                self._showGlobalError(message);
            });
        } else {
            this._setSubmitting(false);
        }
    }

    _setSubmitting(loading) {
        var btn     = this._container.querySelector('.ns-form-submit');
        var label   = this._container.querySelector('.ns-form-submit-label');
        var spinner = this._container.querySelector('.ns-form-submit-spinner');
        if (!btn) return;
        btn.disabled            = loading;
        label.style.display     = loading ? 'none' : '';
        spinner.style.display   = loading ? '' : 'none';
    }

    /* ── Validação ───────────────────────────────────────────────── */

    _validateAll() {
        var valid = true;
        this._options.fields.forEach(function(field) {
            if (!this._validateField(field)) valid = false;
        }, this);
        return valid;
    }

    _validateField(field) {
        var value   = this._getFieldValue(field);
        var message = null;

        if (field.required && this._isEmpty(value)) {
            message = field.requiredMessage || (field.label + ' é obrigatório.');
        }

        if (!message && typeof field.validate === 'function') {
            message = field.validate(value);
        }

        if (message) {
            this._showError(field.key, message);
            return false;
        }

        this._clearError(field.key);
        return true;
    }

    _isEmpty(value) {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string')  return value.trim() === '';
        if (Array.isArray(value))       return value.length === 0;
        return false;
    }

    /* ── Leitura e escrita de valores por tipo ───────────────────── */

    _getFieldValue(field) {
        switch (field.type) {
            case 'checkbox':
                var cb = this._getInput(field.key);
                return cb ? cb.checked : false;

            case 'tags':
                return this._tagValues[field.key] || [];

            case 'currency':
                var curVal = this._currencyValues[field.key];
                return (curVal === undefined) ? null : curVal;

            case 'file':
                var fileInput = this._getInput(field.key);
                return fileInput ? fileInput.files : null;

            case 'autocomplete':
                var hiddenAc = this._container.querySelector('input[name="' + field.key + '-id"]');
                return hiddenAc ? hiddenAc.value : '';

            case 'restlet-autocomplete':
                var state = this._raState[field.key];
                if (!state) return field.multi ? [] : '';
                if (field.multi) return state.selectedIds.slice();       // array de ids
                return state.selectedIds[0] || '';                        // id ou ''

            case 'listbox': {
                var lbHidden = this._container.querySelector('input[name="' + field.key + '"]');
                var lbMulti  = field.multi !== false;
                if (!lbHidden || !lbHidden.value) return lbMulti ? [] : '';
                if (!lbMulti) return lbHidden.value;
                try {
                    var parsed = JSON.parse(lbHidden.value);
                    return Array.isArray(parsed) ? parsed : [];
                } catch (e) {
                    return [];
                }
            }

            default:
                var input = this._getInput(field.key);
                return input ? input.value : '';
        }
    }

    _setFieldValue(field, value) {
        switch (field.type) {
            case 'checkbox':
                var cb = this._getInput(field.key);
                if (cb) cb.checked = !!value;
                break;

            case 'tags':
                this._tagValues[field.key] = [];
                var wrap = this._container.querySelector('[data-field-key="' + field.key + '"].ns-form-tags');
                if (!wrap) break;
                // limpa tags existentes
                wrap.querySelectorAll('.ns-form-tag').forEach(function(t) { t.remove(); });
                var placeholder = wrap.querySelector('.ns-form-tags-placeholder');
                if (placeholder) placeholder.style.display = '';
                var textInput = wrap.querySelector('.ns-form-tags-input');
                var tags = Array.isArray(value) ? value : (value ? [value] : []);
                tags.forEach(function(t) { this._addTag(field.key, t, wrap, textInput); }, this);
                break;

            case 'file':
                // FileInput não pode ser preenchido programaticamente por segurança
                break;

            case 'currency':
                var curInput = this._getInput(field.key);
                var curNum   = (value === '' || value === null || value === undefined) ? null : Number(value);
                this._currencyValues[field.key] = (curNum != null && !isNaN(curNum)) ? curNum : null;
                if (curInput) {
                    curInput.value = (this._currencyValues[field.key] != null)
                        ? this._formatCurrencyDisplay(this._currencyValues[field.key], field.currency, field.locale)
                        : '';
                }
                break;

            case 'autocomplete':
                var acInput  = this._container.querySelector('#ns-field-' + field.key);
                var acHidden = this._container.querySelector('input[name="' + field.key + '-id"]');
                if (acInput)  acInput.value  = typeof value === 'object' ? (value.label || '') : value;
                if (acHidden) acHidden.value = typeof value === 'object' ? (value.value || '') : value;
                break;

            case 'restlet-autocomplete': {
                // value pode ser string/number (single) ou array (multi)
                var state   = this._raState[field.key];
                if (!state) break;

                var raWrap      = this._container.querySelector('.ns-form-ra-wrap[data-field-key="' + field.key + '"]');
                var raText      = raWrap && raWrap.querySelector('.ns-form-ra-input');
                var raHidden    = raWrap && raWrap.querySelector('.ns-form-ra-value');
                var raBadges    = raWrap && raWrap.querySelector('.ns-form-ra-badges');

                var ids = Array.isArray(value)
                    ? value.map(String)
                    : (value !== '' && value != null ? [String(value)] : []);

                state.selectedIds = ids;
                if (raHidden) this._raSyncHidden(field, raHidden);

                if (field.multi) {
                    if (raBadges) this._raRenderBadges(field, raBadges);
                    if (raText)   raText.value = '';
                } else {
                    var selectedItem = state.allItems.find(function(i) { return String(i.id) === ids[0]; });
                    if (raText) raText.value = selectedItem ? selectedItem.name : (ids[0] || '');
                }
                break;
            }

            case 'listbox': {
                var lbMultiSet = field.multi !== false;
                var lbIds = Array.isArray(value)
                    ? value.map(String)
                    : (value !== '' && value != null ? [String(value)] : []);

                var lbWrap = this._container.querySelector('.ns-form-listbox[data-field-key="' + field.key + '"]');
                if (lbWrap) {
                    lbWrap.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(function(inp) {
                        inp.checked = lbIds.indexOf(inp.value) !== -1;
                    });
                }

                var lbHiddenSet = this._container.querySelector('input[name="' + field.key + '"]');
                if (lbHiddenSet) lbHiddenSet.value = lbMultiSet ? JSON.stringify(lbIds) : (lbIds[0] || '');
                break;
            }

            default:
                var input = this._getInput(field.key);
                if (input) input.value = value != null ? value : '';
        }
    }

    /* ── Erros ───────────────────────────────────────────────────── */

    _showError(key, message) {
        var el    = this._container.querySelector('#ns-error-' + key);
        var field = this._container.querySelector('[data-field-key="' + key + '"]');
        if (el)    el.textContent = message;
        if (field) field.classList.add('has-error');
    }

    _clearError(key) {
        var el    = this._container.querySelector('#ns-error-' + key);
        var field = this._container.querySelector('[data-field-key="' + key + '"]');
        if (el)    el.textContent = '';
        if (field) field.classList.remove('has-error');
    }

    _showGlobalError(message) {
        var el = this._container.querySelector('[id^="ns-form-global-error"]');
        if (el) {
            el.innerHTML = '<span class="ns-form-global-error">'
                + '<svg class="ns-icon" style="width:13px;height:13px" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.5"/><path d="M8 5v3.5"/><circle cx="8" cy="11" r=".5" fill="currentColor"/></svg>'
                + message + '</span>';
        }
    }

    _clearGlobalError() {
        var el = this._container.querySelector('[id^="ns-form-global-error"]');
        if (el) el.innerHTML = '';
    }

    /* ── Helpers ─────────────────────────────────────────────────── */

    _getInput(key) {
        return this._container.querySelector('[name="' + key + '"]');
    }

    _uid() {
        return Math.random().toString(36).slice(2, 7);
    }

    /* ── Estilos ─────────────────────────────────────────────────── */

    _injectStyles() {
        if (document.getElementById('ns-form-styles')) return;
        var style = document.createElement('style');
        style.id  = 'ns-form-styles';
        style.textContent = [

            /* ── Utilitários base ──
             * Copiados de ns-topbar / ns-modal / ns-table para garantir
             * disponibilidade mesmo quando esses componentes não são
             * instanciados na página (ex.: tela init sem topbar/tabela).
             * Se já injetados por outro componente a cascata resolve — sem conflito. */
            '.ns-btn {',
            'display:inline-flex;align-items:center;gap:6px;padding:7px 14px;',
            'border-radius:var(--ns-radius-sm);font-family:var(--ns-font);',
            'font-size:var(--ns-text-sm);font-weight:500;cursor:pointer;',
            'border:none;transition:background .12s,opacity .12s;',
            'white-space:nowrap;line-height:1;',
            '}',
            '.ns-btn:disabled{opacity:.4;cursor:not-allowed}',
            '.ns-btn-primary{background:var(--ns-accent);color:#fff;border:none}',
            '.ns-btn-primary:hover:not(:disabled){background:var(--ns-accent-2)}',
            '.ns-btn-ghost{background:transparent;color:var(--ns-text-2);border:1px solid var(--ns-border)}',
            '.ns-btn-ghost:hover:not(:disabled){background:var(--ns-bg);color:var(--ns-text-1)}',

            /* Input e Select escopados ao card do form.
             * Override necessário: ns-table injeta .ns-input com padding-left:32px
             * (reservado para ícone de busca), o que quebra inputs de formulário. */
            '.ns-form-card .ns-input{',
            'font-family:var(--ns-font);font-size:var(--ns-text-sm);',
            'border:1px solid var(--ns-border);border-radius:var(--ns-radius-sm);',
            'background:var(--ns-bg);color:var(--ns-text-1);',
            'outline:none;transition:border-color .15s,box-shadow .15s;',
            'width:100%;padding:7px 10px;',
            '}',
            '.ns-form-card .ns-input:focus{border-color:var(--ns-accent);box-shadow:0 0 0 3px rgba(43,91,224,.1);background:var(--ns-surface)}',
            '.ns-form-card .ns-select{',
            'font-family:var(--ns-font);font-size:var(--ns-text-sm);',
            'border:1px solid var(--ns-border);border-radius:var(--ns-radius-sm);',
            'background:var(--ns-bg);color:var(--ns-text-1);',
            'outline:none;transition:border-color .15s,box-shadow .15s;',
            'width:100%;padding:7px 28px 7px 10px;',
            'appearance:none;cursor:pointer;',
            "background-image:url(\"data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23A8A698' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\");",
            'background-repeat:no-repeat;background-position:right 10px center;',
            '}',
            '.ns-form-card .ns-select:focus{border-color:var(--ns-accent);outline:none}',

            /* Card */
            '.ns-form-card {',
            'background: var(--ns-surface);',
            'border: 1px solid var(--ns-border);',
            'border-radius: var(--ns-radius-lg);',
            'box-shadow: var(--ns-shadow-sm);',
            'margin-bottom: 20px;',
            'animation: ns-fade-in .2s ease both;',
            '}',

            '.ns-form-header {',
            'padding: 16px 24px;',
            'border-bottom: 1px solid var(--ns-border);',
            '}',

            '.ns-form-title {',
            'font-size: var(--ns-text-md);',
            'font-weight: 600;',
            'color: var(--ns-text-1);',
            '}',

            '.ns-form-body { padding: 20px 24px 8px; }',

            /* Grid */
            '.ns-form-grid {',
            'display: grid;',
            'grid-template-columns: repeat(var(--ns-form-cols, 2), 1fr);',
            'gap: 16px 20px;',
            '}',

            '.ns-form-field--wide { grid-column: 1 / -1; }',

            /* Header de grupo (field.group) */
            '.ns-form-group-header {',
            'grid-column: 1 / -1;',
            'font-size: var(--ns-text-xs);',
            'font-weight: 600;',
            'text-transform: uppercase;',
            'letter-spacing: .04em;',
            'color: var(--ns-text-3);',
            'padding-top: 14px;',
            'margin-top: 2px;',
            'border-top: 1px solid var(--ns-border);',
            '}',

            '.ns-form-group-header--first {',
            'border-top: none;',
            'padding-top: 0;',
            'margin-top: 0;',
            '}',

            /* Campo */
            '.ns-form-field { display: flex; flex-direction: column; gap: 5px; }',

            '.ns-form-label-row { display: flex; align-items: center; }',

            '.ns-form-label {',
            'font-size: var(--ns-text-sm);',
            'font-weight: 500;',
            'color: var(--ns-text-2);',
            '}',

            '.ns-form-required { color: var(--ns-danger); margin-left: 2px; }',

            '.ns-form-hint {',
            'font-size: var(--ns-text-xs);',
            'color: var(--ns-text-3);',
            'margin-top: -2px;',
            '}',

            /* Hint em modo popover (hintStyle: 'tooltip', ver cabeçalho da classe) */
            '.ns-form-hint-wrap { position: relative; display: inline-flex; margin-left: 6px; }',

            '.ns-form-hint-trigger {',
            'display: inline-flex; align-items: center; justify-content: center;',
            'width: 15px; height: 15px; padding: 0; flex-shrink: 0;',
            'border-radius: 50%; border: 1px solid var(--ns-border-2);',
            'background: var(--ns-bg); color: var(--ns-text-3);',
            'font-family: var(--ns-font); font-size: 10px; font-weight: 700; line-height: 1;',
            'cursor: pointer; transition: border-color .12s, color .12s;',
            '}',
            '.ns-form-hint-trigger:hover, .ns-form-hint-trigger:focus-visible {',
            'border-color: var(--ns-accent); color: var(--ns-accent); outline: none;',
            '}',

            '.ns-form-hint-popover {',
            'display: none;',
            'position: absolute; top: 100%; left: 0; margin-top: 6px; z-index: 20;',
            'width: max-content; max-width: 240px;',
            'background: var(--ns-surface); border: 1px solid var(--ns-border);',
            'border-radius: var(--ns-radius-sm); box-shadow: 0 4px 16px rgba(0,0,0,.14);',
            'padding: 8px 10px; font-size: var(--ns-text-xs); font-weight: 400;',
            'color: var(--ns-text-2); line-height: 1.4;',
            '}',
            '.ns-form-hint-popover.is-open { display: block; animation: ns-fade-in .12s ease both; }',

            '.ns-form-error {',
            'font-size: var(--ns-text-xs);',
            'color: var(--ns-danger);',
            'min-height: 16px;',
            '}',

            /* Estado de erro no campo */
            '.ns-form-field.has-error .ns-input,',
            '.ns-form-field.has-error .ns-select,',
            '.ns-form-field.has-error .ns-form-tags,',
            '.ns-form-field.has-error .ns-form-file {',
            'border-color: var(--ns-danger);',
            '}',

            /* Textarea */
            '.ns-form-textarea {',
            'resize: vertical;',
            'min-height: 80px;',
            '}',

            /* Toggle (checkbox) */
            '.ns-form-toggle {',
            'display: inline-flex;',
            'align-items: center;',
            'gap: 10px;',
            'cursor: pointer;',
            'user-select: none;',
            '}',

            '.ns-form-toggle input { display: none; }',

            '.ns-form-toggle-track {',
            'position: relative;',
            'width: 36px; height: 20px;',
            'background: var(--ns-border-2);',
            'border-radius: 99px;',
            'transition: background .2s;',
            'flex-shrink: 0;',
            '}',

            '.ns-form-toggle input:checked + .ns-form-toggle-track {',
            'background: var(--ns-accent);',
            '}',

            '.ns-form-toggle-thumb {',
            'position: absolute;',
            'top: 2px; left: 2px;',
            'width: 16px; height: 16px;',
            'background: #fff;',
            'border-radius: 50%;',
            'transition: transform .2s;',
            '}',

            '.ns-form-toggle input:checked ~ .ns-form-toggle-track .ns-form-toggle-thumb,',
            '.ns-form-toggle input:checked + .ns-form-toggle-track .ns-form-toggle-thumb {',
            'transform: translateX(16px);',
            '}',

            '.ns-form-toggle-label {',
            'font-size: var(--ns-text-base);',
            'color: var(--ns-text-1);',
            '}',

            /* Tags */
            '.ns-form-tags {',
            'display: flex;',
            'flex-wrap: wrap;',
            'align-items: center;',
            'gap: 6px;',
            'padding: 6px 10px;',
            'border: 1px solid var(--ns-border);',
            'border-radius: var(--ns-radius-sm);',
            'background: var(--ns-bg);',
            'cursor: text;',
            'min-height: 38px;',
            'transition: border-color .15s, box-shadow .15s;',
            '}',

            '.ns-form-tags:focus-within {',
            'border-color: var(--ns-accent);',
            'box-shadow: 0 0 0 3px rgba(43,91,224,.1);',
            'background: var(--ns-surface);',
            '}',

            '.ns-form-tags-placeholder {',
            'font-size: var(--ns-text-sm);',
            'color: var(--ns-text-3);',
            '}',

            '.ns-form-tags-input {',
            'border: none;',
            'outline: none;',
            'background: transparent;',
            'font-family: var(--ns-font);',
            'font-size: var(--ns-text-sm);',
            'color: var(--ns-text-1);',
            'min-width: 80px;',
            'flex: 1;',
            '}',

            '.ns-form-tag {',
            'display: inline-flex;',
            'align-items: center;',
            'gap: 4px;',
            'padding: 2px 8px;',
            'background: var(--ns-accent-bg);',
            'color: var(--ns-accent);',
            'border-radius: var(--ns-radius-pill);',
            'font-size: var(--ns-text-xs);',
            'font-weight: 500;',
            '}',

            '.ns-form-tag-remove {',
            'background: none;',
            'border: none;',
            'color: inherit;',
            'cursor: pointer;',
            'padding: 0;',
            'font-size: 14px;',
            'line-height: 1;',
            'opacity: .6;',
            '}',

            '.ns-form-tag-remove:hover { opacity: 1; }',

            /* File */
            '.ns-form-file {',
            'display: inline-flex;',
            'align-items: center;',
            'gap: 8px;',
            'padding: 7px 14px;',
            'border: 1px dashed var(--ns-border-2);',
            'border-radius: var(--ns-radius-sm);',
            'background: var(--ns-bg);',
            'cursor: pointer;',
            'font-size: var(--ns-text-sm);',
            'color: var(--ns-text-2);',
            'transition: border-color .15s, color .15s;',
            'width: 100%;',
            'justify-content: center;',
            '}',

            '.ns-form-file:hover {',
            'border-color: var(--ns-accent);',
            'color: var(--ns-accent);',
            '}',

            '.ns-form-file input[type="file"] { display: none; }',

            '.ns-form-file-name {',
            'font-size: var(--ns-text-xs);',
            'color: var(--ns-text-2);',
            'margin-top: -2px;',
            '}',

            /* Autocomplete (genérico) */
            '.ns-form-ac-wrap { position: relative; }',

            '.ns-form-ac-dropdown {',
            'position: absolute;',
            'top: calc(100% + 4px);',
            'left: 0; right: 0;',
            'background: var(--ns-surface);',
            'border: 1px solid var(--ns-border);',
            'border-radius: var(--ns-radius-md);',
            'box-shadow: var(--ns-shadow-md);',
            'z-index: 100;',
            'max-height: 200px;',
            'overflow-y: auto;',
            '}',

            '.ns-form-ac-option {',
            'padding: 9px 14px;',
            'font-size: var(--ns-text-base);',
            'cursor: pointer;',
            'transition: background .1s;',
            '}',

            '.ns-form-ac-option:hover { background: var(--ns-bg); }',

            '.ns-form-ac-loading, .ns-form-ac-empty {',
            'padding: 10px 14px;',
            'font-size: var(--ns-text-sm);',
            'color: var(--ns-text-3);',
            '}',

            /* ── Restlet Autocomplete ── */

            '.ns-form-ra-wrap {',
            'position: relative;',
            '}',

            /* Status bar */
            '.ns-form-ra-status {',
            'font-size: var(--ns-text-xs);',
            'padding: 3px 0;',
            'margin-bottom: 4px;',
            '}',

            '.ns-form-ra-status--loading {',
            'color: var(--ns-text-3);',
            '}',

            '.ns-form-ra-status--error {',
            'color: var(--ns-danger);',
            '}',

            /* Badges (multi) */
            '.ns-form-ra-badges {',
            'display: flex;',
            'flex-wrap: wrap;',
            'gap: 5px;',
            'margin-bottom: 6px;',
            '}',

            '.ns-form-ra-badge {',
            'display: inline-flex;',
            'align-items: center;',
            'gap: 5px;',
            'padding: 3px 8px 3px 10px;',
            'background: var(--ns-accent-bg);',
            'color: var(--ns-accent);',
            'border-radius: var(--ns-radius-pill);',
            'font-size: var(--ns-text-xs);',
            'font-weight: 500;',
            'max-width: 100%;',
            '}',

            '.ns-form-ra-badge-label {',
            'overflow: hidden;',
            'text-overflow: ellipsis;',
            'white-space: nowrap;',
            '}',

            '.ns-form-ra-badge-remove {',
            'display: inline-flex;',
            'align-items: center;',
            'justify-content: center;',
            'background: none;',
            'border: none;',
            'color: inherit;',
            'cursor: pointer;',
            'padding: 1px;',
            'border-radius: 50%;',
            'opacity: .6;',
            'flex-shrink: 0;',
            'transition: opacity .15s, background .15s;',
            '}',

            '.ns-form-ra-badge-remove:hover {',
            'opacity: 1;',
            'background: rgba(0,0,0,.08);',
            '}',

            /* Input */
            '.ns-form-ra-input {',
            'width: 100%;',
            '}',

            '.ns-form-ra-input:disabled {',
            'opacity: .5;',
            'cursor: not-allowed;',
            '}',

            /* Dropdown */
            '.ns-form-ra-dropdown {',
            'position: absolute;',
            'top: calc(100% + 4px);',
            'left: 0; right: 0;',
            'background: var(--ns-surface);',
            'border: 1px solid var(--ns-border);',
            'border-radius: var(--ns-radius-md);',
            'box-shadow: var(--ns-shadow-md);',
            'z-index: 200;',
            'max-height: 220px;',
            'overflow-y: auto;',
            '}',

            '.ns-form-ra-option {',
            'padding: 9px 14px;',
            'font-size: var(--ns-text-base);',
            'cursor: pointer;',
            'transition: background .1s;',
            '}',

            '.ns-form-ra-option:hover { background: var(--ns-bg); }',

            '.ns-form-ra-empty {',
            'padding: 10px 14px;',
            'font-size: var(--ns-text-sm);',
            'color: var(--ns-text-3);',
            '}',

            '.ns-form-ra-highlight {',
            'background: none;',
            'color: var(--ns-accent);',
            'font-weight: 600;',
            '}',

            /* Listbox */
            '.ns-form-listbox { display: flex; flex-direction: column; gap: 6px; }',

            '.ns-form-listbox-search { width: 100%; }',

            '.ns-form-listbox-list {',
            'border: 1px solid var(--ns-border);',
            'border-radius: var(--ns-radius-sm);',
            'background: var(--ns-bg);',
            'max-height: 220px;',
            'overflow-y: auto;',
            '}',

            '.ns-form-listbox-option {',
            'display: flex;',
            'align-items: center;',
            'gap: 8px;',
            'padding: 8px 12px;',
            'font-size: var(--ns-text-sm);',
            'color: var(--ns-text-1);',
            'cursor: pointer;',
            '}',

            '.ns-form-listbox-option:hover { background: var(--ns-surface); }',

            '.ns-form-listbox-option input { cursor: pointer; flex-shrink: 0; }',

            '.ns-form-listbox-empty {',
            'padding: 10px 14px;',
            'font-size: var(--ns-text-sm);',
            'color: var(--ns-text-3);',
            '}',

            /* Footer */
            '.ns-form-footer {',
            'padding: 14px 24px;',
            'border-top: 1px solid var(--ns-border);',
            'display: flex;',
            'align-items: center;',
            'justify-content: space-between;',
            'gap: 12px;',
            '}',

            '.ns-form-footer-left { flex: 1; }',

            '.ns-form-footer-actions {',
            'display: flex;',
            'align-items: center;',
            'gap: 8px;',
            '}',

            '.ns-form-global-error {',
            'display: inline-flex;',
            'align-items: center;',
            'gap: 5px;',
            'font-size: var(--ns-text-sm);',
            'color: var(--ns-danger);',
            '}',

            /* Spinner no botão submit */
            '.ns-form-spin {',
            'animation: ns-form-spin .7s linear infinite;',
            '}',

            '@keyframes ns-form-spin {',
            'to { transform: rotate(360deg); }',
            '}',

        ].join('\n');

        document.head.appendChild(style);
    }
}