/**
 * SMS Dispatch Service Abstraction
 * Supports configurable SMS providers (Fast2SMS, Twilio, AWS SNS)
 * with graceful fallback and explicit status reporting when unconfigured.
 */

export interface ISmsProvider {
  name: string;
  isConfigured: boolean;
  sendSms(
    to: string,
    message: string,
    otp?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string; statusCode?: number }>;
}

class Fast2SmsProvider implements ISmsProvider {
  name = 'Fast2SMS';

  get apiKey(): string {
    return (process.env.FAST2SMS_API_KEY || '').trim();
  }

  get isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 10);
  }

  async sendSms(to: string, message: string, otp?: string) {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'Fast2SMS credentials not configured in environment (FAST2SMS_API_KEY).',
      };
    }

    const cleanPhone = to.replace(/\D/g, '').slice(-10);
    console.log(`\n======================================================`);
    console.log(`[SMS Service (LIVE FAST2SMS)] Dispatching to +91 ${cleanPhone}`);
    if (otp) console.log(`[SMS Service] 6-digit OTP Code: ${otp}`);
    console.log(`======================================================`);

    // 1. Primary: Fast2SMS dedicated OTP route (pre-approved DLT template for OTPs)
    if (otp) {
      try {
        const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: {
            authorization: this.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            variables_values: otp,
            route: 'otp',
            numbers: cleanPhone,
          }),
        });

        const data: any = await res.json().catch(() => ({}));
        if (data.return) {
          console.log(
            `[SMS Service (FAST2SMS SUCCESS)] Delivered via OTP route. Request ID: ${data.request_id}`
          );
          return { success: true, messageId: data.request_id };
        }

        console.warn(`[SMS Service (Fast2SMS OTP Route Note)] Status ${data.status_code}: ${data.message}`);

        // If OTP route requires website verification (996), attempt route 'q' as fallback
        if (data.status_code === 996) {
          console.log(`[SMS Service (Fast2SMS)] Trying fallback Quick SMS route (q)...`);
          const resQ = await fetch('https://www.fast2sms.com/dev/bulkV2', {
            method: 'POST',
            headers: {
              authorization: this.apiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              route: 'q',
              message,
              language: 'english',
              flash: 0,
              numbers: cleanPhone,
            }),
          });
          const dataQ: any = await resQ.json().catch(() => ({}));
          if (dataQ.return) {
            console.log(
              `[SMS Service (FAST2SMS SUCCESS)] Delivered via Quick route. Request ID: ${dataQ.request_id}`
            );
            return { success: true, messageId: dataQ.request_id };
          }
          console.warn(`[SMS Service (Fast2SMS Quick Route Note)] Status ${dataQ.status_code}: ${dataQ.message}`);
          return {
            success: false,
            error: data.message || dataQ.message || 'Fast2SMS delivery blocked',
            statusCode: data.status_code || dataQ.status_code,
          };
        }

        return {
          success: false,
          error: data.message || 'Fast2SMS delivery failed',
          statusCode: data.status_code,
        };
      } catch (err: any) {
        console.error(`[SMS Service (Fast2SMS Network Error)]`, err.message);
        return { success: false, error: err.message };
      }
    }

    // 2. Standard custom message dispatch (route 'q')
    try {
      const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'q',
          message,
          language: 'english',
          flash: 0,
          numbers: cleanPhone,
        }),
      });
      const data: any = await res.json().catch(() => ({}));
      if (data.return) {
        console.log(
          `[SMS Service (FAST2SMS SUCCESS)] Delivered via Quick route. Request ID: ${data.request_id}`
        );
        return { success: true, messageId: data.request_id };
      }
      return { success: false, error: data.message || 'SMS delivery failed', statusCode: data.status_code };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}

// Development / Local simulated provider
class LocalDevSmsProvider implements ISmsProvider {
  name = 'LocalDevConsole';
  isConfigured = true;

  async sendSms(to: string, message: string) {
    console.log('\n======================================================');
    console.log(
      `[SMS Service (${process.env.NODE_ENV === 'production' ? 'BLOCKED - NO PROVIDER' : 'Local Dev Simulation'})]`
    );
    console.log(`To: ${to}`);
    console.log(`Message: ${message}`);
    console.log('Note: To enable live SMS delivery, set FAST2SMS_API_KEY in Backend/.env');
    console.log('======================================================\n');
    return { success: true, messageId: `sim_${Date.now()}` };
  }
}

export const getActiveSmsProvider = (): ISmsProvider => {
  const apiKey = (process.env.FAST2SMS_API_KEY || '').trim();
  return apiKey.length > 10 ? new Fast2SmsProvider() : new LocalDevSmsProvider();
};

export const sendPhoneOtp = async (
  phone: string,
  otp: string
): Promise<{
  success: boolean;
  isSimulated: boolean;
  status: string;
  error?: string;
  provider?: string;
}> => {
  const isProd = process.env.NODE_ENV === 'production';
  const provider = getActiveSmsProvider();
  const hasRealProvider = provider.isConfigured && provider.name !== 'LocalDevConsole';

  if (isProd && !hasRealProvider) {
    return {
      success: false,
      isSimulated: false,
      status: 'BLOCKED',
      provider: provider.name,
      error:
        'Live SMS provider credentials (FAST2SMS_API_KEY) are not configured. SMS delivery is currently blocked.',
    };
  }

  const message = `Your TripzoBox verification code is: ${otp}. Valid for 5 minutes. Never share this OTP with anyone.`;
  const result = await provider.sendSms(phone, message, otp);

  // If Fast2SMS delivered successfully
  if (result.success && hasRealProvider) {
    return {
      success: true,
      isSimulated: false,
      status: 'DELIVERED',
      provider: provider.name,
    };
  }

  // If Fast2SMS returned an account setup action (e.g. KYC / ₹100 transaction needed)
  if (hasRealProvider && !result.success) {
    return {
      success: !isProd, // In development mode, don't crash or break the workflow
      isSimulated: true,
      status: 'FAST2SMS_ACTION_REQUIRED',
      provider: provider.name,
      error: result.error,
    };
  }

  return {
    success: result.success,
    isSimulated: !hasRealProvider,
    status: result.success ? (hasRealProvider ? 'DELIVERED' : 'SIMULATED') : 'FAILED',
    provider: provider.name,
    error: result.error,
  };
};

export const getSmsProviderStatus = () => {
  const provider = getActiveSmsProvider();
  return {
    provider: provider.name,
    isConfigured: provider.isConfigured && provider.name !== 'LocalDevConsole',
  };
};
