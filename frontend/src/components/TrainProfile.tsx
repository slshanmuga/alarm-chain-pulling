import React, { useState, useEffect } from 'react';
import { 
  Card, 
  AutoComplete,
  Row, 
  Col, 
  Typography,
  Select,
  DatePicker,
  Space,
  Button,
  Spin,
  message
} from 'antd';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useNavigate, useParams } from 'react-router-dom';
import { Dayjs } from 'dayjs';
import axios from 'axios';
import { ArrowLeftOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface FilterRequest {
  date_from?: string;
  date_to?: string;
  train_numbers?: string[];
}

interface TrainAnalytics {
  sections: Record<string, number>;
  coaches: Record<string, number>;
  reasons: Record<string, number>;
  time_analysis: Record<string, number>;
  mid_sections: Record<string, number>;
}

interface TimelineData {
  timeline: Array<{
    period: string;
    count: number;
    date: string;
  }>;
}

interface TrainSearchResponse {
  trains: string[];
}

interface TrainAnalyticsResponse {
  sections: Record<string, number>;
  coaches: Record<string, number>;
  reasons: Record<string, number>;
  time_analysis: Record<string, number>;
  mid_sections: Record<string, number>;
}

interface TrainProfileProps {
  cacheKey: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#0000ff', '#ff00ff', '#00ffff'];

const TrainProfile: React.FC<TrainProfileProps> = ({ cacheKey }) => {
  const navigate = useNavigate();
  const { trainNo: urlTrainNo } = useParams<{ trainNo?: string }>();
  const [loading, setLoading] = useState(false);
  const [availableTrains, setAvailableTrains] = useState<string[]>([]);
  const [selectedTrain, setSelectedTrain] = useState<string>(urlTrainNo || '');
  const [trainAnalytics, setTrainAnalytics] = useState<TrainAnalytics>({
    sections: {},
    coaches: {},
    reasons: {},
    time_analysis: {},
    mid_sections: {}
  });
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [dateRangeMode, setDateRangeMode] = useState<'all' | 'month' | 'custom'>('all');
  const [customDateRange, setCustomDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const getFilters = (): FilterRequest => {
    const filters: FilterRequest = {};
    
    if (dateRangeMode === 'month') {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      filters.date_from = firstDay.toISOString().split('T')[0];
      filters.date_to = lastDay.toISOString().split('T')[0];
    } else if (dateRangeMode === 'custom' && customDateRange) {
      filters.date_from = customDateRange[0]?.format('YYYY-MM-DD') || undefined;
      filters.date_to = customDateRange[1]?.format('YYYY-MM-DD') || undefined;
    }
    
    if (selectedTrain) {
      filters.train_numbers = [selectedTrain];
    }
    
    return filters;
  };

  const loadTrains = async (searchText?: string) => {
    if (!cacheKey) return;
    
    try {
      const response = await axios.get(`/train-search/${cacheKey}`, {
        params: { query: searchText || '' }
      });
      setAvailableTrains((response.data as TrainSearchResponse).trains || []);
    } catch (error) {
      console.error('Failed to load trains:', error);
    }
  };

  const loadTrainData = async () => {
    if (!cacheKey || !selectedTrain) return;
    
    setLoading(true);
    try {
      const filters = getFilters();
      
      const [trainAnalyticsRes, timelineRes] = await Promise.all([
        axios.post(`/train-analytics/${cacheKey}`, filters, { 
          params: { 
            train_no: selectedTrain,
            limit: 10
          } 
        }),
        axios.post(`/train-timeline/${cacheKey}`, filters, { 
          params: { 
            train_no: selectedTrain,
            granularity: 'weekly'
          } 
        })
      ]);

      setTrainAnalytics((trainAnalyticsRes.data as TrainAnalyticsResponse) || {
        sections: {},
        coaches: {},
        reasons: {},
        time_analysis: {},
        mid_sections: {}
      });
      setTimelineData((timelineRes.data as TimelineData).timeline || []);
    } catch (error: any) {
      console.error('Failed to load train data:', error);
      message.error('Failed to load train data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrains();
  }, [cacheKey]);

  useEffect(() => {
    if (selectedTrain) {
      loadTrainData();
    }
  }, [selectedTrain, dateRangeMode, customDateRange]);

  const handleTrainSelect = (value: string) => {
    setSelectedTrain(value);
    navigate(`/train/${value}`);
  };

  const handleTrainSearch = (searchText: string) => {
    loadTrains(searchText);
  };

  const renderChart = (data: Record<string, number>, title: string, type: 'bar' | 'pie' = 'bar') => {
    if (!data || Object.keys(data).length === 0) {
      return (
        <Card title={title} style={{ height: '400px' }}>
          <div style={{ textAlign: 'center', padding: '100px 0', color: '#999' }}>
            No data available
          </div>
        </Card>
      );
    }

    const chartData = Object.entries(data).map(([key, value]) => ({
      name: key,
      value: Number(value)
    }));

    if (type === 'pie') {
      return (
        <Card title={title} style={{ height: '400px' }}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent! * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      );
    }

    return (
      <Card title={title} style={{ height: '400px' }}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#1890ff" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    );
  };

  const renderTimelineChart = () => {
    if (!timelineData || timelineData.length === 0) {
      return (
        <Card title="Weekly Incidents Timeline" style={{ height: '400px' }}>
          <div style={{ textAlign: 'center', padding: '100px 0', color: '#999' }}>
            No timeline data available
          </div>
        </Card>
      );
    }

    return (
      <Card title="Weekly Incidents Timeline" style={{ height: '400px' }}>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="count" stroke="#1890ff" fill="#1890ff" fillOpacity={0.6} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    );
  };

  return (
    <div>
      <Row style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Card>
            <Row align="middle" justify="space-between">
              <Col>
                <Space>
                  <Button 
                    icon={<ArrowLeftOutlined />} 
                    onClick={() => navigate('/')}
                  >
                    Back to Dashboard
                  </Button>
                  <Title level={4} style={{ margin: 0 }}>Train Profile</Title>
                </Space>
              </Col>
              <Col>
                <Space>
                  <span>Search Train:</span>
                  <AutoComplete
                    value={selectedTrain}
                    options={availableTrains.map(train => ({ value: train }))}
                    onSelect={handleTrainSelect}
                    onSearch={handleTrainSearch}
                    onChange={setSelectedTrain}
                    placeholder="Enter train number"
                    style={{ width: 200 }}
                    filterOption={false}
                  />
                  
                  <span>Date Range:</span>
                  <Select value={dateRangeMode} onChange={setDateRangeMode} style={{ width: 120 }}>
                    <Option value="all">All</Option>
                    <Option value="month">This Month</Option>
                    <Option value="custom">Custom</Option>
                  </Select>
                  
                  {dateRangeMode === 'custom' && (
                    <RangePicker
                      value={customDateRange}
                      onChange={setCustomDateRange}
                      format="YYYY-MM-DD"
                    />
                  )}
                  
                  <Button onClick={loadTrainData} loading={loading} disabled={!selectedTrain}>
                    Refresh
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {!selectedTrain ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <Title level={3}>Select a Train to View Profile</Title>
            <p>Use the search bar above to find and select a train number</p>
          </div>
        </Card>
      ) : (
        <Spin spinning={loading}>
          <Title level={3} style={{ marginBottom: 16 }}>Train {selectedTrain} - Incident Analysis</Title>
          
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              {renderTimelineChart()}
            </Col>
            <Col xs={24} lg={12}>
              {renderChart(trainAnalytics.sections, 'Top Affected Sections')}
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} lg={12}>
              {renderChart(trainAnalytics.coaches, 'Coach Categories')}
            </Col>
            <Col xs={24} lg={12}>
              {renderChart(trainAnalytics.reasons, 'Top Reasons')}
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} lg={12}>
              {renderChart(trainAnalytics.time_analysis, 'Time Analysis (Max 12 slots)', 'pie')}
            </Col>
            <Col xs={24} lg={12}>
              {renderChart(trainAnalytics.mid_sections, 'Mid Section Analysis')}
            </Col>
          </Row>
        </Spin>
      )}
    </div>
  );
};

export default TrainProfile;