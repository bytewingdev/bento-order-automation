type ValidateOrderInput = {
  targetDateText: string;
  actualDateText: string;
  menuName: string;
  quantity: number;
  price: number;
};

type ValidateOrderResult =
  | {
      valid: true;
    }
  | {
      valid: false;
      reason: string;
    };

const MAX_PRICE = 1000;
const EXPECTED_QUANTITY = 1;

export function validateOrder(input: ValidateOrderInput): ValidateOrderResult {
  const normalizedTargetDateText = input.targetDateText.replaceAll("-", "/");

  if (!input.actualDateText.includes(normalizedTargetDateText)) {
    return {
      valid: false,
      reason: `配達日が一致しません。expected=${normalizedTargetDateText}`,
    };
  }

  if (!input.menuName.trim()) {
    return {
      valid: false,
      reason: "メニュー名を取得できませんでした",
    };
  }

  if (input.quantity !== EXPECTED_QUANTITY) {
    return {
      valid: false,
      reason: `数量が想定と異なります。expected=${EXPECTED_QUANTITY}, actual=${input.quantity}`,
    };
  }

  if (input.price <= 0 || input.price > MAX_PRICE) {
    return {
      valid: false,
      reason: `金額が想定範囲外です。price=${input.price}`,
    };
  }

  return {
    valid: true,
  };
}

export function parsePrice(text: string): number {
  const normalized = text.replace(/[^\d]/g, "");
  return Number(normalized);
}