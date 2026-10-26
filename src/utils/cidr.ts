// IPv4 and CIDR calculation & validation utilities for AWS VPC Peering Lab

export function isValidIpv4(ip: string): boolean {
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return false;
  return parts.every(p => {
    if (!/^\d+$/.test(p)) return false;
    const num = parseInt(p, 10);
    return num >= 0 && num <= 255 && (p === '0' || !p.startsWith('0'));
  });
}

export function isValidCidr(cidr: string): { valid: boolean; error?: string } {
  const trimmed = cidr.trim();
  const parts = trimmed.split('/');
  if (parts.length !== 2) {
    return { valid: false, error: 'CIDR must be in format IP/mask (e.g. 10.10.0.0/16)' };
  }

  const [ip, maskStr] = parts;
  if (!isValidIpv4(ip)) {
    return { valid: false, error: `Invalid IPv4 address: ${ip}` };
  }

  if (!/^\d+$/.test(maskStr)) {
    return { valid: false, error: 'Prefix mask must be an integer between 0 and 32' };
  }

  const mask = parseInt(maskStr, 10);
  if (mask < 0 || mask > 32) {
    return { valid: false, error: `Prefix length /${mask} must be between 0 and 32 (AWS VPC allows /16 to /28)` };
  }

  return { valid: true };
}

export function ipToInt(ip: string): number {
  return ip
    .trim()
    .split('.')
    .reduce((acc, octet) => ((acc << 8) + parseInt(octet, 10)) >>> 0, 0);
}

export function intToIp(intVal: number): string {
  return [
    (intVal >>> 24) & 255,
    (intVal >>> 16) & 255,
    (intVal >>> 8) & 255,
    intVal & 255
  ].join('.');
}

export function getCidrRange(cidr: string): { startInt: number; endInt: number; mask: number; totalIps: number } {
  const [ip, maskStr] = cidr.trim().split('/');
  const mask = parseInt(maskStr, 10);
  const ipNum = ipToInt(ip);
  const maskInt = mask === 0 ? 0 : (~0 << (32 - mask)) >>> 0;
  const networkInt = (ipNum & maskInt) >>> 0;
  const broadcastInt = mask === 0 ? 0xffffffff : (networkInt | (~maskInt >>> 0)) >>> 0;
  const totalIps = Math.pow(2, 32 - mask);

  return {
    startInt: networkInt,
    endInt: broadcastInt,
    mask,
    totalIps
  };
}

export function isIpInCidr(ip: string, cidr: string): boolean {
  if (!isValidIpv4(ip)) return false;
  const validation = isValidCidr(cidr);
  if (!validation.valid) return false;

  const { startInt, endInt } = getCidrRange(cidr);
  const ipNum = ipToInt(ip);
  return ipNum >= startInt && ipNum <= endInt;
}

export function isCidrContained(childCidr: string, parentCidr: string): boolean {
  const child = getCidrRange(childCidr);
  const parent = getCidrRange(parentCidr);
  return child.startInt >= parent.startInt && child.endInt <= parent.endInt;
}

export function doCidrsOverlap(cidr1: string, cidr2: string): boolean {
  const range1 = getCidrRange(cidr1);
  const range2 = getCidrRange(cidr2);
  return Math.max(range1.startInt, range2.startInt) <= Math.min(range1.endInt, range2.endInt);
}

/**
 * Find the most specific (longest prefix match) route for a destination IP
 */
export function findMatchingRoute(routes: { destinationCidr: string }[], destinationIp: string) {
  let bestMatch: any = null;
  let bestMask = -1;

  for (const route of routes) {
    if (isIpInCidr(destinationIp, route.destinationCidr)) {
      const mask = parseInt(route.destinationCidr.split('/')[1] || '0', 10);
      if (mask > bestMask) {
        bestMask = mask;
        bestMatch = route;
      }
    }
  }

  return bestMatch;
}
