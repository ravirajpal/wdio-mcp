import type { ConnectionConfig, SessionProvider, SessionResult } from '../types';

export class LambdaTestProvider implements SessionProvider {
  name = 'lambdatest';

  getConnectionConfig(_options: Record<string, unknown>): ConnectionConfig {
    return {
      protocol: 'https',
      hostname: 'mobile-hub.lambdatest.com',
      port: 443,
      path: '/wd/hub',
      user: process.env.LT_USERNAME,
      key: process.env.LT_ACCESS_KEY,
    };
  }

  buildCapabilities(options: Record<string, unknown>): Record<string, unknown> {
    const platform = options.platform as string;
    const userCapabilities = (options.capabilities as Record<string, unknown> | undefined) ?? {};
    const reporting = options.reporting as { project?: string; build?: string; session?: string } | undefined;
    const uploadMedia = options.uploadMedia as string[] | undefined;

    const ltOptions: Record<string, unknown> = {
      w3c: true,
      username: process.env.LT_USERNAME,
      accessKey: process.env.LT_ACCESS_KEY,
      isRealMobile: true,
      acceptInsecureCerts: true,
    };

    if (reporting?.project) ltOptions.project = reporting.project;
    if (reporting?.build) ltOptions.build = reporting.build;
    if (reporting?.session) ltOptions.name = reporting.session;
    if (uploadMedia && uploadMedia.length > 0) ltOptions.uploadMedia = uploadMedia;

    if (platform === 'android') {
      ltOptions.platformName = 'android';
      if (options.deviceName) ltOptions.deviceName = options.deviceName;
      if (options.platformVersion) ltOptions.platformVersion = options.platformVersion;
      ltOptions.automationName = (options.automationName as string | undefined) ?? 'UiAutomator2';
      ltOptions.enableImageInjection = true;
      ltOptions.enableBiometricsAuthentication = true;
      if (options.autoGrantPermissions !== false) ltOptions.autoGrantPermissions = true;

      return {
        platformName: 'android',
        'appium:app': options.app,
        'appium:newCommandTimeout': (options.newCommandTimeout as number | undefined) ?? 300,
        'LT:options': ltOptions,
        ...userCapabilities,
      };
    }

    // iOS
    ltOptions.platformName = 'ios';
    if (options.deviceName) ltOptions.deviceName = options.deviceName;
    if (options.platformVersion) ltOptions.platformVersion = options.platformVersion;
    ltOptions.enableImageInjection = true;
    ltOptions.enableBiometricsAuthentication = true;
    ltOptions.autoAcceptAlerts = false;

    return {
      platformName: 'ios',
      'appium:app': options.app,
      'appium:newCommandTimeout': (options.newCommandTimeout as number | undefined) ?? 300,
      'appium:settings': {
        respectSystemAlerts: true,
        fixImageTemplateScale: true,
      },
      'appium:acceptAlertButtonSelector':
        '**/XCUIElementTypeButton[`name == "Allow Once" OR name == "Allow" OR name == "Allow While Using App" OR name == "OK"`]',
      'LT:options': ltOptions,
      ...userCapabilities,
    };
  }

  getSessionType(options: Record<string, unknown>): 'browser' | 'ios' | 'android' {
    return options.platform as 'ios' | 'android';
  }

  shouldAutoDetach(_options: Record<string, unknown>): boolean {
    return false;
  }

  async onSessionClose(
    sessionId: string,
    _sessionType: 'browser' | 'ios' | 'android',
    result: SessionResult,
  ): Promise<void> {
    const user = process.env.LT_USERNAME;
    const key = process.env.LT_ACCESS_KEY;
    if (!user || !key) return;

    const auth = Buffer.from(`${user}:${key}`).toString('base64');
    const statusMap: Record<string, string> = { passed: 'passed', failed: 'failed' };

    try {
      await fetch(`https://api.lambdatest.com/automation/api/v1/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status_ind: statusMap[result.status] ?? 'failed',
          ...(result.reason ? { reason: result.reason } : {}),
        }),
      });
    } catch {
      // Non-fatal — session already ended
    }
  }
}

export const lambdaTestProvider = new LambdaTestProvider();
