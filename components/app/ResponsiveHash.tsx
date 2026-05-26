import { shortMiddle } from "@/lib/utils/format";

export function ResponsiveHash({
  value,
  className,
  shortClassName,
}: {
  value: string | undefined;
  className?: string;
  shortClassName?: string;
}) {
  if (!value) {
    return <span className={className}>—</span>;
  }

  return (
    <>
      <span className={`max-[519px]:hidden ${className ?? ""}`}>{value}</span>
      <span className={`hidden max-[519px]:inline ${shortClassName ?? className ?? ""}`}>
        {shortMiddle(value)}
      </span>
    </>
  );
}
