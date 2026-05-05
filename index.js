// Scaler Clone Agent — conversational CLI coding agent
// =====================================================
// A terminal-native AI assistant (Cursor / Windsurf-style) that takes a
// natural-language instruction and builds real files on the user's machine
// by reasoning through a strict step loop:
//
//     START  ->  THINK (n)  ->  TOOL  ->  OBSERVE  ->  THINK  ...  ->  OUTPUT
//
// The reference task: "clone the Scaler Academy website" — produces a folder
// with index.html / styles.css / script.js containing a Header, Hero, Footer.

import "dotenv/config";
import { OpenAI } from "openai";
import Anthropic from "@anthropic-ai/sdk";
import axios from "axios";
import { exec } from "node:child_process";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

// ---------------------------------------------------------------------------
// 1. Tools — the side-effecting capabilities the agent can call
// ---------------------------------------------------------------------------

async function createFile(args = {}) {
  const filePath = args.path ?? args.file_path;
  const content = args.content ?? "";
  if (!filePath) throw new Error("createFile requires { path, content }");

  const dir = path.dirname(filePath);
  if (dir && dir !== ".") await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, content, "utf-8");
  return `File created: ${filePath} (${content.length} chars)`;
}

async function createDirectory(args = {}) {
  const dirPath = typeof args === "string" ? args : args.path;
  if (!dirPath) throw new Error("createDirectory requires { path }");
  await fs.mkdir(dirPath, { recursive: true });
  return `Directory ready: ${dirPath}`;
}

async function readFile(args = {}) {
  const filePath = typeof args === "string" ? args : args.path;
  if (!filePath) throw new Error("readFile requires { path }");
  const content = await fs.readFile(filePath, "utf-8");
  return content.length > 8000
    ? content.slice(0, 8000) + `\n\n[truncated — total ${content.length} chars]`
    : content;
}

async function listFiles(args = {}) {
  const dirPath =
    typeof args === "string" ? args : args.path ?? ".";
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  if (entries.length === 0) return `(empty directory: ${dirPath})`;
  return entries
    .map((e) => `${e.isDirectory() ? "[DIR] " : "[FILE]"} ${e.name}`)
    .join("\n");
}

async function fetchUrl(args = {}) {
  const url = typeof args === "string" ? args : args.url;
  if (!url) throw new Error("fetchUrl requires { url }");
  const { data } = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; ScalerCloneAgent/1.0; +https://github.com/)",
    },
    responseType: "text",
    timeout: 30_000,
  });
  const text = String(data);
  return text.length > 50_000
    ? text.slice(0, 50_000) + `\n\n[truncated — total ${text.length} chars]`
    : text;
}

async function executeCommand(args = {}) {
  const cmd = typeof args === "string" ? args : args.command;
  if (!cmd) throw new Error("executeCommand requires { command }");
  return new Promise((resolve) => {
    exec(cmd, { maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
      if (err) {
        resolve(
          `Command failed: ${err.message}\n` +
            (stderr ? `stderr:\n${stderr}` : "")
        );
      } else {
        resolve(stdout || stderr || `(command ran with no output) $ ${cmd}`);
      }
    });
  });
}

const TOOLS = {
  createFile,
  createDirectory,
  readFile,
  listFiles,
  fetchUrl,
  executeCommand,
};

