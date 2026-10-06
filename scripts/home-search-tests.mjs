import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const repoRoot = process.cwd();
const sourceRoot = path.join(repoRoot, "src", "lib", "real-estate", "listings");
const compiledRoot = path.join(os.tmpdir(), "opzix-home-search-tests");

await compileListingModules();

const { getListingSearchRepository, parseListingSearchParams } = await import(
  `${pathToFileURL(path.join(compiledRoot, "repository.js")).href}?t=${Date.now()}`
);
const { buildSmsHref, formatAddress, formatPrice } = await import(
  `${pathToFileURL(path.join(compiledRoot, "format.js")).href}?t=${Date.now()}`
);

const repository = getListingSearchRepository();

const charlotte = await repository.search({ location: "Charlotte" });
assert(charlotte.total > 0, "Charlotte search should return preview homes");
assert(
  charlotte.homes.every((home) =>
    `${home.streetAddress} ${home.city} ${home.postalCode} ${home.listingId}`
      .toLowerCase()
      .includes("charlotte"),
  ),
  "Location search should use normalized display fields",
);

const filtered = await repository.search({
  minPrice: 500000,
  maxPrice: 650000,
  beds: 4,
  homeType: "House",
});
assert.equal(filtered.total, 2);
assert(
  filtered.homes.every(
    (home) =>
      home.price >= 500000 &&
      home.price <= 650000 &&
      (home.bedrooms ?? 0) >= 4 &&
      home.homeType === "House",
  ),
);

const sorted = await repository.search({ sort: "price-asc" });
const sortedPrices = sorted.homes.map((home) => home.price);
assert.deepEqual(sortedPrices, [...sortedPrices].sort((a, b) => a - b));

const detail = await repository.getByKey("preview-charlotte-001");
assert(detail, "Listing detail should load by key");
assert.equal(formatPrice(detail.price), "$475,000");
assert.equal(
  formatAddress(detail),
  "1248 Maple Ridge Lane, Charlotte, NC 28210",
);

const parsed = parseListingSearchParams({
  location: "28210",
  minPrice: "300000",
  maxPrice: "bad",
  beds: "3",
  homeType: "House",
  sort: "price-desc",
});
assert.deepEqual(parsed, {
  location: "28210",
  minPrice: 300000,
  maxPrice: undefined,
  beds: 3,
  homeType: "House",
  sort: "price-desc",
});

const smsHref = buildSmsHref(detail, { phoneTel: "+15551234567", email: "agent@example.com" });
assert(smsHref.startsWith("sms:+15551234567?&body="));
assert(!smsHref.includes("Brittany"), "Reusable SMS helper should not hard-code Brittany");

console.log("Home search repository tests passed.");

async function compileListingModules() {
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
    const source = await fs.readFile(file, "utf8");
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
    await fs.writeFile(
      outputPath,
      addJsExtensions(transpiled.outputText),
      "utf8",
    );
  }
}

function addJsExtensions(source) {
  return source.replace(
    /from\s+"(\.[^"]+)"|import\("(\.[^"]+)"\)/g,
    (match, staticImport, dynamicImport) => {
      const specifier = staticImport || dynamicImport;
      if (path.extname(specifier)) return match;
      return staticImport
        ? `from "${specifier}.js"`
        : `import("${specifier}.js")`;
    },
  );
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
