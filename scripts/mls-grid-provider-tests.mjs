import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const repoRoot = process.cwd();
const sourceRoot = path.join(repoRoot, "src", "lib", "mls-grid");
const compiledRoot = path.join(os.tmpdir(), "opzix-mls-grid-provider-tests");
const originalEnv = { ...process.env };
const tests = [];

test("selects separate IDX and BO bearer tokens", async ({ modules }) => {
  resetMlsGridEnv();
  const idxCalls = [];
  const boCalls = [];
  const idxClient = modules.createMlsGridClient({
    use: "idx",
    fetchImpl: captureFetch(idxCalls),
    scheduler: noDelayScheduler(modules),
  });
  const boClient = modules.createMlsGridClient({
    use: "bo",
    fetchImpl: captureFetch(boCalls),
    scheduler: noDelayScheduler(modules),
  });

  await idxClient.getProperties({ top: 1 });
  await boClient.getProperties({ top: 1 });

  assert.equal(idxCalls[0].authorization, "Bearer idx-test-token");
  assert.equal(boCalls[0].authorization, "Bearer bo-test-token");
});

test("reports missing token configuration without exposing values", async ({ modules }) => {
  resetMlsGridEnv();
  delete process.env.MLS_GRID_IDX_ACCESS_TOKEN;

  assert.throws(
    () => modules.createMlsGridClient({ use: "idx" }),
    (error) =>
      error.code === "missing_configuration" &&
      error.message.includes("MLS_GRID_IDX_ACCESS_TOKEN") &&
      !error.message.includes("bo-test-token"),
  );
});

test("adds OriginatingSystemName and safely encodes approved filters", async ({
  modules,
}) => {
  resetMlsGridEnv();
  const calls = [];
  const client = modules.createMlsGridClient({
    use: "idx",
    fetchImpl: captureFetch(calls),
    scheduler: noDelayScheduler(modules),
  });

  await client.getProperties({
    top: 25,
    count: true,
    filters: [
      { type: "mlgCanView", value: true },
      { type: "standardStatus", value: "Active" },
      { type: "listingIdIn", values: ["CANOPY-1", "CANOPY-2"] },
    ],
  });

  const url = new URL(calls[0].url);
  assert.equal(url.pathname, "/v2/Property");
  assert.equal(url.searchParams.get("$top"), "25");
  assert.equal(url.searchParams.get("$count"), "true");
  const filter = url.searchParams.get("$filter");
  assert.match(filter, /OriginatingSystemName eq 'carolina'/);
  assert.match(filter, /MlgCanView eq true/);
  assert.match(filter, /StandardStatus eq 'Active'/);
  assert.match(filter, /ListingId in \('CANOPY-1','CANOPY-2'\)/);
});

test("allows only approved Property expansions", async ({ modules }) => {
  resetMlsGridEnv();
  const calls = [];
  const client = modules.createMlsGridClient({
    use: "idx",
    fetchImpl: captureFetch(calls),
    scheduler: noDelayScheduler(modules),
  });

  await client.getProperties({ top: 1, expand: ["Media", "Rooms", "UnitTypes"] });

  assert.equal(
    new URL(calls[0].url).searchParams.get("$expand"),
    "Media,Rooms,UnitTypes",
  );
  await assert.rejects(
    () => client.getMembers({ top: 1, expand: ["Media"] }),
    { code: "invalid_query" },
  );
});

test("follows valid nextLink pages sequentially", async ({ modules }) => {
  resetMlsGridEnv();
  const calls = [];
  const client = modules.createMlsGridClient({
    use: "idx",
    fetchImpl: async (input, init) => {
      calls.push({ url: String(input), authorization: init?.headers?.Authorization });
      if (calls.length === 1) {
        return jsonResponse({
          value: [{ ListingId: "A" }],
          "@odata.nextLink": "https://api.mlsgrid.com/v2/Property?$skip=1",
        });
      }
      return jsonResponse({ value: [{ ListingId: "B" }] });
    },
    scheduler: noDelayScheduler(modules),
  });

  const result = await client.paginateResource({
    resource: "Property",
    top: 1,
  });

  assert.deepEqual(
    result.value.map((record) => record.ListingId),
    ["A", "B"],
  );
  assert.equal(calls.length, 2);
  assert.match(calls[1].url, /^https:\/\/api\.mlsgrid\.com\/v2\/Property/);
});

test("rejects nextLink URLs outside MLS Grid", async ({ modules }) => {
  resetMlsGridEnv();
  const client = modules.createMlsGridClient({
    use: "idx",
    fetchImpl: captureFetch([], {
      value: [{ ListingId: "A" }],
      "@odata.nextLink": "https://example.com/v2/Property?$skip=1",
    }),
    scheduler: noDelayScheduler(modules),
  });

  await assert.rejects(
    () => client.paginateResource({ resource: "Property", top: 1 }),
    { code: "invalid_pagination_url" },
  );
});

