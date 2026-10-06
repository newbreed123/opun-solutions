import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const use = process.argv.includes("--bo") ? "bo" : "idx";
const tokenVariable =
  use === "idx" ? "MLS_GRID_IDX_ACCESS_TOKEN" : "MLS_GRID_BO_ACCESS_TOKEN";

if (!process.env[tokenVariable]?.trim()) {
  console.log(
    JSON.stringify(
      {
        provider: "MLS Grid",
        apiVersion: "v2",
        use,
        configOk: false,
        liveDiagnosticRun: false,
        error: {
          code: "missing_configuration",
          message: `Missing required MLS Grid environment variable: ${tokenVariable}.`,
          details: { variable: tokenVariable, use },
        },
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
} else {
  const compiledRoot = await compileProviderModules();
  const { runMlsGridDiagnostics } = await import(
    `${pathToFileURL(path.join(compiledRoot, "diagnostics.js")).href}?t=${Date.now()}`
  );
  const report = await runMlsGridDiagnostics({ use });
  console.log(JSON.stringify(report, null, 2));
  process.exitCode =
    report.metadata.ok && report.resources.every((resource) => resource.ok)
      ? 0
      : 1;
}

async function compileProviderModules() {
  const repoRoot = process.cwd();
  const sourceRoot = path.join(repoRoot, "src", "lib", "mls-grid");
  const compiledRoot = path.join(os.tmpdir(), "opzix-mls-grid-diagnostic");
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

  return compiledRoot;
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
