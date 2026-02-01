import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { AppLogger } from '../../../core/utils/Logger';
import { RecaptchaService } from '../../../data/services/RecaptchaService';

interface RecaptchaModalProps {
  visible: boolean;
  onSuccess: (token: string) => void;
  onError: (error: string) => void;
  onClose: () => void;
}

export const RecaptchaModal: React.FC<RecaptchaModalProps> = ({
  visible,
  onSuccess,
  onError,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);
  const recaptchaService = RecaptchaService.getInstance();

  // reCAPTCHA site key - you'll need to replace this with your actual site key
  const RECAPTCHA_SITE_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'; // This is a test key

  useEffect(() => {
    if (visible) {
      setLoading(true);
      AppLogger.info('RecaptchaModal: Modal opened');
    }
  }, [visible]);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      AppLogger.info('RecaptchaModal: Received message', data);

      if (data.type === 'success' && data.token) {
        AppLogger.info('RecaptchaModal: reCAPTCHA verification successful');
        recaptchaService.resolveWithToken(data.token);
        onSuccess(data.token);
      } else if (data.type === 'error') {
        const errorMsg = data.error || 'reCAPTCHA verification failed';
        AppLogger.error('RecaptchaModal: reCAPTCHA error', errorMsg);
        recaptchaService.resolveWithError(errorMsg);
        onError(errorMsg);
      } else if (data.type === 'expired') {
        AppLogger.warn('RecaptchaModal: reCAPTCHA expired');
        recaptchaService.resolveWithError('Security verification expired. Please try again.');
        onError('Security verification expired. Please try again.');
      } else if (data.type === 'cancel') {
        AppLogger.info('RecaptchaModal: User cancelled reCAPTCHA');
        recaptchaService.resolveWithError('Security verification cancelled');
        onClose();
      }
    } catch (error) {
      AppLogger.error('RecaptchaModal: Error parsing message', error);
      const errorMsg = 'Failed to process security verification';
      recaptchaService.resolveWithError(errorMsg);
      onError(errorMsg);
    }
  };

  const handleClose = () => {
    AppLogger.info('RecaptchaModal: User closed modal');
    recaptchaService.resolveWithError('User cancelled security verification');
    onClose();
  };

  const recaptchaHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <script src="https://www.google.com/recaptcha/api.js" async defer></script>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            padding: 20px;
          }
          .container {
            text-align: center;
            max-width: 400px;
          }
          h2 {
            color: #333;
            margin-bottom: 10px;
            font-size: 24px;
            font-weight: 600;
          }
          p {
            color: #666;
            margin-bottom: 30px;
            font-size: 16px;
            line-height: 1.5;
          }
          .recaptcha-wrapper {
            display: flex;
            justify-content: center;
            margin-bottom: 20px;
          }
          .g-recaptcha {
            transform: scale(0.9);
            transform-origin: center center;
          }
          @media (max-width: 400px) {
            .g-recaptcha {
              transform: scale(0.8);
            }
          }
          .cancel-button {
            background: #f5f5f5;
            color: #666;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            margin-top: 15px;
          }
          .cancel-button:hover {
            background: #e0e0e0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Security Verification</h2>
          <p>Please complete the verification to continue</p>
          
          <div class="recaptcha-wrapper">
            <div class="g-recaptcha" 
                 data-sitekey="${RECAPTCHA_SITE_KEY}"
                 data-callback="onSuccess"
                 data-expired-callback="onExpired"
                 data-error-callback="onError">
            </div>
          </div>
          
          <button class="cancel-button" onclick="onCancel()">Cancel</button>
        </div>

        <script>
          function onSuccess(token) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'success',
              token: token
            }));
          }

          function onExpired() {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'expired'
            }));
          }

          function onError(error) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'error',
              error: error || 'Verification failed'
            }));
          }

          function onCancel() {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'cancel'
            }));
          }
        </script>
      </body>
    </html>
  `;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Security Verification</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.loadingText}>Loading security check...</Text>
            </View>
          )}

          <WebView
            ref={webViewRef}
            source={{ html: recaptchaHTML }}
            onMessage={handleMessage}
            onLoadEnd={() => setLoading(false)}
            style={styles.webView}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            mixedContentMode="always"
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#6b7280',
    fontWeight: '300',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
