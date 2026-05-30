import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { env } from "../config/env.js";
import { logInfo } from "../utils/logger.js";

type LoginResult =
  | {
      success: true;
      currentUrl: string;
      title: string;
    }
  | {
      success: false;
      reason: string;
      screenshotPath?: string;
      currentUrl?: string;
      title?: string;
    };

export async function loginToObento(): Promise<LoginResult> {
  await mkdir("screenshots", { recursive: true });

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
  });

  const context = await browser.newContext({
    timezoneId: "Asia/Tokyo",
    locale: "ja-JP",
  });

  const page = await context.newPage();

  try {
    logInfo("Opening target site", {
      targetSiteUrl: env.TARGET_SITE_URL,
    });

    await page.goto(env.TARGET_SITE_URL, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    logInfo("Filling login form");

    await page.locator("#CORPORATION_CD").fill(env.OBENTO_COMPANY_CODE);
    await page.locator('input[name="LOGINID"]').fill(env.OBENTO_USER_ID);
    await page.locator('input[name="PASSWORD"]').fill(env.OBENTO_PASSWORD);

    await page.screenshot({
      path: "screenshots/before-login.png",
      fullPage: true,
    });

    logInfo("Clicking login button");

    await page.getByRole("button", { name: "ログイン" }).click();

    await page.waitForLoadState("networkidle");

    const currentUrl = page.url();
    const title = await page.title();

    await page.screenshot({
      path: "screenshots/after-login.png",
      fullPage: true,
    });

    logInfo("After login page state", {
      currentUrl,
      title,
    });

    const isLoginFailed = await page
      .getByText(/ログインできません|IDまたはパスワード|認証に失敗|入力内容をご確認/)
      .isVisible()
      .catch(() => false);

    if (isLoginFailed) {
      const screenshotPath = `screenshots/login-failed-${Date.now()}.png`;

      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
      });

      return {
        success: false,
        reason: "LOGIN_FAILED",
        screenshotPath,
        currentUrl,
        title,
      };
    }

    const stillOnLoginPage = await page
      .locator("#CORPORATION_CD")
      .isVisible()
      .catch(() => false);

    if (stillOnLoginPage) {
      const screenshotPath = `screenshots/still-on-login-page-${Date.now()}.png`;

      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
      });

      return {
        success: false,
        reason: "STILL_ON_LOGIN_PAGE",
        screenshotPath,
        currentUrl,
        title,
      };
    }

    logInfo("Login flow completed", {
      currentUrl,
      title,
    });

    return {
      success: true,
      currentUrl,
      title,
    };
  } catch (error) {
    const screenshotPath = `screenshots/login-error-${Date.now()}.png`;

    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });

    return {
      success: false,
      reason: error instanceof Error ? error.message : String(error),
      screenshotPath,
    };
  } finally {
    await browser.close();
  }
}