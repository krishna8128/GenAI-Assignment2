# Scaler Clone Agent

A **conversational CLI AI agent** — Cursor / Windsurf-style, but in your terminal —
that takes a natural-language instruction and **builds the Scaler Academy website
clone** (HTML + CSS + JS) by reasoning through a strict step loop.

> Assignment 02 — GenAI · *AI Agent CLI Tool*

## What it does

You chat with the agent in the terminal. Tell it:

```
Clone the Scaler Academy website into ./scaler-clone
```

…and it:

1. Plans the work via multiple `THINK` steps
2. Calls real tools (`createFile`, `createDirectory`, `fetchUrl`, …)
3. Observes each result before deciding the next move
4. Produces a working `index.html`, `styles.css`, and `script.js`
5. Stops with an `OUTPUT` summary telling you how to open the result

The output page contains the three required sections — **Header, Hero, Footer** —
styled with Scaler's navy + lime accent palette, responsive layout, and a touch
of interactive JavaScript (mobile-menu toggle, smooth scroll, etc.).

## The reasoning loop

```
START  →  THINK (n)  →  TOOL  →  OBSERVE  →  THINK  →  …  →  OUTPUT
```

Every model turn is a single JSON object with a `step` field. The runtime never
lets the model fake an `OBSERVE` — tool results come from the host process and
are fed back as the next message. The model is forced to think, act, observe,
and reason again. That's the whole loop.

## Tools the agent can call

| Tool              | Args                              | Purpose                                        |
| ----------------- | --------------------------------- | ---------------------------------------------- |
| `createFile`      | `{ path, content }`               | Write any text file (auto-creates parent dirs) |
| `createDirectory` | `{ path }`                        | Recursively make a directory                   |
| `readFile`        | `{ path }`                        | Read a file's contents                         |
| `listFiles`       | `{ path }`                        | List entries in a directory                    |
| `fetchUrl`        | `{ url }`                         | HTTP GET a page (handy to peek at real Scaler) |
| `executeCommand`  | `{ command }`                     | Run a shell command on the user's machine      |

## Quick start

### 1. Install

```bash
git clone <this-repo-url>
cd assignment2
npm install
```

### 2. Configure an API key (Anthropic *or* OpenAI)

```bash
cp .env.example .env
```

Open `.env` and set **one** of:

```env
ANTHROPIC_API_KEY=sk-ant-...     # Claude (sonnet-4-6 by default)
# or
OPENAI_API_KEY=sk-...            # GPT-4.1-mini by default
```

The agent auto-detects whichever key is present. To force a provider when
both are set, also add `LLM_PROVIDER=anthropic` (or `openai`).

### 3. Run the agent

```bash
npm start
```

You'll see:

```
╔══════════════════════════════════════════════════════════════╗
║   Scaler Clone Agent  —  conversational coding CLI           ║
║                                                              ║
║   Tell me what to build. I reason → call tools → write files.║
║   Try:  "Clone the Scaler Academy website into ./scaler-clone" ║
╚══════════════════════════════════════════════════════════════╝

you ›
```

Type your instruction and watch the agent loop run.

### 4. Open the cloned site

After the run finishes:

```bash
# macOS / Linux
open scaler-clone/index.html
# Windows (PowerShell)
start scaler-clone/index.html
```

## Example session

```
you › Clone the Scaler Academy website into ./scaler-clone

● START   User wants a Scaler Academy clone in ./scaler-clone with HTML, CSS, JS.
● THINK   I should plan three files: index.html, styles.css, script.js.
● THINK   Each file needs the Header, Hero, Footer sections from the brief.
● TOOL    createDirectory({"path":"scaler-clone"})
● OBSERVE Directory ready: scaler-clone
● TOOL    createFile({"path":"scaler-clone/index.html","content":"<!doctype html…"})
● OBSERVE File created: scaler-clone/index.html (4231 chars)
● TOOL    createFile({"path":"scaler-clone/styles.css","content":":root{--…"})
● OBSERVE File created: scaler-clone/styles.css (5108 chars)
● TOOL    createFile({"path":"scaler-clone/script.js","content":"const navToggle=…"})
● OBSERVE File created: scaler-clone/script.js (612 chars)
✓ OUTPUT  Created scaler-clone/{index.html, styles.css, script.js}. Open index.html in your browser.
```

## Project layout

```
.
├── index.js          # the agent — tools, system prompt, loop, CLI
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

After your first run, a generated folder (e.g. `scaler-clone/`) appears alongside.

## Configuration

| Env var             | Default              | Description                                                              |
| ------------------- | -------------------- | ------------------------------------------------------------------------ |
| `ANTHROPIC_API_KEY` | *(one of these)*     | Anthropic key — picks Claude                                             |
| `OPENAI_API_KEY`    | *(one of these)*     | OpenAI key — picks GPT                                                   |
| `ANTHROPIC_MODEL`   | `claude-sonnet-4-6`  | Override the Claude model                                                |
| `OPENAI_MODEL`      | `gpt-4.1-mini`       | Override the GPT model                                                   |
| `LLM_PROVIDER`      | *(auto)*             | Force `anthropic` or `openai` when both keys are set                     |

## How it differs from the starter snippet

The reference snippet in the assignment was a single-shot agent with `weather`
and `github` tools. This implementation extends it with:

- **Real interactive CLI** (readline) so you can chat across many turns,
  not just one hardcoded prompt.
- **File-system tools** (`createFile`, `createDirectory`, `readFile`, `listFiles`)
  so the agent can actually build websites.
- **`fetchUrl`** so the agent can peek at the live Scaler site for inspiration.
- **JSON-mode response_format** to force valid JSON every turn.
- **Robust loop** — safety counter, observation truncation, graceful tool-error
  handling, and a self-emitted-OBSERVE soft fallback.
- **Coloured step trace** so the reasoning, tool calls, and observations are
  easy to follow on screen.

## Submission checklist (for the assignment)

- [x] CLI tool that runs in the terminal and accepts NL input
- [x] Agent loops through reasoning + tool calls (not single-shot)
- [x] Produces real files (`index.html`, `styles.css`, `script.js`)
- [x] Output visually resembles the Scaler website
- [x] Includes Header, Hero, Footer
- [ ] Public GitHub repo URL — *push this folder*
- [ ] 2-3 minute YouTube demo — *record terminal + browser open*

## License

MIT
# GenAI-Assignment2
