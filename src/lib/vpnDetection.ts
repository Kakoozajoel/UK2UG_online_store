export interface VpnCheckResult {
  isVpn: boolean;
  ip?: string;
  isp?: string;
  reason?: string;
}

// Known VPN, Proxy, Datacenter, and Anonymizer network keywords
const VPN_KEYWORDS = [
  'vpn',
  'proxy',
  'datacenter',
  'hosting',
  'm247',
  'digitalocean',
  'amazon',
  'aws',
  'google cloud',
  'microsoft azure',
  'linode',
  'hetzner',
  'vultr',
  'ovh',
  'expressvpn',
  'nordvpn',
  'surfshark',
  'cyberghost',
  'private internet access',
  'proton',
  'mullvad',
  'windscribe',
  'tunnelbear',
  'purevpn',
  'ipvanish',
  'hide.me',
  'zenmate',
  'fastestvpn',
  'vyprvpn',
  'hotspot shield',
  'cloudflare-net',
  'choopa',
  'leaseweb',
  'clouvider',
  'tzulo',
  'quadranet',
];

/**
 * Check whether the current visitor's connection is coming through a VPN or Proxy network
 */
export async function checkVpnAccess(): Promise<VpnCheckResult> {
  try {
    // Provider 1: ip-api.com
    const response = await fetch('https://ip-api.com/json/?fields=status,message,country,countryCode,isp,org,as,proxy,hosting,query', {
      signal: AbortSignal.timeout(3500),
    });
    if (response.ok) {
      const data = await response.json();
      if (data.status === 'success') {
        const ispLower = `${data.isp || ''} ${data.org || ''} ${data.as || ''}`.toLowerCase();
        const isVpnOrg = VPN_KEYWORDS.some((keyword) => ispLower.includes(keyword));
        const isProxy = Boolean(data.proxy);
        const isHosting = Boolean(data.hosting);

        if (isProxy || isHosting || isVpnOrg) {
          return {
            isVpn: true,
            ip: data.query,
            isp: data.isp || data.org || 'VPN Network',
            reason: isProxy ? 'Proxy Network Detected' : isHosting ? 'Hosting / Datacenter Connection' : 'VPN Provider Network',
          };
        }
        return { isVpn: false, ip: data.query, isp: data.isp };
      }
    }
  } catch (e) {
    // Fallback if primary API timeout or blocked
  }

  try {
    // Provider 2: ipapi.co fallback
    const res2 = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3500) });
    if (res2.ok) {
      const data2 = await res2.json();
      const orgLower = `${data2.org || ''} ${data2.asn || ''}`.toLowerCase();
      const isVpnOrg = VPN_KEYWORDS.some((keyword) => orgLower.includes(keyword));
      if (isVpnOrg) {
        return {
          isVpn: true,
          ip: data2.ip,
          isp: data2.org || 'VPN Network',
          reason: 'VPN / Proxy Network',
        };
      }
      return { isVpn: false, ip: data2.ip, isp: data2.org };
    }
  } catch (e) {}

  return { isVpn: false };
}
