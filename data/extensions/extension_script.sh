#!/bin/bash

# Need git to get the neo4j-graphql extension.
apk update && apk add git

# Download the neo4j-graphql extension.
# Use the glevine/neo4j-graphql fork because it has the prebuilt package.
git clone https://github.com/glevine/neo4j-graphql

# Use the prebuilt branch because it has the prebuilt package.
cd neo4j-graphql
git checkout prebuilt

# Copy the extension files into the neo4j plugins directory.
cp dist/neo4j-graphql-*.jar /var/lib/neo4j/plugins

# Register the neo4j-graphql extension with neo4j.
echo 'dbms.unmanaged_extension_classes=org.neo4j.graphql=/graphql' >> /var/lib/neo4j/conf/neo4j.conf

# We changed the working directory in this script. Go back because the remaining
# steps to build the container are dependent on the WORKDIR defined in the neo4j
# Dockerfile.
cd ..
