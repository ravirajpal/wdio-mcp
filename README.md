# WebDriverIO MCP Server

> Extended fork of [webdriverio/mcp](https://github.com/webdriverio/mcp) with LambdaTest support, BrowserStack integration, planner tools, and session recording.

A Model Context Protocol (MCP) server that enables AI assistants to interact with web browsers and mobile applications using WebDriverIO. Automate Chrome, Firefox, Edge, and Safari browsers plus iOS and Android apps — all through a unified interface.

## Installation

Install from npm:

```bash
npx @ravirajpal/wdio-lt-mcp
```

Or install directly from GitHub:

```bash
npx github:ravirajpal/wdio-mcp
```

> If you publish under the new npm package name, replace the GitHub install with `npx @ravirajpal/wdio-lt-mcp`.

Add the following configuration to your MCP client settings:

<details>
<summary>Claude Desktop</summary>

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS), `%APPDATA%\Claude\claude_desktop_config.json` (Windows), or `~/.config/Claude/claude_desktop_config.json` (Linux):

```json
{
  "mcpServers": {
    "wdio-mcp": {
      "command": "npx",
      "args": ["@ravirajpal/wdio-lt-mcp"]
    }
  }
}
```

</details>

<details>
<summary>VS Code (Copilot)</summary>

```bash
code --add-mcp '{"name":"wdio-mcp","command":"npx","args":["@ravirajpal/wdio-lt-mcp"]}'
```

</details>

<details>
<summary>Cursor</summary>

Go to `Cursor Settings` → `MCP` → `Add new MCP Server`, or create `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "wdio-mcp": {
      "command": "npx",
      "args": ["@ravirajpal/wdio-lt-mcp"]
    }
  }
}
```

</details>

> ⚠️ **Restart Required**: After adding the configuration, fully restart your MCP client to apply the changes.

### HTTP Transport (for non-subprocess clients)

By default the server uses **stdio** (subprocess) transport. For clients that cannot launch subprocesses, enable HTTP transport:

```bash
npx @ravirajpal/wdio-lt-mcp --http --port 3000
```

| Flag | Default | Description |
|---|---|---|
| `--http` | — | Enable HTTP transport mode |
| `--port` | `3000` | Port to listen on |
| `--allowedHosts` | `localhost,127.0.0.1,::1` | Allowed `Host` header values (DNS rebinding protection) |
| `--allowedOrigins` | *(none — browser clients blocked)* | Allowed `Origin` values for CORS. Use `*` to allow all. |

Then point your MCP client at `http://localhost:3000/mcp`.

### Prerequisites For Mobile App Automation

- **Appium Server**: Install globally with `npm install -g appium`
- **Platform Drivers**:
  - iOS: `appium driver install xcuitest` (requires Xcode on macOS)
  - Android: `appium driver install uiautomator2` (requires Android Studio)
- **Devices/Emulators**:
  - iOS Simulator (macOS) or physical device
  - Android Emulator or physical device
- **For iOS Real Devices**: You'll need the device's UDID (Unique Device Identifier)
  - **Find UDID on macOS**: Connect device → Open Finder → Select device → Click device name/model to reveal UDID
  - **Find UDID on Windows**: Connect device → iTunes or Apple Devices app → Click device icon → Click "Serial Number" to reveal UDID
  - **Xcode method**: Window → Devices and Simulators → Select device → UDID shown as "Identifier"

Start the Appium server before using mobile features:

```bash
appium
# Server runs at http://127.0.0.1:4723 by default
```

---

## BrowserStack

