import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import path from 'path';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log('[Capture] Terminating any existing servers on ports 3000 and 5174...');
  // Force clean ports before start to ensure fresh state
  const cleanCmd = spawn('powershell', [
    '-Command',
    'Get-NetTCPConnection -LocalPort 3000,5174 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }'
  ]);
  await new Promise((resolve) => cleanCmd.on('close', resolve));
  await delay(1000);

  console.log('[Capture] Starting backend Express server...');
  const serverProcess = spawn('npm', ['run', 'server'], { shell: true, stdio: 'ignore' });

  console.log('[Capture] Starting frontend Vite client...');
  const clientProcess = spawn('npm', ['run', 'client'], { shell: true, stdio: 'ignore' });

  await delay(6000);

  console.log('[Capture] Launching Playwright browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });

  const artifactDir = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\1bb20002-76e2-429b-983e-65b0ff91df60';
  const loginPath = path.join(artifactDir, 'screenshot_login.png');
  const wizardPath = path.join(artifactDir, 'screenshot_wizard.png');
  const dashboardPath = path.join(artifactDir, 'screenshot_dashboard.png');

  try {
    console.log('[Capture] Navigating to http://localhost:5174/ ...');
    await page.goto('http://localhost:5174/');
    await page.waitForTimeout(1000);

    console.log(`[Capture] Saving Login screenshot to ${loginPath}`);
    await page.screenshot({ path: loginPath });

    // Login as a new user to capture Onboarding Wizard
    await page.fill('input[placeholder="e.g. name@domain.com"]', 'amit@sharma.com');
    await page.fill('input[placeholder="••••••••"]', 'password');
    await page.click('button:has-text("Sign In to Platform")');
    await page.waitForTimeout(1000);

    console.log(`[Capture] Saving Onboarding Wizard screenshot to ${wizardPath}`);
    await page.screenshot({ path: wizardPath });

    // Transition back to Dashboard by selecting the first seeded profile Rajesh
    await page.goto('http://localhost:5174/');
    await page.waitForTimeout(1000);
    await page.selectOption('select', { label: 'Rajesh Kulkarni (Kurla)' });
    await page.click('button:has-text("Sign In to Platform")');
    await page.waitForTimeout(2000); // Allow weather/news loaders to finish

    console.log(`[Capture] Saving Main Dashboard screenshot to ${dashboardPath}`);
    await page.screenshot({ path: dashboardPath });
  } catch (error) {
    console.error('[Capture] Error during capture:', error);
  } finally {
    await browser.close();
    console.log('[Capture] Terminating background servers...');
    serverProcess.kill('SIGINT');
    clientProcess.kill('SIGINT');
    
    // Final check to make sure ports are free
    const cleanCmdFinal = spawn('powershell', [
      '-Command',
      'Get-NetTCPConnection -LocalPort 3000,5174 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }'
    ]);
    await new Promise((resolve) => cleanCmdFinal.on('close', resolve));
    
    process.exit(0);
  }
}

main();
