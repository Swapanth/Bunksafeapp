import React, { useEffect, useState } from 'react';
import {
    Animated,
    StatusBar,
    Text,
    TouchableOpacity,
    Vibration,
    View,
} from 'react-native';
import { PhoneVerificationUseCase } from '../../../../domain/usecase/PhoneVerificationUseCase';
import { useRecaptcha } from '../../../hooks/useRecaptcha';
import { RecaptchaModal } from '../../components/RecaptchaModal';

// Create instance outside component to avoid recreation
const phoneVerificationUseCase = new PhoneVerificationUseCase();

interface OTPVerificationScreenProps {
  mobileNumber: string;
  onVerified: () => void;
  onBack: () => void;
}

export const OTPVerificationScreen: React.FC<OTPVerificationScreenProps> = ({
  mobileNumber,
  onVerified,
  onBack,
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [shake] = useState(new Animated.Value(0));
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationId, setVerificationId] = useState<string>('');
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [error, setError] = useState<string>('');

  // reCAPTCHA integration
  const {
    showRecaptcha,
    recaptchaToken,
    showRecaptchaModal,
    hideRecaptchaModal,
    handleRecaptchaSuccess,
    handleRecaptchaError,
    resetRecaptcha,
  } = useRecaptcha();

  // Send OTP when component mounts
  useEffect(() => {
    const sendInitialOTP = async () => {
      try {
        setError('');
        console.log('📱 Sending initial OTP to:', mobileNumber);
        const result = await phoneVerificationUseCase.sendOTP(mobileNumber);

        if (result.success && result.verificationId) {
          setVerificationId(result.verificationId);
          console.log('✅ Initial OTP sent successfully');
          
          // Set cooldown based on remaining time
          const cooldownSeconds = phoneVerificationUseCase.getRemainingCooldownSeconds(mobileNumber);
          setCountdown(cooldownSeconds || 60);
          setCanResend(false);
        } else {
          console.error('❌ Failed to send initial OTP:', result.error);
          setError(result.error || 'Failed to send OTP');
          
          if (result.canResendAt) {
            const now = new Date().getTime();
            const canResendAt = result.canResendAt.getTime();
            const remainingSeconds = Math.ceil((canResendAt - now) / 1000);
            setCountdown(Math.max(0, remainingSeconds));
            setCanResend(remainingSeconds <= 0);
          }
        }
      } catch (error) {
        console.error('Error sending initial OTP:', error);
        setError('Unable to send OTP. Please try again.');
      }
    };

    sendInitialOTP();
  }, [mobileNumber]);

  // Handle reCAPTCHA completion
  useEffect(() => {
    if (recaptchaToken) {
      console.log('reCAPTCHA completed, token received');
      // reCAPTCHA was completed, the service will handle the rest
      resetRecaptcha(); // Clear the token after use
    }
  }, [recaptchaToken, resetRecaptcha]);

  // Update countdown timer
  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const sendOTP = async () => {
    try {
      setError('');
      
      // Try sending OTP directly first (SHA-1 authentication)
      // If Firebase requires reCAPTCHA, the service will handle it automatically

      console.log('📱 Sending OTP to:', mobileNumber);
      const result = await phoneVerificationUseCase.sendOTP(mobileNumber);

      if (result.success && result.verificationId) {
        setVerificationId(result.verificationId);
        console.log('✅ OTP sent successfully');
        
        // OTP sent successfully
        
        // Set cooldown based on remaining time
        const cooldownSeconds = phoneVerificationUseCase.getRemainingCooldownSeconds(mobileNumber);
        setCountdown(cooldownSeconds || 60); // Default 60 seconds if no cooldown
        setCanResend(false);
      } else {
        console.error('❌ Failed to send OTP:', result.error);
        setError(result.error || 'Failed to send OTP');
        
        // Handle OTP send failure
        
        if (result.canResendAt) {
          const now = new Date().getTime();
          const canResendAt = result.canResendAt.getTime();
          const remainingSeconds = Math.ceil((canResendAt - now) / 1000);
          setCountdown(Math.max(0, remainingSeconds));
          setCanResend(remainingSeconds <= 0);
        }
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      setError('Unable to send OTP. Please try again.');
      // Handle error
    }
  };

  const handleResendOTP = async () => {
    if (!canResend || isResending) return;

    setIsResending(true);
    setError('');
    await sendOTP();
    setIsResending(false);
  };

  const handleKeyPress = (digit: string) => {
    const currentIndex = otp.findIndex(val => val === '');
    if (currentIndex !== -1) {
      const newOtp = [...otp];
      newOtp[currentIndex] = digit;
      setOtp(newOtp);

      // Auto verify when all 6 digits are entered
      if (currentIndex === 5) {
        verifyOTP([...newOtp]);
      }
    }
  };

  const handleBackspace = () => {
    const lastFilledIndex = otp.map((val, idx) => val !== '' ? idx : -1)
      .filter(idx => idx !== -1)
      .pop();

    if (lastFilledIndex !== undefined) {
      const newOtp = [...otp];
      newOtp[lastFilledIndex] = '';
      setOtp(newOtp);
    }
  };

  const verifyOTP = async (otpToVerify: string[]) => {
    setIsVerifying(true);
    const otpString = otpToVerify.join('');

    try {
      console.log('🔐 Verifying OTP:', otpString);
      const result = await phoneVerificationUseCase.verifyOTP(verificationId, otpString, mobileNumber);

      if (result.success) {
        console.log('✅ OTP verified successfully');
        setIsVerifying(false);
        setError('');
        onVerified();
      } else {
        console.log('❌ OTP verification failed:', result.error);
        // Update remaining attempts if provided
        if (result.remainingAttempts !== undefined) {
          setRemainingAttempts(result.remainingAttempts);
        }
        
        // Show error message
        setError(result.error || 'Invalid OTP. Please try again.');
        
        // Wrong OTP - shake animation and reset
        Vibration.vibrate(500);
        shakeAnimation();
        setOtp(['', '', '', '', '', '']);
        setIsVerifying(false);
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setError('Unable to verify OTP. Please try again.');
      // Wrong OTP - shake animation and reset
      Vibration.vibrate(500);
      shakeAnimation();
      setOtp(['', '', '', '', '', '']);
      setIsVerifying(false);
    }
  };

  const shakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shake, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const KeypadButton: React.FC<{ digit: string; onPress: () => void }> = ({ digit, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      className="w-20 h-20 m-1 mr-7 rounded-full bg-white border border-gray-200 items-center justify-center active:bg-gray-50" >
      <Text className="text-2xl font-semibold text-gray-800">{digit}</Text>
    </TouchableOpacity>
  );

  const formatMobileNumber = (number: string) => {
    return `+91 ${number.slice(0, 5)} ${number.slice(5)}`;
  };

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#EBF8FF" />

      <View className="pt-16 pb-8 px-6">
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={onBack} className="mr-4">
            <View className="w-10 h-10 rounded-full bg-white items-center justify-center">
              <Text className="text-lg">←</Text>
            </View>
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-3xl font-bold text-gray-800">
              Verify Phone
            </Text>
            <Text className="text-lg text-gray-600 mt-2">
              Enter the 6-digit code sent to
            </Text>
            <Text className="text-lg font-semibold text-gray-800 mt-1">
              {formatMobileNumber(mobileNumber)}
            </Text>
          </View>
        </View>
      </View>



      {/* Progress Indicator */}
      <View className="px-6 mb-8">
        <View className="flex-row items-center">
          <View className="flex-1 h-2 bg-green-500 rounded-full" />
          <View className="flex-1 h-2 bg-green-500 rounded-full ml-2" />
          <View className="flex-1 h-2 bg-gray-200 rounded-full ml-2" />
          <View className="flex-1 h-2 bg-gray-200 rounded-full ml-2" />
          <View className="flex-1 h-2 bg-gray-200 rounded-full ml-2" />
          <View className="flex-1 h-2 bg-gray-200 rounded-full ml-2" />
        </View>
        <Text className="text-sm text-gray-500 mt-2 text-center">Step 2 of 6</Text>
      </View>

      <View className="flex-1 items-center justify-center px-6">
        {/* OTP Display - 6 digits */}
        <Animated.View
          className="flex-row flex-wrap justify-center mb-12 mt-8 max-w-sm"
          style={{
            transform: [{ translateX: shake }],
          }}
        >
          {otp.map((digit, index) => (
            <View
              key={index}
              className={`w-12 h-12 rounded-xl m-1 border-2 items-center justify-center ${digit
                ? 'border-green-500 bg-green-50'
                : isVerifying && index === otp.findIndex(val => val === '')
                  ? 'border-green-500 bg-blue-50'
                  : 'border-gray-300 bg-white'
                }`}
            >
              {isVerifying && index === otp.findIndex(val => val === '') ? (
                <View className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              ) : (
                <Text className="text-lg font-bold text-gray-800">{digit}</Text>
              )}
            </View>
          ))}
        </Animated.View>

        {/* Error Message */}
        {error ? (
          <View className="mb-4 px-4">
            <Text className="text-red-600 text-center text-sm font-medium">
              {error}
            </Text>
          </View>
        ) : null}

        {/* Remaining Attempts Warning */}
        {remainingAttempts < 3 && remainingAttempts > 0 ? (
          <View className="mb-4 px-4">
            <Text className="text-orange-600 text-center text-sm">
              {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining
            </Text>
          </View>
        ) : null}


        {/* Custom Keypad */}
        <View className="items-center">
          {/* Row 1 */}
          <View className="flex-row justify-between items-center mb-6 px-8">
            <KeypadButton digit="1" onPress={() => handleKeyPress('1')} />
            <KeypadButton digit="2" onPress={() => handleKeyPress('2')} />
            <KeypadButton digit="3" onPress={() => handleKeyPress('3')} />
          </View>

          {/* Row 2 */}
          <View className="flex-row justify-between items-center mb-6 px-8">
            <KeypadButton digit="4" onPress={() => handleKeyPress('4')} />
            <KeypadButton digit="5" onPress={() => handleKeyPress('5')} />
            <KeypadButton digit="6" onPress={() => handleKeyPress('6')} />
          </View>

          {/* Row 3 */}
          <View className="flex-row justify-between items-center mb-6 px-8">
            <KeypadButton digit="7" onPress={() => handleKeyPress('7')} />
            <KeypadButton digit="8" onPress={() => handleKeyPress('8')} />
            <KeypadButton digit="9" onPress={() => handleKeyPress('9')} />
          </View>

          {/* Row 4 */}
          <View className="flex-row space-x-6 items-center">
            <View className="w-20" />
            <KeypadButton digit="0" onPress={() => handleKeyPress('0')} />
            <TouchableOpacity
              onPress={handleBackspace}
              className="w-20 h-20  ml-2 rounded-full bg-red-50 border border-red-200 items-center justify-center active:bg-red-100"
            >
              <Text className="text-2xl font-semibold text-red-600">⌫</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Resend Section */}
      <View className="p-6 items-center mt-10">
        {canResend ? (
          <TouchableOpacity
            onPress={handleResendOTP}
            disabled={isResending}
            className={`px-4 py-2 rounded-lg ${isResending ? 'opacity-50' : ''}`}
          >
            <Text className="text-blue-600 font-semibold">
              {isResending ? 'Sending...' : 'Resend Code'}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text className="text-gray-500">
            Resend in {countdown}s
          </Text>
        )}

      </View>

      {/* reCAPTCHA Modal */}
      <RecaptchaModal
        visible={showRecaptcha}
        onSuccess={handleRecaptchaSuccess}
        onClose={hideRecaptchaModal}
        onError={handleRecaptchaError}
      />
    </View>
  );
};
