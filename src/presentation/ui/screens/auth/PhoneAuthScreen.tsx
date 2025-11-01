import {
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInWithCredential
} from 'firebase/auth';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { auth } from '../../../../config/firebase';

export default function PhoneAuthScreen() {
  const [phoneNumber, setPhoneNumber] = useState('+917794022444');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRecaptcha, setShowRecaptcha] = useState(false);
  const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null);
  const webViewRef = useRef<WebView>(null);

  // Initialize reCAPTCHA for Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      setupRecaptcha();
    }
  }, []);

  const setupRecaptcha = () => {
    try {
      console.log('Setting up reCAPTCHA for Android');
      // For React Native, we'll handle reCAPTCHA via WebView
    } catch (error) {
      console.error('reCAPTCHA setup error:', error);
    }
  };

  // Step 1: Send OTP
  const sendOTP = async () => {
    try {
      setLoading(true);
      console.log('📱 Sending OTP to:', phoneNumber);

      // For Android, show reCAPTCHA first
      if (Platform.OS === 'android') {
        console.log('Showing reCAPTCHA for Android');
        setShowRecaptcha(true);
      } else {
        // For iOS, direct send (iOS handles reCAPTCHA automatically)
        console.log('Sending OTP directly (iOS)');
        const phoneProvider = new PhoneAuthProvider(auth);
        const verificationId = await phoneProvider.verifyPhoneNumber(phoneNumber);

        setVerificationId(verificationId);
        Alert.alert('Success', 'OTP sent to ' + phoneNumber);
        console.log('✅ OTP sent successfully');
        setLoading(false);
      }
    } catch (error: any) {
      console.error('❌ Error sending OTP:', error);
      Alert.alert('Error', 'Failed to send OTP: ' + error.message);
      setLoading(false);
      setShowRecaptcha(false);
    }
  };

  // Handle reCAPTCHA completion
  const handleRecaptchaComplete = async () => {
    try {
      console.log('reCAPTCHA completed, sending OTP');
      const phoneProvider = new PhoneAuthProvider(auth);

      // For Android with WebView reCAPTCHA
      const verificationId = await phoneProvider.verifyPhoneNumber(phoneNumber);

      setVerificationId(verificationId);
      setShowRecaptcha(false);
      Alert.alert('Success', 'OTP sent to ' + phoneNumber);
      console.log('✅ OTP sent after reCAPTCHA');
    } catch (error: any) {
      console.error('❌ Error after reCAPTCHA:', error);
      Alert.alert('Error', 'Failed to send OTP: ' + error.message);
      setShowRecaptcha(false);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const verifyOTP = async () => {
    if (!verificationId) {
      Alert.alert('Error', 'Please send OTP first');
      return;
    }

    try {
      setLoading(true);
      console.log('🔐 Verifying OTP:', verificationCode);

      const credential = PhoneAuthProvider.credential(
        verificationId,
        verificationCode
      );

      const userCredential = await signInWithCredential(auth, credential);

      Alert.alert('Success', 'Phone verified! UID: ' + userCredential.user.uid);
      console.log('✅ User authenticated:', userCredential.user.uid);
      console.log('✅ Phone:', userCredential.user.phoneNumber);

      return userCredential.user;
    } catch (error: any) {
      console.error('❌ Error verifying OTP:', error);
      Alert.alert('Error', 'Invalid OTP: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const recaptchaHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js"></script>
      <script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js"></script>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          padding: 20px; 
          text-align: center;
          background: #f5f5f5;
        }
        .container {
          background: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h3 { color: #333; margin-bottom: 10px; }
        p { color: #666; margin-bottom: 20px; }
        #recaptcha-container { margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h3>🤖 reCAPTCHA Verification</h3>
        <p>Please complete the verification to continue</p>
        <div id="recaptcha-container"></div>
        <p><small>This helps us verify that you're not a robot</small></p>
      </div>
      <script>
        // Firebase config
        const firebaseConfig = {
          apiKey: "${process.env.EXPO_PUBLIC_FIREBASE_API_KEY}",
          authDomain: "${process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN}",
          projectId: "${process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID}",
        };
        
        firebase.initializeApp(firebaseConfig);
        
        // Initialize reCAPTCHA
        window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
          size: 'normal',
          callback: function(response) {
            console.log('reCAPTCHA solved:', response);
            window.ReactNativeWebView.postMessage('recaptcha-success');
          },
          'expired-callback': function() {
            console.log('reCAPTCHA expired');
            window.ReactNativeWebView.postMessage('recaptcha-expired');
          }
        });
        
        window.recaptchaVerifier.render().then(function(widgetId) {
          console.log('reCAPTCHA rendered with widget ID:', widgetId);
        });
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📱 Phone Authentication</Text>

      <TextInput
        placeholder="Phone Number (+917794022444)"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
        style={styles.input}
        editable={!loading && !showRecaptcha}
      />

      <Button
        title={loading ? "Sending..." : "Send OTP"}
        onPress={sendOTP}
        disabled={loading || showRecaptcha}
      />

      {/* reCAPTCHA WebView for Android */}
      {showRecaptcha && Platform.OS === 'android' && (
        <View style={styles.recaptchaContainer}>
          <WebView
            ref={webViewRef}
            source={{ html: recaptchaHTML }}
            style={styles.webview}
            onMessage={(event) => {
              const message = event.nativeEvent.data;
              console.log('WebView message:', message);
              if (message === 'recaptcha-success') {
                handleRecaptchaComplete();
              } else if (message === 'recaptcha-expired') {
                Alert.alert('Error', 'reCAPTCHA expired. Please try again.');
                setShowRecaptcha(false);
                setLoading(false);
              }
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            onError={(error) => {
              console.error('WebView error:', error.nativeEvent.description);
            }}
          />
          <Button
            title="Cancel"
            onPress={() => {
              setShowRecaptcha(false);
              setLoading(false);
            }}
            color="#ff6b6b"
          />
        </View>
      )}

      {verificationId && !showRecaptcha && (
        <>
          <View style={styles.successContainer}>
            <Text style={styles.successText}>✅ OTP Sent Successfully!</Text>
            <Text style={styles.infoText}>Check your SMS for the 6-digit code</Text>
          </View>

          <TextInput
            placeholder="Enter 6-digit OTP"
            value={verificationCode}
            onChangeText={setVerificationCode}
            keyboardType="number-pad"
            maxLength={6}
            style={[styles.input, styles.otpInput]}
            editable={!loading}
          />
          <Button
            title={loading ? "Verifying..." : "Verify OTP"}
            onPress={verifyOTP}
            disabled={loading || verificationCode.length !== 6}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    fontSize: 16,
  },
  otpInput: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 18,
    letterSpacing: 2,
    borderColor: '#007bff',
    borderWidth: 2,
  },
  recaptchaContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  webview: {
    width: '90%',
    height: '60%',
    backgroundColor: 'white',
    borderRadius: 10,
  },
  successContainer: {
    backgroundColor: '#d4edda',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  successText: {
    color: '#155724',
    fontWeight: 'bold',
    fontSize: 16,
  },
  infoText: {
    color: '#155724',
    fontSize: 14,
    marginTop: 5,
  },
});