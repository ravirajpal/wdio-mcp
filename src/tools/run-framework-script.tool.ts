import { z } from 'zod';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ToolDefinition } from '../types/tool';
import { getBrowser } from '../session/state';

export const runFrameworkScriptToolDefinition: ToolDefinition = {
    name: 'run_framework_script',
    description:
        'Execute a script using your project screen objects and DSL directly. ' +
        'Screen instances from mcp.context.ts are available by name — use them exactly as in tests. ' +
        'Use instead of run_wdio_script when working with framework screen objects. ' +
        'Always return { status, currentScreen }.',
    inputSchema: {
        script: z.string().describe(
            'Async script using screen objects. Screen instances are in scope by name. Must return { status, currentScreen }.'
        ),
    },
};

export const runFrameworkScriptTool: ToolCallback = async ({ script }: { script: string }) => {
    try {
        // 1 — check session
        const browser = getBrowser();
        if (!browser) {
            return {
                isError: true as const,
                content: [{ type: 'text' as const, text: 'No active session. Call start_session first.' }],
            };
        }
        console.log('[run_framework_script] Browser session active');

        // 2 — set globals so $() inside screen constructors resolves correctly
        (global as any).browser = browser;
        (global as any).driver = browser;
        (global as any).$ = browser.$.bind(browser);
        (global as any).$$ = browser.$$.bind(browser);
        console.log('[run_framework_script] Globals set: browser, $, $$');

        // 3 — verify PROJECT_ROOT
        if (!process.env.PROJECT_ROOT) {
            throw new Error('PROJECT_ROOT is not set. Add it to .mcp.json env block.');
        }
        const contextPath = path.join(process.env.PROJECT_ROOT, 'mcp.context.ts');
        console.log('[run_framework_script] Context path:', contextPath);

        // 4 — ESM cache bust via URL timestamp
        // require.cache does not exist in ESM — this is the correct alternative
        // forces fresh import each call so screen singletons reload with current browser globals
        const contextUrl = `${pathToFileURL(contextPath).href}?t=${Date.now()}`;
        console.log('[run_framework_script] Importing:', contextUrl);

        const mod = await import(contextUrl);
        console.log('[run_framework_script] Module exports:', Object.keys(mod));

        // 5 — validate getContext export
        if (!mod.getContext) {
            throw new Error(
                `mcp.context.ts does not export getContext. Found exports: ${Object.keys(mod).join(', ')}`
            );
        }

        const context = mod.getContext();
        console.log('[run_framework_script] Context keys:', Object.keys(context ?? {}));

        if (!context || Object.keys(context).length === 0) {
            throw new Error('getContext() returned empty or null');
        }

        // 6 — build and run script with screen objects injected as named params
        console.log('[run_framework_script] Executing script:', script);
        const fn = new Function(
            ...Object.keys(context),
            'browser',
            `return (async () => { ${script} })()`
        );

        const result = await fn(...Object.values(context), browser);
        console.log('[run_framework_script] Result:', result);

        return {
            content: [{ type: 'text' as const, text: JSON.stringify(result ?? { status: 'ok' }) }],
        };
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        const stack = e instanceof Error ? e.stack : '';
        console.error('[run_framework_script] Error:', message);
        console.error('[run_framework_script] Stack:', stack);
        return {
            isError: true as const,
            content: [{ type: 'text' as const, text: `Script failed: ${message}` }],
        };
    }
};