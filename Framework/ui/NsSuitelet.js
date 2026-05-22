/**
 * NsSuitelet
 * server/ns-suitelet.js
 *
 * Utilitário server-side para Suitelets do ns-framework.
 * Substitui o pd-cnts-suitelet_util.js (Bootstrap/FontAwesome)
 * pela stack moderna: ns-tokens + componentes NS.
 *
 * Duas responsabilidades:
 *   1. NsSuitelet.build()  — monta e escreve o HTML da página no response
 *   2. NsSuitelet.api()    — roteador de métodos HTTP para Restlets
 *
 * ── BUILD (renderizar página) ────────────────────────────────────
 *
 *   // Uso mínimo — apenas os arquivos obrigatórios são incluídos
 *   NsSuitelet.build({
 *       context: context,
 *       title:   'Pedidos em aberto',
 *       statics: {
 *           html: ['pd-cntst-pedidos.html'],
 *           js:   ['pd-cntst-pedidos.js'],
 *       }
 *   });
 *
 *   // Uso completo — com parâmetros e componentes opcionais
 *   NsSuitelet.build({
 *       context: context,
 *       title:   'Aprovações',
 *       statics: {
 *           html: ['pd-cntst-aprovacoes.html'],
 *           js:   ['pd-cntst-aprovacoes.js'],
 *           css:  ['pd-cntst-custom.css'],            // CSS extra opcional
 *       },
 *       components: ['sidebar', 'kpi-card'],           // incluir só o que usar
 *       parameters: {                                  // dados injetados em SUITELET_PARAMETERS
 *           scriptId:     '123',
 *           deploymentId: '1',
 *           filtroInicial: 'pendente',
 *       }
 *   });
 *
 * ── API (rotear chamadas ao Restlet) ────────────────────────────
 *
 *   // No onRequest do Restlet:
 *   NsSuitelet.api({
 *       context: context,
 *       get: function({ parameters }) {
 *           return search_util.run({ type: 'salesorder', ... });
 *       },
 *       post: function({ data }) {
 *           return record_util.create({ type: 'salesorder', values: data });
 *       },
 *       put: function({ data, parameters }) {
 *           return record_util.update({ id: parameters.id, values: data });
 *       },
 *       delete: function({ parameters }) {
 *           record.delete({ type: 'salesorder', id: parameters.id });
 *           return { deleted: parameters.id };
 *       }
 *   });
 *
 * ── COMPONENTES DISPONÍVEIS ──────────────────────────────────────
 *
 *   'topbar'    — NsTopbar    (incluído sempre por padrão)
 *   'table'     — NsTable     (incluído sempre por padrão)
 *   'form'      — NsForm      (incluído sempre por padrão)
 *   'modal'     — NsModal     (incluído sempre por padrão)
 *   'sidebar'   — NsSidebar   (opcional)
 *   'kpi-card'  — NsKpiCard   (opcional)
 *
 *   Passe o array `components` para adicionar os opcionais.
 *   Os quatro padrão (topbar, table, form, modal) são sempre incluídos.
 *   NsHttp é sempre incluído automaticamente antes de qualquer componente.
 *
 * ── PARÂMETROS INJETADOS AUTOMATICAMENTE ────────────────────────
 *
 *   SUITELET_PARAMETERS sempre contém (além dos extras passados em `parameters`):
 *     - currentUserId
 *     - currentUserEmail
 *     - currentUserName
 *     - currentUserRole
 *
 * @NApiVersion 2.1
 * @NModuleScope public
 */
