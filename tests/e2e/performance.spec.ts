import { test, expect } from '@playwright/test';

/**
 * TASK-042: Test perceived frame rate and smoothness at 60fps target
 * TASK-052: Verify consistent 60 FPS performance across all scenarios
 */
test.describe('Performance Tests - 60 FPS', () => {
  test('maintains baseline 60 FPS with no detection (idle state)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Inject FPS counter
    await page.evaluate(() => {
      (window as any).fpsData = [];
      let lastTime = performance.now();
      
      function measureFPS() {
        const now = performance.now();
        const delta = now - lastTime;
        const fps = 1000 / delta;
        (window as any).fpsData.push(fps);
        lastTime = now;
        
        // Measure for 3 seconds (180 frames at 60fps)
        if ((window as any).fpsData.length < 180) {
          requestAnimationFrame(measureFPS);
        }
      }
      
      requestAnimationFrame(measureFPS);
    });
    
    // Wait for measurement to complete
    await page.waitForTimeout(3500);
    
    // Get average FPS
    const avgFPS = await page.evaluate(() => {
      const data = (window as any).fpsData;
      return data.reduce((a: number, b: number) => a + b, 0) / data.length;
    });
    
    console.log(`Average FPS (idle): ${avgFPS.toFixed(2)}`);
    
    // Should maintain 60 FPS when idle
    expect(avgFPS).toBeGreaterThanOrEqual(58); // Allow 2fps variance
  });

  test('frame time consistently under 16.67ms', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Measure frame times
    const frameTimes = await page.evaluate(() => {
      return new Promise<number[]>((resolve) => {
        const times: number[] = [];
        let lastTime = performance.now();
        
        function measureFrameTime() {
          const now = performance.now();
          const delta = now - lastTime;
          times.push(delta);
          lastTime = now;
          
          if (times.length < 180) { // 3 seconds
            requestAnimationFrame(measureFrameTime);
          } else {
            resolve(times);
          }
        }
        
        requestAnimationFrame(measureFrameTime);
      });
    });
    
    const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
    const maxFrameTime = Math.max(...frameTimes);
    
    console.log(`Average frame time: ${avgFrameTime.toFixed(2)}ms`);
    console.log(`Max frame time: ${maxFrameTime.toFixed(2)}ms`);
    
    // Average should be under 16.67ms (60fps budget)
    expect(avgFrameTime).toBeLessThan(16.67);
    
    // Max frame time should not exceed 33ms (would drop to 30fps)
    expect(maxFrameTime).toBeLessThan(33);
  });

  test('no memory leaks during 60-second session', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      const perf = performance as any;
      if (perf.memory) {
        return perf.memory.usedJSHeapSize;
      }
      return 0;
    });
    
    // Run for 60 seconds
    await page.waitForTimeout(60000);
    
    // Force garbage collection if available
    await page.evaluate(() => {
      if ((window as any).gc) {
        (window as any).gc();
      }
    });
    
    // Get final memory usage
    const finalMemory = await page.evaluate(() => {
      const perf = performance as any;
      if (perf.memory) {
        return perf.memory.usedJSHeapSize;
      }
      return 0;
    });
    
    if (initialMemory > 0 && finalMemory > 0) {
      const memoryGrowth = finalMemory - initialMemory;
      const growthMB = memoryGrowth / (1024 * 1024);
      
      console.log(`Memory growth: ${growthMB.toFixed(2)}MB`);
      
      // Memory growth should be reasonable (< 50MB indicates no major leak)
      expect(growthMB).toBeLessThan(50);
    } else {
      console.log('Memory API not available, skipping memory test');
    }
  });
});
