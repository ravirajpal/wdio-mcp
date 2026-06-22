import { z } from 'zod';
import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ToolDefinition } from '../types/tool';
import { getBrowser } from '../session/state';

export const runScriptToolDefinition: ToolDefinition = {
  name: 'run_wdio_script',
  description:
        'Execute an async block of Node.js code against the active WebdriverIO session. ' +
        '`browser` is in scope — use browser.$(), browser.url(), etc. directly. ' +
        'Always return { status, currentScreen }.',
  inputSchema: {
    script: z.string().describe('Async script body. `browser` is available. Must return an object.'),
  },
};

export const runScriptTool: ToolCallback = async ({ script }: { script: string }) => {
  try {
    const browser = getBrowser();
    const fn = new Function('browser', `return (async () => { ${script} })()`);
    const result = await fn(browser);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result ?? { status: 'ok' }) }],
    };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return {
      isError: true as const,
      content: [{ type: 'text' as const, text: `Script failed: ${message}` }],
    };
  }
};