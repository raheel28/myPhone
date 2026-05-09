// server/src/utils/asyncHandler.js
// Wrapper that forwards async route errors into Express' error handler.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
