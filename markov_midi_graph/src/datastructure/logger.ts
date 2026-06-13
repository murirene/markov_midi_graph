const STYLE = "color: #ff2222; text-shadow: 0 0 6px #ff2222, 0 0 12px #ff4444; font-weight: bold;"

export function logError(message: string): void {
  console.log(`%c⚠ ${message}`, STYLE)
}
