import { getPublicEnv } from "@/lib/env";

type ApiResponse<T> = {
  data: T;
  message: string;
  success: boolean;
};

type RequestOptions = {
  accessToken?: string;
  init?: RequestInit;
};

export type TopicGenerationPayload = {
  slide_count: number;
  subject: string;
  tone: string;
  topic: string;
};

export async function getTemplates() {
  return request("/templates");
}

export async function getCurrentUser(accessToken: string) {
  return request("/me", { accessToken });
}

export async function getPlan(accessToken: string) {
  return request("/plan", { accessToken });
}

export async function generateTopic(payload: TopicGenerationPayload) {
  return request("/generate/topic", {
    init: {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
      },
    },
  });
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const env = getPublicEnv();
  const headers = new Headers(options.init?.headers);

  if (!headers.has("Content-Type") && options.init?.body) {
    headers.set("Content-Type", "application/json");
  }

  if (options.accessToken) {
    headers.set("Authorization", `Bearer ${options.accessToken}`);
  }

  const response = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}${path}`, {
    ...options.init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<ApiResponse<T>>;
}
