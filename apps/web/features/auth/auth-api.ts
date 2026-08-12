import {
  logoutResponseSchema,
  meResponseSchema,
  otpRequestResponseSchema,
  otpVerifyResponseSchema,
  type LogoutResponse,
  type MeResponse,
  type OtpRequestInput,
  type OtpRequestResponse,
  type OtpVerifyInput,
  type OtpVerifyResponse,
} from "@komplekku/contracts";

import { apiRequest } from "@/lib/api/client";

export function requestOtp(input: OtpRequestInput): Promise<OtpRequestResponse> {
  return apiRequest("/auth/otp/request", otpRequestResponseSchema, {
    method: "POST",
    body: input,
  });
}

export function verifyOtp(input: OtpVerifyInput): Promise<OtpVerifyResponse> {
  return apiRequest("/auth/otp/verify", otpVerifyResponseSchema, {
    method: "POST",
    body: input,
  });
}

export function getMe(): Promise<MeResponse> {
  return apiRequest("/me", meResponseSchema);
}

export function logout(): Promise<LogoutResponse> {
  return apiRequest("/auth/logout", logoutResponseSchema, { method: "POST" });
}
