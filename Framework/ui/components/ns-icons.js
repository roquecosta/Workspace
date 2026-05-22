/**
 * ns-icons.js
 * Componente de icones do ns-framework - ui/components
 *
 * Catalogo SVG baseado no Lucide Icons (https://lucide.dev)
 * Licenca Lucide: ISC - uso livre inclusive em projetos comerciais.
 *
 * -- USO ---------------------------------------------------------
 *
 *   // enum de nomes - use para passar icones como parametro (com autocomplete)
 *   NsIcons.check            // -> 'check'
 *   NsIcons.arrowUp          // -> 'arrow-up'
 *   NsIcons.alertTriangle    // -> 'alert-triangle'
 *
 *   // renderizar a partir do enum
 *   NsIcons.render(NsIcons.search)
 *   NsIcons.render(NsIcons.trash, { size: 16 })
 *
 *   // passar para componentes
 *   { icon: NsIcons.calendar }
 *   { icon: NsIcons.barChart }
 *
 *   // renderizar diretamente por string (ainda funciona)
 *   NsIcons.render('search')
 *
 *   // com classe extra (para estilizacao pontual)
 *   NsIcons.render(NsIcons.alertTriangle, { size: 20, className: 'ns-icon--warning' })
 *
 *   // checagem antes de usar
 *   NsIcons.has('my-icon')  // -> true | false
 *
 *   // lista completa do catalogo
 *   NsIcons.list()          // -> ['activity', 'alert-circle', ...]
 *
 * -- ADICIONAR UM ICONE ------------------------------------------
 *
 *   Copie o conteudo interno do SVG em https://lucide.dev (o que
 *   esta entre <svg> e </svg>, sem as tags externas) e adicione
 *   uma entrada no objeto ICONS abaixo:
 *
 *   'meu-icone': '<path d="..."/><circle .../>'
 *
 * -- INTEGRACAO COM O FRAMEWORK ----------------------------------
 *
 *   ns-icons.js e carregado automaticamente pelo suitelet base
 *   (CORE_COMPONENTS). Nao e necessario declarar em 'components'.
 *   Os demais componentes (ns-table, ns-form, etc.) chamam
 *   NsIcons.render() diretamente - sem dependencia de CDN externo.
 *
 * @NApiVersion 2.x
 * @NModuleScope public
 */

