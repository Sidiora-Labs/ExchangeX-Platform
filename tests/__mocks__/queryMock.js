/**
 * Global mock for @b/utils/query - used by all API route handlers.
 * Prevents the real module from importing @b/db (which needs MySQL).
 */
var mockFilteredResult = { items: [], pagination: { page: 1, totalPages: 1, totalItems: 0 } };

module.exports = {
  getFiltered: jest.fn(async function() { return mockFilteredResult; }),
  notFoundMetadataResponse: jest.fn(function(model) { return { description: (model || "Resource") + " not found" }; }),
  serverErrorResponse: { description: "Internal server error" },
  unauthorizedResponse: { description: "Unauthorized" },
  createRecordResponses: jest.fn(function(model) { return { 200: { description: (model || "Record") + " created successfully" } }; }),
  deleteRecordResponses: jest.fn(function(model) { return { 200: { description: (model || "Record") + " deleted successfully" } }; }),
  updateRecordResponses: jest.fn(function(model) { return { 200: { description: (model || "Record") + " updated successfully" } }; }),
  getRecordResponses: jest.fn(function(model) { return { 200: { description: (model || "Record") + " retrieved successfully" } }; }),
  recordNotFoundResponse: jest.fn(function(model) { return { description: (model || "Record") + " not found" }; }),
};
