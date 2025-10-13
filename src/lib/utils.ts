export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatCurrency(amount: number | string, decimals = 2): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function calculateHealthFactor(
  suppliedUSD: number,
  borrowedUSD: number,
  ltv: number = 0.75
): number {
  if (borrowedUSD === 0) return Infinity;
  return (suppliedUSD * ltv) / borrowedUSD;
}

export function isLowHealthFactor(healthFactor: number): boolean {
  return healthFactor < 1.5 && healthFactor !== Infinity;
}
