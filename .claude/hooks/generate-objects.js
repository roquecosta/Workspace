#!/usr/bin/env node

/**
 * generate-objects.js
 * Lê um project-manifest.md e gera XMLs SDF em /Objects para cada script com status = novo
 *
 * Uso:
 *   node generate-objects.js --manifest path/to/project-manifest.md --output path/to/Objects
 *   node generate-objects.js  (usa defaults: ./project-manifest.md e ./Objects)
 */

const fs = require('fs');
const path = require('path');

// ─── CLI args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const getArg = (flag) => {
    const i = args.indexOf(flag);
    return i !== -1 ? args[i + 1] : null;
};

const MANIFEST_PATH = getArg('--manifest') || './project-manifest.md';
const OUTPUT_DIR    = getArg('--output')   || './Objects';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseTable(lines) {
    const rows = lines.filter(l => l.startsWith('|') && !l.match(/^\|\s*[-:]+/));
    const result = {};
    for (const row of rows) {
        const cells = row.split('|').map(c => c.trim()).filter(Boolean);
        if (cells.length >= 2) {
            const key   = cells[0].toLowerCase();
            const value = cells[1];
            // acumula linhas de description que continuam em rows com key vazia
            if (key && value) result[key] = value;
        }
    }
    return result;
}

function extractSections(markdown) {
    const lines   = markdown.split('\n');
    const scripts = [];

    let inScripts  = false;
    let currentId  = null;
    let tableLines = [];

    for (const line of lines) {
        // Detecta ## Scripts
        if (line.match(/^##\s+Scripts/i))  { inScripts = true;  continue; }
        if (line.match(/^##\s+(?!Scripts)/i)) { inScripts = false; continue; }

        if (!inScripts) continue;

        // Novo objeto ### [customscript_...]
        const h3 = line.match(/^###\s+\[?(customscript_[^\]\s]+)\]?/i);
        if (h3) {
            if (currentId && tableLines.length) {
                scripts.push({ id: currentId, fields: parseTable(tableLines) });
            }
            currentId  = h3[1];
            tableLines = [];
            continue;
        }

        // Linhas de tabela
        if (currentId && line.startsWith('|')) {
            tableLines.push(line);
        }

        // Separador --- fecha o bloco atual
        if (currentId && line.match(/^---+\s*$/) && tableLines.length) {
            scripts.push({ id: currentId, fields: parseTable(tableLines) });
            currentId  = null;
            tableLines = [];
        }
    }

    // Último bloco sem --- final
    if (currentId && tableLines.length) {
        scripts.push({ id: currentId, fields: parseTable(tableLines) });
    }

    return scripts;
}

// ─── Normaliza o campo type ───────────────────────────────────────────────────
// Suporta valores como "userevent (client action via botão)" → "userevent"

const TYPE_ALIASES = {
    userevent:       'userevent',
    scheduled:       'scheduled',
    mapreduce:       'mapreducescript',
    mapreducescript: 'mapreducescript',
    suitelet:        'suitelet',
    restlet:         'restlet',
    clientscript:    'clientscript',
};

function normalizeType(raw) {
    if (!raw) return null;
    const lower = raw.toLowerCase().trim();
    for (const [key, val] of Object.entries(TYPE_ALIASES)) {
        if (lower.startsWith(key)) return val;
    }
    return lower;
}

// ─── Validação de campos obrigatórios ────────────────────────────────────────

const REQUIRED = {
    userevent:     ['file', 'deploymentid', 'recordtype'],
    scheduled:     ['file', 'deploymentid'],
    mapreducescript: ['file', 'deploymentid'],
    suitelet:      ['file', 'deploymentid'],
    restlet:       ['file', 'deploymentid'],
    clientscript:  ['file', 'deploymentid', 'recordtype'],
};

function validate(id, fields) {
    const type = normalizeType(fields.type);
    if (!type) return [`[${id}] Campo obrigatório ausente: type`];
    const required = REQUIRED[type];
    if (!required) return [`[${id}] Tipo desconhecido: "${fields.type}"`];
    return required
        .filter(f => !fields[f])
        .map(f => `[${id}] Campo obrigatório ausente: ${f}`);
}

// ─── Extração do nome display (tag <n>) ──────────────────────────────────────

function displayName(id) {
    // customscript_pd_recalculo_saldo_cx_1_1 → PD | Recalculo Saldo Cx 1 1
    return id
        .replace(/^customscript_/, '')
        .split('_')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

// ─── Normaliza o caminho do scriptfile ───────────────────────────────────────

function scriptFilePath(raw) {
    // Se já vier com [/SuiteScripts/...] mantém; caso contrário adapta
    if (raw.startsWith('[')) return raw;
    const clean = raw.replace(/^\.?\/?src\/scripts\//, '');
    return `[/SuiteScripts/${clean}]`;
}

// ─── Templates XML por tipo ──────────────────────────────────────────────────

function xmlUserEvent(id, f) {
    const funcs = [
        f.beforesend  ? `  <beforesend>${f.beforesend}</beforesend>`   : '',
        f.beforesubmit ? `  <beforesubmit>${f.beforesubmit}</beforesubmit>` : '',
        f.aftersubmit  ? `  <aftersubmit>${f.aftersubmit}</aftersubmit>`   : '',
    ].filter(Boolean).join('\n');

    return `<usereventscript scriptid="${id}">
  <description>${f.description || ''}</description>
  <isinactive>F</isinactive>
  <n>${displayName(id)}</n>
  <notifyadmins>F</notifyadmins>
  <notifyemails></notifyemails>
  <notifyowner>T</notifyowner>
  <notifyuser>F</notifyuser>
  <scriptfile>${scriptFilePath(f.file)}</scriptfile>
${funcs}
  <scriptdeployments>
    <scriptdeployment scriptid="${f.deploymentid}">
      <allemployees>F</allemployees>
      <alllocalizationcontexts>T</alllocalizationcontexts>
      <allpartners>F</allpartners>
      <allroles>F</allroles>
      <audslctrole></audslctrole>
      <eventtype></eventtype>
      <executioncontext>ACTION|ADVANCEDREVREC|BANKCONNECTIVITY|BANKSTATEMENTPARSER|BUNDLEINSTALLATION|CLIENT|CONSOLRATEADJUSTOR|CSVIMPORT|CUSTOMGLLINES|CUSTOMMASSUPDATE|CUSTOMTOOL|DATASETBUILDER|DEBUGGER|EMAILCAPTURE|FICONNECTIVITY|FIPARSER|MAPREDUCE|OCRPLUGIN|OTHER|PAYMENTGATEWAY|PAYMENTPOSTBACK|PLATFORMEXTENSION|PORTLET|PROMOTIONS|RECORDACTION|RESTLET|RESTWEBSERVICES|SCHEDULED|SDFINSTALLATION|SHIPPINGPARTNERS|SUITELET|TAXCALCULATION|USEREVENT|USERINTERFACE|WEBSERVICES|WORKBOOKBUILDER|WORKFLOW</executioncontext>
      <isdeployed>T</isdeployed>
      <loglevel>DEBUG</loglevel>
      <recordtype>${(f.recordtype || '').toUpperCase()}</recordtype>
      <runasrole></runasrole>
      <status>TESTING</status>
    </scriptdeployment>
  </scriptdeployments>
</usereventscript>`;
}

function xmlScheduled(id, f) {
    return `<scheduledscript scriptid="${id}">
  <description>${f.description || ''}</description>
  <isinactive>F</isinactive>
  <n>${displayName(id)}</n>
  <notifyadmins>F</notifyadmins>
  <notifyemails></notifyemails>
  <notifyowner>T</notifyowner>
  <notifyuser>F</notifyuser>
  <scriptfile>${scriptFilePath(f.file)}</scriptfile>
  <scriptdeployments>
    <scriptdeployment scriptid="${f.deploymentid}">
      <isdeployed>T</isdeployed>
      <loglevel>DEBUG</loglevel>
      <runasrole>ADMINISTRATOR</runasrole>
      <status>NOTSCHEDULED</status>
      <title>${displayName(id)}</title>
    </scriptdeployment>
  </scriptdeployments>
</scheduledscript>`;
}

function xmlMapReduce(id, f) {
    return `<mapreducescript scriptid="${id}">
  <description>${f.description || ''}</description>
  <isinactive>F</isinactive>
  <n>${displayName(id)}</n>
  <notifyadmins>F</notifyadmins>
  <notifyemails></notifyemails>
  <notifyowner>T</notifyowner>
  <scriptfile>${scriptFilePath(f.file)}</scriptfile>
  <scriptdeployments>
    <scriptdeployment scriptid="${f.deploymentid}">
      <buffersize>1</buffersize>
      <concurrencylimit>1</concurrencylimit>
      <isdeployed>T</isdeployed>
      <loglevel>ERROR</loglevel>
      <queueallstagesatonce>T</queueallstagesatonce>
      <runasrole>ADMINISTRATOR</runasrole>
      <status>NOTSCHEDULED</status>
      <title>${displayName(id)}</title>
      <yieldaftermins>60</yieldaftermins>
    </scriptdeployment>
  </scriptdeployments>
</mapreducescript>`;
}

function xmlSuitelet(id, f) {
    return `<suitelet scriptid="${id}">
  <description>${f.description || ''}</description>
  <isinactive>F</isinactive>
  <n>${displayName(id)}</n>
  <notifyadmins>F</notifyadmins>
  <notifyemails></notifyemails>
  <notifyowner>T</notifyowner>
  <notifyuser>F</notifyuser>
  <scriptfile>${scriptFilePath(f.file)}</scriptfile>
  <scriptdeployments>
    <scriptdeployment scriptid="${f.deploymentid}">
      <allemployees>F</allemployees>
      <allpartners>F</allpartners>
      <allroles>T</allroles>
      <audslctrole></audslctrole>
      <isdeployed>T</isdeployed>
      <isonline>F</isonline>
      <loglevel>ERROR</loglevel>
      <runasrole>ADMINISTRATOR</runasrole>
      <status>RELEASED</status>
      <title>${displayName(id)}</title>
    </scriptdeployment>
  </scriptdeployments>
</suitelet>`;
}

function xmlRestlet(id, f) {
    const funcs = [
        f.get    ? `  <get>${f.get}</get>`       : '',
        f.post   ? `  <post>${f.post}</post>`     : '',
        f.put    ? `  <put>${f.put}</put>`        : '',
        f.delete ? `  <delete>${f.delete}</delete>` : '',
    ].filter(Boolean).join('\n');

    return `<restlet scriptid="${id}">
  <description>${f.description || ''}</description>
  <isinactive>F</isinactive>
  <n>${displayName(id)}</n>
  <notifyadmins>F</notifyadmins>
  <notifyemails></notifyemails>
  <notifyowner>T</notifyowner>
  <notifyuser>F</notifyuser>
  <scriptfile>${scriptFilePath(f.file)}</scriptfile>
${funcs}
  <scriptdeployments>
    <scriptdeployment scriptid="${f.deploymentid}">
      <allemployees>F</allemployees>
      <allpartners>F</allpartners>
      <allroles>T</allroles>
      <audslctrole></audslctrole>
      <isdeployed>T</isdeployed>
      <loglevel>DEBUG</loglevel>
      <status>RELEASED</status>
      <title>${displayName(id)}</title>
    </scriptdeployment>
  </scriptdeployments>
</restlet>`;
}

function xmlClientScript(id, f) {
    const funcs = [
        f.pageinit     ? `  <pageinit>${f.pageinit}</pageinit>`         : '',
        f.saverecord   ? `  <saverecord>${f.saverecord}</saverecord>`   : '',
        f.fieldchanged ? `  <fieldchanged>${f.fieldchanged}</fieldchanged>` : '',
        f.lineintit    ? `  <lineinit>${f.lineinit}</lineinit>`         : '',
    ].filter(Boolean).join('\n');

    return `<clientscript scriptid="${id}">
  <description>${f.description || ''}</description>
  <isinactive>F</isinactive>
  <n>${displayName(id)}</n>
  <notifyadmins>F</notifyadmins>
  <notifyemails></notifyemails>
  <notifyowner>T</notifyowner>
  <notifyuser>F</notifyuser>
  <scriptfile>${scriptFilePath(f.file)}</scriptfile>
${funcs}
  <scriptdeployments>
    <scriptdeployment scriptid="${f.deploymentid}">
      <allemployees>F</allemployees>
      <allpartners>F</allpartners>
      <allroles>T</allroles>
      <isdeployed>T</isdeployed>
      <loglevel>DEBUG</loglevel>
      <recordtype>${(f.recordtype || '').toUpperCase()}</recordtype>
      <status>TESTING</status>
    </scriptdeployment>
  </scriptdeployments>
</clientscript>`;
}

// ─── Roteador de templates ────────────────────────────────────────────────────

function generateXML(id, fields) {
    const type = normalizeType(fields.type);
    switch (type) {
        case 'userevent':       return xmlUserEvent(id, fields);
        case 'scheduled':       return xmlScheduled(id, fields);
        case 'mapreducescript':
        case 'mapreduce':       return xmlMapReduce(id, fields);
        case 'suitelet':        return xmlSuitelet(id, fields);
        case 'restlet':         return xmlRestlet(id, fields);
        case 'clientscript':    return xmlClientScript(id, fields);
        default:                return null;
    }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
    // Lê o manifest
    if (!fs.existsSync(MANIFEST_PATH)) {
        console.error(`❌  Manifest não encontrado: ${MANIFEST_PATH}`);
        process.exit(1);
    }
    const markdown = fs.readFileSync(MANIFEST_PATH, 'utf8');

    // Garante que o diretório de output existe
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    // Extrai scripts
    const scripts = extractSections(markdown);
    if (!scripts.length) {
        console.warn('⚠️  Nenhum script encontrado na seção ## Scripts do manifest.');
        return;
    }

    let gerados  = 0;
    let ignorados = 0;
    let erros    = 0;

    for (const { id, fields } of scripts) {
        // Ignora existentes
        if (fields.status?.toLowerCase() === 'existente') {
            console.log(`⏭️   Ignorado (existente): ${id}`);
            ignorados++;
            continue;
        }

        // Valida campos obrigatórios
        const errosValidacao = validate(id, fields);
        if (errosValidacao.length) {
            errosValidacao.forEach(e => console.error(`❌  ${e}`));
            erros++;
            continue;
        }

        // Gera XML
        const xml = generateXML(id, fields);
        if (!xml) {
            console.error(`❌  [${id}] Tipo não suportado: ${fields.type}`);
            erros++;
            continue;
        }

        const outputPath = path.join(OUTPUT_DIR, `${id}.xml`);
        fs.writeFileSync(outputPath, xml, 'utf8');
        console.log(`✅  Gerado: ${outputPath}`);
        gerados++;
    }

    console.log(`\n📊  Resumo: ${gerados} gerado(s) | ${ignorados} ignorado(s) | ${erros} erro(s)`);
    if (erros > 0) process.exit(1);
}

main();