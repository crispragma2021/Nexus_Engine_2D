#!/bin/bash

echo "=== AGENTS.MD (ESPECIFICACIÓN) ==="
if [ -f "AGENTS.md" ]; then
    head -n 40 AGENTS.md
fi

echo -e "\n=== ARCHIVOS EN src/lib/agent/ ==="
if [ -d "src/lib/agent" ]; then
    ls -la src/lib/agent/
fi

echo -e "\n=== TESTS DE AGENTE ==="
ls -la tests/agent-*.test.ts 2>/dev/null
