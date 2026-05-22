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
 *   date               — date picker nativo
 *   select             — dropdown (requer options: [{ value, label }])
 *   checkbox           — toggle booleano
 *   textarea           — texto longo
 *   tags               — múltiplos valores livres (Enter ou vírgula para adicionar)
 *   file               — upload de arquivo (retorna FileList no getData())
 *   autocomplete       — busca assíncrona genérica (requer source: fn(query, done))
 *   restlet-autocomplete — busca via RESTlet NetSuite com suporte a filtros entre
 *                          campos e multi-select com badges
 *
 * ── RESTLET-AUTOCOMPLETE ─────────────────────────────────────────
 *
 *   Integra nativamente com a função global `get(restletOptions, onSuccess, onError)`
 *   que já existe no ambiente NetSuite.
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
 * ── VALIDAÇÃO ────────────────────────────────────────────────────
 *
 *   required: true                          — campo obrigatório
 *   validate: function(value) {             — validador customizado
 *       if (value < 0) return 'Valor negativo não permitido';
 *       return null;  // null = válido
 *   }
 *   validateOn: 'blur' | 'submit'           — padrão: 'blur' para campos
 *                                             simples, 'submit' para compostos
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
        }, options);
        this._errors      = {};
        this._tagValues   = {};     // estado interno dos campos tipo 'tags'
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

        this._container.innerHTML = [
            '<div class="ns-form-card" style="' + (visible ? '' : 'display:none') + '">',
            opts.title ? '<div class="ns-form-header"><span class="ns-form-title">' + opts.title + '</span></div>' : '',
            '<div class="ns-form-body">',
            '<div class="ns-form-grid" style="--ns-form-cols:' + opts.columns + '">',
            opts.fields.map(function(f) { return this._renderField(f); }, this).join(''),
            '</div>',
            '</div>',
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
            '</div>',
        ].join('');

        this._bindFormEvents();
        this._bindFieldEvents();
        this._injectStyles();
    }

    /* ── HTML de cada tipo de campo ─────────────────────────────── */

    _renderField(field) {
        var id      = 'ns-field-' + field.key;
        var isWide  = field.wide || field.type === 'textarea';
        var input   = this._renderInput(field, id);

        return [
            '<div class="ns-form-field' + (isWide ? ' ns-form-field--wide' : '') + '" data-field-key="' + field.key + '">',
            '<label class="ns-form-label" for="' + id + '">',
            field.label,
            field.required ? '<span class="ns-form-required" aria-hidden="true">*</span>' : '',
            '</label>',
            input,
            field.hint ? '<div class="ns-form-hint">' + field.hint + '</div>' : '',
            '<div class="ns-form-error" id="ns-error-' + field.key + '" role="alert"></div>',
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

            case 'number':
                return '<input type="number" class="ns-input ns-form-input" id="' + id + '" name="' + field.key + '" placeholder="' + (field.placeholder || '0') + '" ' + (field.min != null ? 'min="' + field.min + '"' : '') + ' ' + (field.max != null ? 'max="' + field.max + '"' : '') + '>';

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
        };
        textInput.addEventListener('keydown', keyFn);
        this._listeners.push({ el: textInput, type: 'keydown', fn: keyFn });

        // delegação para remoção de tags
        var clickFn = function(e) {
            var btn = e.target.closest('.ns-form-tag-remove');
            if (!btn) return;
            var tag = btn.dataset.tag;
            self._removeTag(field.key, tag, wrap);
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
     * Faz a requisição ao RESTlet e popula _raState[field.key].allItems.
     * Reaproveita a função global `get()` que já existe no ambiente.
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

        var restletOptions = {
            script:     field.restletScriptId,
            deployment: field.restletDeploymentId,
            parameters: parameters,
        };

        // UI: loading
        self._raSetStatus(statusEl, 'loading', 'Carregando…');
        textInput.disabled = true;

        get(
            restletOptions,
            function(data) {
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
            },
            function(errorMessage) {
                textInput.disabled = false;
                self._raSetStatus(statusEl, 'error', errorMessage || 'Erro ao carregar');
            }
        );
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

            /* Campo */
            '.ns-form-field { display: flex; flex-direction: column; gap: 5px; }',

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