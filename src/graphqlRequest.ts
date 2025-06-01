import {
  GraphQLClientConfig,
  GraphQLRequestOptions,
  GraphQLResponse,
  Logger,
} from "./types";

export const createGraphqlRequest = (
  defaultApiKey?: string,
  defaultLogger?: Logger,
  defaultHeaders?: GraphQLClientConfig["headers"]
) => {
  const logger = defaultLogger;

  return async function graphqlRequest<T>({
    url,
    options,
    headers = {},
    apiKey,
  }: {
    url: string;
    options: GraphQLRequestOptions;
    headers?: Record<string, string>;
    apiKey?: string;
  }): Promise<GraphQLResponse<T>> {
    try {
      const effectiveApiKey = apiKey || defaultApiKey;

      logger?.log({
        apiKey: effectiveApiKey ? "[REDACTED]" : undefined,
        headers,
        url,
        options,
      });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(effectiveApiKey ? { "x-api-key": effectiveApiKey } : {}),
          ...{ ...headers, ...defaultHeaders },
        },
        body: JSON.stringify(options),
        cache: "no-store",
      });

      const clonedResponse = response.clone();

      // If the response is not successful, parse and throw an error
      if (!response.ok) {
        let errorData: any = {};
        try {
          const data = await response.json();
          errorData = data;
        } catch {
          const text = await clonedResponse.text();
          errorData.error = text;
        }
        logger?.error("GraphQL request error:", errorData);

        throw (
          errorData?.error ||
          errorData?.message ||
          errorData?.error?.message ||
          response.statusText
        );
      }

      const responseBody: GraphQLResponse<T> = await response.json();

      return responseBody;
    } catch (error: any) {
      logger?.error("GraphQL request error:", error);

      return {
        data: undefined,
        errors: [
          { message: error?.message || String(error) || "An error occurred" },
        ],
      };
    }
  };
};
