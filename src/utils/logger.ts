type LogLevel = "INFO" | "WARN" | "ERROR";

type LogPayload = {
  severity: LogLevel;
  message: string;
  [key: string]: unknown;
};

export function logInfo(message: string, payload: Record<string, unknown> = {}) {
  log({
    severity: "INFO",
    message,
    ...payload,
  });
}

export function logWarn(message: string, payload: Record<string, unknown> = {}) {
  log({
    severity: "WARN",
    message,
    ...payload,
  });
}

export function logError(message: string, payload: Record<string, unknown> = {}) {
  log({
    severity: "ERROR",
    message,
    ...payload,
  });
}

function log(payload: LogPayload) {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      ...payload,
    })
  );
}