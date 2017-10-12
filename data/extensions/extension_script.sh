#!/bin/bash

# Copy the extension files into the neo4j plugins directory.
cp /extensions/neo4j-graphql-*.jar /var/lib/neo4j/plugins

# Register the neo4j-graphql extension with neo4j.
echo 'dbms.unmanaged_extension_classes=org.neo4j.graphql=/graphql' >> /var/lib/neo4j/conf/neo4j.conf
