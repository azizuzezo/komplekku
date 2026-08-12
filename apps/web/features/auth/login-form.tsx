"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  otpRequestInputSchema,
  otpVerifyInputSchema,
  type OtpRequestInput,
  type OtpVerifyInput,
} from "@komplekku/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { ApiError } from "@/lib/api/client";

import { requestOtp, verifyOtp } from "./auth-api";
import { destinationForAuthState } from "./auth-routing";

type OtpStep = {
  requestId: string;
  phone: string;
};

function AuthProgress({ currentStep }: { currentStep: 1 | 2 }) {
  return (
    <ol className="auth-progress" aria-label="Tahapan masuk">
      <li className={currentStep === 1 ? "is-current" : "is-complete"}>
        <span className="auth-progress__number">1</span>
        <span>Nomor HP</span>
      </li>
      <li className={currentStep === 2 ? "is-current" : undefined}>
        <span className="auth-progress__number">2</span>
        <span>Kode OTP</span>
      </li>
    </ol>
  );
}

function readableError(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Permintaan belum dapat diproses. Silakan coba lagi.";
}

// Local-development convenience only: this exact account skips the manual OTP
// screen and auto-submits the fixed dev code, which the API only accepts when
// ALLOW_DEV_OTP is enabled (never in a real deployment). Everyone else still
// goes through the normal two-step flow.
const INSTANT_LOGIN_PHONE = "+6282145610774";
const LOCAL_DEV_OTP_CODE = "123456";

function normalizePhoneForCompare(value: string): string {
  const compact = value.trim().replace(/[\s().-]/g, "");
  if (compact.startsWith("0")) return `+62${compact.slice(1)}`;
  if (compact.startsWith("62")) return `+${compact}`;
  return compact;
}

