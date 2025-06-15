// ./src/utils/fileUpload.ts

export const getFilesLength = (files: File[] | FileList | File): number => {
  if (!files) return 0;
  if (Array.isArray(files)) return files.length;
  if (typeof FileList !== "undefined" && files instanceof FileList)
    return files.length;
  return 1; // Single File object
};

export const convertToFileArray = (files: File[] | FileList | File): File[] => {
  if (!files) return [];
  if (Array.isArray(files)) return files;
  if (typeof FileList !== "undefined" && files instanceof FileList)
    return Array.from(files);
  if (typeof File !== "undefined" && files instanceof File) return [files];
  return []; // If not a File, return empty array for safety
};

export const hasFiles = (variables: Record<string, unknown>): boolean => {
  const hasFileValue = (value: unknown): boolean => {
    // Check for File objects
    if (typeof File !== "undefined" && value instanceof File) return true;

    // Check for FileList objects (browser only)
    if (typeof FileList !== "undefined" && value instanceof FileList)
      return true;

    // Check for objects that look like File objects (duck typing)
    if (
      value &&
      typeof value === "object" &&
      "name" in value &&
      "type" in value &&
      "size" in value
    ) {
      return true;
    }

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

  const isFileObject = (value: unknown): value is File => {
    // Check for actual File instance (browser)
    if (typeof File !== "undefined" && value instanceof File) return true;

    // Duck typing for File-like objects (server-side or custom implementations)
    return (
      !!value &&
      typeof value === "object" &&
      "name" in (value as object) &&
      "type" in (value as object) &&
      "size" in (value as object)
    );
  };

  const isFileListObject = (value: unknown): boolean => {
    // Check for FileList (browser only)
    if (typeof FileList !== "undefined" && value instanceof FileList)
      return true;

    // Check for array-like objects with File-like items
    return (
      !!value &&
      typeof value === "object" &&
      "length" in value &&
      typeof (value as any).length === "number"
    );
  };

  const processValue = (value: unknown, path: string): unknown => {
    if (isFileObject(value)) {
      const index = files.length;
      files.push(value as File);
      map[index.toString()] = [`variables.${path}`];
      return null;
    }

    if (isFileListObject(value)) {
      const fileArray = Array.from(value as FileList);
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
