import type { ReactNode } from "react";

import { BrandMark } from "@/components/ui/brand-mark";

type OnboardingShellProps = {
  stage: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function OnboardingShell({ stage, title, description, children }: OnboardingShellProps) {
  return (
    <main className="onboarding-page">
      <a className="skip-link" href="#onboarding-task">
        Lewati ke formulir
      </a>
      <section className="onboarding-identity" aria-label="Komplekku">
        <div className="auth-brand-sign">
          <BrandMark href="/masuk" tone="light" priority />
        </div>
        <div className="onboarding-identity__copy">
          <p>Aktivasi warga</p>
          <h2>Akun warga tumbuh dari tempat tinggal yang jelas.</h2>
          <span>Data rumah diperiksa pengurus sebelum akses lingkungan diberikan.</span>
        </div>
        <p className="onboarding-identity__footnote">Komplekku menjaga akses tetap sesuai peran.</p>
      </section>
      <section className="onboarding-task" id="onboarding-task" tabIndex={-1}>
        <div className="onboarding-task__inner">
          <header className="onboarding-task__heading">
            <p>{stage}</p>
            <h1>{title}</h1>
            <span>{description}</span>
          </header>
          {children}
        </div>
      </section>
    </main>
  );
}
