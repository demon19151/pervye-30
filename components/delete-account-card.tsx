"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";

export function DeleteAccountCard({
  role,
  locked,
  lockHint,
  onConfirm,
}: {
  role: "participant" | "curator";
  locked?: boolean;
  lockHint?: string;
  onConfirm: () => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const isMentor = role === "curator";
  const description = isMentor
    ? "Удалятся ваш аккаунт, комната и данные всех участников. Это нельзя отменить."
    : "Удалятся ваш аккаунт, ответы и переписка в этой комнате. Это нельзя отменить.";

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
      setOpen(false);
    }
  };

  return (
    <>
      <Card className="p-5 sm:p-6">
        <CardHeader
          title="Удалить аккаунт"
          description={locked ? lockHint : description}
        />
        <Button
          variant="danger"
          className="mt-5"
          disabled={locked}
          onClick={() => setOpen(true)}
        >
          <Trash2 className="size-4" />
          Удалить аккаунт
        </Button>
      </Card>

      <Modal
        open={open}
        onClose={() => !busy && setOpen(false)}
        title="Точно удалить аккаунт?"
        description={
          isMentor
            ? "Комната исчезнет вместе с участниками, шагами и сообщениями. Восстановить это нельзя."
            : "Вы точно уверены, что хотите это сделать? Аккаунт и ваши ответы в группе исчезнут без восстановления."
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
              Отмена
            </Button>
            <Button variant="danger" loading={busy} onClick={() => void handleConfirm()}>
              Да, удалить
            </Button>
          </>
        }
      />
    </>
  );
}
