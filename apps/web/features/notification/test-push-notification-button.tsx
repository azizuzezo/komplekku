"use client";

import { useMutation } from "@tanstack/react-query";
import { BellRing } from "lucide-react";
import { useState } from "react";

import { sendTestPushNotification } from "./notification-api";

export function TestPushNotificationButton() {
  const [message, setMessage] = useState("");

  const mutation = useMutation({
    mutationFn: sendTestPushNotification,
    onSuccess: (res) => {
      const { successCount, failureCount } = res.data;
      if (successCount === 0) {
        setMessage("Tidak ada perangkat terdaftar. Buka aplikasi mobile dan masuk untuk mendaftarkan perangkatmu.");
      } else {
        setMessage(`Terkirim ke ${successCount} perangkat${failureCount > 0 ? `, gagal ke ${failureCount} perangkat` : ""}.`);
      }
    },
    onError: (err: Error) => {
      setMessage(err.message || "Gagal mengirim notifikasi tes.");
    },
  });

  return (
    <div className="test-push-notification">
      <button
        type="button"
        className="button button--secondary"
        disabled={mutation.isPending}
        onClick={() => {
          setMessage("");
          mutation.mutate();
        }}
      >
        <BellRing size={18} />
        <span>{mutation.isPending ? "Mengirim..." : "Tes Push Notifikasi"}</span>
      </button>
      {message && <p className="form-message">{message}</p>}
    </div>
  );
}
