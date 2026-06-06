"use client";
import { useTranslations } from "next-intl";
import Modal from "@/components/ui/Modal/Modal";
import Button from "@/components/ui/Button/Button";

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const t = useTranslations("common");

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title ?? t("deleteConfirmTitle")}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            {cancelLabel ?? t("cancel")}
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel ?? t("confirm")}
          </Button>
        </>
      }
    >
      <p style={{ color: "var(--text-secondary)", lineHeight: 1.5 }}>
        {description ?? t("deleteConfirmDesc")}
      </p>
    </Modal>
  );
}
