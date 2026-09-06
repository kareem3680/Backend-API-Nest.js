const KNOWN_TOOLS = [
  'PostmanRuntime',
  'curl',
  'python-requests',
  'insomnia',
  'okhttp',
  'axios',
] as const;

const BROWSER_PATTERNS: readonly [RegExp, string][] = [
  [/Edg\/([\d.]+)/, 'Edge'],
  [/OPR\/([\d.]+)/, 'Opera'],
  [/Chrome\/([\d.]+)/, 'Chrome'],
  [/Firefox\/([\d.]+)/, 'Firefox'],
  [/Version\/([\d.]+).*Safari/, 'Safari'],
];

export function shortenUserAgent(userAgent: string | undefined): string {
  if (!userAgent) return 'unknown';

  const toolPattern = new RegExp(
    `^(${KNOWN_TOOLS.join('|')})\\/?([\\d.]+)?`,
    'i',
  );
  const toolMatch = userAgent.match(toolPattern);
  if (toolMatch) {
    return toolMatch[2] ? `${toolMatch[1]} ${toolMatch[2]}` : toolMatch[1];
  }

  for (const [pattern, name] of BROWSER_PATTERNS) {
    const match = userAgent.match(pattern);
    if (match) {
      const majorVersion = match[1].split('.')[0];
      return `${name} ${majorVersion}`;
    }
  }

  return userAgent.length > 30 ? `${userAgent.slice(0, 30)}...` : userAgent;
}
