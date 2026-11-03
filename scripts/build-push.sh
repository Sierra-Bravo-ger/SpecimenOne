#!/usr/bin/env bash
# Baut Frontend- und API-Image und pusht sie nach Docker Hub.
# Watchtower auf styx zieht die neuen :latest-Images danach selbst.
set -euo pipefail
cd "$(dirname "$0")/.."
REG="${REGISTRY:-madmoench}"
TAG="${TAG:-latest}"
docker build -t "$REG/specimenone:$TAG" -f Dockerfile .
docker build -t "$REG/specimenone-api:$TAG" server
if [[ "${1:-}" != "--no-push" ]]; then
  docker push "$REG/specimenone:$TAG"
  docker push "$REG/specimenone-api:$TAG"
fi
