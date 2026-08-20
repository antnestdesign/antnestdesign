import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SITE_ORIGIN = "https://www.antnestdesign.com";
const SITE_HOST = "www.antnestdesign.com";
const INDEXNOW_ENDPOINT = "https://searchadvisor.naver.com/indexnow";
const KEY_FILE_NAME =
  "9c45e8cf76518a60e25d781b47f85feda316668ca4258343e13e1be1c030fe87.txt";
const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");
const KEY_FILE_PATH = resolve(REPOSITORY_ROOT, "public", KEY_FILE_NAME);
const KEY_LOCATION = `${SITE_ORIGIN}/${KEY_FILE_NAME}`;
const EMPTY_TREE_SHA = "4b825dc642cb6eb9a060e54bf8d69288fbee4904";

const PROJECT_COMPONENT_ROUTES = new Map([
  ["ApartmentA.tsx", "apartment-a"],
  ["ApartmentB.tsx", "apartment-b"],
  ["AntnestDesignOffice.tsx", "antnest-design-office"],
  [
    "CheongnaCentralEileensGarden84A.tsx",
    "cheongna-central-eileens-garden-84a",
  ],
  [
    "CheongnaHanwhaKkumegreen39A.tsx",
    "cheongna-hanwha-kkumegreen-39a",
  ],
  ["CheongnaHoban4.tsx", "cheongna-hoban-4-33a"],
  ["CheongnaLynnStrauss.tsx", "cheongna-lynn-strauss"],
  ["LuxuryHouse.tsx", "luxury-house"],
  ["PrivateHouse.tsx", "private-house"],
]);

