import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Typography, Space } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authService, RegisterRequest } from '../../shares/services/authService';
import { 
  sendOTP, 
  verifyOTP, 
  cleanupRecaptcha,
  formatPhoneNumber
} from '../../shares/services/firebaseService';
import { detectInputType } from '../../shares/utils';
import type { ConfirmationResult } from 'firebase/auth';

const { Title, Text } = Typography;

const Register: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [inputType, setInputType] = useState<'email' | 'phone' | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Don't initialize reCAPTCHA here - it will be initialized when sending OTP
    // This prevents reCAPTCHA from being rendered multiple times
    
    // Cleanup on unmount or when input type changes
    return () => {
      cleanupRecaptcha();
    };
  }, [inputType]);

  const handleSendOTP = async (phone: string) => {
    setSendingOTP(true);
    try {
      const formattedPhone = formatPhoneNumber(phone);
      const result = await sendOTP(formattedPhone);
      setConfirmationResult(result);
      setOtpSent(true);
      message.success('Đã gửi mã OTP đến số điện thoại của bạn!');
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      
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
        
        // Verify with backend (include password for registration)
        const response = await authService.verifyFirebasePhone(idToken, phone, undefined, password);
        
        if (response.success && response.data) {
          // Store tokens
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('refreshToken', response.data.refreshToken);
          
          message.success('Đăng ký và xác thực thành công!');
          
          // Navigate to dashboard or login
          setTimeout(() => {
            navigate('/dashboard');
          }, 1000);
        } else {
          message.error(response.message || 'Xác thực thất bại');
        }
      }
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      let errorMessage = 'Mã OTP không đúng hoặc đã hết hạn.';
      
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'Mã OTP không đúng.';
      } else if (error.code === 'auth/code-expired') {
        errorMessage = 'Mã OTP đã hết hạn. Vui lòng gửi lại mã.';
      }
      
      message.error(errorMessage);
    } finally {
      setVerifyingOTP(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const detectedType = detectInputType(value);
    setInputType(detectedType);
    
    // Reset OTP state when input changes
    if (detectedType !== 'phone') {
      setOtpSent(false);
      setConfirmationResult(null);
    }
  };

  const onFinish = async (values: RegisterRequest & { confirmPassword?: string; code?: string; emailOrPhone?: string }) => {
    const emailOrPhone = values.emailOrPhone || values.email || values.phone;
    
    if (!emailOrPhone) {
      message.error('Vui lòng nhập email hoặc số điện thoại!');
      return;
    }

    const detectedType = detectInputType(emailOrPhone);
    
    if (!detectedType) {
      message.error('Vui lòng nhập email hoặc số điện thoại hợp lệ!');
      return;
    }

    // Phone registration flow
    if (detectedType === 'phone') {
      if (!otpSent) {
        // Step 1: Send OTP
        await handleSendOTP(emailOrPhone);
      } else {
        // Step 2: Verify OTP and register
        if (!values.code) {
          message.error('Vui lòng nhập mã OTP!');
          return;
        }
        await handleVerifyOTP(values.code, emailOrPhone, values.password);
      }
      return;
    }

    // Email registration (existing flow)
    setLoading(true);
    try {
      const { confirmPassword, emailOrPhone: _, code: __, ...registerData } = values;
      const response = await authService.register({
        ...registerData,
        email: emailOrPhone,
      });
      
      if (response.success) {
        // Lưu password vào sessionStorage để tự động đăng nhập sau khi verify
        // SessionStorage sẽ tự động xóa khi đóng tab, an toàn hơn localStorage
        sessionStorage.setItem('pendingLoginPassword', values.password);
        if (response.data?.email) {
          sessionStorage.setItem('pendingLoginEmail', response.data.email);
        }
        if (response.data?.phone) {
          sessionStorage.setItem('pendingLoginPhone', response.data.phone);
        }
        
        message.success('Đăng ký thành công! Vui lòng xác thực tài khoản.');
        navigate('/verify', { 
          state: { 
            userId: response.data?.userId,
            email: response.data?.email,
            phone: response.data?.phone,
            password: values.password // Lưu password trong state để dùng ngay
          } 
        });
      } else {
        message.error(response.message || 'Đăng ký thất bại');
      }
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi đăng ký');
    } finally {
      setLoading(false);
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
              name="emailOrPhone"
              label="Email hoặc Số điện thoại"
              rules={[
                { required: true, message: 'Vui lòng nhập email hoặc số điện thoại!' },
                {
                  validator: (_, value) => {
                    if (!value) {
                      return Promise.resolve(); // Let required rule handle empty value
                    }
                    const type = detectInputType(value);
                    if (!type) {
                      return Promise.reject(new Error('Email hoặc số điện thoại không hợp lệ!'));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder="Nhập email hoặc số điện thoại"
                onChange={handleInputChange}
                disabled={otpSent && inputType === 'phone'}
              />
            </Form.Item>

            {inputType === 'phone' && (
              <>
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
                        form.validateFields(['emailOrPhone']).then((values) => {
                          if (values.emailOrPhone && detectInputType(values.emailOrPhone) === 'phone') {
                            handleSendOTP(values.emailOrPhone);
                          }
                        });
                      }}
                    >
                      Gửi mã OTP
                    </Button>
                  </Form.Item>
                )}
              </>
            )}

            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu!' },
                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
              ]}
              hasFeedback
            >
              <Input.Password 
                prefix={<LockOutlined />} 
                placeholder="Nhập mật khẩu"
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
                loading={loading || verifyingOTP}
                style={{ height: 45 }}
              >
                {inputType === 'phone' && otpSent ? 'Xác thực và đăng ký' : 'Đăng ký'}
              </Button>
            </Form.Item>
            
            {/* reCAPTCHA container for Firebase */}
            {inputType === 'phone' && (
              <div id="recaptcha-container"></div>
            )}

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
