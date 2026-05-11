#!/bin/bash
FILE_PATH="$1"

# Só age se o arquivo salvo for um spec.md
if [[ "$FILE_PATH" != *"/spec.md" ]]; then
  exit 0
fi

PROJECT_DIR=$(dirname "$FILE_PATH")
MANIFEST="$PROJECT_DIR/project-manifest.md"

if [ -f "$MANIFEST" ]; then
  MODE="diff"
else
  MODE="create"
fi

echo "spec.md modificado em $PROJECT_DIR — disparando manifest-builder (modo: $MODE)"

# Invoca subagente com contexto
claude -p "
Você é o manifest-builder da ProjectDome.
Leia o spec em: $FILE_PATH
$([ "$MODE" = "diff" ] && echo "O manifest atual está em: $MANIFEST — faça apenas diff cirúrgico, atualizando scripts e registros alterados ou adicionados sem tocar no que não mudou." || echo "Não existe manifest ainda. Gere o project-manifest.md completo.")
Salve o resultado em: $MANIFEST
" --allowedTools "Read,Write,Edit"