export function errorToString(err: unknown): string {
  // Treat null/undefined as unknown
  if (err === null || err === undefined) return "Unknown error";

  // Native Error
  if (err instanceof Error) return err.message || String(err);

  const anyErr: any = err as any;

  // Axios-like error with response
  if (anyErr?.response) {
    try {
      const resp = anyErr.response;
      const msg =
        resp?.data?.message ||
        resp?.data?.error ||
        resp?.data?.error_description ||
        resp?.statusText ||
        (resp?.status ? String(resp.status) : undefined);
      return `Request failed: ${msg ?? "unknown"}`;
    } catch {
      // fallthrough
    }
  }

  // Plain object with message
  if (
    typeof anyErr === "object" &&
    anyErr !== null &&
    typeof anyErr.message === "string"
  ) {
    return anyErr.message;
  }

  // Primitives
  if (
    typeof anyErr === "string" ||
    typeof anyErr === "number" ||
    typeof anyErr === "boolean"
  ) {
    return String(anyErr);
  }

  // Fallback to JSON
  try {
    return JSON.stringify(anyErr);
  } catch {
    return String(anyErr);
  }
}

export default errorToString;
