import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SMSNotificationRequest {
  to: string;
  message: string;
  type?: 'booking_confirmation' | 'booking_update' | 'reminder';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, message, type = 'booking_confirmation' }: SMSNotificationRequest = await req.json();

    console.log('Sending SMS notification:', { to, type, messageLength: message.length });

    // Get Twilio credentials from secrets - check both possible names
    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID') || Deno.env.get('TWILIO_SID_TOKEN');
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
    const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER');

    console.log('Twilio configuration check:');
    console.log('ACCOUNT_SID exists:', !!TWILIO_ACCOUNT_SID, 'Value preview:', TWILIO_ACCOUNT_SID?.substring(0, 10) + '...');
    console.log('AUTH_TOKEN exists:', !!TWILIO_AUTH_TOKEN, 'Value preview:', TWILIO_AUTH_TOKEN?.substring(0, 10) + '...');
    console.log('PHONE_NUMBER exists:', !!TWILIO_PHONE_NUMBER, 'Value:', TWILIO_PHONE_NUMBER);

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      console.error('Missing Twilio configuration');
      const missingFields = [];
      if (!TWILIO_ACCOUNT_SID) missingFields.push('TWILIO_ACCOUNT_SID');
      if (!TWILIO_AUTH_TOKEN) missingFields.push('TWILIO_AUTH_TOKEN');
      if (!TWILIO_PHONE_NUMBER) missingFields.push('TWILIO_PHONE_NUMBER');
      
      console.error('Missing fields:', missingFields.join(', '));
      
      return new Response(
        JSON.stringify({ 
          error: 'Twilio configuration missing', 
          missing_fields: missingFields 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate phone number format (more flexible for Israeli numbers)
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]+$/;
    if (!phoneRegex.test(to)) {
      console.error('Invalid phone number format:', to);
      return new Response(
        JSON.stringify({ error: 'Invalid phone number format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Format phone number for Israel (remove spaces, dashes, parentheses)
    let cleanPhoneNumber = to.replace(/[\s\-\(\)]/g, '');
    let formattedPhone = cleanPhoneNumber;
    
    console.log('Original phone:', to);
    console.log('Cleaned phone:', cleanPhoneNumber);
    
    // Handle Israeli phone numbers
    if (!formattedPhone.startsWith('+')) {
      if (formattedPhone.startsWith('0')) {
        // Israeli local number starting with 0 (remove 0, add +972)
        formattedPhone = '+972' + formattedPhone.substring(1);
      } else if (formattedPhone.startsWith('972')) {
        // Number already has country code but no +
        formattedPhone = '+' + formattedPhone;
      } else if (formattedPhone.length >= 9 && formattedPhone.length <= 10) {
        // Assume Israeli mobile number, add country code
        formattedPhone = '+972' + formattedPhone;
      } else {
        // Default to US for other numbers
        formattedPhone = '+1' + formattedPhone;
      }
    } else {
      // Already has +, but check for common mistake: "+972 0524..."
      if (formattedPhone.includes(' 0')) {
        formattedPhone = formattedPhone.replace(' 0', '');
      }
    }
    
    console.log('Final formatted phone:', formattedPhone);

    // Prepare Twilio API request
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    
    const body = new URLSearchParams({
      From: TWILIO_PHONE_NUMBER,
      To: formattedPhone,
      Body: message
    });

    console.log('Making Twilio API request to:', twilioUrl);
    console.log('From:', TWILIO_PHONE_NUMBER, 'To:', formattedPhone);

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Twilio API error:', result);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send SMS', 
          details: result.message || 'Unknown error' 
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('SMS sent successfully:', result.sid);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageSid: result.sid,
        status: result.status 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in send-sms-notification:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});