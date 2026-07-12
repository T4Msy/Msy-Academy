import { EmptyIllustration, type EmptyIllustrationVariant } from "@/components/EmptyIllustration";

export function EmptyState({
  variant,
  title,
  text,
  action,
}: {
  variant: EmptyIllustrationVariant;
  title: string;
  text?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <EmptyIllustration variant={variant} />
      <div className="empty-title">{title}</div>
      {text && <p className="empty-text">{text}</p>}
      {action}
    </div>
  );
}
