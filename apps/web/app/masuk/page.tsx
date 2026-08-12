import type { Metadata } from "next";

import { BrandMark } from "@/components/ui/brand-mark";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke Komplekku dengan nomor HP terdaftar.",
};

export default function LoginPage() {
  return (
    <main className="auth-page">
      <section className="auth-context" aria-labelledby="auth-context-heading">
        <div className="auth-brand-sign">
          <BrandMark href="/masuk" tone="light" priority />
        </div>
        <div className="auth-context__copy">
          <p className="auth-context__label">Pintu masuk warga</p>
          <h2 id="auth-context-heading">Ruang warga dimulai dari rumah yang terverifikasi.</h2>
          <p>
            Baca kabar lingkungan dan temukan identitas rumahmu dalam satu tempat yang tenang dan
            jelas.
          </p>
        </div>
        <p className="auth-context__footnote">Lingkungan terhubung. Akses tetap sesuai peran.</p>
      </section>
      <section className="auth-form-panel" aria-label="Formulir masuk">
        <div className="auth-form-wrap">
          <LoginForm />
          <p className="auth-privacy">
            Nomor HP digunakan hanya untuk verifikasi dan akses akun Komplekku.
          </p>
        </div>
      </section>
    </main>
  );
}