function parseArguments(argv) {
  const options = {
    base: undefined,
    head: undefined,
    deploymentId: undefined,
    dryRun: false,
    changedFiles: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (
      argument === "--base" ||
      argument === "--head" ||
      argument === "--deployment-id" ||
      argument === "--changed-file"
    ) {
      const value = argv[index + 1];

      if (!value) {
        throw new Error(`Missing value for ${argument}`);
      }

      index += 1;

      if (argument === "--base") options.base = value;
      if (argument === "--head") options.head = value;
      if (argument === "--deployment-id") options.deploymentId = value;
      if (argument === "--changed-file") {
        options.changedFiles.push({ status: "M", path: normalizePath(value) });
      }

      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  return options;
}

function runGit(arguments_) {
  return execFileSync("git", arguments_, {
    cwd: REPOSITORY_ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function normalizePath(path) {
  return path.replaceAll("\\", "/");
}

function getHeadSha(explicitHead) {
  return explicitHead ?? runGit(["rev-parse", "HEAD"]);
}

function getChangedFiles(base, head) {
  const output = runGit([
    "diff",
    "--name-status",
    "--no-renames",
    base,
    head,
  ]);

  if (!output) return [];

  return output.split("\n").map((line) => {
    const [status, ...pathParts] = line.split("\t");
    return {
      status,
      path: normalizePath(pathParts.join("\t")),
    };
  });
}

function readFileAtRevision(revision, path) {
  if (!revision) {
    try {
      return readFileSync(resolve(REPOSITORY_ROOT, path), "utf8");
    } catch {
      return "";
    }
  }

  try {
    return runGit(["show", `${revision}:${path}`]);
  } catch {
    return "";
  }
}

function extractProjectSlugs(source) {
  const slugs = [];
  const projectEntryPattern = /^  "?([a-z0-9][a-z0-9-]*)"?:\s*\{\s*$/gm;

  for (const match of source.matchAll(projectEntryPattern)) {
    slugs.push(match[1]);
  }

  return slugs;
}

function extractProjectsPerPage(source) {
  const match = source.match(/PROJECTS_PER_PAGE\s*=\s*(\d+)/);
  return match ? Number(match[1]) : 5;
}

function extractStaticRedirectSources(source) {
  const redirectsFunction = source.match(
    /async\s+redirects\s*\(\)\s*\{[\s\S]*?return\s*\[([\s\S]*?)\];\s*\}/,
  );

  if (!redirectsFunction) return [];

  return [...redirectsFunction[1].matchAll(/source:\s*["']([^"']+)["']/g)]
    .map((match) => match[1])
    .filter((path) => path.startsWith("/") && !path.includes(":"));
}

function getProjectState(base, head) {
  const currentSource = readFileAtRevision(head, "app/data/projects.ts");
  const previousSource = readFileAtRevision(base, "app/data/projects.ts");
  const currentSlugs = extractProjectSlugs(currentSource);
  const previousSlugs = extractProjectSlugs(previousSource);

  return {
    currentSlugs,
    allSlugs: [...new Set([...currentSlugs, ...previousSlugs])],
    projectsPerPage: extractProjectsPerPage(currentSource),
  };
}

function projectDetailUrls(projectState) {
  return projectState.allSlugs.map((slug) => `/projects/${slug}`);
}

function projectIndexUrls(projectState) {
  const pageCount = Math.max(
    1,
    Math.ceil(
      projectState.currentSlugs.length / projectState.projectsPerPage,
    ),
  );
  const paths = ["/projects"];

  for (let page = 2; page <= pageCount; page += 1) {
    paths.push(`/projects?page=${page}`);
  }

  return paths;
}

function staticRouteFromPageFile(path) {
  if (path === "app/page.tsx") return "/";

  const match = path.match(/^app\/(.+)\/page\.(?:js|jsx|ts|tsx)$/);
  if (!match) return undefined;

  const segments = match[1]
    .split("/")
    .filter((segment) => !segment.startsWith("(") && !segment.endsWith(")"));

  if (
    segments.some((segment) => segment.startsWith("[")) ||
    segments[0] === "api" ||
    segments[0] === "os" ||
    segments[0] === "os-app"
  ) {
    return undefined;
  }

  return `/${segments.join("/")}`;
}

function listPageFilesAtRevision(head) {
  try {
    return runGit(["ls-tree", "-r", "--name-only", head, "app"])
      .split("\n")
      .map(normalizePath)
      .filter((path) => /\/page\.(?:js|jsx|ts|tsx)$/.test(path));
  } catch {
    return [];
  }
}

function allIndexableUrls(head, projectState) {
  const paths = new Set(projectDetailUrls(projectState));

  for (const path of listPageFilesAtRevision(head)) {
    const route = staticRouteFromPageFile(path);
    if (route) paths.add(route);
  }

  for (const route of projectIndexUrls(projectState)) {
    paths.add(route);
  }

  return [...paths];
}

function detectChangedUrls(changedFiles, { base, head }) {
  const projectState = getProjectState(base, head);
  const paths = new Set();

  for (const changedFile of changedFiles) {
    const path = normalizePath(changedFile.path);

    if (
      path.startsWith("app/os/") ||
      path.startsWith("app/os-app/") ||
      path.startsWith("app/api/os/")
    ) {
      continue;
    }

    if (path === "app/data/projects.ts") {
      for (const route of projectIndexUrls(projectState)) paths.add(route);
      for (const route of projectDetailUrls(projectState)) paths.add(route);
      continue;
    }

    if (
      path === "app/projects/[slug]/page.tsx" ||
      path === "app/projects/[slug]/ProjectLayout.tsx"
    ) {
      for (const route of projectDetailUrls(projectState)) paths.add(route);
      continue;
    }

    if (path === "app/layout.tsx") {
      for (const route of allIndexableUrls(head, projectState)) paths.add(route);
      continue;
    }

    if (path === "app/projects/page.tsx") {
      for (const route of projectIndexUrls(projectState)) paths.add(route);
      continue;
    }

    if (path === "next.config.ts" || path === "next.config.js") {
      const currentConfig = readFileAtRevision(head, path);
      const previousConfig = readFileAtRevision(base, path);

      for (const route of [
        ...extractStaticRedirectSources(currentConfig),
        ...extractStaticRedirectSources(previousConfig),
      ]) {
        if (!route.startsWith("/os")) paths.add(route);
      }

      continue;
    }

    const projectComponentMatch = path.match(
      /^app\/projects\/\[slug\]\/([^/]+\.tsx)$/,
    );
    const componentSlug = projectComponentMatch
      ? PROJECT_COMPONENT_ROUTES.get(projectComponentMatch[1])
      : undefined;

    if (componentSlug) {
      paths.add(`/projects/${componentSlug}`);
      continue;
    }

    const publicProjectMatch = path.match(/^public\/projects\/([^/]+)\//);
    if (publicProjectMatch) {
      paths.add(`/projects/${publicProjectMatch[1]}`);
      continue;
    }

    if (path.startsWith("public/images/events/cheongna-launch/")) {
      paths.add("/events/cheongna-launch");
      continue;
    }

    if (path.startsWith("public/home/")) {
      paths.add("/");
      continue;
    }

    const staticRoute = staticRouteFromPageFile(path);
    if (staticRoute) paths.add(staticRoute);
  }

  return [...paths]
    .map((path) => new URL(path, SITE_ORIGIN))
    .filter((url) => url.origin === SITE_ORIGIN)
    .map((url) => url.toString())
    .sort();
}

async function githubRequest(path) {
  const repository = process.env.GITHUB_REPOSITORY;
  const token = process.env.GITHUB_TOKEN;

  if (!repository || !token) {
    throw new Error(
      "GITHUB_REPOSITORY and GITHUB_TOKEN are required to inspect deployments.",
    );
  }

  const response = await fetch(`https://api.github.com/repos/${repository}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) {
    throw new Error(
      `GitHub API request failed (${response.status}) while resolving production history.`,
    );
  }

  return response.json();
}

async function resolvePreviousProductionSha(deploymentId, currentSha) {
  const deployments = await githubRequest(
    "/deployments?environment=Production&per_page=100",
  );

  for (const deployment of deployments) {
    if (
      String(deployment.id) === String(deploymentId) ||
      deployment.sha === currentSha ||
      deployment.environment !== "Production" ||
      deployment.creator?.login !== "vercel[bot]"
    ) {
      continue;
    }

    const statuses = await githubRequest(
      `/deployments/${deployment.id}/statuses?per_page=10`,
    );

    if (statuses[0]?.state === "success") {
      return deployment.sha;
    }
  }

  console.log(
    "No previous successful Production deployment found; using the initial repository baseline.",
  );
  return EMPTY_TREE_SHA;
}

function readAndValidateKey() {
  const key = readFileSync(KEY_FILE_PATH, "utf8").trim();
  const keyFromFileName = basename(KEY_FILE_NAME, ".txt");

  if (!/^[a-fA-F0-9-]{8,128}$/.test(key)) {
    throw new Error("IndexNow key does not satisfy Naver's key format.");
  }

  if (key !== keyFromFileName) {
    throw new Error("IndexNow key file name and contents do not match.");
  }

  return key;
}

function sleep(milliseconds) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}

async function verifyProductionKey(key) {
  const attempts = 12;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(KEY_LOCATION, { cache: "no-store" });
      const body = response.ok ? (await response.text()).trim() : "";

      if (response.status === 200 && body === key) {
        console.log("Production key verification: 200 OK");
        return;
      }
    } catch {
      // The production alias can take a few seconds to follow a ready deployment.
    }

    if (attempt < attempts) await sleep(10_000);
  }

  throw new Error("Production key verification failed; IndexNow was not called.");
}

function describeResponse(status) {
  if (status === 200) return "Success";
  if (status === 202) return "Accepted / key verification pending";
  if (status === 400) return "Bad request / invalid request format";
  if (status === 403) return "Forbidden / key verification failed";
  if (status === 422) return "Unprocessable request / URL ownership mismatch";
  if (status === 429) return "Rate limited";
  if (status >= 500) return "IndexNow server error";
  return "Unexpected response";
}

async function submitIndexNow(urlList, key) {
  await verifyProductionKey(key);

  let response;

  if (urlList.length === 1) {
    const requestUrl = new URL(INDEXNOW_ENDPOINT);
    requestUrl.search = new URLSearchParams({
      url: urlList[0],
      key,
    }).toString();
    response = await fetch(requestUrl);
  } else {
    response = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host: SITE_HOST,
        key,
        urlList,
      }),
    });
  }
  const result = describeResponse(response.status);

  console.log(`IndexNow submitted URLs: ${urlList.length}`);
  console.log(`IndexNow response: ${response.status} ${result}`);
  console.log("Submitted URLs:");
  for (const url of urlList) console.log(`- ${url}`);

  if (response.status !== 200 && response.status !== 202) {
    throw new Error(`IndexNow request failed: ${response.status} ${result}`);
  }
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const head = getHeadSha(options.head);
  let base = options.base;

  if (!base && options.deploymentId) {
    base = await resolvePreviousProductionSha(options.deploymentId, head);
  }

  if (!base && options.changedFiles.length === 0) {
    base = runGit(["rev-parse", `${head}^`]);
  }

  const changedFiles =
    options.changedFiles.length > 0
      ? options.changedFiles
      : getChangedFiles(base, head);
  const urlList = detectChangedUrls(changedFiles, { base, head });

  if (urlList.length === 0) {
    console.log("No public indexable URL changes detected.");
    console.log("IndexNow skipped.");
    return;
  }

  console.log(`Detected public indexable URLs: ${urlList.length}`);
  for (const url of urlList) console.log(`- ${url}`);
  console.log(
    `IndexNow request method: ${urlList.length === 1 ? "GET" : "POST"}`,
  );

  if (options.dryRun) {
    console.log("Dry run: no IndexNow request was sent.");
    return;
  }

  const key = readAndValidateKey();
  await submitIndexNow(urlList, key);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
