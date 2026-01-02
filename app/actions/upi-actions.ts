"use server";

import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import QRCode from "qrcode";
import {
  amountSchema,
  upiIdSchema,
  transactionIdSchema,
  paymentSubmissionSchema,
  screenshotSchema,
} from "@/lib/validations/payment";
import type {
  UpiIntentResponse,
  PaymentVerificationResponse,
  UpiConfigResponse,
  ScreenshotUploadResponse,
  TransactionValidationResponse,
} from "@/types/payment";

/**
 * Upload payment Screenshot to storage
 */
export async function uploadScreenshotAction(
  file: File,
  farewellId: string,
  userId: string
): Promise<ScreenshotUploadResponse> {
  try {
    const validation = screenshotSchema.safeParse({
      size: file.size,
      type: file.type,
    });

    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0].message,
      };
    }

    const supabase = await createClient();
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const filePath = `${farewellId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return { success: false, error: "Failed to upload image" };
    }

    const { data } = supabase.storage.from("receipts").getPublicUrl(filePath);

    return { success: true, url: data.publicUrl };
  } catch (err: any) {
    console.error("Upload exception:", err);
    return { success: false, error: "Upload failed" };
  }
}

/**
 * Generate UPI intent URL and QR code
 */
export async function generateUpiIntentAction(
  farewellId: string,
  amount: number,
  upiId: string
): Promise<UpiIntentResponse> {
  try {
    const supabase = await createClient();
    const { data: claimsData } = await supabase.auth.getClaims();

    if (!claimsData?.claims) {
      return { success: false, error: "Authentication required" };
    }

    // Validate inputs
    const amountResult = amountSchema.safeParse(amount);
    const upiResult = upiIdSchema.safeParse(upiId);

    if (!amountResult.success) {
      return { success: false, error: amountResult.error.issues[0].message };
    }

    if (!upiResult.success) {
      return { success: false, error: upiResult.error.issues[0].message };
    }

    // Create UPI URL
    const upiUrl = `upi://pay?pa=${encodeURIComponent(
      upiId
    )}&pn=${encodeURIComponent(
      "Farewell Contribution"
    )}&am=${amount}&cu=INR&tn=${encodeURIComponent(
      `Farewell ${farewellId.slice(0, 8)}`
    )}`;

    // Generate QR with retry
    let qrCodeDataUrl: string;
    let retries = 3;

    while (retries > 0) {
      try {
        qrCodeDataUrl = await QRCode.toDataURL(upiUrl, {
          width: 300,
          margin: 2,
          errorCorrectionLevel: "M",
        });

        return {
          success: true,
          upiUrl,
          qrCodeDataUrl,
          upiId,
          amount,
        };
      } catch (qrError) {
        retries--;
        if (retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    }

    return { success: false, error: "Failed to generate QR code" };
  } catch (err: any) {
    console.error("UPI intent error:", err);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Validate transaction ID for duplicates
 */
export async function validateTransactionIdAction(
  transactionId: string,
  farewellId: string
): Promise<TransactionValidationResponse> {
  try {
    const validation = transactionIdSchema.safeParse(transactionId);

    if (!validation.success) {
      return {
        isValid: false,
        isDuplicate: false,
        message: validation.error.issues[0].message,
      };
    }

    const { data: existing } = await supabaseAdmin
      .from("contributions")
      .select("id")
      .eq("transaction_id", transactionId)
      .eq("farewell_id", farewellId)
      .maybeSingle();

    if (existing) {
      return {
        isValid: false,
        isDuplicate: true,
        message: "This transaction ID has already been used",
      };
    }

    return {
      isValid: true,
      isDuplicate: false,
      message: "Valid transaction ID",
    };
  } catch (err: any) {
    console.error("Validation error:", err);
    return {
      isValid: true,
      isDuplicate: false,
      message: "Validation unavailable",
    };
  }
}

/**
 * Submit UPI payment for verification
 */
export async function verifyUpiPaymentAction(
  farewellId: string,
  amount: number,
  transactionId: string,
  screenshot?: File
): Promise<PaymentVerificationResponse> {
  try {
    const supabase = await createClient();
    const { data: claimsData } = await supabase.auth.getClaims();

    if (!claimsData?.claims) {
      return {
        success: false,
        error: "Authentication required",
        errorCode: "AUTH_REQUIRED",
      };
    }

    const userId = claimsData.claims.sub;

    // Validate inputs
    const validation = paymentSubmissionSchema.safeParse({
      farewellId,
      amount,
      transactionId,
      screenshotUrl: null,
    });

    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0].message,
        errorCode: "VALIDATION_ERROR",
      };
    }

    // Check duplicates
    const duplicateCheck = await validateTransactionIdAction(
      transactionId,
      farewellId
    );

    if (duplicateCheck.isDuplicate) {
      return {
        success: false,
        error: duplicateCheck.message,
        errorCode: "DUPLICATE_TRANSACTION",
      };
    }

    // Upload screenshot if provided
    let screenshotUrl: string | null = null;
    if (screenshot && screenshot.size > 0) {
      const uploadResult = await uploadScreenshotAction(
        screenshot,
        farewellId,
        userId
      );

      if (!uploadResult.success) {
        return {
          success: false,
          error: uploadResult.error || "Screenshot upload failed",
          errorCode: "SCREENSHOT_UPLOAD_FAILED",
        };
      }

      screenshotUrl = uploadResult.url || null;
    }

    // Insert contribution
    const { data, error: insertError } = await supabase
      .from("contributions")
      .insert({
        user_id: userId,
        farewell_id: farewellId,
        amount: amount,
        method: "upi",
        transaction_id: transactionId,
        screenshot_url: screenshotUrl,
        status: "pending",
        metadata: {
          payment_type: "upi_manual",
          submitted_at: new Date().toISOString(),
          has_screenshot: !!screenshotUrl,
        },
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return {
        success: false,
        error: "Failed to record contribution",
        errorCode: "DATABASE_ERROR",
      };
    }

    revalidatePath(`/dashboard/${farewellId}/contributions`);

    return {
      success: true,
      contributionId: data.id,
      message: "Payment submitted successfully!",
    };
  } catch (err: any) {
    console.error("Verify payment error:", err);
    return {
      success: false,
      error: "Unexpected error occurred",
      errorCode: "UNKNOWN_ERROR",
    };
  }
}

/**
 * Get UPI configuration
 */
export async function getUpiConfigAction(
  farewellId: string
): Promise<UpiConfigResponse> {
  try {
    const { data, error } = await supabaseAdmin
      .from("farewells")
      .select("payment_config, accepting_payments, is_maintenance_mode")
      .eq("id", farewellId)
      .single();

    if (error || !data) {
      return { success: false, error: "Farewell not found" };
    }

    if (data.is_maintenance_mode) {
      return { success: false, error: "System under maintenance" };
    }

    if (!data.accepting_payments) {
      return { success: false, error: "Contributions not accepted" };
    }

    const upiId = data.payment_config?.upi_id;

    if (!upiId || upiId === "default@upi") {
      return { success: false, error: "UPI not configured" };
    }

    return {
      success: true,
      upiId,
      upiEnabled: data.payment_config?.upi !== false,
    };
  } catch (err: any) {
    console.error("Get config error:", err);
    return { success: false, error: "Failed to load configuration" };
  }
}
