#!/usr/bin/env bash
#
# Nexora stack control — start / stop / restart / status / logs / install.
#
# Portable by construction: every path is resolved relative to this file, so the tree
# can be copied to any machine and the script run from any working directory.
#
#   ./run.sh start                 every service
#   ./run.sh start web api         only these
#   ./run.sh stop [svc...]
#   ./run.sh restart [svc...]
#   ./run.sh status
#   ./run.sh logs web              tail -f
#   ./run.sh install [svc...]      npm install where node_modules is missing
#
# State lives in .run/<svc>.pid and .run/<svc>.log next to this script.

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_DIR="$ROOT/.run"

# ---------------------------------------------------------------------------
# Service table:  key | directory (relative to ROOT) | port | start command
#
# nexora and vantage both default to Next's :3000 and so would collide with each
# other, hence the explicit --port in their start commands. Change a port here and
# the whole script follows -- but the two apps that read a port from their OWN config
# do not: web's is in apps/web/package.json, desktop's in apps/desktop/vite.config.ts
# (and, paired with it, src-tauri/tauri.conf.json's devUrl).
# ---------------------------------------------------------------------------
SERVICES=(api web desktop nexora vantage)

svc_dir() {
  case "$1" in
    api)     echo "dummy-api" ;;
    web)     echo "desktop-clients" ;;
    desktop) echo "desktop-clients" ;;
    nexora)  echo "desktop-clients/source/nexora-enterprise-erp" ;;
    vantage) echo "desktop-clients/source/vantage-erp-next" ;;
  esac
}

svc_port() {
  case "$1" in
    api)     echo 3200 ;;
    web)     echo 3100 ;;
    desktop) echo 3101 ;;
    nexora)  echo 3102 ;;
    vantage) echo 3103 ;;
  esac
}

# Production by default, because these are served to other people through nginx.
# A dev server behind a reverse proxy is slower, needs HMR websockets proxied and
# needs each framework told which Host headers to trust -- four extra failure
# points for a URL nobody is editing code against.
#
#   ./run.sh start              production: serves the built output
#   MODE=dev ./run.sh start     the dev servers, with HMR, on the same ports
MODE="${MODE:-prod}"

svc_cmd() {
  if [ "$MODE" = "dev" ]; then
    case "$1" in
      api)     echo "node server.mjs" ;;
      web)     echo "npm run dev --silent -w web" ;;
      desktop) echo "npm run dev --silent -w desktop" ;;
      nexora)  echo "npm run dev --silent -- --port 3102" ;;
      vantage) echo "npm run dev --silent -- --port 3103" ;;
    esac
    return 0
  fi
  case "$1" in
    api)     echo "node server.mjs" ;;
    # `next start` reads apps/web/package.json's --port 3100.
    web)     echo "npm run start --silent -w web" ;;
    # `vite preview` reads preview.port/host/allowedHosts from vite.config.ts.
    desktop) echo "npm run preview --silent -w desktop" ;;
    # These two have a bare `next start`, so the port comes from the CLI.
    nexora)  echo "npm run start --silent -- --port 3102" ;;
    vantage) echo "npm run start --silent -- --port 3103" ;;
  esac
}

# What must be built before `start` in prod mode. The API is plain node and the
# dev servers build nothing, so both cases are empty.
svc_build_cmd() {
  [ "$MODE" = "dev" ] && return 0
  case "$1" in
    api)     echo "" ;;
    web)     echo "npm run build --silent -w web" ;;
    desktop) echo "npm run build --silent -w desktop" ;;
    nexora)  echo "npm run build --silent" ;;
    vantage) echo "npm run build --silent" ;;
  esac
}

# The artefact whose absence means "not built yet".
svc_artifact() {
  case "$1" in
    web)     echo "desktop-clients/apps/web/.next" ;;
    desktop) echo "desktop-clients/apps/desktop/dist" ;;
    nexora)  echo "desktop-clients/source/nexora-enterprise-erp/.next" ;;
    vantage) echo "desktop-clients/source/vantage-erp-next/.next" ;;
    *)       echo "" ;;
  esac
}

