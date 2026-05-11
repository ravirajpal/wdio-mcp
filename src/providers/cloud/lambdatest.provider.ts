import type { ConnectionConfig, SessionProvider, SessionResult } from '../types';

export class LambdaTestProvider implements SessionProvider {
  name = 'lambdatest';

  getConnectionConfig(options: Record<string, unknown>): ConnectionConfig {
    const platform = options.platform as string;
    const hostname = 'hub.lambdatest.com';
    return {
      protocol: 'https',
      hostname,
      port: 443,
      path: '/wd/hub',
      user: process.env.LT_USERNAME,
      key: process.env.LT_ACCESS_KEY,
    };
  }

  buildCapabilities(options: Record<string, unknown>): Record<string, unknown> {
    const platform = options.platform as string;
    const userCapabilities = (options.capabilities as Record<string, unknown> | undefined) ?? {};

    if (platform === 'browser') {
      const ltOptions: Record<string, unknown> = {
        platformName: options.os as string | undefined,
      };
      if (options.browserVersion) ltOptions.browserVersion = options.browserVersion;
      if (options.osVersion) ltOptions.osVersion = options.osVersion;

      const reporting = options.reporting as { project?: string; build?: string; session?: string } | undefined;
      if (reporting?.project) ltOptions.projectName = reporting.project;
      if (reporting?.build) ltOptions.buildName = reporting.build;
      if (reporting?.session) ltOptions.sessionName = reporting.session;

      return {
        browserName: (options.browser as string | undefined) ?? 'chrome',
        'lt:options': ltOptions,
        ...userCapabilities,
      };
    }

    // Mobile (ios / android)
    const ltOptions: Record<string, unknown> = {
      platformName: platform,
      deviceName: options.deviceName,
      platformVersion: options.platformVersion,
      isRealMobile: true,
      appiumVersion: '2.0.0',
    };

    const reporting = options.reporting as { project?: string; build?: string; session?: string } | undefined;
    if (reporting?.project) ltOptions.projectName = reporting.project;
    if (reporting?.build) ltOptions.buildName = reporting.build;
    if (reporting?.session) ltOptions.sessionName = reporting.session;

    const autoAcceptAlerts = options.autoAcceptAlerts as boolean | undefined;
    const autoDismissAlerts = options.autoDismissAlerts as boolean | undefined;

    return {
      platformName: platform,
      'appium:app': options.app,
      'appium:autoGrantPermissions': (options.autoGrantPermissions as boolean | undefined) ?? true,
      'appium:autoAcceptAlerts': autoDismissAlerts ? undefined : (autoAcceptAlerts ?? true),
      'appium:autoDismissAlerts': autoDismissAlerts,
      'appium:newCommandTimeout': (options.newCommandTimeout as number | undefined) ?? 300,
      'lt:options': ltOptions,
      ...userCapabilities,
    };
  }

  getSessionType(options: Record<string, unknown>): 'browser' | 'ios' | 'android' {
    const platform = options.platform as string;
    if (platform === 'browser') return 'browser';
    return platform as 'ios' | 'android';
  }

  shouldAutoDetach(_options: Record<string, unknown>): boolean {
    return false;
  }

  async onSessionClose(
    sessionId: string,
    sessionType: 'browser' | 'ios' | 'android',
    result: SessionResult,
    _tunnelHandle?: unknown,
  ): Promise<void> {
    const user = process.env.LT_USERNAME;
    const key = process.env.LT_ACCESS_KEY;
    if (!user || !key) return;

    const baseUrl = 'https://api.lambdatest.com/automation/api/v1/sessions';

    const auth = Buffer.from(`${user}:${key}`).toString('base64');
    const body: Record<string, string> = { status: result.status, ...(result.reason ? { reason: result.reason } : {}) };
    await fetch(`${baseUrl}/${sessionId}`, {
      method: 'PATCH',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }
}

export const lambdaTestProvider = new LambdaTestProvider();
