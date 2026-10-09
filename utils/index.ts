export * from './attendance'
export * from './format'
export * from './message'
export * from './retry'

/**
 * 按逗号分割配置项（环境变量 / secret）。
 *
 * 会额外做清洗：
 * - 去掉首尾空白、换行、制表符（GitHub Secret 常因粘贴带入 `\n`）
 * - 去掉包裹的成对引号（从 JSON 里复制 `content` 字段时容易带上）
 * - 过滤空串
 */
export function getSplitByComma(value: string): string[] {
  if (!value)
    return []

  return value
    .split(',')
    .map((item) => {
      let v = item.trim()
      // 去掉成对包裹的引号，例如 `abc"` 或 'abc'
      if (v.length >= 2) {
        const first = v[0]
        const last = v[v.length - 1]
        if ((first === '"' || first === '\'') && first === last)
          v = v.slice(1, -1).trim()
      }
      return v
    })
    .filter(Boolean)
}

/**
 * Generate a storage key for daily attendance record
 * Uses SHA256 hash of token combined with date in YYYY-MM-DD format (Asia/Shanghai timezone)
 */
export async function generateAttendanceKey(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  // Get current date in Asia/Shanghai timezone
  const now = new Date()
  const shanghaiDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now) // Returns YYYY-MM-DD format

  return `kv:attendance:${hashHex}:${shanghaiDate}`
}
