# AnySearch Skill

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Unified real-time search engine skill for AI agents. Supports general web search, vertical domain search, parallel batch search, and full-page content extraction.

## Download & Install

This folder is a locally adapted snapshot distributed by Jason-Yao-Builder, not an unmodified copy of the current upstream release. To obtain this version:

```bash
git clone https://github.com/Jason-Yao-Builder/Skills.git
```

Copy the entire `Skills/anysearch/` folder to a supported agent skill directory, such as `~/.agents/skills/anysearch/` or `~/.claude/skills/anysearch/`. Compare an existing installation before replacing files; local credentials and runtime preferences are not included here.

For the original upstream distribution, visit [anysearch-ai/anysearch-skill](https://github.com/anysearch-ai/anysearch-skill). Downloading upstream will not restore this bundled snapshot. The Apache-2.0 license and upstream attribution are retained in LICENSE and NOTICE.

Python requires `requests`; Node.js uses built-in modules. The Bash CLI requires both `curl` and `jq`. See the platform-specific instructions below for runtime selection.

## API Key Configuration

An API key is **optional but strongly recommended**. Without a key, you can still use all search features via anonymous access, but with **lower rate limits and quota**.

### How to configure

Copy the example env file and fill in your key:

```bash
cp .env.example .env
# Edit .env and set: ANYSEARCH_API_KEY=<your_api_key_here>
```

Or set the environment variable directly:

```bash
export ANYSEARCH_API_KEY=<your_api_key_here>   # Linux/macOS
set ANYSEARCH_API_KEY=<your_api_key_here>       # Windows CMD
$env:ANYSEARCH_API_KEY="<your_api_key_here>"    # Windows PowerShell
```

### Get an API Key

Visit https://anysearch.com/console/api-keys to sign up and create a free API key.

Key priority order: `--api_key` CLI flag > `.env` file > environment variable > anonymous

## Post-Install Verification

After installation, probe the platform and run the entry test:

### Step 1: Detect available runtime

Run these checks in order. The first success determines the active CLI:

```bash
# Check Python (recommended)
python --version   # Need >= 3.6, requires `requests` library
python3 --version  # Need >= 3.6, requires `requests` library
# Check Node.js (alternative)
node --version     # Need >= 12, no external dependencies
# Check Shell (fallback)
# Windows: PowerShell 5.1+ / Linux/macOS: bash 4+
```

Priority: **Python > Node.js > Shell**

Important: do not assume `python` exists. On many macOS systems, the correct executable is `python3`. Check both `python` and `python3`; if either works, Python is available.

### Step 2: Run entry test (probe all available runtimes)

Run the `doc` command with **each available** runtime to verify the skill works, and observe which runs without errors or warnings:

```bash
# Python
python <skill_dir>/scripts/anysearch_cli.py doc

# Python 3 fallback (common on macOS)
python3 <skill_dir>/scripts/anysearch_cli.py doc

# Node.js (if available)
node <skill_dir>/scripts/anysearch_cli.js doc

# PowerShell (Windows)
powershell -ExecutionPolicy Bypass -File <skill_dir>/scripts/anysearch_cli.ps1 doc

# Bash (Linux/macOS)
bash <skill_dir>/scripts/anysearch_cli.sh doc
```

For each runtime, record whether the command succeeded and any errors/warnings encountered. The runtime that completes without errors and produces the cleanest output is the recommended runtime for this environment.

### Step 3: Persist recommended runtime to configuration file

Based on the entry test results, write the recommended runtime to `<skill_dir>/runtime.conf`:

```bash
echo "Runtime: <RUNTIME>" > <skill_dir>/runtime.conf
echo "Command: <COMMAND>" >> <skill_dir>/runtime.conf
```

Example for Python:

```bash
echo "Runtime: Python" > <skill_dir>/runtime.conf
echo "Command: python <skill_dir>/scripts/anysearch_cli.py" >> <skill_dir>/runtime.conf
```

Example for Python 3:

```bash
echo "Runtime: Python" > <skill_dir>/runtime.conf
echo "Command: python3 <skill_dir>/scripts/anysearch_cli.py" >> <skill_dir>/runtime.conf
```

Example for Node.js:

```bash
echo "Runtime: Node.js" > <skill_dir>/runtime.conf
echo "Command: node <skill_dir>/scripts/anysearch_cli.js" >> <skill_dir>/runtime.conf
```

Example for PowerShell:

```bash
echo "Runtime: PowerShell" > <skill_dir>/runtime.conf
echo "Command: powershell -ExecutionPolicy Bypass -File <skill_dir>/scripts/anysearch_cli.ps1" >> <skill_dir>/runtime.conf
```

Example for Bash:

```bash
echo "Runtime: Bash" > <skill_dir>/runtime.conf
echo "Command: bash <skill_dir>/scripts/anysearch_cli.sh" >> <skill_dir>/runtime.conf
```

**Important:** Runtime preferences are stored in `runtime.conf`, NOT in SKILL.md. The agent reads `runtime.conf` on skill load to determine the active CLI. If the file is missing or corrupted, the agent falls back to the Platform Detection procedure in SKILL.md. If `runtime.conf` already exists, replace it instead of appending.

### Routine agent usage

After `runtime.conf` exists, agents should use the stored `Command` directly for routine calls instead of running `doc` before every search. For example, if `runtime.conf` contains `Command: python3 <skill_dir>/scripts/anysearch_cli.py`, use:

```bash
python3 <skill_dir>/scripts/anysearch_cli.py search "query" --max_results 5
python3 <skill_dir>/scripts/anysearch_cli.py batch_search --queries '[{"query":"q1","max_results":5},{"query":"q2","max_results":5}]'
python3 <skill_dir>/scripts/anysearch_cli.py extract "https://example.com/page"
python3 <skill_dir>/scripts/anysearch_cli.py extract --url "https://example.com/page"
```

`extract` output is already Markdown. Do not pass `--format markdown`, `--format json`, or `--markdown`; the extract command only accepts the URL positional argument or `--url`/`-u`. If a subcommand argument is unclear or fails, run `<command> <subcommand> --help` for that subcommand rather than the full `doc` command.

### Step 4 (optional): Test a real search

```bash
python <skill_dir>/scripts/anysearch_cli.py search "hello world" --max_results 1
```

If your system does not provide `python`, use:

```bash
python3 <skill_dir>/scripts/anysearch_cli.py search "hello world" --max_results 1
```

A successful JSON response confirms the API connection is working.

## File Structure

```
anysearch/
├── .env.example              # API key configuration template
├── .env                      # Your API key (gitignored, create from .env.example)
├── runtime.conf              # Detected runtime preferences (gitignored)
├── runtime.conf.example      # Runtime configuration template
├── SKILL.md                  # Skill definition for AI agents
├── README.md                 # This file
└── scripts/
    ├── anysearch_cli.py       # Python CLI
    ├── anysearch_cli.js       # Node.js CLI
    ├── anysearch_cli.ps1      # PowerShell CLI
    └── anysearch_cli.sh       # Bash CLI
```
