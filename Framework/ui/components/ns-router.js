/**
 * NsRouter
 * ui/components/ns-router.js
 *
 * Sincroniza um estado de navegação genérico (chaves/valores arbitrários,
 * definidos por quem usa o componente) com a querystring da URL atual, via
 * History API — sem round-trip ao Suitelet e sem recarregar a página.
 *
 * Client-agnostic: não sabe nada sobre o domínio da tela que o usa (não
 * conhece "Proposta", "camada CPV" etc.) — só lê/escreve um objeto plano de
 * parâmetros na querystring.
 *
 * ── ESCRITA (navegação) ──────────────────────────────────────────
 *
 *   const router = new NsRouter();
 *
 *   // pushState — nova entrada no histórico do navegador
 *   router.push({ view: 'panel', proposalId: '123', layer: 'CCPV' });
 *
 *   // replaceState — substitui a entrada atual, sem poluir o histórico
 *   // (ex.: troca de aba dentro de um painel)
 *   router.replace({ layer: 'MP' });
 *
 *   // passar `null`/`undefined` para uma chave remove o parâmetro da URL
 *   router.replace({ proposalId: null, layer: null });
 *
 * Parâmetros nativos já presentes na URL (ex.: `script`, `deploy`, `compid`
 * do Suitelet) nunca são removidos — `push`/`replace` fazem merge com a
 * querystring atual; só as chaves explicitamente passadas são alteradas.
 *
 * ── LEITURA (estado atual) ───────────────────────────────────────
 *
 *   const state = router.getState();
 *   // → { script: '123', deploy: '1', view: 'panel', proposalId: '123', layer: 'CCPV' }
 *
 * Útil no boot da tela, para restaurar a navegação depois de um F5 — lê a
 * URL ANTES de decidir a tela inicial.
 *
 * ── REAGIR A VOLTAR/AVANÇAR DO NAVEGADOR ─────────────────────────
 *
 *   const unsubscribe = router.onPopState(function(state) {
 *     console.log('usuário navegou via voltar/avançar', state);
 *   });
 *
 *   // para de escutar
 *   unsubscribe();
 *
 * ── DESTRUIR ──────────────────────────────────────────────────────
 *
 *   router.destroy(); // remove todos os listeners de popstate registrados
 */
class NsRouter {

    constructor() {
        this._listeners = [];
    }

    /* ── API pública — escrita ──────────────────────────────────── */

    /**
     * Mescla `state` na querystring atual e empilha uma nova entrada no
     * histórico do navegador (pushState). Use nas transições de tela
     * (ex.: landing ↔ painel).
     *
     * @param {Object<string, string|number|null|undefined>} state
     */
    push(state) {
        this._write(state, true);
    }

    /**
     * Mescla `state` na querystring atual substituindo a entrada corrente do
     * histórico (replaceState) — não cria uma nova entrada. Use em trocas de
     * estado que não devem poluir o histórico (ex.: troca de aba dentro de
     * um painel).
     *
     * @param {Object<string, string|number|null|undefined>} state
     */
    replace(state) {
        this._write(state, false);
    }

    /* ── API pública — leitura ──────────────────────────────────── */

    /**
     * Lê a querystring atual (`location.search`) e devolve um objeto plano
     * com todas as chaves presentes — inclusive parâmetros nativos do
     * Suitelet (`script`, `deploy`, `compid` etc.), que o chamador deve
     * ignorar se não forem do seu interesse.
     *
     * @returns {Object<string, string>}
     */
    getState() {
        const params = new URLSearchParams(location.search);
        const state  = {};
        params.forEach((value, key) => { state[key] = value; });
        return state;
    }

    /* ── API pública — eventos ───────────────────────────────────── */

    /**
     * Registra um callback chamado sempre que o usuário navega via
     * voltar/avançar do navegador (evento `popstate`). O callback recebe o
     * estado atual da URL já lido (mesmo formato de `getState()`).
     *
     * @param {function(Object<string,string>, PopStateEvent):void} callback
     * @returns {function():void} função para cancelar a inscrição
     */
    onPopState(callback) {
        const fn = (evt) => callback(this.getState(), evt);
        window.addEventListener('popstate', fn);
        this._listeners.push({ el: window, type: 'popstate', fn });
        return () => this._unsubscribe(fn);
    }

    /** Remove todos os listeners de popstate registrados por esta instância. */
    destroy() {
        this._listeners.forEach(({ el, type, fn }) => el.removeEventListener(type, fn));
        this._listeners = [];
    }

    /* ── Internos ────────────────────────────────────────────────── */

    /**
     * @param {Object<string, string|number|null|undefined>} state
     * @param {boolean} push — true = pushState, false = replaceState
     */
    _write(state, push) {
        const params = new URLSearchParams(location.search);

        Object.keys(state || {}).forEach((key) => {
            const value = state[key];
            if (value === null || value === undefined) {
                params.delete(key);
            } else {
                params.set(key, String(value));
            }
        });

        const query = params.toString();
        const url   = location.pathname + (query ? '?' + query : '') + location.hash;

        if (push) {
            history.pushState(state, '', url);
        } else {
            history.replaceState(state, '', url);
        }
    }

    /**
     * @param {Function} fn
     */
    _unsubscribe(fn) {
        window.removeEventListener('popstate', fn);
        this._listeners = this._listeners.filter((l) => l.fn !== fn);
    }
}