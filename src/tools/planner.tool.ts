/**
 * src/tools/planner.tool.ts
 * Generic plan read/write tools for Explorer and Generator agents.
 * Drop this file into your src/tools/ directory.
 */

import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import type { ToolDefinition } from '../types/tool';

const PLANS_DIR = path.join(process.env.PROJECT_ROOT ?? process.cwd(), '.wdio-mcp/plans');

// ─── Helpers ───────────────────────────────────────────────────────────────

function getSessionTimestamp(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 5).replace(':', '');
  return `${date}_${time}`;
}

function getLatestPlanFile(): string | null {
  if (!fs.existsSync(PLANS_DIR)) return null;
  const files = fs.readdirSync(PLANS_DIR)
    .filter(f => f.startsWith('plan_') && f.endsWith('.plan.md'))
    .sort()
    .reverse();
  return files.length > 0 ? path.join(PLANS_DIR, files[0]) : null;
}

// ─── write_plan ────────────────────────────────────────────────────────────

export const writePlanToolDefinition: ToolDefinition = {
  name: 'write_plan',
  description: 'Save the test plan after exploring the app. Pass the full markdown plan as content. Explorer calls this at the end of exploration.',
  inputSchema: {
    content: z.string().describe('Full plan content in markdown. Explorer decides the structure.'),
  },
};

export async function writePlanTool({ content }: { content: string }) {
  const session = getSessionTimestamp();
  const planFile = path.join(PLANS_DIR, `plan_${session}.plan.md`);
  fs.mkdirSync(PLANS_DIR, { recursive: true });
  fs.writeFileSync(planFile, content, 'utf-8');

  return {
    content: [{
      type: 'text' as const,
      text: `✅ Plan saved: ${planFile}`,
    }],
  };
}

// ─── read_plan ─────────────────────────────────────────────────────────────

export const readPlanToolDefinition: ToolDefinition = {
  name: 'read_plan',
  description: 'Load the latest test plan. Generator always calls this first before writing any code.',
  inputSchema: {},
};

export async function readPlanTool() {
  const planFile = getLatestPlanFile();

  if (!planFile) {
    return {
      content: [{
        type: 'text' as const,
        text: `❌ No plan file found in ${PLANS_DIR}. Run Explorer first.`,
      }],
    };
  }

  const content = fs.readFileSync(planFile, 'utf-8');
  return {
    content: [{
      type: 'text' as const,
      text: `📄 Plan: ${planFile}\n\n${content}`,
    }],
  };
}

// ─── confirm_plan ──────────────────────────────────────────────────────────

export const confirmPlanToolDefinition: ToolDefinition = {
  name: 'confirm_plan',
  description: 'Check which plan file will be used without loading full content. Useful before generation.',
  inputSchema: {},
};

export async function confirmPlanTool() {
  const planFile = getLatestPlanFile();

  if (!planFile) {
    return {
      content: [{
        type: 'text' as const,
        text: `❌ No plan found in ${PLANS_DIR}. Run Explorer first.`,
      }],
    };
  }

  const stat = fs.statSync(planFile);
  return {
    content: [{
      type: 'text' as const,
      text: `📋 Latest plan: ${planFile}\n🕐 Created: ${stat.mtime.toLocaleString()}`,
    }],
  };
}