// ---------------------------------------------------------------------------
// 2. System prompt — defines the loop, the JSON schema, and the design brief
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `
You are an AI Coding Agent — a conversational CLI assistant that helps developers
build real software directly on their machine. Think Cursor or Windsurf, but in
the terminal. You have direct access to the user's filesystem via tools.

You operate in a strict, deterministic step loop:

    START  ->  THINK (multiple)  ->  TOOL  ->  OBSERVE  ->  THINK  ->  ...  ->  OUTPUT

Every message you emit MUST be exactly one valid JSON object — no markdown
fences, no prose around it, no extra keys. Schema:

    {
      "step": "START" | "THINK" | "TOOL" | "OBSERVE" | "OUTPUT",
      "content": "string (always present except sometimes on TOOL)",
      "tool_name": "string (only when step is TOOL)",
      "tool_args": object  (only when step is TOOL)
    }

============================== AVAILABLE TOOLS ==============================

1. createFile         { "path": string, "content": string }
   Writes a UTF-8 file. Parent directories are auto-created. Use for HTML,
   CSS, JS, README, or any text file.

2. createDirectory    { "path": string }
   Recursively creates a directory.

3. readFile           { "path": string }
   Returns the file's contents (truncated to 8000 chars if huge).

4. listFiles          { "path": string }
   Lists entries in a directory. Defaults to the current directory.

5. fetchUrl           { "url": string }
   HTTP GETs a URL and returns the raw HTML/text (truncated to 50KB).
   Useful for inspecting a real website before cloning it.

6. executeCommand     { "command": string }
   Runs a shell command on the user's machine. Cross-platform. Use sparingly
   — prefer the file tools above for file I/O.

================================== RULES ===================================

1. EXACTLY one JSON object per message. No code fences. No commentary.
2. After a TOOL step you MUST stop. The runtime will give you the OBSERVE
   result on the next turn. Never invent your own OBSERVE messages.
3. Always do at least 2-3 THINK steps before any TOOL call — plan first,
   then execute. Show your reasoning explicitly.
4. Break large tasks into many small TOOL calls. Don't try to do everything
   at once.
5. Finish with exactly one OUTPUT step that summarises what was created and
   how the user can run / open it.

========================= WEBSITE CLONE GUIDELINES =========================

When the user asks you to clone a website (Scaler in particular), produce
AT MINIMUM these three files inside a dedicated folder:

    <folder>/index.html
    <folder>/styles.css
    <folder>/script.js

The page MUST contain:
  • a Header  — brand wordmark/logo on the left, a nav with links
                 (Programs, Courses, For Companies, About, etc.), and
                 Login + Sign-up buttons on the right.
  • a Hero    — a bold headline, a supporting subtitle, a primary CTA,
                 a secondary CTA, and an illustration / hero visual.
  • a Footer  — dark, multi-column (Programs / Resources / Company /
                 Contact), social icons, and a copyright line.

Style brief for Scaler Academy:
  • Palette  — dark navy backgrounds (#0d1218 / #13182a / #1a2236),
                white text, a vibrant lime/green accent (#15bd66) and
                a warm yellow accent (#ffd400) for highlights.
  • Type     — bold sans-serif from Google Fonts (Inter / Poppins /
                Manrope). Hero headline 48-72px, weight 800.
  • Layout   — fully responsive (CSS grid + flex + at least one
                @media (max-width: 768px) breakpoint).
  • Polish   — subtle hover states, rounded buttons, gradient or
                outline accents, decent vertical rhythm. NO lorem
                ipsum — write real, on-brand marketing copy.
  • JS       — at least one interactive bit (mobile menu toggle,
                smooth scroll, animated counters, or similar).

================================ EXAMPLE ===================================

user: Make a hello.html in ./demo
assistant: { "step": "START", "content": "User wants a minimal hello.html under ./demo." }
assistant: { "step": "THINK", "content": "I need to plan: one HTML file, valid doctype, simple body." }
assistant: { "step": "THINK", "content": "I'll use createFile with path='demo/hello.html' — parents are auto-created." }
assistant: { "step": "TOOL", "tool_name": "createFile", "tool_args": { "path": "demo/hello.html", "content": "<!doctype html>\\n<html><body><h1>Hello</h1></body></html>" } }
developer: { "step": "OBSERVE", "content": "File created: demo/hello.html (60 chars)" }
assistant: { "step": "THINK", "content": "File is on disk; nothing else to do." }
assistant: { "step": "OUTPUT", "content": "Created demo/hello.html. Open it in a browser to view." }
`.trim();

// ---------------------------------------------------------------------------
// 3. Agent loop
// ---------------------------------------------------------------------------

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const MAX_STEPS = 120;

// Provider auto-selection: explicit LLM_PROVIDER overrides, else picks
// whichever key is set. Anthropic wins ties (cheaper for this loop with caching).
function pickProvider() {
  const explicit = (process.env.LLM_PROVIDER || "").toLowerCase();
  if (explicit === "anthropic" && process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (explicit === "openai" && process.env.OPENAI_API_KEY) return "openai";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OPENAI_API_KEY) return "openai";
  return null;
}

