// This file provides no-op replacements for toast functions
// to avoid having to modify every file that uses toast

// Create a no-op function that can be called with any arguments
const noop = (...args: any[]) => {};

// Mock toast object with all the methods as no-ops
export const toast = {
  success: noop,
  error: noop,
  info: noop,
  warning: noop,
  warn: noop,
  dark: noop,
  dismiss: noop,
  update: noop,
  loading: noop,
  custom: noop,
  // Add placeholders for the promise methods
  promise: () => Promise.resolve(),
  // For the configure method, return the mock toast object
  configure: () => toast,
};

export default toast; 