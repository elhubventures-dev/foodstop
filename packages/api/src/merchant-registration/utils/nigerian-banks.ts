/** CBN / Paystack-style bank codes — reference 02-merchant-onboarding.md */
export const NIGERIAN_BANKS: { name: string; code: string }[] = [
  { name: 'Access Bank', code: '044' },
  { name: 'GTBank', code: '058' },
  { name: 'First Bank', code: '011' },
  { name: 'Zenith Bank', code: '057' },
  { name: 'UBA', code: '033' },
  { name: 'Stanbic IBTC', code: '221' },
  { name: 'FCMB', code: '214' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'Union Bank', code: '032' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'Wema Bank', code: '035' },
  { name: 'Polaris Bank', code: '076' },
  { name: 'Opay', code: '999992' },
  { name: 'Palmpay', code: '999991' },
  { name: 'Kuda Bank', code: '090267' },
  { name: 'Moniepoint', code: '090405' },
];

const CODE_SET = new Set(NIGERIAN_BANKS.map((b) => b.code));

export function isValidBankCode(code: string): boolean {
  return CODE_SET.has(code);
}

export function bankNameForCode(code: string): string | undefined {
  return NIGERIAN_BANKS.find((b) => b.code === code)?.name;
}
