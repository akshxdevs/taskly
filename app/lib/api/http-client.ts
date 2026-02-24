type ApiError = {
  error?: string;
};

export async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const isJSON = contentType.includes("application/json");

  if (!isJSON) {
    const text = await response.text();
    if (!response.ok) {
      throw new Error(text || `request failed: ${response.status}`);
    }
    return text as T;
  }

  const data = (await response.json()) as T;
  if (!response.ok) {
    const message = (data as ApiError).error || `request failed: ${response.status}`;
    throw new Error(message);
  }

  return data;
}
