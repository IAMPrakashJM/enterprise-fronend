import { mkdirSync, writeFileSync } from "node:fs";

const DEPS = {
  tokens: {},
  "ops-ui": {},
  "platform-ports": {},
  "erp-config": {},
  "erp-data": { "@pepbits/erp-config": "*" },
  "erp-shell": { "@pepbits/ops-ui": "*", "@pepbits/erp-config": "*", "@pepbits/platform-ports": "*" },
  "erp-screens": {
    "@pepbits/ops-ui": "*", "@pepbits/erp-config": "*", "@pepbits/erp-data": "*",
    "@pepbits/erp-shell": "*", "@pepbits/platform-ports": "*",
  },
};

for (const [name, dependencies] of Object.entries(DEPS)) {
  const dir = `packages/${name}`;
  mkdirSync(`${dir}/src`, { recursive: true });

  const pkg = {
    name: `@pepbits/${name}`,
    version: "0.0.0",
    private: true,
    type: "module",
    ...(name === "tokens"
      ? { exports: { "./tokens.css": "./src/tokens.css" } }
      : { main: "./src/index.ts", types: "./src/index.ts", exports: { ".": "./src/index.ts" } }),
    ...(Object.keys(dependencies).length ? { dependencies } : {}),
    ...(name === "tokens" ? {} : { peerDependencies: { react: ">=19" } }),
  };
  writeFileSync(`${dir}/package.json`, JSON.stringify(pkg, null, 2) + "\n");

  if (name !== "tokens") {
    writeFileSync(`${dir}/tsconfig.json`, JSON.stringify({
      extends: "../../tsconfig.base.json",
      include: ["src/**/*.ts", "src/**/*.tsx"],
    }, null, 2) + "\n");
  }
}
console.log("scaffolded", Object.keys(DEPS).length, "packages");