function activeModel() {
  const p = pickProvider();
  if (p === "anthropic") return ANTHROPIC_MODEL;
  if (p === "openai") return OPENAI_MODEL;
  return "(none)";
}

// Lazy client so the friendly env-check error wins over SDK's throw.
let _client = null;
let _provider = null;
function getClient() {
  if (_client) return { client: _client, provider: _provider };
  _provider = pickProvider();
  if (!_provider) {
    throw new Error(
      "No API key configured (set ANTHROPIC_API_KEY or OPENAI_API_KEY)."
    );
  }
  _client = _provider === "anthropic" ? new Anthropic() : new OpenAI();
  return { client: _client, provider: _provider };
}

// Anthropic requires alternating user/assistant, a separate `system` field,
// and (on this model) the conversation MUST end on a user message — assistant
// prefill is rejected. We normalise our internal OpenAI-shaped log: drop
// system, map developer->user, merge same-role neighbours, and append a
// "continue" user turn whenever the last entry is from the assistant.
function toAnthropicMessages(history) {
  const mapped = history
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "developer" ? "user" : m.role,
      content: m.content,
    }));

  const merged = [];
  for (const m of mapped) {
    if (merged.length && merged[merged.length - 1].role === m.role) {
      merged[merged.length - 1].content += "\n\n" + m.content;
    } else {
      merged.push({ ...m });
    }
  }

  if (merged.length && merged[merged.length - 1].role === "assistant") {
    merged.push({
      role: "user",
      content:
        "Continue the loop. Output ONLY the next JSON step object — no prose, no markdown fences.",
    });
  }
  return merged;
}

async function callModel(history) {
  const { client, provider } = getClient();

  if (provider === "anthropic") {
    const sys = history.find((m) => m.role === "system")?.content ?? "";
    const messages = toAnthropicMessages(history);
    const resp = await client.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 16384,
      temperature: 0.3,
      // cache_control on the (large) system prompt — saves ~80% on repeated turns
      system: [
        { type: "text", text: sys, cache_control: { type: "ephemeral" } },
      ],
      messages,
    });
    return resp.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");
  }

  const resp = await client.chat.completions.create({
    model: OPENAI_MODEL,
    messages: history,
    response_format: { type: "json_object" },
    temperature: 0.4,
  });
  return resp.choices[0]?.message?.content ?? "";
}

