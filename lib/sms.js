// SMS service integration
// This is a placeholder - integrate with your preferred SMS provider
// Examples: Twilio, AWS SNS, MessageBird, etc.

const SMS_API_KEY = process.env.SMS_API_KEY || '';
const SMS_API_SECRET = process.env.SMS_API_SECRET || '';
const SMS_FROM_NUMBER = process.env.SMS_FROM_NUMBER || '';

export async function sendSMS({ to, message }) {
  if (!SMS_API_KEY || !SMS_API_SECRET) {
    console.warn('SMS not configured. Skipping SMS send.');
    console.log('SMS would be sent to:', to);
    console.log('Message:', message);
    return false;
  }

  try {
    // TODO: Integrate with your SMS provider
    // Example with Twilio:
    // const client = require('twilio')(SMS_API_KEY, SMS_API_SECRET);
    // await client.messages.create({
    //   body: message,
    //   from: SMS_FROM_NUMBER,
    //   to: to
    // });

    console.log('SMS sent to:', to);
    console.log('Message:', message);
    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
}

export function getOTPSMSMessage(otp) {
  return `Your iChat verification code is: ${otp}. This code expires in 10 minutes.`;
}
