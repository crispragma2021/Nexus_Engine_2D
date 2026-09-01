#!/bin/bash

echo "=== ESTRUCTURA DEL PROYECTO ==="
if command -v tree >/dev/null 2>&1; then
    tree -L 3 -I 'node_modules|.git|target|__pycache__|venv|.venv'
else
    find . -maxdepth 3 -not -path '*/.*' -not -path './node_modules*' -not -path './target*' | sed -e 's/[^-][^\/]*\// |/g' -e 's/|\([^ ]\)/|-- \1/'
fi

echo -e "\n=== ARCHIVOS DE CONFIGURACIÓN Y MÓDULOS ENCONTRADOS ==="
find . -maxdepth 2 -type f \( -name "*.py" -o -name "*.rs" -o -name "*.json" -o -name "*.toml" -o -name "*.sh" \) -not -path '*/.*'

echo -e "\n=== USO DE MEMORIA Y PROCESOS EN TERMUX ==="
free -m 2>/dev/null || cat /proc/meminfo | grep -E 'MemTotal|MemFree|MemAvailable'
