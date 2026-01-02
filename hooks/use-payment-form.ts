"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  generateUpiIntentAction,
  validateTransactionIdAction,
  verifyUpiPaymentAction,
} from "@/app/actions/upi-actions";
import { amountSchema, transactionIdSchema } from "@/lib/validations/payment";

type PaymentStep = "amount" | "payment";

interface UsePaymentFormProps {
  farewellId: string;
  initialAmount?: number;
  onSuccess?: () => void;
}

export function usePaymentForm({
  farewellId,
  initialAmount = 0,
  onSuccess,
}: UsePaymentFormProps) {
  // Form state
  const [currentStep, setCurrentStep] = useState<PaymentStep>("amount");
  const [amount, setAmount] = useState(initialAmount.toString());
  const [transactionId, setTransactionId] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);

  // UI state
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [upiUrl, setUpiUrl] = useState<string | null>(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation state
  const [amountError, setAmountError] = useState("");
  const [transactionError, setTransactionError] = useState("");
  const [screenshotError, setScreenshotError] = useState("");
  const [qrError, setQrError] = useState("");

  // Validate amount
  const validateAmount = useCallback(() => {
    const num = Number(amount);
    const result = amountSchema.safeParse(num);

    if (!result.success) {
      setAmountError(result.error.issues[0].message);
      return false;
    }

    setAmountError("");
    return true;
  }, [amount]);

  // Validate transaction ID
  const validateTransaction = useCallback(async () => {
    if (!transactionId.trim()) {
      setTransactionError("");
      return true;
    }

    const result = transactionIdSchema.safeParse(transactionId);

    if (!result.success) {
      setTransactionError(result.error.issues[0].message);
      return false;
    }

    // Check for duplicates
    const { isDuplicate, message } = await validateTransactionIdAction(
      transactionId,
      farewellId
    );

    if (isDuplicate) {
      setTransactionError(message || "Transaction already exists");
      return false;
    }

    setTransactionError("");
    return true;
  }, [transactionId, farewellId]);

  // Generate QR code
  const generateQrCode = useCallback(
    async (upiId: string) => {
      if (isGeneratingQr) return;

      setIsGeneratingQr(true);
      setQrError("");

      const num = Number(amount);
      const result = await generateUpiIntentAction(farewellId, num, upiId);

      setIsGeneratingQr(false);

      if (result.success && result.qrCodeDataUrl) {
        setQrCode(result.qrCodeDataUrl);
        setUpiUrl(result.upiUrl || null);
      } else {
        setQrError(result.error || "Failed to generate QR code");
        toast.error(result.error || "QR generation failed");
      }
    },
    [amount, farewellId, isGeneratingQr]
  );

  // Navigate to next step
  const goToNextStep = useCallback(() => {
    if (currentStep === "amount") {
      if (!validateAmount()) {
        toast.error("Please enter a valid amount");
        return;
      }
      setCurrentStep("payment");
    }
  }, [currentStep, validateAmount]);

  // Navigate to previous step
  const goToPreviousStep = useCallback(() => {
    if (currentStep === "payment") {
      setCurrentStep("amount");
      setQrCode(null);
      setUpiUrl(null);
      setTransactionId("");
      setScreenshot(null);
      setTransactionError("");
      setScreenshotError("");
    }
  }, [currentStep]);

  // Submit payment
  const submitPayment = useCallback(async () => {
    if (isSubmitting) return false;

    // Validate transaction ID
    const isTransactionValid = await validateTransaction();
    if (!isTransactionValid) {
      toast.error("Please check transaction ID");
      return false;
    }

    if (!transactionId.trim()) {
      toast.error("Transaction ID is required");
      return false;
    }

    setIsSubmitting(true);

    const num = Number(amount);
    const result = await verifyUpiPaymentAction(
      farewellId,
      num,
      transactionId,
      screenshot || undefined
    );

    setIsSubmitting(false);

    if (result.success) {
      toast.success("Payment submitted successfully!");
      onSuccess?.();
      return true;
    } else {
      toast.error(result.error || "Payment submission failed");
      return false;
    }
  }, [
    isSubmitting,
    validateTransaction,
    transactionId,
    amount,
    farewellId,
    screenshot,
    onSuccess,
  ]);

  return {
    // State
    currentStep,
    amount,
    transactionId,
    screenshot,
    qrCode,
    upiUrl,

    // UI state
    isGeneratingQr,
    isSubmitting,

    // Errors
    amountError,
    transactionError,
    screenshotError,
    qrError,

    // Setters
    setAmount,
    setTransactionId,
    setScreenshot,

    // Actions
    validateAmount,
    validateTransaction,
    generateQrCode,
    goToNextStep,
    goToPreviousStep,
    submitPayment,
  };
}
