import { existsSync, createReadStream } from 'node:fs';
import { z } from 'zod';
import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ToolDefinition } from '../types/tool';

const LT_API = 'https://manual-api.lambdatest.com';

function getAuth(): string | null {
  const user = process.env.LT_USERNAME;
  const key = process.env.LT_ACCESS_KEY;
  if (!user || !key) return null;
  return Buffer.from(`${user}:${key}`).toString('base64');
}

export interface LambdaTestApp {
  app_id: string;
  app_url: string;
  app_name: string;
  app_version: string;
  uploaded_at: string;
}

function formatAppList(apps: LambdaTestApp[]): string {
  if (apps.length === 0) return 'No apps found.';
  return apps.map((a) =>
    `${a.app_name} v${a.app_version} — ${a.app_url} (${a.uploaded_at})`
  ).join('\n');
}

// ─── list_apps ────────────────────────────────────────────────────────────────

export const listLTAppsToolDefinition: ToolDefinition = {
  name: 'list_lt_apps',
  description: 'List apps uploaded to LambdaTest App Automate. Reads LT_USERNAME and LT_ACCESS_KEY from environment.',
  annotations: { title: 'List LambdaTest Apps', readOnlyHint: true, idempotentHint: true },
  inputSchema: {
    sortBy: z.enum(['app_name', 'uploaded_at']).optional().default('uploaded_at').describe('Sort order for results'),
  },
};

export const listLTAppsTool: ToolCallback = async ({ sortBy = 'uploaded_at' }: { sortBy?: 'app_name' | 'uploaded_at' }) => {
  const auth = getAuth();
  if (!auth) {
    return {
      isError: true as const,
      content: [{ type: 'text' as const, text: 'Missing credentials: set LT_USERNAME and LT_ACCESS_KEY environment variables.' }],
    };
  }

  try {
    const res = await fetch(`${LT_API}/app/upload/realDevice`, {
      headers: { Authorization: `Basic ${auth}` },
    });

    if (!res.ok) {
      const body = await res.text();
      return {
        isError: true as const,
        content: [{ type: 'text' as const, text: `LambdaTest API error ${res.status}: ${body}` }],
      };
    }

    const raw = await res.json() as { data?: LambdaTestApp[] };
    let apps: LambdaTestApp[] = Array.isArray(raw?.data) ? raw.data : [];

    apps = sortBy === 'app_name'
      ? apps.sort((a, b) => a.app_name.localeCompare(b.app_name))
      : apps.sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());

    return { content: [{ type: 'text' as const, text: formatAppList(apps) }] };
  } catch (e) {
    return { isError: true as const, content: [{ type: 'text' as const, text: `Error listing apps: ${e}` }] };
  }
};

// ─── upload_app ───────────────────────────────────────────────────────────────

export const uploadLTAppToolDefinition: ToolDefinition = {
  name: 'upload_lt_app',
  description: 'Upload a local .apk or .ipa to LambdaTest App Automate. Returns a lt:// URL for use in start_session with provider: "lambdatest".',
  annotations: { title: 'Upload App to LambdaTest', destructiveHint: false },
  inputSchema: {
    path: z.string().describe('Absolute path to the .apk or .ipa file'),
    name: z.string().optional().describe('Optional display name for the app'),
  },
};

export const uploadLTAppTool: ToolCallback = async ({ path, name }: { path: string; name?: string }) => {
  const auth = getAuth();
  if (!auth) {
    return {
      isError: true as const,
      content: [{ type: 'text' as const, text: 'Missing credentials: set LT_USERNAME and LT_ACCESS_KEY environment variables.' }],
    };
  }

  if (!existsSync(path)) {
    return {
      isError: true as const,
      content: [{ type: 'text' as const, text: `File not found: ${path}` }],
    };
  }

  try {
    const form = new FormData();
    const stream = createReadStream(path);
    const fileName = name ?? (path.split('/').pop() ?? 'app');
    form.append('appFile', new Blob([stream as unknown as BlobPart]), fileName);
    if (name) form.append('name', name);

    const res = await fetch(`${LT_API}/app/upload/realDevice`, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}` },
      body: form,
    });

    if (!res.ok) {
      const body = await res.text();
      return {
        isError: true as const,
        content: [{ type: 'text' as const, text: `Upload failed ${res.status}: ${body}` }],
      };
    }

    const data = await res.json() as { app_url: string; app_id: string };
    return {
      content: [{
        type: 'text' as const,
        text: `Upload successful.\nApp URL: ${data.app_url}\nApp ID: ${data.app_id}\n\nUse this URL as the "app" parameter in start_session with provider: "lambdatest".`,
      }],
    };
  } catch (e) {
    return { isError: true as const, content: [{ type: 'text' as const, text: `Error uploading app: ${e}` }] };
  }
};
