import React from 'react';
import { Carousel, Typography, Button } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

interface BannerItem {
  id: number;
  title: string;
  description: string;
  image: string;
  link?: string;
  buttonText?: string;
}

interface BannerProps {
  banners?: BannerItem[];
}

const Banner: React.FC<BannerProps> = ({ banners = [] }) => {
  const navigate = useNavigate();

  // Default banners if none provided
  const defaultBanners: BannerItem[] = [
    {
      id: 1,
      title: 'Chào mừng đến với XGame',
      description: 'Khám phá bộ sưu tập game và phụ kiện gaming đa dạng',
      image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200',
      link: '/products',
      buttonText: 'Mua sắm ngay',
    },
    {
      id: 2,
      title: 'Giảm giá đặc biệt',
      description: 'Ưu đãi lên đến 50% cho các sản phẩm gaming',
      image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=1200',
      link: '/products',
      buttonText: 'Xem ngay',
    },
    {
      id: 3,
      title: 'Sản phẩm mới',
      description: 'Cập nhật những sản phẩm gaming mới nhất',
      image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200',
      link: '/products',
      buttonText: 'Khám phá',
    },
  ];

  const displayBanners = banners.length > 0 ? banners : defaultBanners;

  return (
    <Carousel
      autoplay
      autoplaySpeed={5000}
      effect="fade"
      style={{
        marginBottom: 32,
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }}
    >
      {displayBanners.map((banner) => (
        <div key={banner.id}>
          <div
            style={{
              position: 'relative',
              height: '400px',
              background: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${banner.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                textAlign: 'center',
                color: '#fff',
                padding: '0 20px',
                maxWidth: 800,
              }}
            >
              <Title
                level={1}
                style={{
                  color: '#fff',
                  fontSize: 'clamp(28px, 5vw, 48px)',
                  marginBottom: 16,
                  textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                }}
              >
                {banner.title}
              </Title>
              <Paragraph
                style={{
                  color: '#fff',
                  fontSize: 'clamp(16px, 2vw, 20px)',
                  marginBottom: 32,
                  textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                }}
              >
                {banner.description}
              </Paragraph>
              {banner.buttonText && (
                <Button
                  type="primary"
                  size="large"
                  icon={<RightOutlined />}
                  onClick={() => banner.link && navigate(banner.link)}
                  style={{
                    height: 50,
                    paddingLeft: 32,
                    paddingRight: 32,
                    fontSize: 16,
                    borderRadius: 25,
                  }}
                >
                  {banner.buttonText}
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </Carousel>
  );
};

export default Banner;