Run browser and mobile app tests on [BrowserStack](https://www.browserstack.com/) real devices and browsers without any local setup.

### Prerequisites

Set your credentials as environment variables:

```bash
export BROWSERSTACK_USERNAME=your_username
export BROWSERSTACK_ACCESS_KEY=your_access_key
```

Or add them to your MCP client config:

```json
{
  "mcpServers": {
    "wdio-mcp": {
      "command": "npx",
      "args": ["@ravirajpal/wdio-lt-mcp"],
      "env": {
        "BROWSERSTACK_USERNAME": "your_username",
        "BROWSERSTACK_ACCESS_KEY": "your_access_key"
      }
    }
  }
}
```

### Browser Sessions

```javascript
start_session({
    provider: 'browserstack',
    platform: 'browser',
    browser: 'chrome',           // chrome | firefox | edge | safari
    browserVersion: 'latest',
    os: 'Windows',
    osVersion: '11',
    reporting: {
        project: 'My Project',
        build: 'v1.2.0',
        session: 'Login flow'
    }
})
```

### Mobile App Sessions

Upload your app first (or use an existing `bs://` URL):

```javascript
// Upload a local .apk or .ipa (returns a bs:// URL)
upload_app({path: '/path/to/app.apk'})

// Start a session with the returned URL
start_session({
    provider: 'browserstack',
    platform: 'android',
    app: 'bs://abc123...',
    deviceName: 'Samsung Galaxy S23',
    platformVersion: '13.0',
    reporting: {
        project: 'My Project',
        build: 'v1.2.0',
        session: 'Checkout flow'
    }
})
```

Use `list_apps` to see previously uploaded apps:

```javascript
list_apps()
list_apps({sortBy: 'app_name'})
list_apps({organizationWide: true})
```

### BrowserStack Local

To test against URLs only accessible on your local machine or internal network:

```javascript
start_session({
    provider: 'browserstack',
    platform: 'browser',
    browser: 'chrome',
    browserstackLocal: true      // starts tunnel automatically
})
```

### Reporting Labels

| Field | Description |
|---|---|
| `reporting.project` | Group sessions under a project name |
| `reporting.build` | Tag sessions with a build/version label |
| `reporting.session` | Name for the individual test session |

### BrowserStack Tools

| Tool | Description |
|---|---|
| `upload_app` | Upload a local `.apk` or `.ipa` to BrowserStack; returns a `bs://` URL |
| `list_apps` | List apps previously uploaded to your BrowserStack account |

---

## LambdaTest

Run mobile app tests on [LambdaTest](https://www.lambdatest.com/) real devices. This is an extension added in this fork — not available in the upstream `webdriverio/mcp`.

### Prerequisites

Set your credentials as environment variables:

```bash
export LT_USERNAME=your_username
export LT_ACCESS_KEY=your_access_key
```

Or add them to your MCP client config:

```json
{
  "mcpServers": {
    "wdio-mcp": {
      "command": "npx",
      "args": ["@ravirajpal/wdio-lt-mcp"],
      "env": {
        "LT_USERNAME": "your_username",
        "LT_ACCESS_KEY": "your_access_key"
      }
    }
  }
}
```

### Mobile App Sessions

Upload your app first (or use an existing `lt://` URL):

```javascript
// Upload a local .apk or .ipa (returns a lt:// URL)
upload_lt_app({path: '/path/to/app.apk'})

// Optionally give it a display name
upload_lt_app({path: '/path/to/app.apk', name: 'My App'})

// Start a session with the returned URL
start_session({
    provider: 'lambdatest',
    platform: 'android',         // android | ios
    app: 'lt://abc123...',
    deviceName: 'Galaxy S23',
    platformVersion: '13',
    reporting: {
        project: 'My Project',
        build: 'v1.2.0',
        session: 'Checkout flow'
    }
})
```

Use `list_lt_apps` to see previously uploaded apps:

```javascript
list_lt_apps()
list_lt_apps({sortBy: 'app_name'})    // or 'uploaded_at' (default)
```

### Image Injection

Inject a media file into the real device camera stream — useful for testing QR scanning, document capture, and photo upload flows:

```javascript
lt_inject_image({
    mediaUrl: 'https://example.com/sample-qr.png'
})
```

> Note: `enableImageInjection` is enabled by default in all LambdaTest sessions started via this server.

### Reporting Labels

| Field | Description |
|---|---|
| `reporting.project` | Group sessions under a project name |
| `reporting.build` | Tag sessions with a build/version label |
| `reporting.session` | Name for the individual test session |

### LambdaTest Tools

| Tool | Description |
|---|---|
| `upload_lt_app` | Upload a local `.apk` or `.ipa` to LambdaTest; returns a `lt://` URL |
| `list_lt_apps` | List apps previously uploaded to your LambdaTest account |
| `lt_inject_image` | Inject an image or video into the real device camera stream |

---

## Features

### Browser Automation

- **Session Management**: Start and close browser sessions (Chrome, Firefox, Edge, Safari) with headless/headed modes
- **Navigation & Interaction**: Navigate URLs, click elements, fill forms, and retrieve content
- **Page Analysis**: Get visible elements, accessibility trees, take screenshots
- **Cookie Management**: Get, set, and delete cookies
- **Scrolling**: Smooth scrolling with configurable distances
- **Attach to running Chrome**: Connect to an existing Chrome window via `--remote-debugging-port`
- **Device emulation**: Apply mobile/tablet presets (iPhone 15, Pixel 7, etc.) to simulate responsive layouts without a physical device
- **Session Recording**: All tool calls are automatically recorded and exportable as runnable WebdriverIO JS

### Mobile App Automation (iOS/Android)

- **Native App Testing**: Test iOS (.app/.ipa) and Android (.apk) apps via Appium
- **Touch Gestures**: Tap, swipe, long-press, drag-and-drop
- **App Lifecycle**: Launch, background, terminate, check app state
- **Context Switching**: Seamlessly switch between native and webview contexts for hybrid apps
- **Device Control**: Rotate, lock/unlock, geolocation, keyboard control, notifications
- **Cross-Platform Selectors**: Accessibility IDs, XPath, UiAutomator (Android), Predicates (iOS)

---

## Available Tools

### Session Management

| Tool | Description |
|---|---|
| `start_session` | Start a browser or app session. Use `platform: 'browser'` for web, `platform: 'ios'`/`'android'` for mobile, or `attach: true` to connect to a running Chrome instance |
| `launch_chrome` | Launch a new Chrome instance with remote debugging enabled |
| `close_session` | Close or detach from the current session (supports `detach: true`) |
| `emulate_device` | Emulate a mobile/tablet device preset; requires BiDi session |

### Navigation & Page Interaction (Web & Mobile)

| Tool | Description |
|---|---|
| `navigate` | Navigate to a URL |
| `get_elements` | Get visible, interactable elements on the page |
| `get_accessibility_tree` | Get the page accessibility tree with roles, names, and selectors. Browser-only. |
| `get_screenshot` | Take a screenshot (base64-encoded, auto-resized to max 2000px / 1MB) |
| `get_tabs` | List all open browser tabs. Browser-only. |
| `scroll` | Scroll in a direction (up/down) by specified pixels. Browser-only. |
| `execute_script` | Execute arbitrary JavaScript in the browser, or Appium mobile commands on devices |
| `run_wdio_script` | Execute an async Node.js block against the active WebdriverIO session. `browser` is in scope — use `browser.$()`, `browser.url()`, etc. directly. Must return `{ status, currentScreen }`. |
| `switch_tab` | Switch to a different browser tab. Browser-only. |
| `switch_frame` | Switch into an iframe by selector, or back to top-level frame. Browser-only. |

### Element Interaction (Web & Mobile)

| Tool | Description |
|---|---|
| `click_element` | Click an element |
| `set_value` | Type text into input fields |

### Cookie Management (Web)

| Tool | Description |
|---|---|
| `get_cookies` | Get all cookies, or a single cookie by name |
| `set_cookie` | Set a cookie with name, value, and optional attributes |
| `delete_cookies` | Delete all cookies or a specific cookie |

### Mobile Gestures (iOS/Android)

| Tool | Description |
|---|---|
| `tap_element` | Tap an element by selector or coordinates |
| `swipe` | Swipe in a direction (up/down/left/right) |
| `drag_and_drop` | Drag from one location to another |

### Context Switching (Hybrid Apps)

| Tool | Description |
|---|---|
| `get_contexts` | List available automation contexts (NATIVE_APP, WEBVIEW_*) |
| `switch_context` | Switch between native and webview contexts |

### Device Control (iOS/Android)

| Tool | Description |
|---|---|
| `get_app_state` | Get the current lifecycle state of a mobile app |
| `rotate_device` | Rotate to portrait or landscape |
| `hide_keyboard` | Hide on-screen keyboard |
| `set_geolocation` | Set device GPS location |

### Planner Tools

| Tool | Description |
|---|---|
| `write_plan` | Save a markdown plan after exploring the app to `.wdio-mcp/plans` |
| `read_plan` | Load the latest saved plan; generator agents call this first before writing code |
| `confirm_plan` | Confirm which plan file will be used without loading full content |

The planner tools support Explorer/Generator workflows by persisting a human-readable, LLM-friendly test plan between sessions. Use `write_plan` after exploration, then `confirm_plan` and `read_plan` before generation.

### BrowserStack Tools

| Tool | Description |
|---|---|
| `upload_app` | Upload a local `.apk` or `.ipa` to BrowserStack; returns a `bs://` URL |
| `list_apps` | List apps previously uploaded to your BrowserStack account |

### LambdaTest Tools

| Tool | Description |
|---|---|
| `upload_lt_app` | Upload a local `.apk` or `.ipa` to LambdaTest; returns a `lt://` URL |
| `list_lt_apps` | List apps previously uploaded to your LambdaTest account |
| `lt_inject_image` | Inject an image or video into the real device camera stream |

### MCP Resources (read-only, no tool call needed)

| Resource | Description |
|---|---|
| `wdio://sessions` | Index of all recorded sessions |
| `wdio://session/current/steps` | Step log for the active session |
| `wdio://session/current/code` | Generated runnable WebdriverIO JS for the active session |
| `wdio://session/{id}/steps` | Step log for any past session by ID |
| `wdio://session/{id}/code` | Generated JS for any past session by ID |
| `wdio://session/current/elements` | Interactable elements (viewport-only by default) |
| `wdio://session/current/accessibility` | Accessibility tree |
| `wdio://session/current/screenshot` | Screenshot (base64) |
| `wdio://session/current/cookies` | Browser cookies |
| `wdio://session/current/tabs` | Open browser tabs |
| `wdio://session/current/contexts` | Native/webview contexts (mobile) |
| `wdio://session/current/context` | Currently active context (mobile) |
| `wdio://session/current/app-state/{bundleId}` | Mobile app lifecycle state for a given bundle ID |
| `wdio://session/current/geolocation` | Device geolocation |
| `wdio://session/current/capabilities` | Resolved WebDriver capabilities for the active session |
| `wdio://browserstack/local-binary` | BrowserStack Local binary download URL and start command |

---

## Usage Examples

### Browser Automation

```javascript
// Default (headed Chrome, 1280x1080)
start_session({platform: 'browser'})

// Firefox
start_session({platform: 'browser', browser: 'firefox'})

// Headless
start_session({platform: 'browser', headless: true})

// Custom dimensions
start_session({platform: 'browser', windowWidth: 1920, windowHeight: 1080})

// Custom capabilities (e.g. Chrome extensions)
start_session({
    platform: 'browser',
    capabilities: {
        'goog:chromeOptions': {
            args: ['--load-extension=/path/to/unpacked-extension']
        }
    }
})
```

**Attach to a running Chrome instance:**

```javascript
start_session({attach: true})
start_session({attach: true, port: 9222, navigationUrl: 'https://app.example.com'})
```

**Device emulation (requires BiDi session):**

```javascript
start_session({capabilities: {webSocketUrl: true}})
emulate_device()                         // list available presets
emulate_device({device: 'iPhone 15'})
emulate_device({device: 'reset'})        // restore desktop defaults
```

### Mobile App Automation

**iOS simulator:**

```
Test my iOS app located at /path/to/MyApp.app on iPhone 15 Pro simulator:
1. Start the app session
2. Tap the login button
3. Enter "testuser" in the username field
4. Take a screenshot of the home screen
5. Close the session
```

**Android emulator:**

```
Test my Android app /path/to/app.apk on the Pixel_6_API_34 emulator:
1. Start the app with auto-grant permissions
2. Get visible elements
3. Swipe up to scroll
4. Tap on the "Settings" button
5. Verify the settings screen is displayed
```

**iOS real device:**

```javascript
start_session({
    platform: 'ios',
    appPath: '/path/to/MyApp.ipa',
    deviceName: 'My iPhone',
    udid: '00008030-001234567890ABCD',
    platformVersion: '17.0'
})
```

**Preserve app state between sessions:**

```javascript
start_session({
    platform: 'android',
    appPath: '/path/to/app.apk',
    deviceName: 'emulator-5554',
    noReset: true,
    fullReset: false,
    autoGrantPermissions: true
})
```

**Hybrid app (context switching):**

```javascript
// Start native session, then switch to webview
get_contexts()
switch_context({context: 'WEBVIEW_com.example.app'})
// ... interact with web content ...
switch_context({context: 'NATIVE_APP'})
```

---

## Advanced Features

### App State Preservation

| noReset | fullReset | Behavior |
|---|---|---|
| `true` | `false` | Preserve state: app stays installed, data preserved |
| `false` | `false` | Clear app data but keep app installed (default) |
| `false` | `true` | Full reset: uninstall and reinstall app |

Use `close_session({detach: true})` to disconnect without terminating the session on the Appium server. Sessions created with `noReset: true` or without `appPath` automatically detach on close.

### Smart Element Detection

- **Platform-specific classification**: Automatically identifies interactable elements vs layout containers
  - Android: Button, EditText, CheckBox vs ViewGroup, FrameLayout, ScrollView
  - iOS: Button, TextField, Switch vs View, StackView, CollectionView
- **Multiple locator strategies**: Each element provides accessibility ID, resource ID, text, XPath, and platform-specific selectors
- **Viewport filtering**: Control whether to get only visible elements or all elements including off-screen (`inViewportOnly`)
- **Layout debugging**: Optionally include container elements (`includeContainers: true`)

### Automatic Permission & Alert Handling

- `autoGrantPermissions` (default: `true`): Automatically grants app permissions (camera, location, etc.)
- `autoAcceptAlerts` (default: `true`): Automatically accepts system alerts and dialogs
- `autoDismissAlerts` (optional): Set to `true` to dismiss alerts instead of accepting them

### Session Recording & Code Export

Every tool call is automatically recorded. Export runnable WebdriverIO JS via MCP resources:

- `wdio://session/current/code` — generated script for the active session
- `wdio://session/{sessionId}/code` — generated script for any past session

The generated script reconstructs the full session as a standalone `import { remote } from 'webdriverio'` file. For BrowserStack sessions it includes a full try/catch/finally with automatic session result marking.

---

## Selector Syntax Quick Reference

**Web (CSS/XPath):**

- CSS: `button.my-class`, `#element-id`
- XPath: `//button[@class='my-class']`
- Text: `button=Exact text`, `a*=Contains text`

**Mobile (Cross-Platform):**

- Accessibility ID: `~loginButton` (works on both iOS and Android)
- Android UiAutomator: `android=new UiSelector().text("Login")`
- iOS Predicate: `-ios predicate string:label == "Login" AND visible == 1`
- XPath: `//android.widget.Button[@text="Login"]`

---

## Technical Details

- **Built with:** TypeScript, WebDriverIO, Appium
- **Browser Support:** Chrome, Firefox, Edge (headed/headless), Safari (headed only; macOS)
- **Mobile Support:** iOS (XCUITest) and Android (UiAutomator2/Espresso)
- **Cloud Providers:** BrowserStack, LambdaTest
- **Protocol:** Model Context Protocol (MCP)
- **Session Model:** Single active session (browser or mobile app)
- **Data Format:** TOON (Token-Oriented Object Notation) for efficient LLM communication
- **Element Detection:** XML-based page source parsing with intelligent filtering and multi-strategy locator generation

---

## Troubleshooting

**Browser automation not working?**

- Ensure Chrome, Firefox, Edge, or Safari is installed
- Try restarting your MCP client completely
- Check that no other WebDriver instances are running

**Mobile automation not working?**

- Verify Appium server is running: `appium`
- Check device/emulator is running: `adb devices` (Android) or Xcode Devices (iOS)
- Ensure correct platform drivers are installed
- Verify app path is correct and accessible

**LambdaTest / BrowserStack not connecting?**

- Verify `LT_USERNAME` / `LT_ACCESS_KEY` or `BROWSERSTACK_USERNAME` / `BROWSERSTACK_ACCESS_KEY` are set correctly
- Check your account has App Automate access enabled

**Found issues or have suggestions?** Please [open an issue](https://github.com/ravirajpal/wdio-mcp/issues).