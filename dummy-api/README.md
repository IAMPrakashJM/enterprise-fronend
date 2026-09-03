# nexora-dummy-api

Demo auth API for the Nexora web and desktop shells. **Zero dependencies** — no
`npm install` needed.

```bash
node server.mjs          # http://localhost:4000
PORT=4100 node server.mjs
```

## Endpoints

| Method | Path | Body | Returns |
|---|---|---|---|
| `POST` | `/auth/login` | `{username, password}` | `200 {token, user}` · `401 {error}` |
| `GET` | `/auth/me` | — | `200 {user}` from `Authorization: Bearer <token>` · `401` |
| `POST` | `/auth/logout` | — | `204` |
| `GET` | `/preferences` | — | `200 {preferences}` — `{}` until the user saves something |
| `PUT` | `/preferences` | `{preferences}` | `204` |
| `GET` | `/health` | — | `200 {ok, sessions, profiles}` |

## Preferences

Stored per user id in `data/preferences.json` (gitignored), written temp-file-then-rename
so a crash mid-write cannot leave a truncated file that drops everyone's settings.
Unlike sessions, this **survives a restart** — otherwise "log out, log back in, your
settings are still there" would only hold until the next `node server.mjs`.

The client sends only the keys that differ from its defaults, so the file reads as what
each user changed:

```json
{ "USR-00311": { "theme": "midnight", "sidebarPlacement": "right" } }
```

An absent key means "still default", not "unset" — so a preference added to the app
later starts at its new default instead of at a value frozen into an old snapshot.

## Accounts

Password is the same as the username.

| Username | Name | Role |
|---|---|---|
| `user1` | Aisha Rahman | Finance Manager |
| `user2` | Omar Khan | Operations Analyst |
| `admin` | Prakash Mathew | Enterprise Administrator |

Roles are the `value` strings from `@pepbits/erp-config`'s `ROLES`, so the shell's role
selector reflects the signed-in account.

## What this is not

Not a security boundary. Plaintext passwords, no token expiry, open CORS, sessions in a
`Map` that dies with the process. It exists so the shells have something to log in
against; do not model a real service on it.
