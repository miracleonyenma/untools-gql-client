// ./src/graphqlRequest.ts - Enhanced with file upload support
import {
  GraphQLClientConfig,
  GraphQLRequestOptions,
  GraphQLResponse,
  Logger,
} from "./types";
import { hasFiles, extractFiles } from "./utils/fileUpload";

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
        options: {
          ...options,
          files: options.files ? `${options.files.length} files` : undefined,
        },
      });

      // Check if we have files to upload
      const hasFilesToUpload =
        (options.files?.length || 0) > 0 ||
        (options.variables && hasFiles(options.variables));

      let fetchOptions: RequestInit;

      if (hasFilesToUpload) {
        // Handle multipart form data for file uploads
        const formData = new FormData();

        let filesToProcess: File[] = [];
        let cleanVariables = options.variables || {};
        let fileMap: Record<string, string[]> = {};

        // Handle files from options.files
        if (options.files?.length) {
          const filesArray = Array.from(options.files);
          filesArray.forEach((file, index) => {
            filesToProcess.push(file);
            fileMap[index.toString()] = [`variables.files.${index}`];
          });

          // Add files array to variables if not present
          if (!cleanVariables.files) {
            cleanVariables = {
              ...cleanVariables,
              files: new Array(filesArray.length).fill(null),
            };
          }
        }

        // Handle files embedded in variables
        if (options.variables && hasFiles(options.variables)) {
          const extracted = extractFiles(options.variables);
          const startIndex = filesToProcess.length;

          extracted.files.forEach((file, index) => {
            filesToProcess.push(file);
            // Adjust map indices
            const originalKey = Object.keys(extracted.map)[index];
            fileMap[(startIndex + index).toString()] =
              extracted.map[originalKey];
          });

          cleanVariables = extracted.cleanVariables;
        }

        // Build FormData
        formData.append(
          "operations",
          JSON.stringify({
            query: options.query,
            variables: cleanVariables,
          })
        );

        formData.append("map", JSON.stringify(fileMap));

        filesToProcess.forEach((file, index) => {
          formData.append(index.toString(), file);
        });

        fetchOptions = {
          method: "POST",
          headers: {
            // Don't set Content-Type for FormData - browser will set it with boundary
            ...(effectiveApiKey ? { "x-api-key": effectiveApiKey } : {}),
            ...{ ...headers, ...defaultHeaders },
          },
          body: formData,
          cache: "no-store",
        };
      } else {
        // Handle regular JSON request
        fetchOptions = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(effectiveApiKey ? { "x-api-key": effectiveApiKey } : {}),
            ...{ ...headers, ...defaultHeaders },
          },
          body: JSON.stringify(options),
          cache: "no-store",
        };
      }

      const response = await fetch(url, fetchOptions);
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
