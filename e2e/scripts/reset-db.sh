#!/usr/bin/env bash
# Recrea la base de datos E2E desde cero (Modo A, plan §3.2).
# Requiere que `sga-caja-db` sea un checkout hermano de este repo (ver
# `E2E_DB_REPO` para sobrescribir la ruta) y que `psql`/`createdb`/`dropdb`
# estén en PATH y autenticados (usa las mismas PG* env vars que `psql`).
#
# Uso: E2E_DB_NAME=sga_caja_e2e ./e2e/scripts/reset-db.sh
set -euo pipefail

DB_NAME="${E2E_DB_NAME:-sga_caja_e2e}"
DB_REPO="${E2E_DB_REPO:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../sga-caja-db" && pwd)}"

if [[ ! -d "$DB_REPO" ]]; then
  echo "No se encontró sga-caja-db en '$DB_REPO'. Define E2E_DB_REPO con la ruta correcta." >&2
  exit 1
fi

echo "Recreando base '$DB_NAME' desde $DB_REPO ..."
dropdb --if-exists "$DB_NAME"
createdb "$DB_NAME"
psql -v ON_ERROR_STOP=1 -d "$DB_NAME" -f "$DB_REPO/migrations/000_run_all.sql"
psql -v ON_ERROR_STOP=1 -d "$DB_NAME" -f "$DB_REPO/seed/dev_seed.sql"
psql -v ON_ERROR_STOP=1 -d "$DB_NAME" -f "$DB_REPO/seed/002_maestros_epic3.sql"

echo "Base '$DB_NAME' lista."
