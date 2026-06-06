"use client";
import { ReactNode } from "react";
import { useTranslations } from "next-intl";
import EmptyState from "@/components/ui/EmptyState/EmptyState";
import "./ComingSoon.scss";

interface ComingSoonProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
}

export default function ComingSoon({ title, subtitle, icon }: ComingSoonProps) {
  const t = useTranslations("common");
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
      </header>
      <div className="coming-soon">
        <EmptyState
          icon={icon}
          title={t("comingSoon")}
          description={t("comingSoonDesc")}
        />
      </div>
    </div>
  );
}