// Walk the string and extract the first balanced { ... } JSON object,
// respecting strings and escapes. Used as a last-resort recovery if the model
// adds any preamble around the JSON.
function extractFirstJson(text) {
  let depth = 0;
  let start = -1;
  let inString = false;
  let escape = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (escape) { escape = false; continue; }
    if (inString) {
      if (c === "\\") escape = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') inString = true;
    else if (c === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (c === "}") {
      depth--;
      if (depth === 0 && start >= 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

function safeJsonParse(text) {
  try { return JSON.parse(text); } catch {}

  // Strip ```json ... ``` fences if the model added them despite instructions.
  const cleaned = text
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
  try { return JSON.parse(cleaned); } catch {}

  // Last resort: pull out the first balanced { ... } from anywhere in the text.
  const extracted = extractFirstJson(text);
  if (extracted) {
    try { return JSON.parse(extracted); } catch {}
  }
  return null;
}

function previewArgs(args) {
  if (args === undefined || args === null) return "";
  if (typeof args === "string") {
    return args.length > 80 ? args.slice(0, 80) + "…" : args;
  }
  const json = JSON.stringify(args);
  return json.length > 100 ? json.slice(0, 100) + "…" : json;
}

const C = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  magenta: "\x1b[35m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
};

async function runAgent(userInstruction, history) {
  history.push({ role: "user", content: userInstruction });

  for (let step = 0; step < MAX_STEPS; step++) {
    const raw = await callModel(history);
    const parsed = safeJsonParse(raw);

    if (!parsed || typeof parsed !== "object" || !parsed.step) {
      console.log(
        `${C.red}✖ Model returned non-conforming output, stopping:${C.reset}\n${raw.slice(0, 300)}`
      );
      break;
    }

    history.push({ role: "assistant", content: JSON.stringify(parsed) });

    switch (parsed.step) {
      case "START":
        console.log(
          `\n${C.cyan}${C.bold}● START${C.reset}  ${parsed.content ?? ""}`
        );
        break;

      case "THINK":
        console.log(
          `${C.yellow}● THINK${C.reset}  ${parsed.content ?? ""}`
        );
        break;

      case "TOOL": {
        const name = parsed.tool_name;
        const args = parsed.tool_args ?? {};
        console.log(
          `${C.magenta}● TOOL${C.reset}   ${C.bold}${name}${C.reset}(${C.dim}${previewArgs(args)}${C.reset})`
        );

        const fn = TOOLS[name];
        let observation;
        if (!fn) {
          observation = `Tool "${name}" does not exist. Available tools: ${Object.keys(TOOLS).join(", ")}.`;
        } else {
          try {
            observation = await fn(args);
          } catch (err) {
            observation = `Tool error: ${err?.message ?? String(err)}`;
          }
        }

        const obsStr = String(observation);
        const obsPreview =
          obsStr.length > 240 ? obsStr.slice(0, 240) + "…" : obsStr;
        console.log(
          `${C.blue}● OBSERVE${C.reset} ${obsPreview.replace(/\n/g, " ⏎ ")}`
        );

        history.push({
          role: "developer",
          content: JSON.stringify({ step: "OBSERVE", content: obsStr }),
        });
        break;
      }

      case "OBSERVE":
        // The model shouldn't emit OBSERVE itself, but if it does, ignore softly.
        console.log(
          `${C.dim}(model self-emitted OBSERVE — ignoring): ${parsed.content ?? ""}${C.reset}`
        );
        break;

      case "OUTPUT":
        console.log(
          `\n${C.green}${C.bold}✓ OUTPUT${C.reset} ${parsed.content ?? ""}\n`
        );
        return history;

      default:
        console.log(
          `${C.dim}(unknown step "${parsed.step}"): ${parsed.content ?? ""}${C.reset}`
        );
    }
  }

  console.log(
    `${C.red}⚠ Reached MAX_STEPS=${MAX_STEPS} without an OUTPUT. Stopping for safety.${C.reset}`
  );
  return history;
}

// ---------------------------------------------------------------------------
// 4. Interactive CLI chat
// ---------------------------------------------------------------------------

const BANNER = `
${C.cyan}╔══════════════════════════════════════════════════════════════╗
║   ${C.bold}Scaler Clone Agent${C.reset}${C.cyan}  —  conversational coding CLI         ║
║                                                              ║
║   ${C.reset}Tell me what to build. I reason → call tools → write files.${C.cyan}  ║
║   ${C.reset}Try:  ${C.green}"Clone the Scaler Academy website into ./scaler-clone"${C.cyan} ║
║                                                              ║
║   ${C.reset}Type ${C.yellow}exit${C.reset} (or Ctrl+C) to quit.${C.cyan}                          ║
╚══════════════════════════════════════════════════════════════╝${C.reset}
`;

async function chatLoop() {
  if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    console.error(
      `${C.red}✖ Missing API key.${C.reset}  ` +
        `Copy .env.example to .env and add either ANTHROPIC_API_KEY or OPENAI_API_KEY ` +
        `(or export one in your shell).`
    );
    process.exit(1);
  }

  console.log(BANNER);
  console.log(
    `${C.dim}Provider: ${pickProvider()} · Model: ${activeModel()}${C.reset}`
  );

  const rl = readline.createInterface({ input, output });
  const history = [{ role: "system", content: SYSTEM_PROMPT }];

  while (true) {
    let userInput;
    try {
      userInput = (await rl.question(`\n${C.bold}you ›${C.reset} `)).trim();
    } catch {
      // Ctrl+C / closed stream
      break;
    }
    if (!userInput) continue;
    if (["exit", "quit", "bye", ":q"].includes(userInput.toLowerCase())) {
      console.log(`${C.dim}bye 👋${C.reset}`);
      rl.close();
      break;
    }

    try {
      await runAgent(userInput, history);
    } catch (err) {
      console.error(
        `${C.red}✖ Agent error:${C.reset} ${err?.message ?? String(err)}`
      );
    }
  }
}

chatLoop().catch((err) => {
  console.error(`${C.red}Fatal:${C.reset}`, err);
  process.exit(1);
});
