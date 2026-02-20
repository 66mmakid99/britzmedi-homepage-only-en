// Email validation helpers for lead scoring integration
// Extends src/utils/email-validation.ts with isFreeEmail + domain extraction

export const FREE_EMAIL_DOMAINS = [
  // Global
  'gmail.com', 'googlemail.com',
  'yahoo.com', 'yahoo.co.uk', 'yahoo.co.jp', 'yahoo.fr', 'yahoo.de', 'yahoo.co.kr',
  'hotmail.com', 'hotmail.co.uk', 'hotmail.fr', 'hotmail.de',
  'outlook.com', 'outlook.co.uk', 'live.com', 'live.co.uk', 'msn.com',
  'icloud.com', 'me.com', 'mac.com',
  'protonmail.com', 'proton.me',
  'aol.com',
  'zoho.com',
  'mail.com',
  'gmx.com', 'gmx.net', 'gmx.de',
  'yandex.com', 'yandex.ru',
  'tutanota.com', 'fastmail.com',
  // Korea
  'naver.com', 'hanmail.net', 'daum.net', 'kakao.com',
  'nate.com', 'empal.com', 'dreamwiz.com', 'korea.com',
  // China
  'qq.com', '163.com', '126.com', 'sina.com',
  // Japan
  'docomo.ne.jp', 'ezweb.ne.jp', 'softbank.ne.jp',
  // Southeast Asia
  'rediffmail.com',
  // European regional
  'web.de', 'freenet.de', 't-online.de',
  'orange.fr', 'laposte.net', 'sfr.fr',
  'libero.it', 'virgilio.it',
];

export function isFreeEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return FREE_EMAIL_DOMAINS.includes(domain);
}

export function isValidEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function getEmailDomain(email: string): string {
  return email.split('@')[1]?.toLowerCase() || '';
}
