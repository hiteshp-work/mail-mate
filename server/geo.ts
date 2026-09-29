import { UAParser } from 'ua-parser-js';

const DEMO_LOCATIONS = [
  { city: 'San Francisco', region: 'California', country: 'United States', countryCode: 'US', flag: '🇺🇸' },
  { city: 'New York', region: 'New York', country: 'United States', countryCode: 'US', flag: '🇺🇸' },
  { city: 'London', region: 'England', country: 'United Kingdom', countryCode: 'GB', flag: '🇬🇧' },
  { city: 'Toronto', region: 'Ontario', country: 'Canada', countryCode: 'CA', flag: '🇨🇦' },
  { city: 'Berlin', region: 'Berlin', country: 'Germany', countryCode: 'DE', flag: '🇩🇪' },
  { city: 'Tokyo', region: 'Kanto', country: 'Japan', countryCode: 'JP', flag: '🇯🇵' },
  { city: 'Sydney', region: 'New South Wales', country: 'Australia', countryCode: 'AU', flag: '🇦🇺' },
  { city: 'Paris', region: 'Île-de-France', country: 'France', countryCode: 'FR', flag: '🇫🇷' },
  { city: 'Singapore', region: 'Singapore', country: 'Singapore', countryCode: 'SG', flag: '🇸🇬' },
  { city: 'Austin', region: 'Texas', country: 'United States', countryCode: 'US', flag: '🇺🇸' },
];

export function parseUserAgent(uaString: string | undefined) {
  if (!uaString) {
    return {
      client: 'Direct Webmail',
      os: 'Unknown OS',
      device: 'desktop' as const,
    };
  }

  const parser = new UAParser(uaString);
  const result = parser.getResult();

  // Check for common mail proxies (e.g., GoogleImageProxy, AppleMail)
  const isGoogleProxy = uaString.includes('GoogleImageProxy') || uaString.includes('via ggpht.com');
  const isAppleProxy = uaString.includes('AppleWebKit') && uaString.includes('Apple Mail');
  const isOutlook = uaString.includes('Outlook') || uaString.includes('Microsoft Office');
  const isThunderbird = uaString.includes('Thunderbird');

  let client = result.browser.name || 'Unknown Browser';
  if (isGoogleProxy) {
    client = 'Gmail Proxy';
  } else if (isAppleProxy) {
    client = 'Apple Mail (Privacy Protection)';
  } else if (isOutlook) {
    client = 'Microsoft Outlook';
  } else if (isThunderbird) {
    client = 'Mozilla Thunderbird';
  } else if (result.browser.name) {
    client = result.browser.name;
    if (result.browser.version) {
      client += ` ${result.browser.version.split('.')[0]}`;
    }
  }

  const os = result.os.name ? `${result.os.name} ${result.os.version || ''}`.trim() : 'Unknown OS';

  let device: 'desktop' | 'mobile' | 'tablet' | 'bot' | 'unknown' = 'desktop';
  const type = result.device.type;

  if (type === 'mobile') {
    device = 'mobile';
  } else if (type === 'tablet') {
    device = 'tablet';
  } else if (isGoogleProxy || uaString.toLowerCase().includes('bot') || uaString.toLowerCase().includes('crawler')) {
    device = isGoogleProxy ? 'desktop' : 'bot';
  } else if (result.os.name === 'iOS' || result.os.name === 'Android') {
    device = 'mobile';
  }

  return { client, os, device };
}

export function resolveLocation(ip: string | undefined) {
  const isLocal = !ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.');

  if (isLocal) {
    // Pick deterministic or random realistic location
    const randomIndex = Math.floor(Math.random() * DEMO_LOCATIONS.length);
    return DEMO_LOCATIONS[randomIndex];
  }

  // Fallback for demo / development
  return DEMO_LOCATIONS[0];
}