const NsIcons = (function () {

    /* ===========================================================
       CSS - injetado uma unica vez no <head>
    =========================================================== */

    const CSS_ID = 'ns-icons-styles';

    const CSS = [
        '.ns-icon {',
        '    display: inline-flex;',
        '    align-items: center;',
        '    justify-content: center;',
        '    flex-shrink: 0;',
        '    vertical-align: middle;',
        '}',
        '.ns-icon svg {',
        '    display: block;',
        '    stroke: currentColor;',
        '    stroke-width: 1.75;',
        '    stroke-linecap: round;',
        '    stroke-linejoin: round;',
        '    fill: none;',
        '}',

        /* modificadores de cor - usam os tokens do ns-framework */
        '.ns-icon--muted   { color: const(--ns-text-2, #888); }',
        '.ns-icon--accent  { color: const(--ns-accent, #2B5BE0); }',
        '.ns-icon--success { color: const(--ns-success, #1E7F4E); }',
        '.ns-icon--warning { color: const(--ns-warning, #B45309); }',
        '.ns-icon--danger  { color: const(--ns-danger,  #C0392B); }',
    ].join('\n');

    /* ===========================================================
       CATALOGO - conteudo interno dos SVGs Lucide (~80 icones)
       viewBox padrao: "0 0 24 24"
    =========================================================== */

    const ICONS = {

        /* -- Interface geral -- */
        'search':           '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
        'x':                '<path d="M18 6 6 18M6 6l12 12"/>',
        'x-circle':         '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>',
        'check':            '<path d="M20 6 9 17l-5-5"/>',
        'check-circle':     '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/>',
        'plus':             '<path d="M12 5v14M5 12h14"/>',
        'plus-circle':      '<circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>',
        'minus':            '<path d="M5 12h14"/>',
        'minus-circle':     '<circle cx="12" cy="12" r="10"/><path d="M8 12h8"/>',
        'chevron-up':       '<path d="m18 15-6-6-6 6"/>',
        'chevron-down':     '<path d="m6 9 6 6 6-6"/>',
        'chevron-left':     '<path d="m15 18-6-6 6-6"/>',
        'chevron-right':    '<path d="m9 18 6-6-6-6"/>',
        'chevrons-up-down': '<path d="m7 15 5 5 5-5M7 9l5-5 5 5"/>',
        'arrow-up':         '<path d="m5 12 7-7 7 7M12 19V5"/>',
        'arrow-down':       '<path d="m19 12-7 7-7-7M12 5v14"/>',
        'arrow-left':       '<path d="m12 19-7-7 7-7M19 12H5"/>',
        'arrow-right':      '<path d="m12 5 7 7-7 7M5 12h14"/>',
        'arrow-up-right':   '<path d="M7 17 17 7M7 7h10v10"/>',
        'menu':             '<path d="M4 6h16M4 12h16M4 18h16"/>',
        'more-horizontal':  '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
        'more-vertical':    '<circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>',
        'grip-vertical':    '<circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/>',

        /* -- Acoes CRUD -- */
        'edit':             '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
        'edit-2':           '<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>',
        'trash':            '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
        'trash-2':          '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/>',
        'copy':             '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
        'save':             '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
        'download':         '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
        'upload':           '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
        'refresh-cw':       '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
        'filter':           '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
        'sort-asc':         '<path d="m3 8 4-4 4 4M7 4v16"/><path d="M11 12h4M11 16h7M11 20h10"/>',
        'sort-desc':        '<path d="m3 16 4 4 4-4M7 20V4"/><path d="M11 4h4M11 8h7M11 12h10"/>',

        /* -- Alertas e estado -- */
        'alert-circle':     '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
        'alert-triangle':   '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/>',
        'info':             '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
        'help-circle':      '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" x2="12.01" y1="17" y2="17"/>',
        'loader':           '<line x1="12" x2="12" y1="2" y2="6"/><line x1="12" x2="12" y1="18" y2="22"/><line x1="4.93" x2="7.76" y1="4.93" y2="7.76"/><line x1="16.24" x2="19.07" y1="16.24" y2="19.07"/><line x1="2" x2="6" y1="12" y2="12"/><line x1="18" x2="22" y1="12" y2="12"/><line x1="4.93" x2="7.76" y1="19.07" y2="16.24"/><line x1="16.24" x2="19.07" y1="7.76" y2="4.93"/>',
        'ban':              '<circle cx="12" cy="12" r="10"/><line x1="4.93" x2="19.07" y1="4.93" y2="19.07"/>',
        'lock':             '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
        'unlock':           '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
        'eye':              '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
        'eye-off':          '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>',

        /* -- Navegacao e layout -- */
        'home':             '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
        'layout':           '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/>',
        'sidebar':          '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M9 3v18"/>',
        'panel-left':       '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/>',
        'maximize':         '<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>',
        'minimize':         '<path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>',
        'external-link':    '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/>',
        'link':             '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
        'link-2-off':       '<path d="M9 17H7A5 5 0 0 1 7 7"/><path d="M15 7h2a5 5 0 0 1 4 8"/><line x1="8" x2="12" y1="12" y2="12"/><line x1="2" x2="22" y1="2" y2="22"/>',

        /* -- Dados e documentos -- */
        'file':             '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/>',
        'file-text':        '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/>',
        'file-plus':        '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="12" x2="12" y1="18" y2="12"/><line x1="9" x2="15" y1="15" y2="15"/>',
        'folder':           '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
        'folder-open':      '<path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/>',
        'table':            '<path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>',
        'list':             '<line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/>',
        'bar-chart':        '<line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/>',
        'bar-chart-2':      '<line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/>',
        'pie-chart':        '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>',
        'trending-up':      '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
        'trending-down':    '<polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>',

        /* -- Usuarios e organizacao -- */
        'user':             '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
        'users':            '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
        'user-plus':        '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/>',
        'user-minus':       '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="22" x2="16" y1="11" y2="11"/>',
        'user-check':       '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>',
        'building':         '<rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M8 10h.01M16 10h.01M12 14h.01M8 14h.01M16 14h.01"/>',
        'briefcase':        '<rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',

        /* -- Comunicacao -- */
        'mail':             '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
        'bell':             '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
        'bell-off':         '<path d="M8.7 8.7A6 6 0 0 0 6 13c0 7-3 9-3 9h18m-3.46-3A6 6 0 0 0 18 13V8"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/><line x1="2" x2="22" y1="2" y2="22"/>',
        'message-square':   '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
        'phone':            '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.28 2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>',

        /* -- Tempo e calendario -- */
        'calendar':         '<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>',
        'clock':            '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
        'timer':            '<line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="12" y1="14" y2="8"/><path d="M20.5 10 A9 9 0 1 1 3.5 10"/>',

        /* -- Configuracoes e sistema -- */
        'settings':         '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
        'sliders':          '<line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="6" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="6" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="10" y2="3"/><line x1="1" x2="7" y1="14" y2="14"/><line x1="9" x2="15" y1="12" y2="12"/><line x1="17" x2="23" y1="16" y2="16"/>',
        'tag':              '<path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/>',
        'hash':             '<line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/>',
        'code':             '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
        'terminal':         '<polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/>',
        'database':         '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/>',
        'server':           '<rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/>',
        'cloud':            '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>',
        'package':          '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
        'globe':            '<circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
        'map-pin':          '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
        'star':             '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
        'heart':            '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
        'flag':             '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>',
        'zap':              '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
        'shield':           '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
        'key':              '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>',
        'log-out':          '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
        'log-in':           '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/>',
        'move':             '<polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="22"/>',
        'expand':           '<path d="m21 21-6-6m6 6v-4.8m0 4.8h-4.8"/><path d="M3 16.2V21m0 0h4.8M3 21l6-6"/><path d="M21 7.8V3m0 0h-4.8M21 3l-6 6"/><path d="M3 7.8V3m0 0h4.8M3 3l6 6"/>',
        'shrink':           '<path d="m15 15 6 6m-6-6v4.8m0-4.8h4.8"/><path d="M9 19.8V15m0 0H4.2M9 15l-6 6"/><path d="M15 4.2V9m0 0h4.8M15 9l6-6"/><path d="M9 4.2V9m0 0H4.2M9 9 3 3"/>',
        'columns':          '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="12" x2="12" y1="3" y2="21"/>',
        'rows':             '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="12" y2="12"/>',
        'credit-card':      '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
        'dollar-sign':      '<line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
        'percent':          '<line x1="19" x2="5" y1="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
        'activity':         '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
        'clipboard':        '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
        'clipboard-check':  '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
        'printer':          '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/>',
        'image':            '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
        'paperclip':        '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
    };

    /* ===========================================================
       Utilitarios internos
    =========================================================== */

    function _injectCSS() {
        if (document.getElementById(CSS_ID)) { return; }
        const style = document.createElement('style');
        style.id = CSS_ID;
        style.textContent = CSS;
        document.head.appendChild(style);
    }

    /* ===========================================================
       API publica
    =========================================================== */

    /**
     * Retorna o HTML de um icone como string.
     *
     * @param {string} name       - Nome do icone (ex.: 'search', 'trash')
     * @param {Object} [options]
     * @param {number} [options.size=18]        - Tamanho em px (width e height)
     * @param {string} [options.className='']   - Classes CSS extras no wrapper
     * @param {string} [options.title='']       - Atributo title para acessibilidade
     * @returns {string} HTML string - pronto para interpolacao em templates
     */
    function render(name, options) {
        _injectCSS();

        const opts   = options || {};
        const size     = opts.size      || 18;
        const extra    = opts.className ? (' ' + opts.className) : '';
        const title    = opts.title     ? ('<title>' + opts.title + '</title>') : '';
        const paths    = ICONS[name];

        if (!paths) {
            console.warn('[NsIcons] icone nao encontrado: "' + name + '"');
            return '';
        }

        return '<span class="ns-icon' + extra + '" aria-hidden="true">' +
            '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
            title + paths +
            '</svg></span>';
    }

    /**
     * Verifica se um icone existe no catalogo.
     * @param {string} name
     * @returns {boolean}
     */
    function has(name) {
        return Object.prototype.hasOwnProperty.call(ICONS, name);
    }

    /**
     * Retorna a lista de todos os nomes do catalogo em ordem alfabetica.
     * @returns {string[]}
     */
    function list() {
        return Object.keys(ICONS).sort();
    }

    /* init */
    _injectCSS();

    /* ===========================================================
       ICONS - enum publico: cada chave aponta para seu proprio nome.
       Uso: NsIcons.ICONS.check  ->  'check'  (passavel ao render)
    =========================================================== */
    const ICONS_ENUM = Object.keys(ICONS).reduce(function (acc, key) {
        acc[key] = key;
        return acc;
    }, {});

    return {
        render : render,
        has    : has,
        list   : list,
        ICONS  : ICONS_ENUM,
    };

}());