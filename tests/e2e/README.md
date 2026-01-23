# Playwright E2E Tests

## Running Tests

```bash
# Run all tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug

# View test report
npm run test:report
```

## Test Suites

### Basic Tests (`basic.spec.ts`)
- Homepage loads
- Pure black background verification
- Keyboard accessibility

### Performance Tests (`performance.spec.ts`)
Covers TASK-042 and TASK-052:
- ✅ Baseline 60 FPS (idle state)
- ✅ Frame time under 16.67ms
- ✅ Memory leak detection (60-second session)

### Accessibility Tests (`accessibility.spec.ts`)
Covers TASK-039, TASK-040, TASK-041, TASK-051:
- ✅ WCAG 2.1 AA compliance (axe-core)
- ✅ Keyboard navigation
- ✅ Focus indicators
- ✅ ARIA labels
- ✅ Color contrast
- ✅ Reduced motion support

## Test Configuration

Configuration is in `playwright.config.ts`:

### Browsers Tested
- Desktop Chrome (Chromium)
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 13)
- Desktop 1920×1080
- Desktop 2560×1440

### Features
- Automatic dev server startup
- Screenshot on failure
- Video recording on failure
- Trace collection on retry
- HTML report generation

## Adding New Tests

Create new test files in `tests/e2e/`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('My Feature', () => {
  test('does something', async ({ page }) => {
    await page.goto('/');
    // Your test code
  });
});
```

## CI/CD Integration

Add to `.github/workflows/test.yml`:

```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright Browsers
  run: npx playwright install --with-deps chromium

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```
