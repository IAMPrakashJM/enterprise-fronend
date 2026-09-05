# Running the desktop app as a real Tauri window

_5 September 2026._

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

**Xvfb is a dead end without root.** It runs `/usr/bin/xkbcomp` from a compiled-in
path, ignores `XKB_BINDIR`, and exits when the keymap fails to compile. A Wayland
compositor avoids this entirely, because libxkbcommon compiles keymaps in-process
from `XKB_CONFIG_ROOT`.

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

## What this can and cannot show you

It runs. The binary compiles against the real WebKit and GTK, the webview loads
the dev server, and both WebKit helper processes come up.

It cannot be clicked. A headless compositor has no seat, so there is no keyboard
and no pointer, and `weston-screenshooter` fails because the headless backend
reports a zero-width output. Anything that needs a click — including opening a
detached window from the tab menu — still needs a real session.

What a browser CAN check is the child window's own code path, because that is
just a URL:

```
http://localhost:3101/?document=acme%3ACUSTOMER-MASTER%3Aview~CUS-02401
```

That found a real bug the first time it was run: the detached window had no
`NavigationProvider`, so every window it opened would have been blank.