# The directory whose node_modules must exist before the service can start. For the
# two workspace apps that is the workspace root, not the app folder.
svc_install_dir() { svc_dir "$1"; }

# api is plain node with no dependencies at all.
svc_needs_install() { [ "$1" != "api" ]; }

svc_label() {
  case "$1" in
    api)     echo "demo auth API" ;;
    web)     echo "web shell (Next)" ;;
    desktop) echo "desktop shell (Vite)" ;;
    nexora)  echo "nexora-enterprise-erp" ;;
    vantage) echo "vantage-erp-next" ;;
  esac
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
if [ -t 1 ]; then
  C_OK=$'\033[32m'; C_ERR=$'\033[31m'; C_WARN=$'\033[33m'; C_DIM=$'\033[2m'; C_OFF=$'\033[0m'
else
  C_OK=""; C_ERR=""; C_WARN=""; C_DIM=""; C_OFF=""
fi

info() { printf '%s\n' "$*"; }
ok()   { printf '%s✓%s %s\n' "$C_OK" "$C_OFF" "$*"; }
warn() { printf '%s!%s %s\n' "$C_WARN" "$C_OFF" "$*"; }
err()  { printf '%s✗%s %s\n' "$C_ERR" "$C_OFF" "$*" >&2; }

is_service() {
  local candidate="$1" s
  for s in "${SERVICES[@]}"; do [ "$s" = "$candidate" ] && return 0; done
  return 1
}

# One -i per address: `lsof -ti tcp:3100 tcp:3101` is not valid and exits without
# killing anything, while still looking like it worked.
#
# The ss fallback is not belt-and-braces, it is load-bearing on Linux. lsof 4.95 finds
# a process's command name by scanning /proc/<pid>/stat for the parenthesis that closes
# the comm field. Next renames its worker process to "next-server (v16.3.3)", which the
# kernel truncates to 15 characters -- "next-server (v1", an UNBALANCED paren. lsof
# gives up on the process entirely and reports no sockets for it, so every Next dev
# server reads as down while it is serving 200s: `start` reports a 45-second timeout
# for an app that came up in 700ms and then DELETES its pid file, and `stop`'s port
# sweep finds nothing to kill -- leaving an orphan holding the port that this script
# can no longer see or signal. vite and plain node are unaffected; their comm strings
# have no parenthesis. ss parses no such field and sees all of them.
#
# ss is Linux-only. macOS never reaches the fallback: lsof works correctly there, and
# an unset `pids` simply stays empty.
port_pids() {
  local pids
  pids="$(lsof -ti "tcp:$1" 2>/dev/null)"
  if [ -z "$pids" ] && command -v ss >/dev/null 2>&1; then
    # No -H: it is a recent iproute2 flag, and the header line carries no "pid=".
    pids="$(ss -ltnp "sport = :$1" 2>/dev/null | grep -o 'pid=[0-9]*' | cut -d= -f2 | sort -u)"
  fi
  [ -n "$pids" ] && printf '%s\n' "$pids"
  return 0
}
port_busy() { [ -n "$(port_pids "$1")" ]; }

pid_file() { echo "$RUN_DIR/$1.pid"; }
log_file() { echo "$RUN_DIR/$1.log"; }

running_pid() {
  local file; file="$(pid_file "$1")"
  [ -f "$file" ] || return 1
  local pid; pid="$(cat "$file" 2>/dev/null)"
  [ -n "$pid" ] || return 1
  kill -0 "$pid" 2>/dev/null || return 1
  echo "$pid"
}

wait_for_port() {
  local port="$1" tries="${2:-60}"
  while [ "$tries" -gt 0 ]; do
    port_busy "$port" && return 0
    sleep 0.5
    tries=$((tries - 1))
  done
  return 1
}

