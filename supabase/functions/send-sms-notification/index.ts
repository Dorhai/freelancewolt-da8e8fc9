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

    // Get Twilio credentials from secrets
    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
    const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      console.error('Missing Twilio configuration');
      return new Response(
        JSON.stringify({ error: 'Twilio configuration missing' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+?[0-9\s\-\(\)]+$/;
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

    // Format phone number (remove spaces, dashes, parentheses)
    const cleanPhoneNumber = to.replace(/[\s\-\(\)]/g, '');
    let formattedPhone = cleanPhoneNumber;
    
    // Add country code if not present
    if (!formattedPhone.startsWith('+')) {
      // If starts with 0, assume it's a local number and add country code
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+972' + formattedPhone.substring(1); // Israel country code as example
      } else if (formattedPhone.length === 10) {
        formattedPhone = '+1' + formattedPhone; // US country code
      } else {
        formattedPhone = '+' + formattedPhone;
      }
    }

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