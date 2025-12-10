import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

// Generate TOTP secret for authenticator app
export function generateTOTPSecret(userEmail, serviceName = 'iChat') {
  const secret = speakeasy.generateSecret({
    name: `${serviceName} (${userEmail})`,
    issuer: serviceName,
  });

  return {
    secret: secret.base32 || '',
    qrCodeUrl: secret.otpauth_url || '',
  };
}

// Generate QR code data URL for TOTP
export async function generateQRCode(otpauthUrl) {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

// Verify TOTP token
export function verifyTOTP(token, secret) {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 time steps (60 seconds) of tolerance
  });
}

// Generate TOTP token (for testing)
export function generateTOTPToken(secret) {
  return speakeasy.totp({
    secret,
    encoding: 'base32',
  });
}
