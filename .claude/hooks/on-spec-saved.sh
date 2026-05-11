#!/bin/bash
# on-spec-saved.sh
# Disparado pelo hook PostToolUse sempre que um arquivo é salvo/editado.
# Se o arquivo for um spec.md, invoca o manifest-builder em modo diff ou criação.

FILE_PATH="$1"

# Ignora se não for um spec.md
if [[ "$FILE_PATH" != *"/spec.md" ]]; then
  exit 0
fi

PROJECT_DIR=$(dirname "$FILE_PATH")
MANIFEST="$PROJECT_DIR/project-manifest.md"

if [ -f "$MANIFEST" ]; then
  MODE="diff"
  MODE_INSTRUCTION="O manifest atual está em: $MANIFEST
Rode em modo diff automático: compare o spec com o manifest existente, aplique apenas as alterações identificadas (scripts, records e campos adicionados, removidos ou modificados), registre dúvidas ambíguas como comentários HTML inline e atualize o changelog com a entrada de atualização automática. Não faça perguntas e não apresente resumo."
else
  MODE="criação"
  MODE_INSTRUCTION="Não existe manifest ainda. Gere o project-manifest.md completo a partir do spec, usando o template em assets/project-manifest-template.md. Não faça perguntas — use as convenções padrão da ProjectDome para prefixos e nomenclatura."
fi

echo "[hook] spec.md modificado: $FILE_PATH"
echo "[hook] Modo: $MODE — disparando manifest-builder..."

claude -p \
  --allowedTools "Read,Write,Edit" \
  "Você é o manifest-builder da ProjectDome. Sempre responda em português brasileiro.

Spec modificado: $FILE_PATH
$MODE_INSTRUCTION

Salve o resultado em: $MANIFEST"

echo "[hook] manifest-builder concluído (modo: $MODE)"