/**
 * NsHttp
 * ui/api/ns-http.js
 *
 * Cliente HTTP para chamadas a Restlets e Suitelets NetSuite.
 * Evolução do pd-cntst-restlet.util.js — mesma responsabilidade,
 * interface moderna baseada em Promises, sem dependência de jQuery.
 *
 * ── USO BÁSICO ──────────────────────────────────────────────────
 *
 *   const http = new NsHttp({ script: 123, deployment: 1 });
 *
 *   // GET — buscar dados
 *   http.get({ parameters: { status: 'aberto' } })
 *       .then(function(data) { table.setData(data); })
 *       .catch(function(err) { showError(err.message); });
 *
 *   // POST — salvar registro
 *   http.post({ data: { id: 1, nome: 'Teste' } })
 *       .then(function(data) { console.log('salvo', data); });
 *
 * ── USO COM async/await ──────────────────────────────────────────
 *
 *   async function carregarPedidos() {
 *       try {
 *           const pedidos = await http.get({ parameters: { status: 'aberto' } });
 *           table.setData(pedidos);
 *       } catch (err) {
 *           showError(err.message);
 *       }
 *   }
 *
 * ── MÚLTIPLOS RESTLETS ───────────────────────────────────────────
 *
 *   const pedidosHttp  = new NsHttp({ script: 101, deployment: 1 });
 *   const produtosHttp = new NsHttp({ script: 102, deployment: 1 });
 *
 * ── SUITELET ────────────────────────────────────────────────────
 *
 *   const http = new NsHttp({ suitelet: { script: 'customscript_xyz', deployment: '1' } });
 *   http.get({ parameters: { empreendimentoId: 123 } }).then(...);
 *
 * ── BLOQUEAR ELEMENTO DURANTE A REQUISIÇÃO ───────────────────────
 *
 *   http.post({
 *       data:          { step: 'rateio' },
 *       blockSelector: '#btn-executar',
 *   });
 */
class NsHttp {

    /**
     * @param {object} restlet
     * @param {number|string} [restlet.script]      — ID do script (Restlet)
     * @param {number|string} [restlet.deployment]  — ID do deployment (Restlet)
     * @param {object}        [restlet.suitelet]    — { script, deployment } para Suitelet
     */
    constructor(restlet) {
        const hasSuitelet = restlet && restlet.suitelet && restlet.suitelet.script && restlet.suitelet.deployment;
        const hasRestlet  = restlet && restlet.script && restlet.deployment;

        if (!hasSuitelet && !hasRestlet) {
            throw new NsHttpError(
                'INVALID_RESTLET',
                'NsHttp requer { script, deployment } ou { suitelet: { script, deployment } } no construtor.'
            );
        }

        this._restlet = restlet;
    }

    /* ── Métodos públicos ───────────────────────────────────────── */

    /**
     * GET — busca dados. Parâmetros vão na URL.
     *
     * @param {object}  [options]
     * @param {object}  [options.parameters]    — chave:valor adicionados à URL
     * @param {string}  [options.blockSelector] — seletor CSS de elementos a desabilitar
     * @param {boolean} [options.async=true]
     * @returns {Promise<any>}
     */
    get(options) {
        return this._request('GET', options || {});
    }

    /**
     * POST — envia dados. Payload vai no body como JSON.
     *
     * @param {object}  [options]
     * @param {any}     [options.data]           — payload serializado como JSON
     * @param {object}  [options.parameters]     — parâmetros adicionais na URL
     * @param {string}  [options.blockSelector]  — seletor CSS de elementos a desabilitar
     * @param {boolean} [options.async=true]
     * @returns {Promise<any>}
     */
    post(options) {
        return this._request('POST', options || {});
    }

    /**
     * PUT — substitui um registro completo.
     * @param {object} [options]
     * @returns {Promise<any>}
     */
    put(options) {
        return this._request('PUT', options || {});
    }

    /**
     * PATCH — atualização parcial de um registro.
     * @param {object} [options]
     * @returns {Promise<any>}
     */
    patch(options) {
        return this._request('PATCH', options || {});
    }

