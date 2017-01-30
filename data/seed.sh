#!/bin/bash

echo -n "Connecting to databse "
while [ $(curl -s -o /dev/null -w "%{http_code}" -i -H "Accept: application/json; charset=UTF-8" -H "Content-Type: application/json" http://localhost:7474/db/data/) -ne 200 ];
do
	echo -n "."
	sleep 2
done
echo " connected"

echo -n "Removing data ... "
curl -s -o /dev/null -i -H "Accept: application/json; charset=UTF-8" -H "Content-Type: application/json" -X POST -d '{"statements": [{"statement": "MATCH (n) DETACH DELETE n"}]}' http://localhost:7474/db/data/transaction/commit
echo "done"

echo -n "Populating data ... "
curl -s -o /dev/null -i -H "Accept: application/json; charset=UTF-8" -H "Content-Type: application/json" -X POST -d '{"statements": [{"statement": "CREATE (google:Resource {name: \"www.google.com\", location: \"http://www.google.com\"}),(yahoo:Resource {name: \"www.yahoo.com\", location: \"http://www.yahoo.com\"}),(espn:Resource {name: \"espn.go.com\", location: \"http://espn.go.com\"}),(cnn:Resource {name: \"www.cnn.com\", location: \"http://www.cnn.com\"}),(news:Topic {name: \"news\"}),(sports:Topic {name: \"sports\"}),(search:Topic {name: \"search\"}),(google)-[:TAGGED]->(search),(yahoo)-[:TAGGED]->(search),(yahoo)-[:TAGGED]->(news),(cnn)-[:TAGGED]->(news),(espn)-[:TAGGED]->(sports),(espn)-[:TAGGED]->(news)"}]}' http://localhost:7474/db/data/transaction/commit
echo "done"
