import React from 'react';
import { Typography, Table, Tag, Card, Divider, Button, message, Tabs } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { generateCurl, generateJavascript, generatePython, generateJava } from '../../utils/codeGenerators';

const { Title, Text } = Typography;

interface Props {
  apiData: any;
}

const Documentation: React.FC<Props> = ({ apiData }) => {
  if (!apiData) return null;

  let content: any = {};
  try {
    content = JSON.parse(apiData.content || '{}');
  } catch (e) {}

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('Copied to clipboard');
  };

  const paramColumns = [
    { title: 'Name', dataIndex: 'key', key: 'key' },
    { title: 'Type', dataIndex: 'type', key: 'type', render: (t: string) => <Tag color="blue">{t}</Tag> },
    { title: 'Description', dataIndex: 'description', key: 'description' },
  ];

  const codeItems = [
    { label: 'cURL', key: 'curl', generator: generateCurl },
    { label: 'JavaScript', key: 'javascript', generator: generateJavascript },
    { label: 'Python', key: 'python', generator: generatePython },
    { label: 'Java', key: 'java', generator: generateJava },
  ];

  return (
    <div style={{ padding: '24px 40px', maxWidth: 1000, margin: '0 auto' }}>
      <Title level={2}>{apiData.title}</Title>
      
      {content.tags && content.tags.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {content.tags.map((tag: string) => (
            <Tag key={tag} color="blue" style={{ borderRadius: 12 }}>{tag}</Tag>
          ))}
        </div>
      )}
      
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Tag color={content.method === 'POST' ? 'orange' : 'green'} style={{ fontSize: 16, padding: '4px 12px' }}>
          {content.method || 'GET'}
        </Tag>
        <Text copyable style={{ fontSize: 16, fontFamily: 'monospace' }}>{content.url}</Text>
      </div>

      <Divider />

      <Title level={4}>Request Parameters</Title>
      <Table 
        dataSource={content.queryParams || []} 
        columns={paramColumns} 
        pagination={false} 
        size="small" 
        rowKey="id" 
        style={{ marginBottom: 32 }}
      />

      <Title level={4}>Request Headers</Title>
      <Table 
        dataSource={content.headers || []} 
        columns={paramColumns} 
        pagination={false} 
        size="small" 
        rowKey="id" 
        style={{ marginBottom: 32 }}
      />

      {content.bodyType === 'json' && (
        <>
          <Title level={4}>Request Body (JSON)</Title>
          <Card size="small" style={{ background: '#fafafa', marginBottom: 32 }}>
            <pre style={{ margin: 0 }}>{content.bodyContent}</pre>
          </Card>
        </>
      )}

      <Divider />

      <Title level={4}>Code Generation</Title>
      <Tabs 
        type="card"
        items={codeItems.map(item => {
            const code = item.generator(content);
            return {
                label: item.label,
                key: item.key,
                children: (
                    <div style={{ position: 'relative' }}>
                        <Button 
                            icon={<CopyOutlined />} 
                            size="small" 
                            style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}
                            onClick={() => copyToClipboard(code)}
                        >
                            Copy
                        </Button>
                        <Card size="small" style={{ background: '#1e1e1e', color: '#fff' }}>
                            <pre style={{ margin: 0, overflow: 'auto', maxHeight: 400 }}>{code}</pre>
                        </Card>
                    </div>
                )
            };
        })}
      />
    </div>
  );
};

export default Documentation;