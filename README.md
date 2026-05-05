# Prompt Cleaner

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/CiprianCirstea.prompt-cleaner?label=VS%20Code%20Marketplace)](https://marketplace.visualstudio.com/items?itemName=CiprianCirstea.prompt-cleaner)

Cleans up your messy, stream-of-consciousness prompts before sending them to Copilot — removing filler words, fixing typos, trimming stray dots and self-corrections, then filling the Copilot Chat input with the cleaned version ready to send.

## Commands

### `Cmd+Shift+X` — Open prompt file
Opens `prompt.md` from your workspace root. Type your ramble, press `Cmd+S` — the extension cleans it and places it in the Copilot Chat input, then clears the file ready for next use.

> **Setup required:** Create a `prompt.md` file in your workspace root manually before using this command. The extension will not create or modify any files in your project other than clearing `prompt.md` after sending.

### `Cmd+Shift+R` — Clean selected text
Select any text in the editor, press `Cmd+Shift+R` — the cleaned version is sent directly to the Copilot Chat input.

## Configuration

Open Settings (`Cmd+,`) and search for `Prompt Cleaner`.

| Setting | Default | Description |
|---|---|---|
| `copilotPromptCleaner.endpoint` | `https://api.openai.com` | API endpoint. Change to `http://localhost:11434` for Ollama, or any OpenAI-compatible server |
| `copilotPromptCleaner.model` | `gpt-4o` | Model name. Use `llama3`, `mistral`, etc. for local AI |
| `copilotPromptCleaner.apiKey` | _(empty)_ | API key. Required for OpenAI. Leave empty for local AI |

### Using with OpenAI
```json
"copilotPromptCleaner.endpoint": "https://api.openai.com",
"copilotPromptCleaner.model": "gpt-4o",
"copilotPromptCleaner.apiKey": "sk-..."
```

### Using with Ollama (local, no key needed)
```json
"copilotPromptCleaner.endpoint": "http://localhost:11434",
"copilotPromptCleaner.model": "llama3",
"copilotPromptCleaner.apiKey": ""
```

> **Tip:** Store your API key in User Settings (`Cmd+Shift+P` → Open User Settings JSON), not workspace settings, so it never gets committed to git.
