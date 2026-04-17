/**
 * Masking Engine
 *
 * All processing runs entirely in the browser.
 * No data is sent to any external API or server.
 *
 * Each rule uses a safe, non-backtracking regex pattern
 * to avoid ReDoS vulnerabilities.
 */

// ============================================
// Types
// ============================================

export interface MaskingRule {
  /** Unique ID for the rule */
  id: string;
  /** Human-readable label */
  label: string;
  /** Label in Japanese */
  labelJa: string;
  /** Regex pattern to detect the sensitive data */
  pattern: RegExp;
  /** Replacement function or string */
  replacer: (match: string, ...groups: string[]) => string;
}

export interface MaskingResult {
  /** The masked output text */
  maskedText: string;
  /** Summary of which rules were applied and how many times */
  summary: MaskingSummaryItem[];
  /** Total number of replacements */
  totalReplacements: number;
}

export interface MaskingSummaryItem {
  ruleId: string;
  label: string;
  labelJa: string;
  count: number;
}

// ============================================
// Masking Rules
// ============================================

/**
 * Helper: replace digits in a string with 'x', preserving hyphens/spaces
 */
function replaceDigitsWithX(str: string): string {
  return str.replace(/\d/g, 'x');
}

export const MASKING_RULES: MaskingRule[] = [
  // ------------------------------------------------
  // 1. Bearer Token / API Key
  //    Must come BEFORE email to avoid partial matches
  // ------------------------------------------------
  {
    id: 'bearer_token',
    label: 'Bearer Token',
    labelJa: 'Bearerトークン',
    pattern: /Bearer\s+[A-Za-z0-9\-_=.]{8,}/g,
    replacer: () => 'Bearer [REDACTED_API_KEY]',
  },

  // ------------------------------------------------
  // 2. AWS Access Key (starts with AKIA, 20 chars)
  // ------------------------------------------------
  {
    id: 'aws_access_key',
    label: 'AWS Access Key',
    labelJa: 'AWSアクセスキー',
    pattern: /\bAKIA[0-9A-Z]{16}\b/g,
    replacer: () => '[REDACTED_API_KEY]',
  },

  // ------------------------------------------------
  // 3. AWS Secret Key (40 char base64-like)
  // ------------------------------------------------
  {
    id: 'aws_secret_key',
    label: 'AWS Secret Key',
    labelJa: 'AWSシークレットキー',
    pattern: /\b(?:aws_secret_access_key|secret_access_key|AWS_SECRET_ACCESS_KEY)\s*[=:]\s*[A-Za-z0-9/+=]{40}\b/g,
    replacer: (match: string) => {
      const sep = match.includes('=') ? '=' : ':';
      const key = match.split(/[=:]/)[0];
      return `${key}${sep} [REDACTED_API_KEY]`;
    },
  },

  // ------------------------------------------------
  // 4. Generic API Key patterns  (key=..., token=..., etc.)
  // ------------------------------------------------
  {
    id: 'generic_api_key',
    label: 'API Key / Secret',
    labelJa: 'APIキー/シークレット',
    pattern: /\b(?:api[_-]?key|api[_-]?secret|access[_-]?token|secret[_-]?key|private[_-]?key|auth[_-]?token)\s*[=:]\s*["']?[A-Za-z0-9\-_=.]{8,}["']?/gi,
    replacer: (match: string) => {
      const parts = match.match(/^([^=:]+[=:])\s*/);
      return parts ? `${parts[1]} [REDACTED_API_KEY]` : '[REDACTED_API_KEY]';
    },
  },

  // ------------------------------------------------
  // 5. Email Address
  // ------------------------------------------------
  {
    id: 'email',
    label: 'Email Address',
    labelJa: 'メールアドレス',
    pattern: /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g,
    replacer: () => 'xxx@example.jp',
  },

  // ------------------------------------------------
  // 6. Credit Card Number (14-16 digits, optional hyphens/spaces)
  // ------------------------------------------------
  {
    id: 'credit_card',
    label: 'Credit Card Number',
    labelJa: 'クレジットカード番号',
    pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{2,4}[-\s]?\d{2,4}\b/g,
    replacer: (match: string) => {
      // Only match if total digits is 14-16
      const digits = match.replace(/\D/g, '');
      if (digits.length >= 14 && digits.length <= 16) {
        return 'xxxx-xxxx-xxxx-xxxx';
      }
      return match; // Not a CC number, return unchanged
    },
  },

  // ------------------------------------------------
  // 7. MAC Address (xx:xx:xx:xx:xx:xx or xx-xx-xx-xx-xx-xx)
  // ------------------------------------------------
  {
    id: 'mac_address',
    label: 'MAC Address',
    labelJa: 'MACアドレス',
    pattern: /\b[0-9A-Fa-f]{2}(?::[0-9A-Fa-f]{2}){5}\b|\b[0-9A-Fa-f]{2}(?:-[0-9A-Fa-f]{2}){5}\b/g,
    replacer: (match: string) => {
      const sep = match.includes(':') ? ':' : '-';
      return `xx${sep}xx${sep}xx${sep}xx${sep}xx${sep}xx`;
    },
  },

  // ------------------------------------------------
  // 8. IPv6 Address
  //    Must come BEFORE IPv4 to avoid partial matching
  // ------------------------------------------------
  {
    id: 'ipv6',
    label: 'IPv6 Address',
    labelJa: 'IPv6アドレス',
    pattern: /\b(?:[0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4}\b|\b(?:[0-9A-Fa-f]{1,4}:){1,7}:(?:[0-9A-Fa-f]{1,4}:){0,5}[0-9A-Fa-f]{1,4}\b|\b::(?:[0-9A-Fa-f]{1,4}:){0,5}[0-9A-Fa-f]{1,4}\b/g,
    replacer: () => 'xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx',
  },

  // ------------------------------------------------
  // 9. IPv4 Address
  // ------------------------------------------------
  {
    id: 'ipv4',
    label: 'IPv4 Address',
    labelJa: 'IPv4アドレス',
    pattern: /\b(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g,
    replacer: () => 'xxx.xxx.xxx.xxx',
  },

  // ------------------------------------------------
  // 10. Japanese Phone Number
  //     03-xxxx-xxxx, 090-xxxx-xxxx, 0120-xxx-xxx, etc.
  //     Also handles formats like 052-999-9999-1234
  // ------------------------------------------------
  {
    id: 'phone_number',
    label: 'Phone Number',
    labelJa: '電話番号',
    pattern: /\b0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{2,4}(?:[-\s]?\d{1,4})?\b/g,
    replacer: (match: string) => replaceDigitsWithX(match),
  },
];

// ============================================
// Engine
// ============================================

/**
 * Apply all masking rules to the input text.
 * Processing is done entirely in browser memory — no network calls.
 */
export function applyMasking(input: string): MaskingResult {
  let text = input;
  const summary: MaskingSummaryItem[] = [];
  let totalReplacements = 0;

  for (const rule of MASKING_RULES) {
    // Reset lastIndex for global regexes
    rule.pattern.lastIndex = 0;
    let count = 0;

    text = text.replace(rule.pattern, (...args: string[]) => {
      const result = rule.replacer(args[0], ...args.slice(1));
      // Only count if actual replacement happened
      if (result !== args[0]) {
        count++;
      }
      return result;
    });

    if (count > 0) {
      summary.push({
        ruleId: rule.id,
        label: rule.label,
        labelJa: rule.labelJa,
        count,
      });
      totalReplacements += count;
    }
  }

  return {
    maskedText: text,
    summary,
    totalReplacements,
  };
}
