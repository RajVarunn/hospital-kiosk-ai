/**
 * Debug helper functions for DynamoDB integration
 */

// Enable this to see detailed logs
const DEBUG = true;

/**
 * Log data with a label if debugging is enabled
 */
export const debugLog = (label, data) => {
  if (DEBUG) {
    console.log(`[DEBUG] ${label}:`, data);
  }
};

/**
 * Wrap a function with debug logging
 */
export const withDebug = (fn, fnName) => {
  return async (...args) => {
    if (!DEBUG) return fn(...args);
    
    debugLog(`${fnName} called with`, args);
    try {
      const result = await fn(...args);
      debugLog(`${fnName} result`, result);
      return result;
    } catch (error) {
      debugLog(`${fnName} error`, error);
      throw error;
    }
  };
};

/**
 * Add debug logging to all methods in an object
 */
export const addDebugToService = (service) => {
  if (!DEBUG) return service;
  
  const debuggedService = {};
  
  Object.keys(service).forEach(key => {
    if (typeof service[key] === 'function') {
      debuggedService[key] = withDebug(service[key], key);
    } else {
      debuggedService[key] = service[key];
    }
  });
  
  return debuggedService;
};

export default {
  debugLog,
  withDebug,
  addDebugToService
};