wait_for_free() {
  local port="$1" tries="${2:-20}"
  while [ "$tries" -gt 0 ]; do
    port_busy "$port" || return 0
    sleep 0.25
    tries=$((tries - 1))
  done
  return 1
}

# The path that proves the service is answering. The API has no route at /, so probing
# it there reports a healthy service as 404.
svc_probe() { case "$1" in api) echo "/health" ;; *) echo "/" ;; esac; }

http_code() {
  local code
  # No `|| echo 000`: curl already prints 000 on failure, and the fallback made it
  # print twice — "000000", which then failed every comparison against "000".
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 4 "http://localhost:$1$2" 2>/dev/null)"
  echo "${code:-000}"
}

# ---------------------------------------------------------------------------
# install
# ---------------------------------------------------------------------------
do_install() {
  local svc="$1" dir
  svc_needs_install "$svc" || { ok "$(printf '%-8s' "$svc") no dependencies"; return 0; }
  dir="$ROOT/$(svc_install_dir "$svc")"
  if [ ! -d "$dir" ]; then
    err "$(printf '%-8s' "$svc") missing directory: $dir"
    return 1
  fi
  if [ -d "$dir/node_modules" ]; then
    ok "$(printf '%-8s' "$svc") already installed"
    return 0
  fi
  info "  installing $(svc_label "$svc") …"
  # vantage's postinstall renames route folders that could not be stored in a zip;
  # without it the app builds but routes nowhere.
  if (cd "$dir" && npm install --no-audit --no-fund >>"$(log_file "$svc")" 2>&1); then
    ok "$(printf '%-8s' "$svc") installed"
  else
    err "$(printf '%-8s' "$svc") npm install failed — see $(log_file "$svc")"
    return 1
  fi
}

# ---------------------------------------------------------------------------
# build
# ---------------------------------------------------------------------------
do_build() {
  local svc="$1" dir cmd
  cmd="$(svc_build_cmd "$svc")"
  if [ -z "$cmd" ]; then
    ok "$(printf '%-8s' "$svc") nothing to build"
    return 0
  fi
  dir="$ROOT/$(svc_dir "$svc")"
  if svc_needs_install "$svc" && [ ! -d "$ROOT/$(svc_install_dir "$svc")/node_modules" ]; then
    do_install "$svc" || return 1
  fi
  mkdir -p "$RUN_DIR"
  info "  building $(svc_label "$svc") ..."
  # NEXT_PUBLIC_* and VITE_* are inlined into the bundle HERE, not read at
  # runtime. Editing a .env.local without rebuilding leaves the old API host
  # baked in, and the symptom is a shell that loads and cannot sign in.
  if (cd "$dir" && $cmd >>"$(log_file "$svc")" 2>&1); then
    ok "$(printf '%-8s' "$svc") built"
  else
    err "$(printf '%-8s' "$svc") build failed -- see $(log_file "$svc")"
    info "$C_DIM$(tail -n 15 "$(log_file "$svc")" 2>/dev/null | sed 's/^/    /')$C_OFF"
    return 1
  fi
}