export function LoginForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [otpStep, setOtpStep] = useState<OtpStep | null>(null);
  const [isInstantLogin, setIsInstantLogin] = useState(false);

  const phoneForm = useForm<OtpRequestInput>({
    resolver: zodResolver(otpRequestInputSchema),
    defaultValues: { phone: "" },
  });

  const otpForm = useForm<OtpVerifyInput>({
    resolver: zodResolver(otpVerifyInputSchema),
    defaultValues: { requestId: "", code: "" },
  });

  const requestMutation = useMutation({
    mutationFn: requestOtp,
    onSuccess(response, variables) {
      const nextStep = { requestId: response.data.requestId, phone: variables.phone };
      otpForm.reset({ requestId: nextStep.requestId, code: "" });
      if (normalizePhoneForCompare(variables.phone) === INSTANT_LOGIN_PHONE) {
        setIsInstantLogin(true);
        verifyMutation.mutate({ requestId: nextStep.requestId, code: LOCAL_DEV_OTP_CODE });
        return;
      }
      setOtpStep(nextStep);
    },
  });

  const verifyMutation = useMutation({
    mutationFn: verifyOtp,
    async onSuccess(response) {
      await queryClient.invalidateQueries();
      const destination = destinationForAuthState(response.data.authState);
      router.replace(destination);
      router.refresh();
    },
    onError(error, variables) {
      // Instant login only works when the API's local dev-OTP bypass is
      // enabled; if it isn't, fall back to the normal manual OTP step
      // instead of leaving the account stuck.
      if (isInstantLogin) {
        setIsInstantLogin(false);
        setOtpStep({ requestId: variables.requestId, phone: phoneForm.getValues("phone") });
      }
      void error;
    },
  });

  if (isInstantLogin && !otpStep) {
    return (
      <div className="form-stack">
        <AuthProgress currentStep={2} />
        <div className="auth-step-copy">
          <p className="auth-step-copy__label">Akses akun warga</p>
          <h1>Masuk otomatis…</h1>
          <p>Menyiapkan sesi admin utama.</p>
        </div>
        <p className="field-hint">
          <LoaderCircle className="loading-icon" size={16} aria-hidden="true" /> Memverifikasi…
        </p>
      </div>
    );
  }

  if (otpStep) {
    const codeError = otpForm.formState.errors.code ? "Masukkan 6 digit kode OTP." : undefined;

    return (
      <form
        className="form-stack"
        onSubmit={otpForm.handleSubmit((values) => verifyMutation.mutate(values))}
        noValidate
      >
        <input type="hidden" {...otpForm.register("requestId")} />
        <AuthProgress currentStep={2} />
        <div className="auth-step-copy">
          <p className="auth-step-copy__label">Verifikasi nomor</p>
          <h1>Periksa kode masukmu</h1>
          <p>Kode 6 digit dikirim untuk {otpStep.phone}.</p>
        </div>

        <div className="field">
          <label htmlFor="otp-code">Kode OTP</label>
          <input
            className="input input--otp"
            id="otp-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            autoFocus
            aria-invalid={Boolean(codeError)}
            aria-describedby={codeError ? "otp-code-error" : "otp-code-hint"}
            {...otpForm.register("code")}
          />
          {codeError ? (
            <p className="field-error" id="otp-code-error" role="alert">
              {codeError}
            </p>
          ) : (
            <p className="field-hint" id="otp-code-hint">
              Untuk pengembangan lokal, gunakan kode yang disediakan konfigurasi proyek.
            </p>
          )}
        </div>

        {verifyMutation.isError && (
          <p className="form-message" role="alert">
            {readableError(verifyMutation.error)}
          </p>
        )}

        <button
          className="button button--primary button--full"
          type="submit"
          disabled={verifyMutation.isPending}
        >
          {verifyMutation.isPending ? (
            <>
              <LoaderCircle className="loading-icon" size={18} aria-hidden="true" />
              Memverifikasi…
            </>
          ) : (
            <>
              Masuk ke Komplekku
              <ArrowRight size={18} aria-hidden="true" />
            </>
          )}
        </button>

        <button
          className="button button--secondary button--full"
          type="button"
          onClick={() => {
            verifyMutation.reset();
            setOtpStep(null);
          }}
          disabled={verifyMutation.isPending}
        >
          <ArrowLeft size={18} aria-hidden="true" />
          Ganti nomor HP
        </button>
      </form>
    );
  }

  const phoneError = phoneForm.formState.errors.phone ? "Masukkan nomor HP yang valid." : undefined;

  return (
    <form
      className="form-stack"
      onSubmit={phoneForm.handleSubmit((values) => requestMutation.mutate(values))}
      noValidate
    >
      <AuthProgress currentStep={1} />
      <div className="auth-step-copy">
        <p className="auth-step-copy__label">Akses akun warga</p>
        <h1>Masuk dengan nomor HP</h1>
        <p>Kami mengirim satu kode untuk mencocokkan akun dan rumahmu.</p>
      </div>

      <div className="field">
        <label htmlFor="phone">Nomor HP</label>
        <input
          className="input"
          id="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="08xxxxxxxxxx"
          aria-invalid={Boolean(phoneError)}
          aria-describedby={phoneError ? "phone-error" : "phone-hint"}
          {...phoneForm.register("phone")}
        />
        {phoneError ? (
          <p className="field-error" id="phone-error" role="alert">
            {phoneError}
          </p>
        ) : (
          <p className="field-hint" id="phone-hint">
            Gunakan nomor yang terdaftar pada data rumahmu.
          </p>
        )}
      </div>

      {requestMutation.isError && (
        <p className="form-message" role="alert">
          {readableError(requestMutation.error)}
        </p>
      )}

      <button
        className="button button--primary button--full"
        type="submit"
        disabled={requestMutation.isPending}
      >
        {requestMutation.isPending ? (
          <>
            <LoaderCircle className="loading-icon" size={18} aria-hidden="true" />
            Mengirim kode…
          </>
        ) : (
          <>
            Kirim kode OTP
            <ArrowRight size={18} aria-hidden="true" />
          </>
        )}
      </button>
    </form>
  );
}
