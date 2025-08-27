import React, { useState, useEffect } from 'react';
import { Card, Table, Row, Col, Spin, Typography } from 'antd';
import { CarOutlined } from '@ant-design/icons';
import axios from 'axios';
import GlobalFilters, { GlobalFilterState } from './GlobalFilters';
import NavigationRail from './NavigationRail';

const { Title } = Typography;

interface TrainListProps {
  cacheKey: string;
}

interface TrainRecord {
  train_no: string;
  incident_count: number;
  train_from_to: string;
  direction: string;
  daily_type: string;
}

interface TrainListResponse {
  trains: TrainRecord[];
}

const TrainList: React.FC<TrainListProps> = ({ cacheKey }) => {
  const [loading, setLoading] = useState(false);
  const [trains, setTrains] = useState<TrainRecord[]>([]);
  
  const [globalFilters, setGlobalFilters] = useState<GlobalFilterState>({
    timeframe: 'all',
    dateRange: null,
    selectedMonth: null,
    rpfPosts: [],
    trainNumbers: []
  });

  useEffect(() => {
    if (cacheKey) {
      loadTrains();
    }
  }, [cacheKey, globalFilters]);

  const buildFilters = () => {
    const filters: any = {};
    
    // Handle timeframe filters
    if (globalFilters.timeframe === 'month' || globalFilters.timeframe === 'custom') {
      if (globalFilters.dateRange) {
        filters.date_from = globalFilters.dateRange[0]?.format('YYYY-MM-DD');
        filters.date_to = globalFilters.dateRange[1]?.format('YYYY-MM-DD');
      }
    }
    
    if (globalFilters.rpfPosts.length > 0) {
      filters.rpf_posts = globalFilters.rpfPosts;
    }
    
    if (globalFilters.trainNumbers.length > 0) {
      filters.train_numbers = globalFilters.trainNumbers;
    }
    
    return filters;
  };

  const loadTrains = async () => {
    if (!cacheKey) return;
    
    setLoading(true);
    try {
      const filters = buildFilters();
      
      const response = await axios.post(`/train-list/${cacheKey}`, filters, {
        params: { limit: 25 }
      });

      const data = response.data as TrainListResponse;
      setTrains(data.trains || []);
    } catch (error) {
      console.error('Failed to load trains:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (format: string) => {
    try {
      const filters = buildFilters();
      const response = await axios.post(`/export-data/${cacheKey}`, filters, {
        params: { format },
        responseType: format === 'csv' ? 'blob' : 'json'
      });
      
      if (format === 'csv') {
        const blob = new Blob([response.data as string], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'top_trains_data.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        const dataStr = JSON.stringify(response.data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'top_trains_data.json');
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (error) {
      console.error('Failed to download data:', error);
    }
  };

  const columns = [
    {
      title: 'Rank',
      key: 'rank',
      width: 70,
      render: (_: any, __: any, index: number) => (
        <div style={{
          width: 32,
          height: 32,
          backgroundColor: index < 3 ? '#fa8c16' : '#1890ff',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          fontWeight: 'bold'
        }}>
          {index + 1}
        </div>
      )
    },
    {
      title: 'Train Number',
      dataIndex: 'train_no',
      key: 'train_no',
      width: 120,
      sorter: (a: TrainRecord, b: TrainRecord) => a.train_no.localeCompare(b.train_no),
    },
    {
      title: 'Route',
      dataIndex: 'train_from_to',
      key: 'train_from_to',
      ellipsis: true,
      sorter: (a: TrainRecord, b: TrainRecord) => a.train_from_to.localeCompare(b.train_from_to),
    },
    {
      title: 'Direction',
      dataIndex: 'direction',
      key: 'direction',
      width: 100,
      filters: [
        { text: 'UP', value: 'UP' },
        { text: 'DOWN', value: 'DOWN' },
      ],
      onFilter: (value: any, record: TrainRecord) => record.direction === value,
    },
    {
      title: 'Service Type',
      dataIndex: 'daily_type',
      key: 'daily_type',
      width: 120,
      filters: [
        { text: 'Daily', value: 'Daily' },
        { text: 'Non-daily', value: 'Non-daily' },
      ],
      onFilter: (value: any, record: TrainRecord) => record.daily_type === value,
    },
    {
      title: 'Incident Count',
      dataIndex: 'incident_count',
      key: 'incident_count',
      width: 130,
      sorter: (a: TrainRecord, b: TrainRecord) => a.incident_count - b.incident_count,
      defaultSortOrder: 'descend' as const,
      render: (count: number) => (
        <span style={{ 
          color: count > 10 ? '#ff4d4f' : count > 5 ? '#fa8c16' : '#52c41a',
          fontWeight: 'bold' 
        }}>
          {count}
        </span>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Navigation Rail */}
      <div style={{ width: 64, backgroundColor: '#fafafa', borderRight: '1px solid #f0f0f0' }}>
        <NavigationRail collapsed={true} />
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: 24, backgroundColor: '#f5f5f5' }}>
        <GlobalFilters
          cacheKey={cacheKey}
          onFiltersChange={setGlobalFilters}
          onDownload={handleDownload}
        />

        <Card>
          <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
            <Col>
              <Title level={3} style={{ margin: 0 }}>
                <CarOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                Top 25 Affected Trains ({trains.length} trains)
              </Title>
            </Col>
          </Row>

          <Spin spinning={loading}>
            <Table
              columns={columns}
              dataSource={trains}
              rowKey="train_no"
              pagination={false}
              scroll={{ x: 800 }}
              size="middle"
              style={{ marginTop: 16 }}
            />
          </Spin>
        </Card>
      </div>
    </div>
  );
};

export default TrainList;