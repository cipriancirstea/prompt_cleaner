import * as vscode from 'vscode';

const CLEAN_SYSTEM_PROMPT = `You are an expert prompt editor for software developers using an AI coding assistant.
The user will give you a rough, stream-of-consciousness message typed quickly. It may contain plain text, code snippets, or HTML fragments.

Your job is to rewrite it into a single, clear, concise developer question or instruction. Follow these rules strictly:

REMOVE:
- Filler and hedge words: "like", "basically", "you know", "I mean", "kind of", "sort of", "I guess", "maybe", "probably", "just", "so", "ok so", "um", "uh", "well"
- Uncertainty openers: "I don't understand why", "I'm not sure but", "I think maybe", "it seems like"
- Trailing or mid-sentence ellipsis: "...", "…"
- Inline self-corrections and annotations: anything after "<-", "(typo)", "(wrong word)" etc.
- Redundant repetition and false starts: if the user restates the same thing twice, keep only the clearest version
- Meta-commentary about the prompt itself: "like I was saying", "you know what I mean", "does that make sense"

PRESERVE:
- All technical terms exactly as written, even if they look like typos (e.g. useState, useEffect, div, CSS, API names, variable names, error messages)
- The full intent — do not oversimplify or lose meaning
- Code-related specifics: file names, function names, error messages, framework names
- Code blocks and snippets — keep them intact and properly fenced with the correct language tag (e.g. \`\`\`js, \`\`\`html, \`\`\`css)
- HTML fragments that are relevant to the question — preserve tag names, attributes, class names, and IDs that are referenced in the question

CODE & HTML:
- If the prompt contains a code snippet, identify the language and wrap it in a fenced code block if not already fenced
- If the prompt references a specific function, component, or element, make sure the cleaned prompt names it precisely
- Do not paraphrase or summarise code — reproduce it exactly as given
- If inline HTML is included, keep only the elements directly relevant to the question; strip unrelated boilerplate, scripts, and styles that do not affect the issue being asked about

INFER:
- If the user's meaning is clear despite vague phrasing, rewrite it precisely (e.g. "that thing that makes divs float side by side" → "CSS flexbox or float layout")
- Normalize casual phrasing to technical phrasing where appropriate
- Map vague references to concrete technical terms (e.g. "the red squiggly" → "TypeScript type error", "the box around it" → "CSS border or outline")

FORMAT:
- Output a single clean question or instruction
- Use natural developer language — direct and specific
- No bullet points unless the original clearly had multiple distinct questions
- Return ONLY the cleaned prompt — no explanation, no preamble, no surrounding quotes`;

type Provider = 'openai' | 'claude' | 'grok' | 'custom';

interface OpenAIConfig  { provider: 'openai';  endpoint: string; model: string; apiKey: string; }
interface GrokConfig    { provider: 'grok';    endpoint: string; model: string; apiKey: string; }
interface CustomConfig  { provider: 'custom';  endpoint: string; model: string; apiKey: string; }
interface ClaudeConfig  { provider: 'claude';  model: string; apiKey: string; }

type ProviderConfig = OpenAIConfig | GrokConfig | CustomConfig | ClaudeConfig;

function getConfig(): ProviderConfig {
    const cfg = vscode.workspace.getConfiguration('copilotPromptCleaner');
    const provider = cfg.get<Provider>('provider', 'openai');

    switch (provider) {
        case 'claude':
            return {
                provider: 'claude',
                apiKey: cfg.get<string>('claude.apiKey', ''),
                model:  cfg.get<string>('claude.model', 'claude-haiku-4-5'),
            };
        case 'grok':
            return {
                provider: 'grok',
                endpoint: 'https://api.x.ai',
                apiKey: cfg.get<string>('grok.apiKey', ''),
                model:  cfg.get<string>('grok.model', 'grok-4.3'),
            };
        case 'custom': {
            const model = cfg.get<string>('custom.model', '').trim();
            const endpoint = cfg.get<string>('custom.endpoint', '').trim().replace(/\/$/, '');
            if (!endpoint) {
                throw new Error('Custom provider: no endpoint specified. Set copilotPromptCleaner.custom.endpoint in Settings.');
            }
            if (!model) {
                throw new Error('Custom provider: no model specified. Set copilotPromptCleaner.custom.model in Settings.');
            }
            return {
                provider: 'custom',
                endpoint,
                apiKey: cfg.get<string>('custom.apiKey', ''),
                model,
            };
        }
        default:
            return {
                provider: 'openai',
                endpoint: 'https://api.openai.com',
                apiKey: cfg.get<string>('openai.apiKey', ''),
                model:  cfg.get<string>('openai.model', 'gpt-4o'),
            };
    }
}

/** Calls any OpenAI-compatible endpoint (OpenAI, Grok, or custom) */
async function callOpenAICompatible(
    config: OpenAIConfig | GrokConfig | CustomConfig,
    messages: Array<{ role: string; content: string }>,
    token?: vscode.CancellationToken
): Promise<string> {
    const { endpoint, model, apiKey } = config;
    const controller = new AbortController();
    token?.onCancellationRequested(() => controller.abort());

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) { headers['Authorization'] = `Bearer ${apiKey}`; }

    let response: Response;
    try {
        response = await fetch(`${endpoint}/v1/chat/completions`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ model, messages, stream: false }),
            signal: controller.signal,
        });
    } catch (err) {
        throw new Error(`Cannot reach API at ${endpoint}. Check your endpoint setting.`);
    }

    if (!response.ok) {
        throw new Error(`API responded with ${response.status}: ${await response.text()}`);
    }

    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    return data.choices[0].message.content.trim();
}

