#!/bin/bash
HOOK_URL="https://api.vercel.com/v1/integrations/deploy/prj_o8Ub91Uj40QjkQAsEpewaYEFYAF8/iciiiM9wom"

echo "Disparando despliegue de nexus-core en Vercel..."
curl -s -X POST "$HOOK_URL"
echo -e "\nDespliegue solicitado correctamente."
