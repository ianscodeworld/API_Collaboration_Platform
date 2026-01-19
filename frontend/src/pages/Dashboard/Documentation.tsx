import React from 'react';
import { Typography, Table, Tag, Card, Divider, Button, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';

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

  const generateCurl = () => {
    let curl = `curl --location --request ${content.method || 'GET'} '${content.url || ''}'`;
    
    // Headers
    if (content.headers) {
      content.headers.forEach((h: any) => {
        if (h.key && h.enabled) curl += ` \
--header '${h.key}: ${h.value}'`;
      });
    }

    // Body
    if (content.bodyType === 'json' && content.bodyContent) {
      // Simple escape for single quotes in curl command
      const escapedBody = content.bodyContent.replace(/'/g, "'\\''");
      curl += ` \\\n--data-raw '${escapedBody}'`;
    }

    return curl;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('Copied to clipboard');
  };

  const paramColumns = [
    { title: 'Name', dataIndex: 'key', key: 'key' },
    { title: 'Type', dataIndex: 'type', key: 'type', render: (t: string) => <Tag color="blue">{t}</Tag> },
    { title: 'Description', dataIndex: 'description', key: 'description' },
  ];

  return (
    <div style={{ padding: '24px 40px', maxWidth: 1000, margin: '0 auto' }}>
      <Title level={2}>{apiData.title}</Title>
      
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Code Generation</Title>
        <Button icon={<CopyOutlined />} onClick={() => copyToClipboard(generateCurl())}>Copy cURL</Button>
      </div>
      <Card size="small" style={{ background: '#1e1e1e', color: '#fff' }}>
        <pre style={{ margin: 0, overflow: 'auto' }}>{generateCurl()}</pre>
      </Card>
    </div>
  );
};

export default Documentation;