define(
    [
        'N/log',
        'N/runtime',
        'N/search',
        'N/file',
    ],
    function(log, runtime, search, file) {

        /* ══════════════════════════════════════════════════════
           Declaração dos arquivos do framework
           Único lugar onde nomes de arquivo são definidos.
           Nenhum path hard-coded além destes nomes.
        ══════════════════════════════════════════════════════ */

        /** CSS de design tokens — sempre o primeiro link da página */
        const TOKENS_CSS_FILE = 'ns-tokens.css';

        /** Mapa de nome de componente → nome de arquivo no File Cabinet */
        const COMPONENT_FILE_MAP = {
            'https':    'ns-https.js',
            'icons':    'ns-icons.js',
            'topbar':   'ns-topbar.js',
            'table':    'ns-table.js',
            'form':     'ns-form.js',
            'modal':    'ns-modal.js',
            'sidebar':  'ns-sidebar.js',
            'kpi-card': 'ns-kpi-card.js',
        };

        /**
         * Componentes de UI incluídos em toda página, sem precisar declarar em `components`.
         * NsHttp NÃO entra aqui — tem tag própria no buildHTML para garantir
         * que carrega antes de qualquer componente de UI ou script do projeto.
         */
        const CORE_COMPONENTS = ['icons', 'topbar', 'table', 'form', 'modal'];

        /**
         * Todos os arquivos próprios do framework (tokens + componentes).
         * Derivado das constantes acima — sem duplicação manual.
         */
        const FRAMEWORK_FILES = (function() {
            const names = [TOKENS_CSS_FILE];
            Object.keys(COMPONENT_FILE_MAP).forEach(function(key) {
                names.push(COMPONENT_FILE_MAP[key]);
            });
            return names; // ex.: ['ns-tokens.css', 'ns-https.js', 'ns-topbar.js', ...]
        }());

        /* ══════════════════════════════════════════════════════
           Cache de URLs — preenchido uma vez por execução
        ══════════════════════════════════════════════════════ */

        /**
         * Mapa { nomeDoArquivo → url } dos arquivos do framework.
         * Populado na primeira chamada a _ensureCache().
         * @type {Object|null}
         */
        let _urlCache = null;

        /**
         * Garante que o cache de URLs está populado.
         *
         * Usa N/search com type 'file' e filtro OR encadeado —
         * o mesmo que o pd-cnts-suitelet_util faz internamente via search_util.
         * Uma única busca retorna name + url de todos os arquivos do framework.
         */
        function _ensureCache() {
            if (_urlCache !== null) return;

            _urlCache = {};

            const filters = [];
            FRAMEWORK_FILES.forEach(function(fileName, index) {
                if (index > 0) filters.push('or');
                filters.push(['name', 'is', fileName]);
            });

            try {
                const fileSearch = search.create({
                    type: 'file',
                    filters: filters,
                    columns: [
                        search.createColumn({ name: 'name' }),
                        search.createColumn({ name: 'url'  }),
                    ],
                });

                fileSearch.run().each(function(result) {
                    const name = (result.getValue({ name: 'name' }) || '').toLowerCase().trim();
                    const url  =  result.getValue({ name: 'url'  });
                    if (name && url) {
                        _urlCache[name] = url;
                    }
                    return true;
                });

                log.debug({
                    title:   'NsSuitelet._ensureCache — URLs carregadas',
                    details: Object.keys(_urlCache),
                });

            } catch(e) {
                log.error({ title: 'NsSuitelet._ensureCache — falha na busca', details: e });
                throw buildException(
                    'CACHE_BUILD_FAILED',
                    'Não foi possível carregar as URLs dos arquivos do framework via N/search. ' +
                    'Verifique se os arquivos estão no File Cabinet e se o script tem permissão de leitura. ' +
                    'Detalhe: ' + (e.message || String(e))
                );
            }
        }

        /**
         * Retorna a URL pública de um arquivo do framework pelo nome.
         * Usa o cache populado por _ensureCache() via search_util — sem file.load() individual.
         *
         * @param {string} fileName — nome do arquivo (ex.: 'ns-topbar.js')
         * @returns {string}
         */
        function _frameworkUrl(fileName) {
            _ensureCache();

            const url = _urlCache[fileName];
            if (!url) {
                throw buildException(
                    'FRAMEWORK_FILE_NOT_FOUND',
                    'Arquivo do framework não encontrado no File Cabinet: "' + fileName + '". ' +
                    'Confirme que o arquivo existe e está acessível ao script.'
                );
            }
            return url;
        }

        /**
         * Busca no File Cabinet os arquivos do projeto (html, js, css) por nome,
         * usando N/search com filtro OR — mesma abordagem do cache do framework.
         *
         * Retorna um mapa { nomeDoArquivo → { url, id } } para todos os arquivos
         * encontrados. Uma única busca cobre html + js + css de uma vez.
         *
         * @param {string[]} fileNames — lista de nomes a localizar
         * @returns {Object}  mapa { fileName.toLowerCase() → { url, id } }
         */
        function _resolveProjectFileMap(fileNames) {
            const map = {};

            const toSearch = fileNames.filter(function(n) { return !!n; });
            if (toSearch.length === 0) return map;

            const filters = [];
            toSearch.forEach(function(fileName, index) {
                if (index > 0) filters.push('or');
                filters.push(['name', 'is', fileName]);
            });

            const fileSearch = search.create({
                type: 'file',
                filters: filters,
                columns: [
                    search.createColumn({ name: 'name' }),
                    search.createColumn({ name: 'url'  }),
                ],
            });

            fileSearch.run().each(function(result) {
                const name = (result.getValue({ name: 'name' }) || '').toLowerCase().trim();
                const url  =  result.getValue({ name: 'url'  });
                const id   =  result.id;
                if (name) {
                    map[name] = { url: url, id: id };
                }
                return true;
            });

            return map;
        }

        /* ══════════════════════════════════════════════════════
           BUILD — renderiza a página do Suitelet
        ══════════════════════════════════════════════════════ */

        /**
         * Monta o HTML completo e escreve no response do Suitelet.
         *
         * @param {object}   options
         * @param {object}   options.context            — contexto do Suitelet (onRequest)
         * @param {string}   options.title              — título da página (<title> e topbar)
         * @param {object}   options.statics            — arquivos do projeto
         *   @param {Array}  options.statics.html       — nomes de arquivos HTML no File Cabinet
         *   @param {Array}  [options.statics.js]       — nomes de arquivos JS no File Cabinet
         *   @param {Array}  [options.statics.css]      — nomes de arquivos CSS no File Cabinet
         * @param {string[]} [options.components]       — componentes opcionais: 'sidebar', 'kpi-card'
         * @param {object}   [options.parameters]       — dados extras injetados em SUITELET_PARAMETERS
         */
        function build(options) {
            validateBuildOptions(options);

            _ensureCache();

            const html = buildHTML(options);
            options.context.response.write(html);
        }

        function buildHTML(options) {
            const componentUrls   = resolveComponentUrls(options.components);
            const projectFiles    = resolveProjectFiles(options.statics);
            const parametersBlock = buildParametersBlock(options.parameters);
            const hasSidebar      = Array.isArray(options.components) && options.components.indexOf('sidebar') !== -1;

            return [
                '<!DOCTYPE html>',
                '<html lang="pt-BR">',
                '<head>',
                '<meta charset="UTF-8">',
                '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
                '<title>' + esc(options.title) + '</title>',

                /* Fontes — DM Sans + DM Mono (Google Fonts CDN) */
                '<link rel="preconnect" href="https://fonts.googleapis.com">',
                '<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">',

                /* Design tokens (sempre primeiro) */
                '<link rel="stylesheet" href="' + _frameworkUrl(TOKENS_CSS_FILE) + '">',

                /* CSS extra do projeto */
                projectFiles.css.map(function(url) { return '<link rel="stylesheet" href="' + url + '">'; }).join(''),

                /* Layout base */
                '<style>',
                'body { display: flex; min-height: 100vh; }',
                '.ns-has-sidebar .ns-main { margin-left: var(--ns-sidebar-w, 220px); }',
                '.ns-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }',
                '.ns-content { padding: var(--ns-content-py) var(--ns-content-px); flex: 1; }',
                '</style>',

                '</head>',
                '<body' + (hasSidebar ? ' class="ns-has-sidebar"' : '') + '>',

                /* Pontos de montagem padrão */
                '<div id="sidebar"></div>',
                '<div class="ns-main">',
                '<div id="topbar"></div>',
                '<div class="ns-content">',
                projectFiles.html.join(''),
                '</div>',
                '</div>',

                /* 1. Parâmetros injetados como JS global */
                parametersBlock,

                /* 2. NsHttp — sempre o primeiro script, antes de qualquer componente ou
                      código do projeto, para que todos possam usá-lo imediatamente */
                '<script src="' + _frameworkUrl(COMPONENT_FILE_MAP['https']) + '"></script>',

                /* 3. Componentes de UI (core: topbar, table, form, modal + opcionais) */
                componentUrls.map(function(url) { return '<script src="' + url + '"></script>'; }).join(''),

                /* 4. JS do projeto */
                projectFiles.js.map(function(url) { return '<script src="' + url + '"></script>'; }).join(''),

                '</body>',
                '</html>',
            ].join('');
        }

        /**
         * Resolve URLs dos componentes de UI a incluir (core + opcionais).
         * NsHttp é excluído aqui — já é emitido diretamente no buildHTML antes deste bloco.
         *
         * @param {string[]} [extraComponents]
         * @returns {string[]}
         */
        function resolveComponentUrls(extraComponents) {
            const components = CORE_COMPONENTS.slice();

            if (Array.isArray(extraComponents)) {
                extraComponents.forEach(function(name) {
                    const normalized = name.toLowerCase().trim();

                    if (!COMPONENT_FILE_MAP[normalized]) {
                        throw buildException(
                            'UNKNOWN_COMPONENT',
                            'Componente desconhecido: "' + name + '". ' +
                            'Disponíveis: ' + Object.keys(COMPONENT_FILE_MAP).filter(function(k) { return k !== 'http'; }).join(', ')
                        );
                    }
                    if (components.indexOf(normalized) === -1) {
                        components.push(normalized);
                    }
                });
            }

            return components.map(function(name) {
                return _frameworkUrl(COMPONENT_FILE_MAP[name]);
            });
        }

        /**
         * Carrega o conteúdo dos arquivos HTML do projeto e resolve URLs
         * dos arquivos JS e CSS do projeto.
         *
         * @param {object} statics
         * @returns {{ html: string[], js: string[], css: string[] }}
         */
        function resolveProjectFiles(statics) {
            const result = { html: [], js: [], css: [] };

            const htmlFiles = statics.html || [];
            const jsFiles   = statics.js   || [];
            const cssFiles  = statics.css  || [];

            const allNames = htmlFiles.concat(jsFiles).concat(cssFiles);
            const fileMap  = _resolveProjectFileMap(allNames);

            htmlFiles.forEach(function(fileName) {
                const key   = fileName.toLowerCase().trim();
                const entry = fileMap[key];

                if (!entry) {
                    throw buildException(
                        'HTML_FILE_NOT_FOUND',
                        'Arquivo HTML não encontrado no File Cabinet: "' + fileName + '"'
                    );
                }

                try {
                    result.html.push(file.load({ id: entry.id }).getContents());
                } catch(e) {
                    throw buildException(
                        'HTML_FILE_LOAD_ERROR',
                        'Erro ao carregar conteúdo do arquivo HTML: "' + fileName + '". ' +
                        'Detalhe: ' + (e.message || String(e))
                    );
                }
            });

            jsFiles.forEach(function(fileName) {
                const key   = fileName.toLowerCase().trim();
                const entry = fileMap[key];

                if (!entry) {
                    throw buildException(
                        'JS_FILE_NOT_FOUND',
                        'Arquivo JS não encontrado no File Cabinet: "' + fileName + '"'
                    );
                }

                result.js.push(entry.url);
            });

            cssFiles.forEach(function(fileName) {
                const key   = fileName.toLowerCase().trim();
                const entry = fileMap[key];

                if (!entry) {
                    throw buildException(
                        'CSS_FILE_NOT_FOUND',
                        'Arquivo CSS não encontrado no File Cabinet: "' + fileName + '"'
                    );
                }

                result.css.push(entry.url);
            });

            return result;
        }

        /**
         * Gera o bloco <script> que injeta SUITELET_PARAMETERS no frontend.
         * Sempre inclui dados do usuário corrente.
         *
         * @param {object} [extraParams]
         * @returns {string}
         */
        function buildParametersBlock(extraParams) {
            const user = runtime.getCurrentUser();

            const params = Object.assign({}, extraParams || {}, {
                currentUserId:    user.id,
                currentUserEmail: user.email,
                currentUserName:  user.name,
                currentUserRole:  user.roleId,
            });

            return (
                [
                    '<script type="text/javascript">',
                    'const SUITELET_PARAMETERS =' + JSON.stringify(params),
                    '</script>'
                ].join('')
            )
        }

        /* ── Validação do build ── */

        function validateBuildOptions(options) {
            if (options == null) {
                throw buildException('MISSING_OPTIONS', 'Parâmetro "options" é obrigatório.');
            }
            if (options.context == null) {
                throw buildException('MISSING_CONTEXT', 'options.context é obrigatório.');
            }
            if (!options.title) {
                throw buildException('MISSING_TITLE', 'options.title é obrigatório.');
            }
            if (options.statics == null || !Array.isArray(options.statics.html) || options.statics.html.length === 0) {
                throw buildException('MISSING_STATICS_HTML', 'options.statics.html é obrigatório e deve conter ao menos um arquivo.');
            }
        }

        /* ══════════════════════════════════════════════════════
           API — roteador de métodos HTTP para Restlets
        ══════════════════════════════════════════════════════ */

        /**
         * Roteia a requisição para o handler do método correspondente
         * e serializa a resposta no envelope { status, message, data }
         * compatível com NsHttp.
         *
         * @param {object}    options
         * @param {object}    options.context    — contexto do Restlet (onRequest)
         * @param {Function}  [options.get]      — handler GET
         * @param {Function}  [options.post]     — handler POST
         * @param {Function}  [options.put]      — handler PUT
         * @param {Function}  [options.patch]    — handler PATCH
         * @param {Function}  [options.delete]   — handler DELETE
         */
        function api(options) {
            validateApiOptions(options);

            const request  = options.context.request;
            const response = options.context.response;

            const envelope = {
                status:  200,
                message: 'Success',
                data:    null,
            };

            log.audit({ title: 'NsSuitelet.api — ' + request.method, details: {
                    parameters: request.parameters,
                    body:       request.body ? request.body.substring(0, 500) : null,
                }});

            try {
                const method  = request.method.toLowerCase();
                const handler = options[method];

                if (typeof handler !== 'function') {
                    throw buildException(
                        'METHOD_NOT_ALLOWED',
                        'Método não implementado: ' + request.method.toUpperCase() +
                        '. Disponíveis: ' + implementedMethods(options).join(', ')
                    );
                }

                envelope.data = handler({
                    data:       parseBody(request.body),
                    parameters: request.parameters,
                    headers:    request.headers,
                });

            } catch(e) {
                const isNsException = e && typeof e.code === 'string' && typeof e.message === 'string';

                envelope.status  = 400;
                envelope.message = isNsException
                    ? '[' + e.code + '] ' + e.message
                    : String(e);

                log.error({ title: 'NsSuitelet.api — erro', details: e });
            }

            response.addHeader('Content-Type', 'application/json');
            response.write(JSON.stringify(envelope));
        }

        /* ── Helpers da API ── */

        function parseBody(body) {
            if (!body) return null;
            try {
                return JSON.parse(body);
            } catch(e) {
                return body;
            }
        }

        function implementedMethods(options) {
            return ['get', 'post', 'put', 'patch', 'delete']
                .filter(function(m) { return typeof options[m] === 'function'; })
                .map(function(m)    { return m.toUpperCase(); });
        }

        function validateApiOptions(options) {
            if (options == null) {
                throw buildException('MISSING_OPTIONS', 'Parâmetro "options" é obrigatório.');
            }
            if (options.context == null) {
                throw buildException('MISSING_CONTEXT', 'options.context é obrigatório.');
            }
            const hasMethods = ['get', 'post', 'put', 'patch', 'delete'].some(function(m) {
                return typeof options[m] === 'function';
            });
            if (!hasMethods) {
                throw buildException(
                    'NO_HANDLER',
                    'Nenhum handler de método encontrado. Implemente ao menos um: get, post, put, patch, delete.'
                );
            }
        }

        /* ══════════════════════════════════════════════════════
           Helpers internos
        ══════════════════════════════════════════════════════ */

        function esc(str) {
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        }

        function buildException(code, message) {
            const err = new Error(message);
            err.code = code;
            err.name = 'NsSuiteletException';
            return err;
        }

        /* ══════════════════════════════════════════════════════
           Interface pública
        ══════════════════════════════════════════════════════ */

        return {
            build: build,
            api:   api,
        };
    }
);