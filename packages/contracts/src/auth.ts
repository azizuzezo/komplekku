import { z } from "zod";

import { dataEnvelopeSchema } from "./envelope";

export const authStateSchema = z.enum([
  "NEEDS_RESIDENCY",
  "PENDING_APPROVAL",
  "READY",
  "CONTEXT_REQUIRED",
  "REJECTED",
  "SUSPENDED",
  "ACCOUNT_CONFIGURATION_REQUIRED",
]);

export type AuthState = z.infer<typeof authStateSchema>;

export const otpRequestInputSchema = z.object({
  phone: z.string().trim().min(8).max(24),
});

export type OtpRequestInput = z.infer<typeof otpRequestInputSchema>;

export const otpRequestResponseSchema = dataEnvelopeSchema(
  z.object({
    requestId: z.string().uuid(),
    expiresAt: z.string().datetime({ offset: true }),
    resendAt: z.string().datetime({ offset: true }),
  }),
);

export type OtpRequestResponse = z.infer<typeof otpRequestResponseSchema>;

export const otpVerifyInputSchema = z.object({
  requestId: z.string().uuid(),
  code: z.string().regex(/^\d{6}$/),
});

export type OtpVerifyInput = z.infer<typeof otpVerifyInputSchema>;

export const otpVerifyResponseSchema = dataEnvelopeSchema(
  z.object({
    user: z.object({
      id: z.string().uuid(),
      displayName: z.string().nullable(),
      phoneMasked: z.string(),
    }),
    authState: authStateSchema,
    nextPath: z.string().startsWith("/"),
    session: z.object({
      expiresAt: z.string().datetime({ offset: true }),
    }),
    accessToken: z.string().min(32).optional(),
  }),
);

export type OtpVerifyResponse = z.infer<typeof otpVerifyResponseSchema>;

export const logoutResponseSchema = dataEnvelopeSchema(z.object({ loggedOut: z.literal(true) }));

export type LogoutResponse = z.infer<typeof logoutResponseSchema>;
