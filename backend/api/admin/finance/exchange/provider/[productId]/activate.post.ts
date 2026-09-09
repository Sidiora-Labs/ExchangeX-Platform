import { activateProvider } from "../../utils";

import {
  notFoundMetadataResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@b/utils/query";

export const metadata = {
  summary: "Activate Exchange Provider",
  operationId: "activateExchangeProvider",
  tags: ["Admin", "Settings", "Exchange"],
  description:
    "Activates the given exchange provider and deactivates any other active provider.",
  requiresAuth: true,
  parameters: [
    {
      index: 0,
      in: "path",
      name: "productId",
      description: "Product ID of the exchange provider to activate",
      required: true,
      schema: {
        type: "string",
      },
    },
  ],
  responses: {
    200: {
      description: "Exchange provider activated successfully",
    },
    401: unauthorizedResponse,
    404: notFoundMetadataResponse("Exchange"),
    500: serverErrorResponse,
  },
  permission: "Access Exchange Provider Management",
};

export default async (data: Handler) => {
  const { params } = data;
  const { productId } = params;

  if (!productId) {
    throw new Error("Product ID is required to activate a provider.");
  }

  await activateProvider(productId);

  return { message: "Exchange provider activated successfully" };
};
