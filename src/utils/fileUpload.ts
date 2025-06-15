// ./src/utils/fileUpload.ts

export const hasFiles = (variables: Record<string, unknown>): boolean => {
  const hasFileValue = (value: unknown): boolean => {
    if (value instanceof File) return true;
    if (value instanceof FileList) return true;
    if (Array.isArray(value)) return value.some(hasFileValue);
    if (value && typeof value === "object") {
      return Object.values(value).some(hasFileValue);
    }
    return false;
  };

  return variables ? hasFileValue(variables) : false;
};

export const extractFiles = (
  variables: Record<string, unknown>
): {
  files: File[];
  map: Record<string, string[]>;
  cleanVariables: Record<string, unknown>;
} => {
  const files: File[] = [];
  const map: Record<string, string[]> = {};

  const processValue = (value: unknown, path: string): unknown => {
    if (value instanceof File) {
      const index = files.length;
      files.push(value);
      map[index.toString()] = [`variables.${path}`];
      return null;
    }

    if (value instanceof FileList) {
      const fileArray = Array.from(value);
      return fileArray.map((file, i) => processValue(file, `${path}.${i}`));
    }

    if (Array.isArray(value)) {
      return value.map((item, i) => processValue(item, `${path}.${i}`));
    }

    if (value && typeof value === "object") {
      const result: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value)) {
        result[key] = processValue(val, path ? `${path}.${key}` : key);
      }
      return result;
    }

    return value;
  };

  const cleanVariables = processValue(variables, "") as Record<string, unknown>;

  return { files, map, cleanVariables };
};