# ---------------------------------------------------------------------------
# start
# ---------------------------------------------------------------------------
do_start() {
  local svc="$1" dir port cmd pid
  dir="$ROOT/$(svc_dir "$svc")"
  port="$(svc_port "$svc")"
  cmd="$(svc_cmd "$svc")"

  if [ ! -d "$dir" ]; then
    err "$(printf '%-8s' "$svc") missing directory: $dir"
    return 1
  fi

  if pid="$(running_pid "$svc")"; then
    ok "$(printf '%-8s' "$svc") already running (pid $pid, :$port)"
    return 0
  fi

  # Refuse rather than launch something that exits half a second later. Vite in
  # particular uses strictPort and dies with a message turbo reduces to an exit code.
  if port_busy "$port"; then
    err "$(printf '%-8s' "$svc") port $port already in use by pid $(port_pids "$port" | tr '\n' ' ')"
    return 1
  fi

  if svc_needs_install "$svc" && [ ! -d "$ROOT/$(svc_install_dir "$svc")/node_modules" ]; then
    do_install "$svc" || return 1
  fi

  # In prod mode `start` serves a build that must already exist. Building on
  # demand beats the alternative: `next start` on a missing .next exits with a
  # message no one sees, and the port never opens -- which reads as a hang.
  local artifact; artifact="$(svc_artifact "$svc")"
  if [ -n "$(svc_build_cmd "$svc")" ] && [ -n "$artifact" ] && [ ! -d "$ROOT/$artifact" ]; then
    do_build "$svc" || return 1
  fi

  mkdir -p "$RUN_DIR"
  : >"$(log_file "$svc")"

  # setsid where available so the whole tree lands in its own process group and can be
  # signalled as one; macOS has no setsid, so stop falls back to a port sweep.
  if command -v setsid >/dev/null 2>&1; then
    (cd "$dir" && setsid nohup $cmd >>"$(log_file "$svc")" 2>&1 &  echo $! >"$(pid_file "$svc")")
  else
    (cd "$dir" && nohup $cmd >>"$(log_file "$svc")" 2>&1 & echo $! >"$(pid_file "$svc")")
  fi

  if wait_for_port "$port" 90; then
    ok "$(printf '%-8s' "$svc") up on :$port  $(printf '%s(%s)%s' "$C_DIM" "$(svc_label "$svc")" "$C_OFF")"
    return 0
  fi

  err "$(printf '%-8s' "$svc") failed to listen on :$port within 45s"
  info "$C_DIM$(tail -n 12 "$(log_file "$svc")" 2>/dev/null | sed 's/^/    /')$C_OFF"
  rm -f "$(pid_file "$svc")"
  return 1
}

# ---------------------------------------------------------------------------
# stop
# ---------------------------------------------------------------------------
do_stop() {
  local svc="$1" port pid stopped=0
  port="$(svc_port "$svc")"

  if pid="$(running_pid "$svc")"; then
    # Negative pid signals the process group, which is what actually reaches the
    # `next dev` / `vite` child. Killing the recorded npm pid alone leaves the real
    # server listening — the orphan that keeps ports held after a Ctrl+C.
    kill -TERM "-$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null
    stopped=1
  fi
  rm -f "$(pid_file "$svc")"

  # Port sweep regardless: the pid file can be stale, and on macOS there is no setsid
  # so the group kill above may not have reached every child.
  local pids; pids="$(port_pids "$port")"
  if [ -n "$pids" ]; then
    echo "$pids" | xargs kill -TERM 2>/dev/null
    stopped=1
  fi

  if ! wait_for_free "$port" 20; then
    pids="$(port_pids "$port")"
    [ -n "$pids" ] && echo "$pids" | xargs kill -9 2>/dev/null
    wait_for_free "$port" 8 || { err "$(printf '%-8s' "$svc") port $port still held"; return 1; }
  fi

  if [ "$stopped" -eq 1 ]; then ok "$(printf '%-8s' "$svc") stopped"; else info "  $(printf '%-8s' "$svc") not running"; fi
  return 0
}

# ---------------------------------------------------------------------------
# status
# ---------------------------------------------------------------------------
do_status() {
  printf '%-9s %-24s %-6s %-8s %-6s %s\n' "SERVICE" "WHAT" "PORT" "PID" "HTTP" "STATE"
  local svc port pid code state
  for svc in "${SERVICES[@]}"; do
    port="$(svc_port "$svc")"
    pid="$(running_pid "$svc" || true)"
    if port_busy "$port"; then
      [ -n "$pid" ] || pid="$(port_pids "$port" | head -1)"
      code="$(http_code "$port" "$(svc_probe "$svc")")"
      # Any HTTP status means the server answered. Next compiles a route on first
      # request, so a just-started app can hold the port for a second before replying.
      if [ "$code" = "000" ]; then state="${C_WARN}listening, still compiling${C_OFF}"; else state="${C_OK}up${C_OFF}"; fi
    else
      pid="-"; code="-"; state="${C_DIM}down${C_OFF}"
    fi
    printf '%-9s %-24s %-6s %-8s %-6s %b\n' "$svc" "$(svc_label "$svc")" "$port" "${pid:--}" "$code" "$state"
  done
}

