import { mkdir } from "node:fs/promises";
import { chromium, type Page } from "playwright";
import { env } from "../config/env.js";
import type { OrderResult } from "../types/order.js";
import { logInfo } from "../utils/logger.js";
import { parsePrice, validateOrder } from "../utils/validation.js";

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

export async function orderObento(targetDateText: string): Promise<OrderResult> {
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
    const loginResult = await loginToObento(page);

    if (!loginResult.success) {
      return {
        success: false,
        status: "FAILED_LOGIN",
        reason: loginResult.reason,
        targetDate: targetDateText,
        screenshotPath: loginResult.screenshotPath,
      };
    }

    return await proceedOrderFlow(page, targetDateText);
  } catch (error) {
    const screenshotPath = `screenshots/order-error-${Date.now()}.png`;

    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });

    return {
      success: false,
      status: "FAILED_UNKNOWN",
      reason: error instanceof Error ? error.message : String(error),
      targetDate: targetDateText,
      screenshotPath,
    };
  } finally {
    await browser.close();
  }
}

async function loginToObento(page: Page): Promise<LoginResult> {
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
}

async function proceedOrderFlow(
  page: Page,
  targetDateText: string
): Promise<OrderResult> {
  logInfo("Starting order flow", {
    targetDate: targetDateText,
  });

  await page.getByRole("link", { name: "明日のお弁当" }).click();
  await page.waitForLoadState("networkidle");

  await page.screenshot({
    path: "screenshots/tomorrow-menu.png",
    fullPage: true,
  });

  const alreadyOrdered = await page
    .getByText(/注文済み|予約済み|注文内容|買い物かごに入っています/)
    .isVisible()
    .catch(() => false);

  if (alreadyOrdered) {
    const screenshotPath = `screenshots/already-ordered-${Date.now()}.png`;

    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });

    return {
      success: true,
      status: "ALREADY_ORDERED",
      targetDate: targetDateText,
      screenshotPath,
    };
  }

  logInfo("Adding item to cart");

  await page.getByRole("link", { name: "買い物かごに入れる" }).nth(3).click();
  await page.waitForLoadState("networkidle");

  await page.screenshot({
    path: "screenshots/cart-added.png",
    fullPage: true,
  });

  logInfo("Moving to confirmation page");

  await page.getByRole("button", { name: "入力内容を確認する" }).click();
  await page.waitForLoadState("networkidle");

  await page.screenshot({
    path: "screenshots/order-confirmation.png",
    fullPage: true,
  });

  const bodyText = await page.locator("body").innerText();

  const actualDateText = bodyText;
  const menuName = bodyText.includes("弁当") ? "弁当" : "";
  const quantity = bodyText.includes("1") ? 1 : 0;

  const priceMatch = bodyText.match(/[\d,]+円/);
  const price = priceMatch ? parsePrice(priceMatch[0]) : 0;

  const validation = validateOrder({
    targetDateText,
    actualDateText,
    menuName,
    quantity,
    price,
  });

  if (!validation.valid) {
    const screenshotPath = `screenshots/order-validation-failed-${Date.now()}.png`;

    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });

    return {
      success: false,
      status: "FAILED_VALIDATION",
      reason: validation.reason,
      targetDate: targetDateText,
      screenshotPath,
    };
  }

  if (!env.ORDER_EXECUTE) {
    logInfo("Dry run completed before order confirmation", {
      status: "DRY_RUN_COMPLETED",
      targetDate: targetDateText,
      price,
      menuName,
    });

    return {
      success: true,
      status: "DRY_RUN_COMPLETED",
      targetDate: targetDateText,
      menuName,
      price,
      screenshotPath: "screenshots/order-confirmation.png",
    };
  }

  logInfo("Confirming order", {
    targetDate: targetDateText,
    price,
    menuName,
  });

  await page.getByRole("button", { name: /注文確定|注文する|確定/ }).click();
  await page.waitForLoadState("networkidle");

  const screenshotPath = `screenshots/order-confirmed-${Date.now()}.png`;

  await page.screenshot({
    path: screenshotPath,
    fullPage: true,
  });

  return {
    success: true,
    status: "ORDER_CONFIRMED",
    targetDate: targetDateText,
    menuName,
    price,
    screenshotPath,
  };
}