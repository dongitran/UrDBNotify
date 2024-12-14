/**
 * Recursively sanitizes a JSON object by limiting string lengths and removing sensitive data
 * @param {Object} obj - The object to sanitize
 * @param {number} maxLength - Maximum allowed string length (default: 1000)
 * @returns {Object} Sanitized object
 */
function sanitizeJson(obj, maxLength = 1000) {
  if (!obj || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeJson(item, maxLength));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    // Skip sensitive field names
    if (
      ["password", "token", "secret", "key", "authorization"].includes(
        key.toLowerCase()
      )
    ) {
      sanitized[key] = "[REDACTED]";
      continue;
    }

    if (typeof value === "string") {
      // Truncate long strings
      sanitized[key] =
        value.length > maxLength
          ? value.substring(0, maxLength) + "...[truncated]"
          : value;
    } else if (value instanceof Date) {
      sanitized[key] = value;
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeJson(value, maxLength);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

module.exports = {
  sanitizeJson,
};
