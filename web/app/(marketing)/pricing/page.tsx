"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import {
  createPaymentOrder,
  type PlanSummary,
  verifyPayment,
} from "@/lib/api/backend";
import { loadRazorpayScript } from "@/lib/razorpay";
import { useApp } from "@/components/providers/app-provider";
import { buttonClasses } from "@/components/ui/button";
import { PageHero } from "@/components/ui/page-hero";
import { Panel } from "@/components/ui/panel";
import { StatusBanner } from "@/components/ui/status-banner";

export default function PricingPage() {
  const { accessToken, currentUser, plan, refreshAccount } = useApp();
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  const planCards = useMemo<PlanSummary[]>(() => {
    if (plan?.available_plans?.length) {
      return plan.available_plans.filter((item) => item.code !== "team");
    }

    return [
      {
        code: "free",
        name: "Free",
        price: 0,
        currency: "INR",
        billing_cycle: "monthly",
        active: false,
        features: [
          { key: "slides", label: "3 topic generations per day", included: true },
          { key: "templates", label: "Basic templates", included: true },
          { key: "exports", label: "Watermarked PPT export", included: true },
          { key: "notes", label: "Notes to PPT", included: false },
          { key: "pdf", label: "PDF to PPT", included: false },
        ],
      },
      {
        code: "pro",
        name: "Pro",
        price: 999,
        currency: "INR",
        billing_cycle: "monthly",
        active: false,
        features: [
          { key: "slides", label: "Unlimited generations", included: true },
          { key: "templates", label: "Premium templates", included: true },
          { key: "exports", label: "No watermark", included: true },
          { key: "notes", label: "Notes to PPT", included: true },
          { key: "pdf", label: "PDF to PPT", included: true },
        ],
      },
    ];
  }, [plan]);

  async function handleUpgrade() {
    if (!accessToken || !currentUser) {
      setPaymentError("Sign in before starting the Pro upgrade flow.");
      return;
    }

    setLoadingCheckout(true);
    setPaymentError(null);
    setPaymentSuccess(null);

    try {
      await loadRazorpayScript();
      const orderResponse = await createPaymentOrder(accessToken, "pro");
      const order = orderResponse.data;

      if (!window.Razorpay) {
        throw new Error("Razorpay checkout failed to load.");
      }
      const Razorpay = window.Razorpay;

      await new Promise<void>((resolve, reject) => {
        const checkout = new Razorpay({
          key: order.key_id,
          amount: order.amount,
          currency: order.currency,
          name: "AI PPT Maker",
          description: "Upgrade to Pro",
          order_id: order.order_id,
          prefill: {
            email: currentUser.email ?? undefined,
            name: currentUser.name ?? undefined,
          },
          notes: {
            plan_code: order.plan_code,
            user_id: currentUser.id,
          },
          handler: async (response) => {
            try {
              const verification = await verifyPayment(accessToken, {
                order_id: response.razorpay_order_id,
                payment_id: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              });

              if (verification.data.status !== "verified") {
                throw new Error("Payment could not be verified.");
              }

              await refreshAccount();
              setPaymentSuccess(
                "Payment verified successfully. Pro features are now unlocked on your account.",
              );
              resolve();
            } catch (nextError) {
              reject(nextError);
            }
          },
          modal: {
            ondismiss: () => reject(new Error("Payment checkout was closed before completion.")),
          },
        });

        checkout.on("payment.failed", () => {
          reject(new Error("Payment failed. No upgrade was applied."));
        });
        checkout.open();
      });
    } catch (error) {
      setPaymentError(
        error instanceof Error ? error.message : "Payment checkout failed.",
      );
    } finally {
      setLoadingCheckout(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Pricing"
        title="Plans that scale from revision decks to polished premium exports."
        description="Free keeps Topic-to-PPT lightweight for students, while Pro unlocks Notes, PDF, premium templates, watermark removal, and unlimited generations."
        actions={
          <>
            <Link href="/login" className={buttonClasses("primary")}>
              Start free
            </Link>
            <Link href="/dashboard" className={buttonClasses("secondary")}>
              Open workspace
            </Link>
          </>
        }
      />

      {paymentError ? (
        <StatusBanner title="Upgrade issue" description={paymentError} tone="danger" />
      ) : null}
      {paymentSuccess ? (
        <StatusBanner title="Upgrade complete" description={paymentSuccess} tone="success" />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {planCards.map((planOption) => (
          <Panel
            key={planOption.code}
            className={planOption.code === "pro" ? "border-cyan/30 bg-cyan/[0.08]" : undefined}
          >
            <p className="text-xs uppercase tracking-[0.22em] text-cyan">
              {planOption.code === "pro" ? "Most popular" : "Starter"}
            </p>
            <h2 className="mt-4 font-display text-3xl font-semibold text-white">
              {planOption.name}
            </h2>
            <div className="mt-4 flex items-end gap-2">
              <span className="font-display text-5xl font-semibold text-white">
                {planOption.price === 0 ? "0" : `INR ${planOption.price}`}
              </span>
              <span className="pb-2 text-mist">/{planOption.billing_cycle}</span>
            </div>
            <div className="mt-6 space-y-3">
              {planOption.features.map((feature) => (
                <div
                  key={feature.key}
                  className="surface-inset rounded-2xl p-3 text-sm text-white/90"
                >
                  {feature.included ? "Included" : "Locked"}: {feature.label}
                </div>
              ))}
            </div>
            {planOption.code === "free" ? (
              <Link href="/login" className={`${buttonClasses("secondary")} mt-6 w-full`}>
                Start on Free
              </Link>
            ) : (
              <button
                type="button"
                className={`${buttonClasses("primary")} mt-6 w-full`}
                disabled={loadingCheckout || !accessToken || currentUser?.can_use_pro_features}
                onClick={() => void handleUpgrade()}
              >
                {currentUser?.can_use_pro_features
                  ? "You're already on Pro"
                  : loadingCheckout
                    ? "Opening checkout..."
                    : "Upgrade to Pro"}
              </button>
            )}
          </Panel>
        ))}
      </div>
    </div>
  );
}
