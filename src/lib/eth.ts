const DECIMALS = 18
const WEI_PER_ETH = 10n ** BigInt(DECIMALS)
const ETH_PATTERN = /^\d+(\.\d+)?$/

export type EthString = string

export function isEthString(value: string): boolean {
  if (!ETH_PATTERN.test(value)) return false
  const fraction = value.split('.')[1] ?? ''
  return fraction.length <= DECIMALS
}

export function parseEth(value: EthString): bigint {
  if (!isEthString(value)) throw new Error(`Invalid ETH amount: "${value}"`)
  const [whole = '0', fraction = ''] = value.split('.')
  return BigInt(whole) * WEI_PER_ETH + BigInt(fraction.padEnd(DECIMALS, '0'))
}

export function formatEth(wei: bigint, minDecimals = 2): EthString {
  const negative = wei < 0n
  const absolute = negative ? -wei : wei
  const whole = absolute / WEI_PER_ETH
  const fraction = (absolute % WEI_PER_ETH).toString().padStart(DECIMALS, '0').replace(/0+$/, '')
  const padded = fraction.padEnd(minDecimals, '0')
  return `${negative ? '-' : ''}${whole}${padded ? `.${padded}` : ''}`
}

export function addEth(...values: EthString[]): EthString {
  return formatEth(values.reduce((total, value) => total + parseEth(value), 0n))
}

export function multiplyEth(value: EthString, quantity: number): EthString {
  if (!Number.isInteger(quantity) || quantity < 0) throw new Error(`Invalid quantity: ${quantity}`)
  return formatEth(parseEth(value) * BigInt(quantity))
}

export function compareEth(a: EthString, b: EthString): number {
  const difference = parseEth(a) - parseEth(b)
  return difference === 0n ? 0 : difference > 0n ? 1 : -1
}

export function displayEth(value: EthString): string {
  return `${value} ETH`
}
