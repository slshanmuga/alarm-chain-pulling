import React, { useState } from 'react';
import { 
  Layout, 
  Upload, 
  Button, 
  Card, 
  message,
  Typography
} from 'antd';
import { 
  UploadOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import NewDashboard from './components/NewDashboard';
import AllIncidents from './components/AllIncidents';
import TrainProfile from './components/TrainProfile';
import TrainList from './components/TrainList';
import TopSections from './components/TopSections';
import './App.css';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

interface UploadResponse {
  cache_key: string;
  total_records: number;
}

const AppContent: React.FC = () => {
  const [cacheKey, setCacheKey] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [, setTotalRecords] = useState(0);

  const handleFileUpload = async (file: any) => {
    const formData = new FormData();
    formData.append('files', file);
    
    setUploading(true);
    try {
      const response = await axios.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const uploadData = response.data as UploadResponse;
      setCacheKey(uploadData.cache_key);
      setTotalRecords(uploadData.total_records);
      console.log(`Uploaded ${uploadData.total_records} records`); // Use totalRecords
      message.success(`Successfully uploaded data with ${uploadData.total_records} records`);
      return false;
    } catch (error: any) {
      message.error(`Upload failed: ${error.response?.data?.detail || error.message}`);
      return false;
    } finally {
      setUploading(false);
    }
  };

  if (!cacheKey) {
    return (
      <Layout className="layout" style={{ minHeight: '100vh' }}>
        <Header style={{ background: '#001529', padding: '0 24px' }}>
          <Title level={3} style={{ color: 'white', margin: '16px 0' }}>
            <BarChartOutlined /> Alarm Chain Pulling Analytics
          </Title>
        </Header>
        
        <Content style={{ padding: '24px', background: '#f0f2f5', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Card style={{ maxWidth: 500, width: '100%' }}>
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <Title level={4}>Upload CSV File to Get Started</Title>
              <Text type="secondary">
                Upload your alarm chain pulling incidents CSV file to begin analysis
              </Text>
              <div style={{ marginTop: 24 }}>
                <Upload
                  beforeUpload={handleFileUpload}
                  showUploadList={false}
                  accept=".csv"
                  disabled={uploading}
                >
                  <Button 
                    icon={<UploadOutlined />} 
                    size="large" 
                    type="primary" 
                    loading={uploading}
                  >
                    {uploading ? 'Uploading...' : 'Upload CSV File'}
                  </Button>
                </Upload>
              </div>
            </div>
          </Card>
        </Content>
      </Layout>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<NewDashboard cacheKey={cacheKey} />} />
      <Route path="/all-incidents" element={<AllIncidents cacheKey={cacheKey} />} />
      <Route path="/train" element={<TrainList cacheKey={cacheKey} />} />
      <Route path="/train/:trainNo" element={<TrainProfile cacheKey={cacheKey} />} />
      <Route path="/top-sections" element={<TopSections cacheKey={cacheKey} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;