test("enforces two MLS Grid requests per second scheduling", async ({ modules }) => {
  const waits = [];
  const scheduler = new modules.MlsGridRequestScheduler(async (ms) => {
    waits.push(ms);
  });

  await scheduler.waitForTurn(1000);
  await scheduler.waitForTurn(1000);
  await scheduler.waitForTurn(1500);

  assert.deepEqual(waits, [500, 500]);
});

test("maps auth, rate limit, and upstream HTTP statuses safely", async ({
  modules,
}) => {
  resetMlsGridEnv();
  for (const [status, code] of [
    [401, "authentication_failure"],
    [403, "authorization_failure"],
    [429, "rate_limited"],
    [500, "upstream_server_failure"],
  ]) {
    const client = modules.createMlsGridClient({
      use: "idx",
      fetchImpl: () => jsonResponse({ error: "nope" }, status),
      scheduler: noDelayScheduler(modules),
    });
    await assert.rejects(
      () => client.getProperties({ top: 1 }),
      (error) => error.code === code && !JSON.stringify(error).includes("token"),
    );
  }
});

test("rejects malformed JSON and malformed OData responses", async ({
  modules,
}) => {
  resetMlsGridEnv();
  const malformedJsonClient = modules.createMlsGridClient({
    use: "idx",
    fetchImpl: () => new Response("not-json", { status: 200 }),
    scheduler: noDelayScheduler(modules),
  });
  const malformedShapeClient = modules.createMlsGridClient({
    use: "idx",
    fetchImpl: () => jsonResponse({ nope: true }),
    scheduler: noDelayScheduler(modules),
  });

  await assert.rejects(
    () => malformedJsonClient.getProperties({ top: 1 }),
    { code: "malformed_provider_response" },
  );
  await assert.rejects(
    () => malformedShapeClient.getProperties({ top: 1 }),
    { code: "malformed_provider_response" },
  );
});

test("redacts bearer, token, and authorization details", async ({ modules }) => {
  const error = new modules.MlsGridError({
    code: "upstream_server_failure",
    message: "Bearer raw-secret-token failed",
    details: {
      url: "https://api.mlsgrid.com/v2/Property?access_token=raw-secret-token",
      authorization: "Bearer raw-secret-token",
    },
  });

  const serialized = JSON.stringify(modules.serializeMlsGridError(error));
  assert(!serialized.includes("raw-secret-token"));
  assert(serialized.includes("[redacted]"));
});

await main();

function test(name, run) {
  tests.push({ name, run });
}

async function main() {
  await compileProviderModules();
  const modules = await import(
    `${pathToFileURL(path.join(compiledRoot, "index.js")).href}?t=${Date.now()}`
  );

  let passed = 0;
  for (const entry of tests) {
    process.env = { ...originalEnv };
    try {
      await entry.run({ modules });
      passed += 1;
      console.log(`ok - ${entry.name}`);
    } catch (error) {
      console.error(`not ok - ${entry.name}`);
      console.error(error);
      process.exitCode = 1;
      break;
    }
  }

  if (passed === tests.length) {
    console.log(`MLS Grid provider tests passed (${passed}/${tests.length}).`);
  }
}

async function compileProviderModules() {
  await fs.rm(compiledRoot, { recursive: true, force: true });
  await fs.mkdir(compiledRoot, { recursive: true });
  await fs.writeFile(
    path.join(compiledRoot, "package.json"),
    JSON.stringify({ type: "module" }),
    "utf8",
  );
  const files = await collectTypeScriptFiles(sourceRoot);

  for (const file of files) {
    const relativePath = path.relative(sourceRoot, file);
    const outputPath = path.join(
      compiledRoot,
      relativePath.replace(/\.ts$/, ".js"),
    );
    const source = (await fs.readFile(file, "utf8")).replace(
      /^import "server-only";\r?\n/gm,
      "",
    );
    const transpiled = ts.transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        esModuleInterop: true,
      },
      fileName: file,
    });
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, transpiled.outputText, "utf8");
  }
}

async function collectTypeScriptFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectTypeScriptFiles(absolutePath)));
    } else if (entry.name.endsWith(".ts")) {
      files.push(absolutePath);
    }
  }
  return files;
}

function resetMlsGridEnv() {
  process.env.MLS_GRID_BASE_URL = "https://api.mlsgrid.com/v2";
  process.env.MLS_GRID_ORIGINATING_SYSTEM_NAME = "carolina";
  process.env.MLS_GRID_IDX_ACCESS_TOKEN = "idx-test-token";
  process.env.MLS_GRID_BO_ACCESS_TOKEN = "bo-test-token";
}

function noDelayScheduler(modules) {
  return new modules.MlsGridRequestScheduler(async () => {});
}

function captureFetch(calls, body = { value: [] }, status = 200) {
  return async (input, init) => {
    calls.push({
      url: String(input),
      authorization: init?.headers?.Authorization,
    });
    return jsonResponse(body, status);
  };
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
