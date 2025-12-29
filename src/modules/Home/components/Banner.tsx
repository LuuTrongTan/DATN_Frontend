import React from 'react';
import { Carousel, Typography, Button } from 'antd';
import { RightOutlined, LeftOutlined } from '@ant-design/icons';
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

// Wrapper components để loại bỏ props không hợp lệ từ Ant Design Carousel
const PrevArrow: React.FC<any> = (props) => {
  const { currentSlide, slideCount, ...restProps } = props;
  return (
    <div {...restProps} style={{ ...restProps.style }}>
      <LeftOutlined />
    </div>
  );
};

const NextArrow: React.FC<any> = (props) => {
  const { currentSlide, slideCount, ...restProps } = props;
  return (
    <div {...restProps} style={{ ...restProps.style }}>
      <RightOutlined />
    </div>
  );
};

const Banner: React.FC<BannerProps> = ({ banners = [] }) => {
  const navigate = useNavigate();

  // Default banners if none provided
  const defaultBanners: BannerItem[] = [
    {
      id: 1,
      title: 'Chào mừng đến với T-Shop',
      description: 'Khám phá bộ sưu tập quần áo thời trang đa dạng và phong phú',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200',
      link: '/products',
      buttonText: 'Mua sắm ngay',
    },
    {
      id: 2,
      title: 'Giảm giá đặc biệt',
      description: 'Ưu đãi lên đến 50% cho các sản phẩm quần áo thời trang',
      image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200',
      link: '/products',
      buttonText: 'Xem ngay',
    },
    {
      id: 3,
      title: 'Sản phẩm mới',
      description: 'Cập nhật những mẫu quần áo mới nhất theo xu hướng thời trang',
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200',
      link: '/products',
      buttonText: 'Khám phá',
    },
  ];

  const displayBanners = banners.length > 0 ? banners : defaultBanners;

  return (
    <div style={{ position: 'relative', marginBottom: 32 }}>
      <style>{`
        .banner-carousel .slick-arrow {
          z-index: 10;
          width: 32px !important;
          height: 32px !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          color: #fff !important;
          background: rgba(0, 0, 0, 0.35) !important;
          backdrop-filter: blur(8px) !important;
          -webkit-backdrop-filter: blur(8px) !important;
          border-radius: 50% !important;
          border: 1.5px solid rgba(255, 255, 255, 0.25) !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25), 
                      0 1px 4px rgba(0, 0, 0, 0.15),
                      inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
          cursor: pointer !important;
          margin-top: 0 !important;
          opacity: 0.9 !important;
        }
        .banner-carousel .slick-arrow:hover {
          background: rgba(0, 0, 0, 0.55) !important;
          border-color: rgba(255, 255, 255, 0.35) !important;
          transform: translateY(-50%) scale(1.1) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35), 
                      0 2px 6px rgba(0, 0, 0, 0.2),
                      inset 0 1px 0 rgba(255, 255, 255, 0.15) !important;
          opacity: 1 !important;
        }
        .banner-carousel .slick-arrow:active {
          transform: translateY(-50%) scale(1.05) !important;
        }
        .banner-carousel .slick-prev {
          left: 16px !important;
        }
        .banner-carousel .slick-next {
          right: 16px !important;
        }
        .banner-carousel .slick-arrow::before {
          display: none !important;
          content: '' !important;
        }
        .banner-carousel .slick-arrow::after {
          display: none !important;
          content: '' !important;
        }
        .banner-carousel .slick-prev,
        .banner-carousel .slick-next {
          font-size: 0 !important;
        }
        .banner-carousel .slick-prev .anticon,
        .banner-carousel .slick-next .anticon {
          font-size: 14px !important;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4)) !important;
          transition: transform 0.25s ease !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          line-height: 1 !important;
          margin: 0 !important;
          padding: 0 !important;
          position: absolute !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;
        }
        .banner-carousel .slick-arrow > * {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 100% !important;
          height: 100% !important;
          position: relative !important;
        }
        .banner-carousel .slick-arrow:hover .anticon {
          transform: translate(-50%, -50%) scale(1.15) !important;
        }
        .banner-carousel .slick-prev:hover .anticon {
          transform: translate(calc(-50% - 1px), -50%) scale(1.15) !important;
        }
        .banner-carousel .slick-next:hover .anticon {
          transform: translate(calc(-50% + 1px), -50%) scale(1.15) !important;
        }
        @media (max-width: 768px) {
          .banner-carousel .slick-arrow {
            width: 28px !important;
            height: 28px !important;
            border-width: 1px !important;
          }
          .banner-carousel .slick-prev {
            left: 10px !important;
          }
          .banner-carousel .slick-next {
            right: 10px !important;
          }
          .banner-carousel .slick-prev .anticon,
          .banner-carousel .slick-next .anticon {
            font-size: 12px !important;
          }
        }
        @media (max-width: 480px) {
          .banner-carousel .slick-arrow {
            width: 24px !important;
            height: 24px !important;
          }
          .banner-carousel .slick-prev {
            left: 8px !important;
          }
          .banner-carousel .slick-next {
            right: 8px !important;
          }
          .banner-carousel .slick-prev .anticon,
          .banner-carousel .slick-next .anticon {
            font-size: 10px !important;
          }
        }
      `}</style>
      <Carousel
        className="banner-carousel"
        autoplay
        autoplaySpeed={5000}
        effect="fade"
        arrows={true}
        prevArrow={<PrevArrow />}
        nextArrow={<NextArrow />}
        style={{
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
    </div>
  );
};

export default Banner;

