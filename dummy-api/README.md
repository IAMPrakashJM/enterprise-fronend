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
| `GET` | `/health` | — | `200 {ok, sessions}` |

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
