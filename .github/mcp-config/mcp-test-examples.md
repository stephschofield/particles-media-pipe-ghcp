# MCP Test Examples for Tester Agent

This document provides MCP-optimized test examples for common testing tasks.

## Example 1: TASK-042 (60 FPS Performance Testing)

```typescript
// Execute via MCP
await mcp_playwright.goto('http://localhost:3000');
await mcp_playwright.waitForLoadState('networkidle');

const testResult = await mcp_playwright.evaluate(`
  (async function() {
    const fpsData = [];
    let lastTime = performance.now();
    let frameCount = 0;
    
    return new Promise(resolve => {
      function measure() {
        const now = performance.now();
        const delta = now - lastTime;
        const fps = 1000 / delta;
        fpsData.push(fps);
        lastTime = now;
        frameCount++;
        
        if (frameCount < 180) { // 3 seconds at 60fps
          requestAnimationFrame(measure);
        } else {
          const avgFPS = fpsData.reduce((a, b) => a + b) / fpsData.length;
          const minFPS = Math.min(...fpsData);
          const maxFPS = Math.max(...fpsData);
          const frameDrops = fpsData.filter(f => f < 58).length;
          
          resolve({
            avgFPS: avgFPS.toFixed(2),
            minFPS: minFPS.toFixed(2),
            maxFPS: maxFPS.toFixed(2),
            frameDrops,
            totalFrames: fpsData.length
          });
        }
      }
      requestAnimationFrame(measure);
    });
  })()
`);

await mcp_playwright.screenshot({ path: 'test-results/task-042-fps.png' });

return {
  task: 'TASK-042',
  status: testResult.avgFPS >= 58 ? 'PASS' : 'FAIL',
  metrics: testResult,
  acceptanceCriteria: {
    'AC #1: 60 FPS maintained': testResult.avgFPS >= 58,
    'AC #2: No frame drops': testResult.frameDrops === 0,
    'AC #3: Frame time <16.67ms': (1000 / testResult.avgFPS) < 16.67
  }
};
```

## Example 2: TASK-039 (ARIA Label Validation)

```typescript
await mcp_playwright.goto('http://localhost:3000');

const ariaValidation = await mcp_playwright.evaluate(`
  {
    const modeToggle = document.querySelector('[data-testid="mode-toggle"]');
    const hideCamera = document.querySelector('[data-testid="hide-camera"]');
    const status = document.querySelector('[data-testid="status-indicator"]');
    
    const allButtons = Array.from(document.querySelectorAll('button'));
    const unlabeled = allButtons.filter(btn => {
      return !btn.getAttribute('aria-label') && 
             !btn.getAttribute('aria-labelledby') &&
             !btn.textContent?.trim();
    });
    
    return {
      modeToggle: {
        found: !!modeToggle,
        ariaLabel: modeToggle?.getAttribute('aria-label')
      },
      hideCamera: {
        found: !!hideCamera,
        ariaLabel: hideCamera?.getAttribute('aria-label')
      },
      status: {
        found: !!status,
        ariaLive: status?.getAttribute('aria-live')
      },
      totalButtons: allButtons.length,
      unlabeledButtons: unlabeled.length
    };
  }
`);

return {
  task: 'TASK-039',
  status: ariaValidation.unlabeledButtons === 0 ? 'PASS' : 'FAIL',
  details: ariaValidation
};
```

## Example 3: TASK-026 (Responsive Layout Testing)

```typescript
const viewports = [
  { width: 1920, height: 1080, name: 'Full HD' },
  { width: 2560, height: 1440, name: '2K' }
];

const results = [];

for (const viewport of viewports) {
  await mcp_playwright.setViewportSize(viewport);
  await mcp_playwright.goto('http://localhost:3000');
  
  const layout = await mcp_playwright.evaluate(`
    {
      const cameraPreview = document.querySelector('.camera-preview');
      const rect = cameraPreview?.getBoundingClientRect();
      
      return {
        isCentered: rect ? Math.abs(
          rect.left + rect.width / 2 - window.innerWidth / 2
        ) < 50 : false,
        width: rect?.width,
        height: rect?.height
      };
    }
  `);
  
  await mcp_playwright.screenshot({ 
    path: `test-results/task-026-${viewport.name}.png` 
  });
  
  results.push({ viewport: viewport.name, layout });
}

return {
  task: 'TASK-026',
  status: results.every(r => r.layout.isCentered) ? 'PASS' : 'FAIL',
  results
};
```

## Template for Any Task

```typescript
async function testTaskViaMCP(taskId) {
  // 1. Navigate
  await mcp_playwright.goto('http://localhost:3000');
  await mcp_playwright.waitForLoadState('networkidle');
  
  // 2. Execute test logic
  const results = await mcp_playwright.evaluate(`
    // Test code based on acceptance criteria
    {
      // Return test results
    }
  `);
  
  // 3. Capture evidence
  await mcp_playwright.screenshot({ 
    path: `test-results/${taskId}.png` 
  });
  
  // 4. Return structured results
  return {
    task: taskId,
    status: 'PASS' | 'FAIL',
    acceptanceCriteria: {},
    evidence: `test-results/${taskId}.png`
  };
}
```
