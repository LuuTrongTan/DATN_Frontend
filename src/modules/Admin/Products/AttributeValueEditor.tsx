import React, { useState } from 'react';
import { Card, Space, Typography, Tag, Button, Input, Modal } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface AttributeValueEditorProps {
  attributeName: string;
  displayName: string;
  values: string[];
  onRemove: () => void;
  onEdit?: (newAttributeName: string, newValues: string[]) => void;
}

const AttributeValueEditor: React.FC<AttributeValueEditorProps> = ({
  attributeName,
  displayName,
  values,
  onRemove,
  onEdit,
}) => {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingAttributeName, setEditingAttributeName] = useState(attributeName);
  const [editingValues, setEditingValues] = useState<string[]>(values);
  const [newValueInput, setNewValueInput] = useState('');

  const handleSaveEdit = () => {
    if (onEdit && editingAttributeName.trim()) {
      onEdit(editingAttributeName.trim(), editingValues.filter(v => v.trim()));
      setEditModalVisible(false);
    }
  };

  const handleAddValue = () => {
    if (newValueInput.trim() && !editingValues.includes(newValueInput.trim())) {
      setEditingValues([...editingValues, newValueInput.trim()]);
      setNewValueInput('');
    }
  };

  const handleRemoveValue = (valueToRemove: string) => {
    setEditingValues(editingValues.filter(v => v !== valueToRemove));
  };

  return (
    <>
      <Card
        size="small"
        style={{ 
          border: '1px solid #e8e8e8',
          borderRadius: 6,
          backgroundColor: '#ffffff',
        }}
        bodyStyle={{ padding: '12px' }}
        extra={
          <Space>
            {onEdit && (
              <Button
                type="default"
                size="small"
                icon={<EditOutlined />}
                onClick={() => {
                  setEditingAttributeName(attributeName);
                  setEditingValues([...values]);
                  setNewValueInput('');
                  setEditModalVisible(true);
                }}
                style={{
                  borderRadius: 4,
                  fontWeight: 500,
                  fontSize: 12,
                }}
              >
                Sửa
              </Button>
            )}
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={onRemove}
              style={{
                borderRadius: 4,
                fontWeight: 500,
                fontSize: 12,
              }}
            >
              Xóa
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <div>
            <Tag color="blue" style={{ 
              fontSize: 13, 
              padding: '4px 10px',
              borderRadius: 4,
              fontWeight: 600,
              border: 'none',
              margin: 0,
            }}>
              {displayName}
            </Tag>
            {attributeName !== displayName && (
              <Text type="secondary" style={{ fontSize: 11, marginLeft: 6 }}>
                ({attributeName})
              </Text>
            )}
          </div>
          
          <div>
            <Text type="secondary" style={{ fontSize: 12, marginBottom: 6, display: 'block' }}>
              Các giá trị:
            </Text>
            <Space wrap style={{ width: '100%' }} size={[4, 4]}>
              {values.map((value) => (
                <Tag
                  key={value}
                  style={{
                    fontSize: 12,
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontWeight: 400,
                    backgroundColor: '#f5f5f5',
                    border: '1px solid #e8e8e8',
                    color: '#595959',
                    margin: 0,
                  }}
                >
                  {value}
                </Tag>
              ))}
            </Space>
          </div>
        </Space>
      </Card>

      {onEdit && (
        <Modal
          title="Sửa thuộc tính"
          open={editModalVisible}
          onOk={handleSaveEdit}
          onCancel={() => {
            setEditModalVisible(false);
            setEditingAttributeName(attributeName);
            setEditingValues([...values]);
            setNewValueInput('');
          }}
          okText="Lưu"
          cancelText="Hủy"
          width={500}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                Tên thuộc tính
              </Text>
              <Input
                value={editingAttributeName}
                onChange={(e) => setEditingAttributeName(e.target.value)}
                placeholder="Ví dụ: Size, Color..."
              />
            </div>
            
            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                Các giá trị
              </Text>
              <Space wrap style={{ width: '100%', marginBottom: 8 }} size={[4, 4]}>
                {editingValues.map((value) => (
                  <Tag
                    key={value}
                    closable
                    onClose={() => handleRemoveValue(value)}
                    style={{
                      fontSize: 12,
                      padding: '4px 8px',
                    }}
                  >
                    {value}
                  </Tag>
                ))}
              </Space>
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  placeholder="Nhập giá trị mới..."
                  value={newValueInput}
                  onChange={(e) => setNewValueInput(e.target.value)}
                  onPressEnter={handleAddValue}
                />
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAddValue}
                  disabled={!newValueInput.trim()}
                >
                  Thêm
                </Button>
              </Space.Compact>
            </div>
          </Space>
        </Modal>
      )}
    </>
  );
};

export default AttributeValueEditor;
