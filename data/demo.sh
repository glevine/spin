#!/bin/bash

echo -n "Removing data ... "
curl -s -o /dev/null -i -H "Accept: application/json; charset=UTF-8" -H "Content-Type: application/json" -X POST -d '{"statements": [{"statement": "MATCH (n) DETACH DELETE n"}]}' http://localhost:7474/db/data/transaction/commit
echo "done"

echo -n "Populating data ... "
declare -a STATEMENTS
while IFS= read -r; do STATEMENTS+=("$REPLY"); done <./data/demo.cypher
CYPHER=$(echo "$(IFS=,; echo "${STATEMENTS[*]}")" | sed 's/["]/\\&/g')
curl -i -H "Accept: application/json; charset=UTF-8" -H "Content-Type: application/json" -X POST -d "{\"statements\": [{\"statement\": \"CREATE ${CYPHER}\"}]}" http://localhost:7474/db/data/transaction/commit
echo "done"
