#!/usr/bin/env bash
# Sobe o servidor de contas do Vida de Dev na Cloudflare.
# Precisa de: CF_TOKEN com Workers Scripts:Edit, Workers KV Storage:Edit e Account Settings:Read.
#
#   export CF_TOKEN=...
#   bash deploy.sh
set -euo pipefail

API=https://api.cloudflare.com/client/v4
NOME=vida-de-dev-api
KV=VIDA_DE_DEV
H=(-H "Authorization: Bearer ${CF_TOKEN:?defina CF_TOKEN}" )

diga(){ printf '\n%s\n' "$*"; }
campo(){ python3 -c "import json,sys; d=json.load(sys.stdin); print(eval('d'+'$1') if d.get('success') else 'ERRO: '+json.dumps(d.get('errors')))"; }

diga "1/5  procurando a conta"
CONTA=$(curl -s "${H[@]}" "$API/accounts" | campo "['result'][0]['id']")
echo "     conta $CONTA"

diga "2/5  criando o KV (se ainda não existe)"
LISTA=$(curl -s "${H[@]}" "$API/accounts/$CONTA/storage/kv/namespaces?per_page=100")
NS=$(echo "$LISTA" | python3 -c "
import json,sys
d=json.load(sys.stdin)
print(next((n['id'] for n in d.get('result',[]) if n['title']=='$KV'), ''))")
if [ -z "$NS" ]; then
  NS=$(curl -s -X POST "${H[@]}" -H 'Content-Type: application/json' \
    "$API/accounts/$CONTA/storage/kv/namespaces" -d "{\"title\":\"$KV\"}" | campo "['result']['id']")
fi
echo "     kv $NS"

diga "3/5  subindo o worker"
cat > /tmp/metadata.json <<JSON
{"main_module":"worker.js","compatibility_date":"2026-01-01",
 "bindings":[{"type":"kv_namespace","name":"JOGO","namespace_id":"$NS"}]}
JSON
curl -s -X PUT "${H[@]}" \
  "$API/accounts/$CONTA/workers/scripts/$NOME" \
  -F 'metadata=@/tmp/metadata.json;type=application/json' \
  -F 'worker.js=@worker.js;type=application/javascript+module' \
  | campo "['result']['id']"

diga "4/5  ligando o endereço workers.dev"
curl -s -X POST "${H[@]}" -H 'Content-Type: application/json' \
  "$API/accounts/$CONTA/workers/scripts/$NOME/subdomain" -d '{"enabled":true}' >/dev/null
SUB=$(curl -s "${H[@]}" "$API/accounts/$CONTA/workers/subdomain" | campo "['result']['subdomain']")

diga "5/5  conferindo"
URL="https://$NOME.$SUB.workers.dev"
sleep 6
curl -s "$URL/status" || true

cat <<FIM

================================================================
  Servidor no ar:  $URL

  Confira se a constante API no index.html é exatamente essa.
================================================================
FIM
