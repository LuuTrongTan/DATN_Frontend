import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography, Space } from 'antd';
import { MailOutlined, PhoneOutlined, ArrowLeftOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../shares/services/authService';
import { 
  sendOTP, 
  verifyOTP, 
  formatPhoneNumber
} from '../../shares/services/firebaseService';
import type { ConfirmationResult } from 'firebase/auth';

const { Title, Text } = Typography;

const ForgotPassword: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [forgotType, setForgotType] = useState<'email' | 'phone'>('email');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [emailForReset, setEmailForReset] = useState<string>('');
  const navigate = useNavigate();

  // Handle send OTP for phone
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
      message.error(error.message || 'Không thể gửi mã OTP. Vui lòng thử lại.');
    } finally {
      setSendingOTP(false);
    }
  };

  // Handle verify OTP and reset password for phone
  const handleVerifyOTPAndReset = async (code: string, phone: string, newPassword: string) => {
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
        
        // Reset password via backend
        const response = await authService.forgotPasswordByPhone(
          phone,
          idToken,
          newPassword,
          newPassword // confirmPassword same as newPassword
        );
        
        if (response.success) {
          message.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.');
          setTimeout(() => {
            navigate('/login');
          }, 1500);
        } else {
          message.error(response.message || 'Đặt lại mật khẩu thất bại');
        }
      }
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
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

  // Handle email forgot password (send code)
  const handleEmailForgotPassword = async (email: string) => {
    setLoading(true);
    try {
      const response = await authService.forgotPasswordByEmail(email);
      if (response.success) {
        setEmailForReset(email);
      setSubmitted(true);
        message.success('Đã gửi mã đặt lại mật khẩu đến email của bạn!');
      } else {
        message.error(response.message || 'Có lỗi xảy ra');
      }
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: {
    email?: string;
    phone?: string;
    code?: string;
    newPassword?: string;
    confirmPassword?: string;
  }) => {
    if (forgotType === 'phone') {
      if (!otpSent) {
        // Step 1: Send OTP
        if (!values.phone) {
          message.error('Vui lòng nhập số điện thoại!');
          return;
        }
        await handleSendOTP(values.phone);
      } else {
        // Step 2: Verify OTP and reset password
        if (!values.code || !values.newPassword) {
          message.error('Vui lòng nhập đầy đủ mã OTP và mật khẩu mới!');
          return;
        }
        if (values.newPassword !== values.confirmPassword) {
          message.error('Mật khẩu xác nhận không khớp!');
          return;
        }
        await handleVerifyOTPAndReset(values.code, values.phone!, values.newPassword);
      }
    } else {
      // Email flow - just send code
      if (!values.email) {
        message.error('Vui lòng nhập email!');
        return;
      }
      await handleEmailForgotPassword(values.email);
    }
  };

  // Reset password page for email (after code sent)
  if (submitted && forgotType === 'email') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px'
      }}>
        <Card style={{ width: '100%', maxWidth: 450 }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div style={{ textAlign: 'center' }}>
            <Title level={3}>Đã gửi mã thành công!</Title>
            <Text type="secondary">
                Chúng tôi đã gửi mã đặt lại mật khẩu đến email <strong>{emailForReset}</strong>.
                Vui lòng kiểm tra email và nhập mã bên dưới.
            </Text>
            </div>

            <Form
              form={form}
              name="resetPassword"
              onFinish={async (values) => {
                setLoading(true);
                try {
                  const response = await authService.resetPassword(
                    values.code,
                    emailForReset,
                    values.newPassword,
                    values.confirmPassword
                  );
                  if (response.success) {
                    message.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.');
                    setTimeout(() => {
                      navigate('/login');
                    }, 1500);
                  } else {
                    message.error(response.message || 'Đặt lại mật khẩu thất bại');
                  }
                } catch (error: any) {
                  message.error(error.message || 'Có lỗi xảy ra');
                } finally {
                  setLoading(false);
                }
              }}
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="code"
                label="Mã xác thực"
                rules={[
                  { required: true, message: 'Vui lòng nhập mã xác thực!' },
                  { pattern: /^[0-9]{6}$/, message: 'Mã xác thực phải có 6 chữ số!' }
                ]}
              >
                <Input 
                  placeholder="Nhập mã xác thực 6 chữ số"
                  maxLength={6}
                  style={{ textAlign: 'center', fontSize: 20, letterSpacing: 8 }}
                />
              </Form.Item>

              <Form.Item
                name="newPassword"
                label="Mật khẩu mới"
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                  { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự!' }
                ]}
                hasFeedback
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="Nhập mật khẩu mới"
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Xác nhận mật khẩu"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
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
                  placeholder="Nhập lại mật khẩu mới"
                />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  block 
                  loading={loading}
                  style={{ height: 45 }}
                >
                  Đặt lại mật khẩu
                </Button>
              </Form.Item>

              <div style={{ textAlign: 'center' }}>
                <Button 
                  type="link" 
                  onClick={() => {
                    setSubmitted(false);
                    form.resetFields();
                  }}
                >
                  Quay lại
            </Button>
              </div>
            </Form>
          </Space>
        </Card>
      </div>
    );
  }

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
            <Title level={2} style={{ marginBottom: 8 }}>Quên mật khẩu</Title>
            <Text type="secondary">
              {forgotType === 'phone' && otpSent 
                ? 'Nhập mã OTP và mật khẩu mới để đặt lại mật khẩu'
                : `Nhập ${forgotType === 'email' ? 'email' : 'số điện thoại'} để đặt lại mật khẩu`
              }
            </Text>
          </div>

          {!otpSent && (
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <Button.Group>
              <Button 
                type={forgotType === 'email' ? 'primary' : 'default'}
                onClick={() => {
                  setForgotType('email');
                  form.setFieldsValue({ phone: undefined });
                }}
                icon={<MailOutlined />}
              >
                Email
              </Button>
              <Button 
                type={forgotType === 'phone' ? 'primary' : 'default'}
                onClick={() => {
                  setForgotType('phone');
                  form.setFieldsValue({ email: undefined });
                }}
                icon={<PhoneOutlined />}
              >
                Số điện thoại
              </Button>
            </Button.Group>
          </div>
          )}

          <Form
            form={form}
            name="forgotPassword"
            onFinish={onFinish}
            layout="vertical"
            size="large"
            autoComplete="off"
          >
            {forgotType === 'email' ? (
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email!' },
                  { type: 'email', message: 'Email không hợp lệ!' }
                ]}
              >
                <Input 
                  prefix={<MailOutlined />} 
                  placeholder="Nhập email của bạn"
                />
              </Form.Item>
            ) : (
              <>
              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại!' },
                    { pattern: /^[0-9]{11}$/, message: 'Số điện thoại phải có 11 chữ số!' }
                ]}
              >
                <Input 
                  prefix={<PhoneOutlined />} 
                    placeholder="Nhập số điện thoại (ví dụ: 0912345678)"
                    disabled={otpSent}
                    maxLength={11}
                  />
                </Form.Item>

                {otpSent && (
                  <>
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

                    <Form.Item
                      name="newPassword"
                      label="Mật khẩu mới"
                      rules={[
                        { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                        { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự!' }
                      ]}
                      hasFeedback
                    >
                      <Input.Password 
                        prefix={<LockOutlined />} 
                        placeholder="Nhập mật khẩu mới"
                      />
                    </Form.Item>

                    <Form.Item
                      name="confirmPassword"
                      label="Xác nhận mật khẩu"
                      dependencies={['newPassword']}
                      rules={[
                        { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('newPassword') === value) {
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
                        placeholder="Nhập lại mật khẩu mới"
                />
              </Form.Item>
                  </>
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
              </>
            )}

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                block 
                loading={loading || verifyingOTP}
                style={{ height: 45 }}
                disabled={forgotType === 'phone' && !otpSent}
              >
                {forgotType === 'phone' && otpSent 
                  ? 'Đặt lại mật khẩu' 
                  : forgotType === 'phone'
                  ? 'Vui lòng gửi mã OTP trước'
                  : 'Gửi mã đặt lại mật khẩu'
                }
              </Button>
            </Form.Item>

            {/* reCAPTCHA container for Firebase */}
            {forgotType === 'phone' && (
              <div id="recaptcha-container"></div>
            )}

            <div style={{ textAlign: 'center' }}>
              <Link to="/login">
                <Button type="link" icon={<ArrowLeftOutlined />}>
                  Quay lại đăng nhập
                </Button>
              </Link>
            </div>
          </Form>
        </Space>
      </Card>
    </div>
  );
};

export default ForgotPassword;
