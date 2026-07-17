const BNCC_CODE_PATTERN = /^[A-Z0-9]{4,20}$/;

export function normalizeBnccCodes(codes: string[] | undefined): string[] | undefined {
  if (codes === undefined) return undefined;

  const normalized = Array.from(
    new Set(
      codes
        .map((code) => code.trim().toUpperCase())
        .filter(Boolean),
    ),
  ).sort();

  const invalid = normalized.find((code) => !BNCC_CODE_PATTERN.test(code));
  if (invalid) throw new Error(`Codigo BNCC invalido: ${invalid}`);

  return normalized;
}

export function parseBnccCodesParam(value?: string): string[] {
  return normalizeBnccCodes(value?.split(",") ?? []) ?? [];
}
