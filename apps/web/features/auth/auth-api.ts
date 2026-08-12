import {
  logoutResponseSchema,
  meResponseSchema,
  otpRequestResponseSchema,
  otpVerifyResponseSchema,
  updateProfileResponseSchema,
  type LogoutResponse,
  type MeResponse,
  type OtpRequestInput,
  type OtpRequestResponse,
  type OtpVerifyInput,
  type OtpVerifyResponse,
  type UpdateProfileInput,
  type UpdateProfileResponse,
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

export function updateProfile(input: UpdateProfileInput): Promise<UpdateProfileResponse> {
  return apiRequest("/me", updateProfileResponseSchema, {
    method: "PATCH",
    body: input,
  });
}

export function logout(): Promise<LogoutResponse> {
  return apiRequest("/auth/logout", logoutResponseSchema, { method: "POST" });
}