# ---------------------------------------------------------------------------
# dispatch
# ---------------------------------------------------------------------------
resolve_targets() {
  if [ "$#" -eq 0 ]; then
    printf '%s\n' "${SERVICES[@]}"
    return 0
  fi
  local arg
  for arg in "$@"; do
    if ! is_service "$arg"; then
      err "unknown service: $arg"
      err "known services: ${SERVICES[*]}"
      return 1
    fi
    printf '%s\n' "$arg"
  done
}

usage() {
  cat <<EOF
Nexora stack control

  ./run.sh start   [svc...]   start (default: all)
  ./run.sh stop    [svc...]   stop
  ./run.sh restart [svc...]   stop then start
  ./run.sh status             one line per service
  ./run.sh logs    <svc>      tail -f the service log
  ./run.sh install [svc...]   npm install where node_modules is missing
  ./run.sh build   [svc...]   production build (start does this if missing)

MODE=dev in front of any command runs the dev servers instead of the built
output, on the same ports.

Services and ports:
EOF
  local svc
  for svc in "${SERVICES[@]}"; do
    printf '  %-9s :%-5s %s\n' "$svc" "$(svc_port "$svc")" "$(svc_label "$svc")"
  done
  echo
  echo "Logs and pids: ${RUN_DIR#"$ROOT"/}/"
}

main() {
  local action="${1:-}"; shift || true
  local failures=0 targets svc

  case "$action" in
    start|stop|restart|install|build)
      # Not `mapfile`: that is a bash 4 builtin, and macOS still ships bash 3.2, where
      # it fails with "command not found" and leaves targets empty.
      local line
      targets=()
      while IFS= read -r line; do targets+=("$line"); done < <(resolve_targets "$@")
      [ "${#targets[@]}" -gt 0 ] || exit 2
      ;;
  esac

  case "$action" in
    start)
      for svc in "${targets[@]}"; do do_start "$svc" || failures=$((failures + 1)); done
      ;;
    stop)
      # Reverse order so dependents go before the API they talk to.
      for (( i=${#targets[@]}-1; i>=0; i-- )); do do_stop "${targets[i]}" || failures=$((failures + 1)); done
      ;;
    restart)
      for (( i=${#targets[@]}-1; i>=0; i-- )); do do_stop "${targets[i]}" || failures=$((failures + 1)); done
      for svc in "${targets[@]}"; do do_start "$svc" || failures=$((failures + 1)); done
      ;;
    install)
      for svc in "${targets[@]}"; do do_install "$svc" || failures=$((failures + 1)); done
      ;;
    build)
      for svc in "${targets[@]}"; do do_build "$svc" || failures=$((failures + 1)); done
      ;;
    status) do_status ;;
    logs)
      local svc_name="${1:-}"
      if [ -z "$svc_name" ] || ! is_service "$svc_name"; then
        err "usage: ./run.sh logs <${SERVICES[*]// /|}>"
        exit 2
      fi
      local file; file="$(log_file "$svc_name")"
      [ -f "$file" ] || { err "no log yet for $svc_name"; exit 1; }
      tail -f "$file"
      ;;
    ""|-h|--help|help) usage ;;
    *) err "unknown command: $action"; echo; usage; exit 2 ;;
  esac

  [ "$failures" -eq 0 ] || exit 1
}

main "$@"
