import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, Card, message, Typography, Space } from 'antd';
import { LockOutlined, PhoneOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../shares/services/authService';
import { useAuth } from '../../shares/contexts/AuthContext';
import { 
  sendOTP, 
  verifyOTP, 
  cleanupRecaptcha,
  formatPhoneNumber
} from '../../shares/services/firebaseService';
import type { ConfirmationResult } from 'firebase/auth';
import { logger } from '../../shares/utils/logger';

const { Title, Text } = Typography;

const Register: React.FC = () => {
  const [form] = Form.useForm();
  const [sendingOTP, setSendingOTP] = useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Ensure container exists and is visible
    if (recaptchaContainerRef.current) {
      recaptchaContainerRef.current.style.display = 'block';
      recaptchaContainerRef.current.style.visibility = 'visible';
      recaptchaContainerRef.current.style.minHeight = '78px';
    }
    
    // Cleanup on unmount
    return () => {
      cleanupRecaptcha();
    };
  }, []);

  const handleSendOTP = async (phone: string) => {
    setSendingOTP(true);
    try {
      const formattedPhone = formatPhoneNumber(phone);
      const result = await sendOTP(formattedPhone);
      setConfirmationResult(result);
      setOtpSent(true);
      message.success('Đã gửi mã OTP đến số điện thoại của bạn!');
    } catch (error: any) {
      logger.error('Error sending OTP', error instanceof Error ? error : new Error(String(error)));
      
      // Use error message from firebaseService if available
      let errorMessage = error.message || 'Không thể gửi mã OTP. Vui lòng thử lại.';
      
      // Additional error code handling
      if (error.code === 'auth/configuration-not-found') {
        errorMessage = 'reCAPTCHA chưa được cấu hình. Vui lòng cấu hình reCAPTCHA trong Firebase Console.';
        message.error({
          content: errorMessage,
          duration: 10, // Show longer for important errors
        });
      } else if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Số điện thoại không hợp lệ.';
        message.error(errorMessage);
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Quá nhiều yêu cầu. Vui lòng thử lại sau.';
        message.error(errorMessage);
      } else if (error.code === 'auth/captcha-check-failed') {
        errorMessage = 'Xác thực reCAPTCHA thất bại. Vui lòng thử lại.';
        message.error(errorMessage);
      } else {
        message.error(errorMessage);
      }
    } finally {
      setSendingOTP(false);
    }
  };

  const handleVerifyOTP = async (code: string, phone: string, password: string) => {
    if (!confirmationResult) {
      message.error('Vui lòng gửi mã OTP trước.');
      return;
    }

    setVerifyingOTP(true);
    try {
      // Verify OTP with Firebase
      const userCredential = await verifyOTP(confirmationResult, code);
      
      if (userCredential) {
        // Get Firebase ID token
        const idToken = await userCredential.getIdToken();
        
        // Register with backend (phone + password + idToken)
        const response = await authService.register({
          phone: phone,
          password: password,
          idToken: idToken
        });
        
        if (response.success && response.data) {
          // Update auth context with tokens and user data
          if (response.data.user) {
            login(response.data.token, response.data.user, response.data.refreshToken);
          }
          
          message.success('Đăng ký thành công!');
          
          // Navigate to home
          setTimeout(() => {
            navigate('/home');
          }, 1000);
        } else {
          message.error(response.message || 'Đăng ký thất bại');
        }
      }
    } catch (error: any) {
      logger.error('Error verifying OTP', error instanceof Error ? error : new Error(String(error)));
      let errorMessage = 'Mã OTP không đúng hoặc đã hết hạn.';
      
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'Mã OTP không đúng.';
      } else if (error.code === 'auth/code-expired') {
        errorMessage = 'Mã OTP đã hết hạn. Vui lòng gửi lại mã.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      message.error(errorMessage);
    } finally {
      setVerifyingOTP(false);
    }
  };

  const onFinish = async (values: { phone: string; password: string; confirmPassword?: string; code?: string }) => {
    if (!otpSent) {
      // Step 1: Send OTP
      if (!values.phone) {
        message.error('Vui lòng nhập số điện thoại!');
        return;
      }
      await handleSendOTP(values.phone);
    } else {
      // Step 2: Verify OTP and register
      if (!values.code) {
        message.error('Vui lòng nhập mã OTP!');
        return;
      }
      if (!values.password) {
        message.error('Vui lòng nhập mật khẩu!');
        return;
      }
      await handleVerifyOTP(values.code, values.phone, values.password);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <Card 
        style={{ 
          width: '100%', 
          maxWidth: 450,
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={2} style={{ marginBottom: 8 }}>Đăng ký</Title>
            <Text type="secondary">Tạo tài khoản mới</Text>
          </div>

          <Form
            form={form}
            name="register"
            onFinish={onFinish}
            layout="vertical"
            size="large"
            autoComplete="off"
          >
            <Form.Item
              name="phone"
              label="Số điện thoại"
              rules={[
                { required: true, message: 'Vui lòng nhập số điện thoại!' },
                { pattern: /^[0-9]{10}$/, message: 'Số điện thoại phải có 10 chữ số!' }
              ]}
            >
              <Input 
                prefix={<PhoneOutlined />} 
                placeholder="Nhập số điện thoại (ví dụ: 0912345678)"
                disabled={otpSent}
                maxLength={10}
              />
            </Form.Item>

            {otpSent && (
              <Form.Item
                name="code"
                label="Mã OTP"
                rules={[
                  { required: true, message: 'Vui lòng nhập mã OTP!' },
                  { pattern: /^[0-9]{6}$/, message: 'Mã OTP phải có 6 chữ số!' }
                ]}
              >
                <Input 
                  placeholder="Nhập mã OTP 6 chữ số"
                  maxLength={6}
                  style={{ textAlign: 'center', fontSize: 20, letterSpacing: 8 }}
                />
              </Form.Item>
            )}
            
            {!otpSent && (
              <Form.Item>
                <Button 
                  type="default"
                  block
                  loading={sendingOTP}
                  onClick={() => {
                    form.validateFields(['phone']).then((values) => {
                      if (values.phone) {
                        handleSendOTP(values.phone);
                      }
                    });
                  }}
                >
                  Gửi mã OTP
                </Button>
              </Form.Item>
            )}

            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu!' },
                { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự!' }
              ]}
              hasFeedback
            >
              <Input.Password 
                prefix={<LockOutlined />} 
                placeholder="Nhập mật khẩu (tối thiểu 8 ký tự)"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Xác nhận mật khẩu"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                  },
                }),
              ]}
              hasFeedback
            >
              <Input.Password 
                prefix={<LockOutlined />} 
                placeholder="Nhập lại mật khẩu"
              />
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                block 
                loading={verifyingOTP}
                style={{ height: 45 }}
                disabled={!otpSent}
              >
                {otpSent ? 'Xác thực và đăng ký' : 'Vui lòng gửi mã OTP trước'}
              </Button>
            </Form.Item>
            
            {/* reCAPTCHA container for Firebase - Must be visible and exist in DOM */}
            <div 
              ref={recaptchaContainerRef}
              id="recaptcha-container" 
              style={{ 
                minHeight: '78px', // Minimum height for reCAPTCHA widget
                display: 'block',
                visibility: 'visible',
                width: '100%'
              }}
            ></div>

            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">
                Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
              </Text>
            </div>
          </Form>
        </Space>
      </Card>
    </div>
  );
};

export default Register;
