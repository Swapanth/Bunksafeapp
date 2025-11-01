/**
 * reCAPTCHA Configuration
 * 
 * To use your Firebase reCAPTCHA key in production:
 * 1. Go to https://console.firebase.google.com/project/YOUR_PROJECT/authentication/providers
 * 2. Click on Phone and copy the reCAPTCHA site key
 * 3. Go to https://www.google.com/recaptcha/admin and find your site
 * 4. Add these domains to the authorized domains:
 *    - localhost
 *    - 127.0.0.1
 *    - 192.168.0.109 (or your local IP)
 *    - Your production domain
 * 5. Replace the test key below with your production key
 */

export const RecaptchaConfig = {
  // Using Google's test key for development (works on any domain)
  siteKey: "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI",
    
  // Your Firebase key (uncomment when domains are properly configured):
  // siteKey: "6LdlTv0rAAAAAOBY_FyLnUprV0zhCZLXb5OXKvvX",
};