/** Calls the Anthropic Claude API (/v1/messages) */
async function callClaudeApi(
    config: ClaudeConfig,
    systemPrompt: string,
    userContent: string,
    token?: vscode.CancellationToken
): Promise<string> {
    const controller = new AbortController();
    token?.onCancellationRequested(() => controller.abort());

    if (!config.apiKey) {
        throw new Error('Claude API key is not set. Add it in Settings → Prompt Cleaner → claude.apiKey.');
    }

    let response: Response;
    try {
        response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': config.apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: config.model,
                max_tokens: 1024,
                system: systemPrompt,
                messages: [{ role: 'user', content: userContent }],
            }),
            signal: controller.signal,
        });
    } catch (err) {
        throw new Error('Cannot reach Anthropic API. Check your network connection.');
    }

    if (!response.ok) {
        throw new Error(`Anthropic API responded with ${response.status}: ${await response.text()}`);
    }

    const data = await response.json() as { content: Array<{ type: string; text: string }> };
    return data.content[0].text.trim();
}

/**
 * Strips an HTML string down to only the elements likely relevant to a developer question:
 * removes <script>, <style>, <link>, <meta>, <head> and their contents, collapses
 * runs of whitespace-only text nodes, and trims the result.
 */
function extractRelevantHtml(html: string): string {
    return html
        // Remove script, style, link, meta, head blocks entirely
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<head[\s\S]*?<\/head>/gi, '')
        .replace(/<link[^>]*>/gi, '')
        .replace(/<meta[^>]*>/gi, '')
        // Collapse runs of blank lines
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

/** Returns true if the text looks like it contains significant HTML markup */
function looksLikeHtml(text: string): boolean {
    return /<[a-z][\s\S]*?>/i.test(text);
}

async function cleanPrompt(text: string, token?: vscode.CancellationToken): Promise<string> {
    const input = looksLikeHtml(text) ? extractRelevantHtml(text) : text;
    const config = getConfig();

    if (config.provider === 'claude') {
        return callClaudeApi(config, CLEAN_SYSTEM_PROMPT, input, token);
    }

    return callOpenAICompatible(config as OpenAIConfig | GrokConfig | CustomConfig, [
        { role: 'system', content: CLEAN_SYSTEM_PROMPT },
        { role: 'user', content: input },
    ], token);
}

async function sendToChat(cleaned: string): Promise<void> {
    await vscode.commands.executeCommand('workbench.action.chat.open', {
        query: cleaned,
        isPartialQuery: true,
    });
}

export function activate(context: vscode.ExtensionContext) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri;

    // Cmd+Shift+X — toggle prompt.md open/closed in a split
    const openPromptFile = vscode.commands.registerCommand(
        'copilotPromptCleaner.openPromptFile',
        async () => {
            if (!workspaceFolder) {
                vscode.window.showErrorMessage('No workspace folder open.');
                return;
            }
            const promptUri = vscode.Uri.joinPath(workspaceFolder, 'prompt.md');

            // If prompt.md is already visible, focus it then close it
            const existing = vscode.window.visibleTextEditors.find(
                e => e.document.uri.fsPath === promptUri.fsPath
            );
            if (existing) {
                await vscode.window.showTextDocument(existing.document, { viewColumn: existing.viewColumn, preserveFocus: false });
                await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                return;
            }

            try {
                await vscode.workspace.fs.stat(promptUri);
            } catch {
                vscode.window.showErrorMessage('prompt.md not found. Create it in your workspace root first.');
                return;
            }
            const doc = await vscode.workspace.openTextDocument(promptUri);
            await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside, preserveFocus: false });
        }
    );
    context.subscriptions.push(openPromptFile);

    // On save of prompt.md — clean content and send to Copilot Chat, then clear the file
    const onSave = vscode.workspace.onDidSaveTextDocument(async (doc) => {
        if (!workspaceFolder) { return; }
        const promptUri = vscode.Uri.joinPath(workspaceFolder, 'prompt.md');
        if (doc.uri.fsPath !== promptUri.fsPath) { return; }

        const text = doc.getText().trim();
        if (!text) { return; }

        await vscode.window.withProgress(
            { location: vscode.ProgressLocation.Notification, title: 'Cleaning prompt...' },
            async () => {
                try {
                    const cleaned = await cleanPrompt(text);
                    await sendToChat(cleaned);
                    // Clear via editor buffer only — avoid fs.writeFile conflict with VS Code save
                    const editor = vscode.window.visibleTextEditors.find(
                        e => e.document.uri.fsPath === promptUri.fsPath
                    );
                    if (editor) {
                        await editor.edit(eb => eb.delete(
                            new vscode.Range(
                                editor.document.positionAt(0),
                                editor.document.positionAt(editor.document.getText().length)
                            )
                        ));
                        await editor.document.save();
                    }
                } catch (err) {
                    vscode.window.showErrorMessage(String(err));
                }
            }
        );
    });
    context.subscriptions.push(onSave);

    // Cmd+Shift+R — clean selected text and send to Copilot Chat
    const cleanSelection = vscode.commands.registerCommand(
        'copilotPromptCleaner.cleanPrompt',
        async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) { return; }

            const selection = editor.selection;
            const text = editor.document.getText(selection);
            if (!text) {
                vscode.window.showInformationMessage('Select some text first.');
                return;
            }

            await vscode.window.withProgress(
                { location: vscode.ProgressLocation.Notification, title: 'Cleaning prompt...' },
                async () => {
                    try {
                        const cleaned = await cleanPrompt(text);
                        await sendToChat(cleaned);
                    } catch (err) {
                        vscode.window.showErrorMessage(String(err));
                    }
                }
            );
        }
    );
    context.subscriptions.push(cleanSelection);
}

export function deactivate() {}