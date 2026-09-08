# Running the desktop app as a real Tauri window

_Updated 7 September 2026._

`npm run dev:desktop` serves the desktop shell at :3101 in a browser, which is
enough for almost everything. The exception is anything that only exists inside
a Tauri webview — detached windows, the native menu, the filesystem APIs. This
is how to run the real thing.

## On a normal machine

```bash
sudo apt install -y build-essential pkg-config \
  libwebkit2gtk-4.1-dev libgtk-3-dev libsoup-3.0-dev \
  libjavascriptcoregtk-4.1-dev librsvg2-dev libssl-dev
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
cd desktop-clients/apps/desktop && npx tauri dev
```

That is the whole story where you have root and a desktop session.

## Without sudo, and without a display

The machine this was first run on had neither, so the toolchain was assembled
from unpacked Debian packages and the app was run against a headless Wayland
compositor. It works, and the traps are worth writing down because none of them
announce themselves.

**Assemble a sysroot.** `apt-get download` needs no privileges, and `dpkg -x`
unpacks anywhere. Resolve the closure with `apt-cache depends --recurse`, then
point pkg-config at it:

```bash
export PKG_CONFIG_PATH="$SYSROOT/usr/lib/x86_64-linux-gnu/pkgconfig:$SYSROOT/usr/share/pkgconfig"
export PKG_CONFIG_SYSROOT_DIR="$SYSROOT"
export RUSTFLAGS="-L $SYSROOT/usr/lib/x86_64-linux-gnu -L $SYSROOT/lib/x86_64-linux-gnu"
```

`PKG_CONFIG_SYSROOT_DIR` is the part that matters: every `.pc` file contains
absolute `/usr/...` paths, and this is what rewrites them.

**Take the `-dev` packages that are not named `lib*`.** A filter of `^lib` looks
reasonable and drops `x11proto-dev`, without which `gdk-3.0.pc` cannot resolve
`x11` and the whole GTK stack fails to configure.

**Ubuntu 24.04 blocks unprivileged user namespaces**, so `unshare` cannot be
used to bind-mount anything over `/usr`. Check
`/proc/sys/kernel/apparmor_restrict_unprivileged_userns` before planning around
it.

**Rootless Xvfb needs its keyboard compiler path resolved.** The unpacked binary
runs `/usr/bin/xkbcomp` from a compiled-in path and ignores `XKB_BINDIR`. The
7 September test used a task-local copy with that path redirected to a local
`xkbcomp` symlink. An ordinary system installation does not need this workaround.
Wayland avoids this path issue, but the headless Weston configuration below
had no input seat and produced invalid GTK viewport metrics during automation.

**Weston, headless, kiosk shell.** The desktop shell tries to launch helper
clients from `/usr/libexec` and dies; the kiosk shell needs none and still maps
`xdg_toplevel`, which is what GTK creates.

```bash
export WESTON_MODULE_MAP="headless-backend.so=$D/libweston-13/headless-backend.so;kiosk-shell.so=$D/weston/kiosk-shell.so"
weston --backend=headless --width=1600 --height=1000 --socket=wayland-99 --shell=kiosk
```

`WESTON_MODULE_MAP` exists because weston, too, loads its modules from a
compiled-in directory.

**WebKitGTK 2.52 spawns its network, web and GPU processes from a path baked
into the library, and `WEBKIT_EXEC_PATH` no longer overrides it.** The app dies
on startup with `Failed to spawn child process`. The way through is to shorten
the string inside your own unpacked copy of the library and symlink the short
path — `/usr/lib/x86_64-linux-gnu/webkit2gtk-4.1` is 40 bytes, `/tmp/wk` fits
inside it with room for the NUL:

```python
data = bytearray(open(lib, "rb").read())
at = data.find(b"/usr/lib/x86_64-linux-gnu/webkit2gtk-4.1")
data[at:at + 40] = b"/tmp/wk" + b"\0" * 33
```

Do the `injected-bundle/` string too, and patch the longest match first or the
shorter one eats its prefix.

## Verifying detached windows without a click

`cargo run --example detach-smoke` opens a second webview the way the JS port
does — same `doc-` label, same query-string document key, same title — and
reports what happened:

```
SMOKE before=1
SMOKE created=true label=doc-w1
SMOKE windows=2
SMOKE title="CUSTOMER-MASTER view~CUS-02401"
SMOKE url=http://localhost:3101/index.html?document=acme%3ACUSTOMER-MASTER%3Aview~CUS-02401
SMOKE after_close=1
```

This Rust-only smoke checks creation and metadata. It does not exercise the JS
menu or its capability permissions. The end-to-end check below covers that gap.

## Native lifecycle regression with WebDriver

Install `tauri-driver` and your distribution's `WebKitWebDriver` package using the
[official Tauri setup](https://v2.tauri.app/develop/tests/webdriver/manual-setup/).
Use a desktop session or Xvfb with a working keyboard/pointer. Run the app and
driver with isolated XDG config/data/cache directories and a dedicated demo API
account; this test signs in as `user1` / `user1` and signs out after each journey.
The built frontend must point to the demo API containing `CUS-02401`.

From `desktop-clients`:

```bash
cd apps/desktop
# Set VITE_API_URL to the demo API URL reachable from the native webview.
VITE_API_URL=http://localhost:3200 npx tauri build --debug --no-bundle
cd ../..
# In another terminal with the same display/environment:
tauri-driver --native-driver /usr/bin/WebKitWebDriver
# Then:
npm run e2e:native
```

`TAURI_DRIVER_URL` defaults to `http://127.0.0.1:4444`.
`TAURI_APPLICATION` defaults to `apps/desktop/src-tauri/target/debug/app` relative
to the current directory. Override it for another binary location. The test
creates and deletes its own WebDriver session; start with no other driver session.
It uses only Node's built-in APIs.

The test clicks the real login, page picker, record edit and detach controls. It
checks the native title, requests the native close event, verifies reattachment,
reopens the record, and verifies logout from both the child and the main window.
It asserts no main-window runtime errors and zero main-window preference writes.
Main-window preference requests are stubbed to provide a predictable tab layout;
authentication and session invalidation use the real demo API. It does not edit
or save customer data. The native close step invokes the same close request event
used by the title-bar control; it does not click the OS title bar. WebDriver's
`DELETE /window` bypasses that event and is unsuitable for testing this path.

### Verified on 7 September 2026

Passed on Linux with Tauri 2.11.5, Wry 0.55.1 and WebKitGTK 2.52.6 under Xvfb
(1440 × 900 webview, device pixel ratio 1). The debug executable bundled the exact
frontend assets from release `20260907152207170-63028a2b` through a temporary
`frontendDist` override; it did not load a Vite development server.

This run found a missing `core:window:allow-destroy` permission: the JS SDK's
`onCloseRequested` handler invokes `destroy()` after the callback. Both sessions
were invalidated on logout, but the detached window remained open and emitted an
unhandled rejection. Adding the permission for `main` and `doc-*` fixed the
failure, and the complete lifecycle regression passed on the rebuilt executable.
Native capability changes require a rebuilt desktop executable; serving new
browser assets alone does not update them.

Rootless TLS also needed the unpacked `glib-networking` GnuTLS GIO module. Without
it, HTTPS authentication failed before reaching the application API. Load the
needed module via `GIO_EXTRA_MODULES` when using an isolated sysroot.

This is a native automated Linux check, not installer validation or physical
multi-monitor QA. Windows/macOS behavior, OS title-bar interaction, display/DPI
changes and crash recovery remain separate checks. Headless Weston smoke results
alone do not establish clickable UI behavior; Xvfb was used for this regression.
