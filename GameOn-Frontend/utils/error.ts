export function errorToString(err: unknown): string {
  if (err === null || err === undefined) return "Unknown error";

  if (err instanceof Error) return err.message || String(err);

  const anyErr: any = err as any;

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

  if (
    typeof anyErr === "object" &&
    anyErr !== null &&
    typeof anyErr.message === "string"
  ) {
    return anyErr.message;
  }

  if (
    typeof anyErr === "string" ||
    typeof anyErr === "number" ||
    typeof anyErr === "boolean"
  ) {
    return String(anyErr);
  }

  try {
    return JSON.stringify(anyErr);
  } catch {
    return String(anyErr);
  }
}

export default errorToString;
