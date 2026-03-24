import { getPublicEnv } from "@/lib/env";

export type ApiResponse<T> = {
  data: T;
  message: string;
  success: boolean;
};

type RequestOptions = {
  accessToken?: string;
  init?: RequestInit;
};

export type CurrentUser = {
  id: string;
  email: string | null;
  name: string | null;
  authenticated: boolean;
  plan_code: string;
  can_use_pro_features: boolean;
  credits_remaining: number | null;
  daily_topic_limit: number | null;
  created_at: string | null;
};

export type PlanFeature = {
  key: string;
  label: string;
  included: boolean;
};

export type PlanSummary = {
  code: string;
  name: string;
  price: number;
  currency: string;
  billing_cycle: string;
  active: boolean;
  features: PlanFeature[];
};

export type PlanOverview = {
  current_plan: PlanSummary;
  available_plans: PlanSummary[];
  is_paid: boolean;
  subscription_status: string | null;
  daily_topic_limit: number | null;
  remaining_topic_generations: number | null;
};

export type TemplateDefinition = {
  id: string;
  name: string;
  description: string;
  is_pro: boolean;
  theme: {
    title_font_size: number;
    body_font_size: number;
    primary_color: string;
    secondary_color: string;
    font_family: string;
  };
  layout: {
    title_alignment: "left" | "center" | "right";
    body_alignment: "left" | "center" | "right";
    cover_style: string;
    content_columns: number;
    show_page_numbers: boolean;
    use_accent_band: boolean;
  };
};

export type TemplateListData = {
  items: TemplateDefinition[];
  total: number;
  free_count: number;
  pro_count: number;
};

export type PresentationSlide = {
  title: string;
  bullets: string[];
  speaker_notes: string;
};

export type GeneratedPresentationContent = {
  presentation_title: string;
  slides: PresentationSlide[];
};

export type PresentationSummary = {
  id: string;
  title: string;
  source_type: "topic" | "notes" | "pdf";
  status: "draft" | "processing" | "completed" | "failed";
  slide_count: number;
  template_id: string;
  template_name: string | null;
  topic: string | null;
  file_url: string | null;
  watermark_applied: boolean;
  created_at: string;
  content_preview: string[];
};

export type PresentationDetail = PresentationSummary & {
  metadata: Record<string, unknown>;
};

export type PresentationListData = {
  items: PresentationSummary[];
  total: number;
};

export type GenerationResult = {
  queued: boolean;
  presentation: PresentationDetail;
  content: GeneratedPresentationContent | null;
};

export type TopicGenerationPayload = {
  slide_count: number;
  subject: string;
  tone: string;
  topic: string;
  user_id: string;
  template_id: string;
};

export type NotesGenerationPayload = {
  notes: string;
  title?: string;
  topic?: string;
  slide_count: number;
  template_id: string;
  user_id: string;
};

export type PdfGenerationPayload = {
  pdf: File;
  slide_count?: number;
  template_id: string;
  user_id: string;
};

export type PaymentOrder = {
  order_id: string;
  provider: "razorpay";
  plan_code: string;
  amount: number;
  currency: string;
  key_id: string;
  status: "created";
};

export type VerifyPaymentPayload = {
  order_id: string;
  payment_id: string;
  signature: string;
};

export type VerifyPaymentResult = {
  order_id: string;
  payment_id: string;
  status: "verified" | "failed";
  plan_code: string | null;
};

export async function getTemplates() {
  return request<TemplateListData>("/templates");
}

export async function getCurrentUser(accessToken: string) {
  return request<CurrentUser>("/me", { accessToken });
}

export async function getPlan(accessToken: string) {
  return request<PlanOverview>("/plan", { accessToken });
}

export async function getPresentations(accessToken: string) {
  return request<PresentationListData>("/presentations", { accessToken });
}

export async function getPresentation(accessToken: string, presentationId: string) {
  return request<PresentationDetail>(`/presentations/${presentationId}`, {
    accessToken,
  });
}

export async function generateTopic(accessToken: string, payload: TopicGenerationPayload) {
  return request<GenerationResult>("/generate/topic", {
    accessToken,
    init: {
      method: "POST",
      body: JSON.stringify(payload),
    },
  });
}

export async function generateNotes(accessToken: string, payload: NotesGenerationPayload) {
  return request<GenerationResult>("/generate/notes", {
    accessToken,
    init: {
      method: "POST",
      body: JSON.stringify(payload),
    },
  });
}

export async function generatePdf(accessToken: string, payload: PdfGenerationPayload) {
  const formData = new FormData();
  formData.append("pdf", payload.pdf);
  formData.append("template_id", payload.template_id);
  formData.append("user_id", payload.user_id);
  formData.append("slide_count", String(payload.slide_count ?? 10));

  return request<GenerationResult>("/generate/pdf", {
    accessToken,
    init: {
      method: "POST",
      body: formData,
    },
  });
}

export async function createPaymentOrder(accessToken: string, planCode = "pro") {
  return request<PaymentOrder>("/payments/create-order", {
    accessToken,
    init: {
      method: "POST",
      body: JSON.stringify({ plan_code: planCode }),
    },
  });
}

export async function verifyPayment(accessToken: string, payload: VerifyPaymentPayload) {
  return request<VerifyPaymentResult>("/payments/verify", {
    accessToken,
    init: {
      method: "POST",
      body: JSON.stringify(payload),
    },
  });
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const env = getPublicEnv();
  const headers = new Headers(options.init?.headers);
  const isFormDataBody =
    typeof FormData !== "undefined" && options.init?.body instanceof FormData;

  if (!isFormDataBody && !headers.has("Content-Type") && options.init?.body) {
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
    throw new Error(await parseErrorMessage(response));
  }

  return response.json() as Promise<ApiResponse<T>>;
}

async function parseErrorMessage(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const payload = (await response.json().catch(() => null)) as
      | { detail?: string; message?: string }
      | null;
    if (payload?.detail) {
      return payload.detail;
    }
    if (payload?.message) {
      return payload.message;
    }
  }

  const text = await response.text().catch(() => "");
  return text || `Request failed with status ${response.status}`;
}
