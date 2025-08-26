import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Row, 
  Col, 
  Typography,
  Select,
  Slider,
  DatePicker,
  Space,
  Button,
  Spin
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
import { useNavigate } from 'react-router-dom';
import { Dayjs } from 'dayjs';
import axios from 'axios';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface FilterRequest {
  date_from?: string;
  date_to?: string;
  train_numbers?: string[];
  directions?: string[];
  categories?: string[];
  reasons?: string[];
  coach_types?: string[];
  sections?: string[];
}

interface TrainIncident {
  train_no: string;
  incident_count: number;
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

interface TrainIncidentsResponse {
  trains: TrainIncident[];
}

interface TrainAnalyticsResponse {
  sections: Record<string, number>;
  coaches: Record<string, number>;
  reasons: Record<string, number>;
  time_analysis: Record<string, number>;
  mid_sections: Record<string, number>;
}

interface DashboardProps {
  cacheKey: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#0000ff', '#ff00ff', '#00ffff'];

const Dashboard: React.FC<DashboardProps> = ({ cacheKey }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [trainIncidents, setTrainIncidents] = useState<TrainIncident[]>([]);
  const [trainAnalytics, setTrainAnalytics] = useState<TrainAnalytics>({
    sections: {},
    coaches: {},
    reasons: {},
    time_analysis: {},
    mid_sections: {}
  });
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [selectedTrain, setSelectedTrain] = useState<string | null>(null);
  const [dateRangeMode, setDateRangeMode] = useState<'all' | 'month' | 'custom'>('all');
  const [customDateRange, setCustomDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [rowLimit, setRowLimit] = useState<number>(25);

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

  const loadData = async () => {
    if (!cacheKey) return;
    
    setLoading(true);
    try {
      const filters = getFilters();
      
      const [trainIncidentsRes, trainAnalyticsRes, timelineRes] = await Promise.all([
        axios.post(`/train-incidents/${cacheKey}`, filters, { params: { limit: rowLimit } }),
        axios.post(`/train-analytics/${cacheKey}`, filters, { 
          params: { 
            train_no: selectedTrain || undefined,
            limit: 10
          } 
        }),
        axios.post(`/train-timeline/${cacheKey}`, filters, { 
          params: { 
            train_no: selectedTrain || undefined,
            granularity: selectedTrain ? 'weekly' : 'monthly'
          } 
        })
      ]);

      setTrainIncidents((trainIncidentsRes.data as TrainIncidentsResponse).trains || []);
      setTrainAnalytics((trainAnalyticsRes.data as TrainAnalyticsResponse) || {
        sections: {},
        coaches: {},
        reasons: {},
        time_analysis: {},
        mid_sections: {}
      });
      setTimelineData((timelineRes.data as TimelineData).timeline || []);
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [cacheKey, selectedTrain, dateRangeMode, customDateRange, rowLimit]);

  const handleTrainClick = (trainNo: string) => {
    if (selectedTrain === trainNo) {
      setSelectedTrain(null);
    } else {
      setSelectedTrain(trainNo);
    }
  };

  const navigateToTrainProfile = (trainNo: string) => {
    navigate(`/train/${trainNo}`);
  };

  const trainColumns = [
    {
      title: 'Train Number',
      dataIndex: 'train_no',
      key: 'train_no',
      render: (text: string) => (
        <Button 
          type="link" 
          onClick={() => handleTrainClick(text)} 
          style={{ 
            padding: 0, 
            color: selectedTrain === text ? '#1890ff' : 'inherit', 
            fontWeight: selectedTrain === text ? 'bold' : 'normal' 
          }}
        >
          {text}
        </Button>
      )
    },
    {
      title: 'Number of Incidents',
      dataIndex: 'incident_count',
      key: 'incident_count',
      sorter: (a: TrainIncident, b: TrainIncident) => a.incident_count - b.incident_count,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: TrainIncident) => (
        <Button type="link" onClick={() => navigateToTrainProfile(record.train_no)}>
          View Profile
        </Button>
      )
    }
  ];

  const renderChart = (data: Record<string, number>, title: string, type: 'bar' | 'pie' = 'bar') => {
    if (!data || Object.keys(data).length === 0) return null;

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
    if (!timelineData || timelineData.length === 0) return null;

    return (
      <Card title={selectedTrain ? `${selectedTrain} - Weekly Incidents` : "Monthly Incidents Timeline"} style={{ height: '400px' }}>
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
                <Title level={4}>Dashboard Controls</Title>
              </Col>
              <Col>
                <Space>
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
                  
                  <span>Display Rows:</span>
                  <Slider
                    value={rowLimit}
                    onChange={setRowLimit}
                    min={5}
                    max={100}
                    step={5}
                    style={{ width: 100 }}
                    tooltip={{ formatter: (value) => `${value}` }}
                  />
                  <span>{rowLimit}</span>
                  
                  <Button onClick={loadData} loading={loading}>
                    Refresh
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card title={`Top ${rowLimit} Trains by Incidents${selectedTrain ? ` (Selected: ${selectedTrain})` : ''}`}>
              <Table
                columns={trainColumns}
                dataSource={trainIncidents}
                rowKey="train_no"
                pagination={false}
                size="middle"
                rowClassName={(record) => selectedTrain === record.train_no ? 'selected-row' : ''}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} lg={12}>
            {renderTimelineChart()}
          </Col>
          <Col xs={24} lg={12}>
            {renderChart(trainAnalytics.sections, selectedTrain ? `${selectedTrain} - Top Sections` : 'Top 10 Affected Sections')}
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} lg={12}>
            {renderChart(trainAnalytics.coaches, selectedTrain ? `${selectedTrain} - Coach Categories` : 'Top 10 Coach Categories')}
          </Col>
          <Col xs={24} lg={12}>
            {renderChart(trainAnalytics.reasons, selectedTrain ? `${selectedTrain} - Top Reasons` : 'Top Affected Reasons')}
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} lg={12}>
            {renderChart(trainAnalytics.time_analysis, selectedTrain ? `${selectedTrain} - Time Slots` : 'Time Analysis (All Trains)', 'pie')}
          </Col>
          <Col xs={24} lg={12}>
            {renderChart(trainAnalytics.mid_sections, selectedTrain ? `${selectedTrain} - Mid Sections` : 'Mid Section Analysis')}
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default Dashboard;