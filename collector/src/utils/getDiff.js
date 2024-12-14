const isObject = (obj) =>
  obj !== null && typeof obj === "object" && !Array.isArray(obj);

/**
 * Compares two objects and returns the differences
 * @param {Object} oldObj - The original object
 * @param {Object} newObj - The new object to compare against
 * @returns {Object} An object containing only the changed values
 */
function getDifferences(oldObj, newObj) {
  // Handle cases where either object is null/undefined
  if (!oldObj) return newObj;
  if (!newObj) return { _deleted: true };
  if (typeof oldObj !== typeof newObj) return newObj;

  const changes = {};

  // Get all keys from both objects
  const allKeys = [
    ...new Set([...Object.keys(oldObj), ...Object.keys(newObj)]),
  ];

  for (const key of allKeys) {
    // Handle deleted keys
    if (!(key in newObj)) {
      changes[key] = undefined;
      continue;
    }

    // Handle newly added keys
    if (!(key in oldObj)) {
      changes[key] = newObj[key];
      continue;
    }

    const oldVal = oldObj[key];
    const newVal = newObj[key];

    // Handle different types
    if (typeof oldVal !== typeof newVal) {
      changes[key] = newVal;
      continue;
    }

    // Handle objects recursively
    if (isObject(oldVal) && isObject(newVal)) {
      const nestedDiff = getDifferences(oldVal, newVal);
      if (Object.keys(nestedDiff).length > 0) {
        changes[key] = nestedDiff;
      }
      continue;
    }

    // Handle arrays
    if (Array.isArray(oldVal) && Array.isArray(newVal)) {
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changes[key] = newVal;
      }
      continue;
    }

    // Handle primitive values
    if (oldVal !== newVal) {
      changes[key] = newVal;
    }
  }

  return changes;
}

/**
 * Creates a summary of changes between two objects
 * @param {Object} oldObj - The original object
 * @param {Object} newObj - The new object
 * @returns {Object} Summary of changes
 */
function getChangeSummary(oldObj, newObj) {
  const differences = getDifferences(oldObj, newObj);
  return {
    changedFields: Object.keys(differences),
    addedFields: Object.keys(differences).filter((key) => !(key in oldObj)),
    removedFields: Object.keys(oldObj).filter((key) => !(key in newObj)),
    totalChanges: Object.keys(differences).length,
  };
}

module.exports = {
  getDifferences,
  getChangeSummary,
};
