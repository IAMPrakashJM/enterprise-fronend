#!/usr/bin/env bash
# Compatibility entry point; the service table lives in run.sh.
exec bash "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/run.sh" "$@"
