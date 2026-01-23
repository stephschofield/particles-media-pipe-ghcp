# Playwright MCP Server Setup Guide

## Overview

This document explains how to configure the Playwright MCP server for the tester agent to enable browser automation without local Playwright installation.

## Prerequisites

- MCP server environment configured
- Access to Playwright MCP server endpoint

## Configuration Steps

### 1. MCP Settings Configuration

Add the Playwright MCP server to your MCP settings file (`.mcp/settings.json` or equivalent):

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-playwright"
      ],
      "env": {
        "PLAYWRIGHT_BROWSERS_PATH": "~/.cache/ms-playwright"
      }
    }
  }
}
```

### 2. Install Playwright MCP Server

```bash
# Install the MCP server globally or in project
npm install -g @modelcontextprotocol/server-playwright

# Install Playwright browsers
npx playwright install chromium
```

### 3. Enable in Tester Agent

Edit `.github/agents/tester.agent.md`:

```yaml
tools:
  - codebase
  - readFile
  # ... other tools ...
  - mcp_playwright  # Uncomment this line
```

### 4. Verify Connection

Test that the agent can access Playwright MCP:

```typescript
// Ask tester agent to run this verification
const result = await mcp_playwright.ping();
console.log('Playwright MCP Status:', result);
```

## Available MCP Commands

The Playwright MCP server provides these capabilities:

### Navigation
- `playwright.goto(url)` - Navigate to URL
- `playwright.goBack()` - Browser back
- `playwright.goForward()` - Browser forward
- `playwright.reload()` - Reload page

### Interactions
- `playwright.click(selector)` - Click element
- `playwright.fill(selector, value)` - Fill input
- `playwright.press(key)` - Press keyboard key
- `playwright.type(selector, text)` - Type text

### Assertions
- `playwright.isVisible(selector)` - Check visibility
- `playwright.getText(selector)` - Get element text
- `playwright.getAttribute(selector, name)` - Get attribute

### Capture
- `playwright.screenshot(options)` - Take screenshot
- `playwright.pdf(options)` - Generate PDF
- `playwright.video()` - Record video

### Performance
- `playwright.metrics()` - Get performance metrics
- `playwright.coverage()` - Get code coverage
- `playwright.trace()` - Record trace

### Accessibility
- `playwright.accessibility()` - Get accessibility tree
- `playwright.axe()` - Run axe-core audit

## Usage in Test Tasks

### Example: TASK-042 (60 FPS Performance)

```markdown
## Test Implementation with Playwright MCP

1. Start dev server: `npm run dev`
2. Agent uses MCP to:
   ```javascript
   await playwright.goto('http://localhost:3000');
   
   // Inject FPS counter
   await playwright.evaluate(() => {
     let frameCount = 0;
     let lastTime = performance.now();
     const fpsData = [];
     
     function measureFPS() {
       const now = performance.now();
       const delta = now - lastTime;
       const fps = 1000 / delta;
       fpsData.push(fps);
       frameCount++;
       lastTime = now;
       
       if (frameCount < 3600) { // 60 seconds at 60fps
         requestAnimationFrame(measureFPS);
       } else {
         console.log('Average FPS:', 
           fpsData.reduce((a,b) => a+b) / fpsData.length
         );
       }
     }
     requestAnimationFrame(measureFPS);
   });
   
   // Wait for test completion
   await playwright.waitForTimeout(61000);
   
   // Capture results
   const avgFPS = await playwright.evaluate(() => 
     window.fpsData.reduce((a,b) => a+b) / window.fpsData.length
   );
   
   // Assert
   expect(avgFPS).toBeGreaterThanOrEqual(60);
   ```
```

### Example: TASK-039 (ARIA Labels)

```javascript
// Via MCP: Get accessibility tree
const a11yTree = await playwright.accessibility();

// Check for proper ARIA labels
const buttons = a11yTree.filter(node => node.role === 'button');
buttons.forEach(button => {
  expect(button.name).toBeTruthy(); // Has aria-label or text
});
```

### Example: TASK-026 (Desktop Responsiveness)

```javascript
// Test multiple viewport sizes
const viewports = [
  { width: 1920, height: 1080, name: 'Full HD' },
  { width: 2560, height: 1440, name: '2K' }
];

for (const viewport of viewports) {
  await playwright.setViewportSize(viewport);
  await playwright.screenshot({ 
    path: `screenshot-${viewport.name}.png` 
  });
  
  // Verify layout
  const cameraPreview = await playwright.boundingBox('.camera-preview');
  expect(cameraPreview.x).toBeCloseTo(viewport.width / 2, 50);
}
```

## Fallback Strategy

If Playwright MCP is unavailable, the tester agent will:

1. **Check for local Playwright installation**
   ```bash
   npm list playwright
   ```

2. **Install if missing**
   ```bash
   npm install -D @playwright/test
   npx playwright install
   ```

3. **Run tests via terminal**
   ```bash
   npm run test:e2e
   ```

4. **Parse output for results**

## Troubleshooting

### MCP Connection Failed

```bash
# Check MCP server status
curl http://localhost:3000/mcp/status

# Restart MCP server
mcp restart playwright
```

### Browser Launch Failed

```bash
# Reinstall browsers
npx playwright install --force chromium

# Check permissions
ls -la ~/.cache/ms-playwright
```

### Performance Issues

- Use `--headed` flag only when debugging
- Enable `--trace` only for failed tests
- Disable video recording for fast tests

## Security Considerations

- Playwright MCP server runs with browser access
- Limit network access in CI/CD environments
- Sanitize inputs passed to `evaluate()`
- Use Content Security Policy for test pages

## CI/CD Integration

```yaml
# .github/workflows/test.yml
- name: Setup Playwright MCP
  run: |
    npm install -g @modelcontextprotocol/server-playwright
    npx playwright install chromium --with-deps

- name: Run E2E Tests via MCP
  run: npm run test:e2e
  env:
    MCP_PLAYWRIGHT_ENABLED: true
```

## Cost Optimization

- Use headless mode by default (faster, cheaper)
- Run visual tests only on critical paths
- Cache browser binaries in CI
- Parallelize tests across agents

## Resources

- [Playwright MCP Documentation](https://github.com/modelcontextprotocol/servers/tree/main/src/playwright)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [MCP Specification](https://modelcontextprotocol.io/)
