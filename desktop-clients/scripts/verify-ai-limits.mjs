#!/usr/bin/env node
/**
 * The configured limits must actually limit.
 *
 * `requestsPerMinute` and `tokensPerDay` sat in AiConfig and on the
 * administration surface for four tasks, enforced nowhere. Harmless while
 * dispatch echoed a mock; a live cost the moment a billed provider was wired in
 * behind a public host. This is the check that they are still enforced after
 * someone reorders the handler.
 *
 * COSTS NOTHING AT THE PROVIDER. Requests are counted on admission, ahead of
 * prompt validation, so a deliberately unknown promptId is admitted by the
 * limiter and then refused before callProvider is reached. That is the same
 * ordering the limiter relies on for abuse protection, so testing it this way
 * exercises the real path rather than a special case: the day the counter moves
 * below validation, these 400s become 429-free and the test fails.
 *
 * Restores whatever limits it found. Zero dependencies.
 * Needs the demo API up:  ./run.sh start api
 */
const API = process.env.AI_API ?? "http://localhost:3200";
const json = (body, headers = {}) => ({ headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(body) });

const login = await fetch(`${API}/auth/login`, { method: "POST", ...json({ username: "admin", password: "admin" }) })
  .then((r) => r.json()).catch(() => null);
if (!login?.token) {
  console.error(`\n  Could not sign in to ${API}. Start it with:  ./run.sh start api\n`);
  process.exit(1);
}
const auth = { Authorization: `Bearer ${login.token}` };

const config = await fetch(`${API}/ai/config`, { headers: auth }).then((r) => r.json());
const original = config?.limits;
if (!original) { console.error("\n  No limits in the tenant config; nothing to test.\n"); process.exit(1); }

const setLimits = (limits) => fetch(`${API}/ai/config`, { method: "PUT", ...json({ limits }, auth) });
const usage = () => fetch(`${API}/ai/usage`, { headers: auth }).then((r) => r.json());
const dispatch = () => fetch(`${API}/ai/dispatch`, {
  method: "POST",
  /* Deliberately unregistered: admitted by the limiter, refused before the
     provider. No tokens are spent by this script. */
  ...json({ useCaseId: "probe", promptId: "deliberately.unregistered.v0", pageId: "probe", fields: [{ label: "a", value: "b" }] }, auth),
});

let failures = 0;
const check = (ok, label) => { if (!ok) failures += 1; console.log(`    ${ok ? "ok    " : "FAIL  "} ${label}`); };

try {
  console.log("\n  a missing or zero limit must mean the DEFAULT, never unlimited");
  await setLimits({ ...original, requestsPerMinute: 0 });
  const zeroed = await usage();
  check(zeroed.requestsPerMinute === 20, `requestsPerMinute 0 resolves to 20, got ${zeroed.requestsPerMinute}`);
  await setLimits({ ...original, tokensPerDay: -5 });
  const negative = await usage();
  check(negative.tokensPerDay === 200000, `tokensPerDay -5 resolves to 200000, got ${negative.tokensPerDay}`);

  console.log("\n  the per-minute limit is enforced");
  const CAP = 3;
  await setLimits({ ...original, requestsPerMinute: CAP });
  /* Whatever this minute already holds, so the test is not thrown off by real
     traffic that happened to arrive first. */
  const already = (await usage()).requestsLastMinute;
  const budget = Math.max(0, CAP - already);

  const statuses = [];
  let retryAfter = null;
  for (let i = 0; i < budget + 3; i += 1) {
    const response = await dispatch();
    statuses.push(response.status);
    if (response.status === 429 && retryAfter === null) retryAfter = response.headers.get("retry-after");
  }
  const admitted = statuses.filter((s) => s === 400).length;
  const refused = statuses.filter((s) => s === 429).length;
  console.log(`      window held ${already}, cap ${CAP}, sent ${statuses.length}: ${statuses.join(" ")}`);
  check(admitted === budget, `${budget} admitted (400, refused at prompt — no provider call), got ${admitted}`);
  check(refused === 3, `the rest refused 429, got ${refused}`);
  check(retryAfter !== null && Number(retryAfter) >= 1 && Number(retryAfter) <= 60,
    `429 carries a usable Retry-After, got ${retryAfter ?? "none"}`);

  console.log("\n  the admin's own provider call is not a way round it");
  const verify = await fetch(`${API}/ai/config/credential/verify`, { method: "POST", headers: auth });
  check(verify.status === 429, `verify is refused while the window is full, got ${verify.status}`);
} finally {
  await setLimits(original);
  const restored = await usage();
  console.log(`\n  restored: ${restored.requestsPerMinute}/min, ${restored.tokensPerDay} tokens/day`);
  console.log(`  spent today: ${restored.tokensUsedToday} tokens (unchanged by this script)`);
}

console.log();
if (failures) {
  console.error(`  ${failures} check(s) failed.\n`);
  console.error("  A configured limit that does not limit is worse than no limit: it reads");
  console.error("  as a control on the admin screen. Fix before anything ships.\n");
  process.exit(1);
}
console.log("  Limits are enforced, defaults cover a missing or invalid value, and the");
console.log("  admin verify path spends from the same budget.\n");
console.log("  The per-minute window clears 60s after the last request.\n");