    /**
     * DELETE — remove um registro.
     * @param {object} [options]
     * @returns {Promise<any>}
     */
    delete(options) {
        return this._request('DELETE', options || {});
    }

    /* ── Núcleo da requisição ───────────────────────────────────── */

    /**
     * @param {string} method   — 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
     * @param {object} options
     * @returns {Promise<any>}
     * @private
     */
    _request(method, options) {
        const blockedEls = this._block(options.blockSelector);

        const fetchOptions = {
            method,
            headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        };

        const methodsWithBody = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
        if (methodsWithBody.has(method) && options.data !== undefined) {
            fetchOptions.body = JSON.stringify(options.data);
        }

        return fetch(this._buildURL(options.parameters), fetchOptions)
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        throw new NsHttpError(
                            'HTTP_ERROR',
                            `${response.status} ${response.statusText}${text ? ': ' + text : ''}`,
                            { status: response.status }
                        );
                    });
                }
                return response.json();
            })
            .then(data => {
                const unwrapped = this._unwrap(data);
                if (unwrapped.ok) return unwrapped.data;
                throw new NsHttpError('API_ERROR', unwrapped.message, data);
            })
            .finally(() => {
                this._unblock(blockedEls);
            });
    }

    /* ── Desempacota o envelope { status, message, data } ──────── */

    /**
     * Compatível com o envelope produzido pelo NsSuitelet.api()
     * e pelo pd-cntst-restlet.util.js legado.
     *
     * Se a resposta não tiver o campo "status" (Restlet que retorna
     * dados direto), trata como sucesso e passa o payload inteiro.
     *
     * @param {any} response
     * @returns {{ ok: boolean, data: any, message: string }}
     * @private
     */
    _unwrap(response) {
        if (response == null || response.status == null) {
            return { ok: true, data: response, message: '' };
        }

        if (response.status === 200) {
            return { ok: true, data: response.data, message: '' };
        }

        return { ok: false, data: null, message: response.message || 'Erro desconhecido' };
    }

    /* ── Monta a URL do Restlet ou Suitelet ─────────────────────── */

    /**
     * @param {object} [parameters]
     * @returns {string}
     * @private
     */
    _buildURL(parameters) {
        let url;

        if (this._restlet.suitelet) {
            const { script, deployment } = this._restlet.suitelet;
            url = `/app/site/hosting/scriptlet.nl?script=${script}&deploy=${deployment}`;
        } else {
            const { script, deployment } = this._restlet;
            url = `/app/site/hosting/restlet.nl?script=${script}&deploy=${deployment}`;
        }

        if (parameters != null) {
            for (const key in parameters) {
                if (Object.prototype.hasOwnProperty.call(parameters, key)) {
                    const value = parameters[key];
                    url += `&${encodeURIComponent(key)}=${value != null ? encodeURIComponent(value) : ''}`;
                }
            }
        }

        return url;
    }

    /* ── Block / unblock helpers ────────────────────────────────── */

    /**
     * @param {string} [selector]
     * @returns {NodeList|null}
     * @private
     */
    _block(selector) {
        if (!selector) return null;
        const els = document.querySelectorAll(selector);
        els.forEach(el => { el.disabled = true; });
        return els;
    }

    /**
     * @param {NodeList|null} els
     * @private
     */
    _unblock(els) {
        if (!els) return;
        els.forEach(el => { el.disabled = false; });
    }
}

/* ── Classe de erro tipada ──────────────────────────────────────── */

/**
 * NsHttpError
 *
 * Erro específico de chamadas HTTP, com código e contexto separados
 * da mensagem legível — facilita tratamento diferenciado por tipo.
 *
 * @example
 *   http.get(...)
 *       .catch(function(err) {
 *           if (err instanceof NsHttpError && err.code === 'API_ERROR') {
 *               showToast(err.message);
 *           }
 *       });
 */
class NsHttpError extends Error {

    /**
     * @param {string} code     — 'HTTP_ERROR' | 'API_ERROR' | 'INVALID_RESTLET'
     * @param {string} message  — mensagem legível
     * @param {any}    [context]— dados brutos para debug
     */
    constructor(code, message, context) {
        super(message);
        this.name    = 'NsHttpError';
        this.code    = code;
        this.context = context || null;
    }
}