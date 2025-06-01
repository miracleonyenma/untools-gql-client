import { GraphQLRequestParams, Logger } from "./types";
import { createGraphqlRequest } from "./graphqlRequest";

export const createExecuteGraphQL = (
  defaultApiUrl?: string,
  defaultApiKey?: string,
  defaultLogger?: Logger
) => {
  const logger = defaultLogger;

  const graphqlRequest = createGraphqlRequest(defaultApiKey, logger);

  return async function executeGraphQL<
    TResponse,
    TVariables extends Record<string, unknown> | undefined
  >({
    query,
    variables,
    headers = {},
    url = defaultApiUrl,
  }: GraphQLRequestParams<TVariables>): Promise<TResponse> {
    if (!url) {
      throw new Error(
        "GraphQL API URL is required. Either provide it in the request or set a default URL."
      );
    }

    try {
      const response = await graphqlRequest<TResponse>({
        url,
        options: { query, variables },
        headers,
        apiKey: defaultApiKey,
      });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      if (!response.data) {
        throw new Error("No data returned from GraphQL response.");
      }

      return response.data;
    } catch (error: unknown) {
      logger?.error("GraphQL request error:", error);
      throw new Error(
        (error as { message: string }).message || "Unknown error occurred."
      );
    }
  };
};
