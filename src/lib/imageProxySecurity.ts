const ALLOWED_IMAGE_APEX_DOMAINS = [
  'microsoft.com',
  'microsoftonline.com',
  'msftstatic.com',
  'msecnd.net',
  'office.com',
  'office.net',
  'msft.net',
  's-microsoft.com',
  'microsoft365.com',
] as const;

const BLOCKED_LITERAL_HOSTNAMES = new Set(['localhost', '0.0.0.0', '0', '::']);

export function isAllowedImageHost(hostname: string): boolean {
  const normalizedHostname = hostname.toLowerCase();
  return ALLOWED_IMAGE_APEX_DOMAINS.some(
    apex => normalizedHostname === apex || normalizedHostname.endsWith(`.${apex}`),
  );
}

export function isSsrfHost(hostname: string): boolean {
  if (BLOCKED_LITERAL_HOSTNAMES.has(hostname.toLowerCase())) return true;
  return isPrivateIpv4(hostname) || isPrivateIpv6(hostname);
}

function isPrivateIpv4(hostname: string): boolean {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(hostname);
  if (!match) return false;

  const octets = match.slice(1).map(Number);
  if (octets.some(octet => octet > 255)) return false;

  const [first = 0, second = 0] = octets;
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

function isPrivateIpv6(hostname: string): boolean {
  const normalizedHostname = (
    hostname.startsWith('[') ? hostname.slice(1, -1) : hostname
  ).toLowerCase();

  if (normalizedHostname === '::1') return true;

  const firstFourCharacters = normalizedHostname.substring(0, 4);
  if (!/^fe[89ab][0-9a-f]$/.test(firstFourCharacters)) return false;

  const firstSegment = parseInt(firstFourCharacters, 16);
  return firstSegment >= 0xfe80 && firstSegment <= 0xfebf;
}
