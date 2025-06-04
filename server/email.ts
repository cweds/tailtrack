import { Resend } from 'resend';

export async function sendPasswordResetEmail(email: string, resetToken: string) {
  console.log('Attempting to send password reset email to:', email);
  console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
  console.log('RESEND_API_KEY first 10 chars:', process.env.RESEND_API_KEY?.substring(0, 10));
  console.log('RESEND_API_KEY length:', process.env.RESEND_API_KEY?.length);
  
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY environment variable is not set');
    return false;
  }

  // Test raw fetch approach to bypass Resend client issues
  const resetUrl = `${process.env.FRONTEND_URL || 'https://tailtrack.app'}/reset-password?token=${resetToken}`;
  
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TailTrack <noreply@tailtrack.app>',
        to: [email],
        subject: 'Reset your TailTrack password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; border: 1px solid #e1e5e9; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="margin-bottom: 10px;">
                <span style="font-size: 24px; color: #000000 !important; filter: grayscale(100%);">🐾</span>
              </div>
              <h1 style="color: #333; font-size: 24px; margin: 0; text-align: center;">TailTrack</h1>
              <h2 style="color: #666; font-size: 18px; margin: 10px 0 0 0; text-align: center;">Password Reset Request</h2>
            </div>
            
            <div style="margin-bottom: 30px;">
              <p style="color: #333; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                Hi there! We received a request to reset your TailTrack password.
              </p>
              
              <p style="color: #333; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
                Click the button below to create a new password:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #FF69B4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="color: #007bff; font-size: 14px; word-break: break-all; margin-bottom: 30px;">
                ${resetUrl}
              </p>
              
              <p style="color: #666; font-size: 14px; line-height: 1.5; margin-bottom: 10px;">
                This link will expire in 1 hour for security reasons.
              </p>
              
              <p style="color: #666; font-size: 14px; line-height: 1.5;">
                If you didn't request this password reset, you can safely ignore this email.
              </p>
            </div>
            
            <div style="border-top: 1px solid #e1e5e9; padding-top: 20px; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                TailTrack - Your pet care companion
              </p>
            </div>
          </div>
        `,
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Resend API error via fetch:', JSON.stringify(result, null, 2));
      return false;
    }

    console.log('Password reset email sent successfully via fetch:', result);
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return false;
  }
}