import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Card, Typography, Button } from 'antd';
import { ShoppingOutlined, DoubleLeftOutlined, DoubleRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Category } from '../../../shares/types';

const { Title, Text } = Typography;

interface CategorySectionProps {
  categories: Category[];
  title?: string;
  showTitle?: boolean;
}

const CategorySection: React.FC<CategorySectionProps> = ({ 
  categories, 
  title = 'Danh mục sản phẩm',
  showTitle = true,
}) => {
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [displayCategories, setDisplayCategories] = useState<Category[]>([]);
  const [hasUserInteracted, setHasUserInteracted] = useState(false); // Track xem user đã bấm icon chưa
  const [isAnimating, setIsAnimating] = useState(false); // Track animation state
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null); // Track hướng slide

  // Sắp xếp categories theo display_order nếu có (chỉ tính toán một lần)
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      const orderA = a.display_order ?? 9999;
      const orderB = b.display_order ?? 9999;
      return orderA - orderB;
    });
  }, [categories]);

  // Khởi tạo displayCategories khi categories thay đổi (chỉ lần đầu hoặc khi categories thay đổi)
  useEffect(() => {
    // Chỉ reset về sortedCategories nếu user chưa tương tác hoặc categories thay đổi
    if (!hasUserInteracted) {
      setDisplayCategories(sortedCategories);
    }
  }, [categories]); // Chỉ phụ thuộc vào categories, không phải sortedCategories

  // Kiểm tra xem có thể scroll không
  const [canScroll, setCanScroll] = useState(false);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const hasScroll = container.scrollWidth > container.clientWidth;
      setCanScroll(hasScroll);
    }
  }, [displayCategories]);

  const scrollLeft = () => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    
    // Đánh dấu user đã tương tác
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
    }
    
    // Nếu có scroll thật (nhiều danh mục)
    if (canScroll) {
      const scrollAmount = (120 + 12) * 2.5; // ~330px
      const currentScroll = container.scrollLeft;
      const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth);
      
      if (currentScroll <= 10) {
        // Quay về cuối
        if (maxScroll > 0) {
          container.scrollTo({ left: maxScroll, behavior: 'smooth' });
        }
      } else {
        // Cuộn trái
        container.scrollTo({ 
          left: Math.max(0, currentScroll - scrollAmount), 
          behavior: 'smooth' 
        });
      }
    } else {
      // Nếu không có scroll (ít danh mục) - xoay vòng: arrow trái sẽ đưa phần tử đầu xuống cuối
      if (isAnimating) return; // Tránh spam click
      setIsAnimating(true);
      setSlideDirection('left'); // Đánh dấu hướng slide
      setDisplayCategories((prev) => {
        if (prev.length === 0) return prev;
        const newCategories = [...prev];
        const firstItem = newCategories.shift()!;
        return [...newCategories, firstItem];
      });
      setTimeout(() => {
        setIsAnimating(false);
        setSlideDirection(null);
      }, 400); // Reset sau khi animation xong
    }
  };

  const scrollRight = () => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    
    // Đánh dấu user đã tương tác
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
    }
    
    // Nếu có scroll thật (nhiều danh mục)
    if (canScroll) {
      const scrollAmount = (120 + 12) * 2.5; // ~330px
      const currentScroll = container.scrollLeft;
      const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth);
      const isAtEnd = currentScroll + container.clientWidth >= container.scrollWidth - 10;
      
      if (isAtEnd) {
        // Quay về đầu
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        // Cuộn phải
        container.scrollTo({ 
          left: Math.min(maxScroll, currentScroll + scrollAmount), 
          behavior: 'smooth' 
        });
      }
    } else {
      // Nếu không có scroll (ít danh mục) - xoay vòng: arrow phải sẽ đưa phần tử cuối lên đầu
      if (isAnimating) return; // Tránh spam click
      setIsAnimating(true);
      setSlideDirection('right'); // Đánh dấu hướng slide
      setDisplayCategories((prev) => {
        if (prev.length === 0) return prev;
        const newCategories = [...prev];
        const lastItem = newCategories.pop()!;
        return [lastItem, ...newCategories];
      });
      setTimeout(() => {
        setIsAnimating(false);
        setSlideDirection(null);
      }, 400); // Reset sau khi animation xong
    }
  };

  if (sortedCategories.length === 0) {
    return null;
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto 32px', padding: '0 16px', position: 'relative' }}>
      {showTitle && (
        <Title 
          level={2} 
          style={{ 
            marginBottom: 20,
            fontSize: 'clamp(1.25rem, 2vw, 1.5rem)',
            fontWeight: 600,
            textAlign: 'center',
          }}
        >
          {title}
        </Title>
      )}
      
      {/* Thanh danh mục cuộn ngang với mũi tên inline */}
      <div
        ref={scrollContainerRef}
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          overflowY: 'hidden',
          paddingBottom: 12,
          paddingLeft: 12,
          paddingRight: 12,
          scrollbarWidth: 'thin',
          scrollbarColor: '#d1d5db transparent',
          WebkitOverflowScrolling: 'touch',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        className="category-scroll-container"
      >
        {/* Mũi tên điều hướng trái - ở đầu danh sách */}
        <Button
          type="text"
          icon={<DoubleLeftOutlined />}
          onClick={scrollLeft}
          className="category-nav-arrow category-nav-arrow-left"
          style={{
            flex: '0 0 auto',
            marginRight: 8,
          }}
        />
        <style>{`
          .category-scroll-container::-webkit-scrollbar {
            height: 6px;
          }
          .category-scroll-container::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          .category-scroll-container::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 10px;
          }
          .category-scroll-container::-webkit-scrollbar-thumb:hover {
            background: #a8a8a8;
          }
          .category-item {
            transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease;
          }
          .category-item-slide-in {
            animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          }
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(30px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateX(0) scale(1);
            }
          }
          .category-scroll-container {
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          }
        `}</style>
        
        {displayCategories.map((category, index) => {
          const isFirstItem = index === 0;
          const isLastItem = index === displayCategories.length - 1;
          const shouldAnimate = 
            (slideDirection === 'left' && isLastItem) || // Khi slide left, item cuối (mới xuất hiện) có animation
            (slideDirection === 'right' && isFirstItem); // Khi slide right, item đầu (mới xuất hiện) có animation
          
          return (
          <div
            key={category.id}
            style={{
              flex: '0 0 auto',
              width: 120,
              minWidth: 120,
              transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease',
              transform: 'translateX(0)',
            }}
            className={`category-item ${shouldAnimate ? 'category-item-slide-in' : ''}`}
          >
            <Card
              hoverable
              onClick={() => navigate(`/products?category_slug=${category.slug || category.id}`)}
              style={{
                textAlign: 'center',
                borderRadius: 12,
                height: '100%',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                border: 'none',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              }}
              styles={{ 
                body: { 
                  padding: '16px 12px',
                } 
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
              }}
            >
              {category.image_url ? (
                <div
                  style={{
                    width: 70,
                    height: 70,
                    margin: '0 auto 10px',
                    borderRadius: '50%',
                    background: `url(${category.image_url}) center/cover`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: '2px solid #f3f4f6',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 70,
                    height: 70,
                    margin: '0 auto 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    background: '#f9fafb',
                    border: '2px solid #e5e7eb',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f3f4f6';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f9fafb';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                >
                  <ShoppingOutlined style={{ fontSize: 36, color: '#6b7280' }} />
                </div>
              )}
              <Text 
                strong 
                style={{ 
                  fontSize: 13,
                  display: 'block',
                  marginTop: 4,
                  color: '#374151',
                  lineHeight: 1.4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {category.name}
              </Text>
            </Card>
          </div>
          );
        })}
        
        {/* Mũi tên điều hướng phải - ở cuối danh sách */}
        <Button
          type="text"
          icon={<DoubleRightOutlined />}
          onClick={scrollRight}
          className="category-nav-arrow category-nav-arrow-right"
          style={{
            flex: '0 0 auto',
            marginLeft: 8,
          }}
        />
      </div>

      <style>{`
        .category-nav-arrow {
          width: 32px !important;
          height: 32px !important;
          min-width: 32px !important;
          padding: 0 !important;
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
          opacity: 0.9 !important;
        }
        .category-nav-arrow:hover {
          background: rgba(0, 0, 0, 0.55) !important;
          border-color: rgba(255, 255, 255, 0.35) !important;
          transform: scale(1.1) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35), 
                      0 2px 6px rgba(0, 0, 0, 0.2),
                      inset 0 1px 0 rgba(255, 255, 255, 0.15) !important;
          opacity: 1 !important;
        }
        .category-nav-arrow:active {
          transform: scale(1.05) !important;
        }
        .category-nav-arrow .anticon {
          font-size: 14px !important;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4)) !important;
          transition: transform 0.25s ease !important;
        }
        .category-nav-arrow:hover .anticon {
          transform: scale(1.15) !important;
        }
        .category-nav-arrow-left:hover .anticon {
          transform: translateX(-1px) scale(1.15) !important;
        }
        .category-nav-arrow-right:hover .anticon {
          transform: translateX(1px) scale(1.15) !important;
        }
        @media (max-width: 768px) {
          .category-nav-arrow {
            width: 28px !important;
            height: 28px !important;
            min-width: 28px !important;
            border-width: 1px !important;
          }
          .category-nav-arrow .anticon {
            font-size: 12px !important;
          }
        }
        @media (max-width: 480px) {
          .category-nav-arrow {
            width: 24px !important;
            height: 24px !important;
            min-width: 24px !important;
          }
          .category-nav-arrow .anticon {
            font-size: 10px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CategorySection;

