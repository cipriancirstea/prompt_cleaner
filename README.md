# Prompt Cleaner

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/CiprianCirstea.prompt-cleaner?label=VS%20Code%20Marketplace)](https://marketplace.visualstudio.com/items?itemName=CiprianCirstea.prompt-cleaner)

Cleans up your messy, stream-of-consciousness prompts before sending them to Copilot Chat — removing filler words, fixing typos, trimming stray dots and self-corrections, then filling the Copilot Chat input with the cleaned version ready to send.

Supports **OpenAI**, **Anthropic Claude**, **xAI Grok**, and any **custom OpenAI-compatible endpoint** (Ollama, LM Studio, OpenRouter, Hugging Face, and more).

## Commands

### `Cmd+Shift+X` — Open prompt file
Opens `prompt.md` from your workspace root. Type your ramble, press `Cmd+S` — the extension cleans it and places it in the Copilot Chat input, then clears the file ready for next use.

> **Setup required:** Create a `prompt.md` file in your workspace root manually before using this command. The extension will not create or modify any files in your project other than clearing `prompt.md` after sending.

### `Cmd+Shift+R` — Clean selected text
Select any text in the editor, press `Cmd+Shift+R` — the cleaned version is sent directly to the Copilot Chat input.

## Configuration

Open Settings (`Cmd+,`) and search for `Prompt Cleaner`.

### Provider

Set `copilotPromptCleaner.provider` to choose which AI backend cleans your prompts:

| Value | Description |
|---|---|
| `openai` | OpenAI GPT models (default) |
| `claude` | Anthropic Claude |
| `grok` | xAI Grok |
| `custom` | Any OpenAI-compatible endpoint — local or remote |

Each provider has its own settings group. You can configure all of them and just toggle `provider` to switch — no need to re-enter keys.

---

### OpenAI

| Setting | Default | Description |
|---|---|---|
| `copilotPromptCleaner.openai.apiKey` | _(empty)_ | API key from [platform.openai.com](https://platform.openai.com/api-keys) |
| `copilotPromptCleaner.openai.model` | `gpt-4o` | Model name (e.g. `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`) |

```json
"copilotPromptCleaner.provider": "openai",
"copilotPromptCleaner.openai.apiKey": "sk-...",
"copilotPromptCleaner.openai.model": "gpt-4o"
```

---

### Anthropic Claude

| Setting | Default | Description |
|---|---|---|
| `copilotPromptCleaner.claude.apiKey` | _(empty)_ | API key from [console.anthropic.com](https://console.anthropic.com/settings/keys) |
| `copilotPromptCleaner.claude.model` | `claude-haiku-4-5` | Model name (e.g. `claude-haiku-4-5`, `claude-sonnet-4-5`, `claude-opus-4-5`) |

```json
"copilotPromptCleaner.provider": "claude",
"copilotPromptCleaner.claude.apiKey": "sk-ant-...",
"copilotPromptCleaner.claude.model": "claude-haiku-4-5"
```

---

### xAI Grok

| Setting | Default | Description |
|---|---|---|
| `copilotPromptCleaner.grok.apiKey` | _(empty)_ | API key from [console.x.ai](https://console.x.ai/team/default/api-keys) |
| `copilotPromptCleaner.grok.model` | `grok-4.3` | Model name (e.g. `grok-4.3`, `grok-3`) |

```json
"copilotPromptCleaner.provider": "grok",
"copilotPromptCleaner.grok.apiKey": "xai-...",
"copilotPromptCleaner.grok.model": "grok-4.3"
```

---

### Custom endpoint

Use this for any OpenAI-compatible server — local or remote. Both `endpoint` and `model` are required. `apiKey` is optional.

| Setting | Default | Description |
|---|---|---|
| `copilotPromptCleaner.custom.endpoint` | _(empty)_ | Base URL without `/v1` |
| `copilotPromptCleaner.custom.model` | _(empty)_ | Exact model name as required by the provider |
| `copilotPromptCleaner.custom.apiKey` | _(empty)_ | API key — leave empty for servers that don't require auth |

**Ollama (local, no key needed)**
```json
"copilotPromptCleaner.provider": "custom",
"copilotPromptCleaner.custom.endpoint": "http://localhost:11434",
"copilotPromptCleaner.custom.model": "llama3"
```

**LM Studio (local)**
```json
"copilotPromptCleaner.provider": "custom",
"copilotPromptCleaner.custom.endpoint": "http://localhost:1234",
"copilotPromptCleaner.custom.model": "phi3"
```

**OpenRouter**
```json
"copilotPromptCleaner.provider": "custom",
"copilotPromptCleaner.custom.endpoint": "https://openrouter.ai/api",
"copilotPromptCleaner.custom.model": "mistralai/mixtral-8x7b-instruct",
"copilotPromptCleaner.custom.apiKey": "sk-or-..."
```

**Hugging Face**
```json
"copilotPromptCleaner.provider": "custom",
"copilotPromptCleaner.custom.endpoint": "https://api-inference.huggingface.co",
"copilotPromptCleaner.custom.model": "HuggingFaceH4/zephyr-7b-beta",
"copilotPromptCleaner.custom.apiKey": "hf_..."
```

---

> **Tip:** Store API keys in User Settings (`Cmd+Shift+P` → Open User Settings JSON), not workspace settings, so they are never committed to git.
