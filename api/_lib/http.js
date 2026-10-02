// Only JSON objects are valid request bodies. Invalid input must never mutate data.
export function parseBody(req) {
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    return body && typeof body === "object" && !Array.isArray(body) ? body : null;
  } catch {
    return null;
  }
}
