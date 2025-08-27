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
import KPICards from './KPICards';
import GlobalFilters, { GlobalFilterState } from './GlobalFilters';

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
  rpf_posts?: string[];
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

interface KPIData {
  total_incidents: number;
  daily_avg: number;
  monthly_trend: number[];
  percentile?: number;
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
  const [kpiData, setKpiData] = useState<KPIData>({
    total_incidents: 0,
    daily_avg: 0,
    monthly_trend: []
  });
  const [globalFilters, setGlobalFilters] = useState<GlobalFilterState>({
    timeframe: 'all',
    dateRange: null,
    selectedMonth: null,
    rpfPosts: [],
    trainNumbers: []
  });
  const [rowLimit, setRowLimit] = useState<number>(25);

  const getFilters = (): FilterRequest => {
    const filters: FilterRequest = {};

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
    } else if (selectedTrain) {
      filters.train_numbers = [selectedTrain];
    }

    return filters;
  };

  const loadData = async () => {
    if (!cacheKey) return;

    setLoading(true);
    try {
      const filters = getFilters();

      const [trainIncidentsRes, trainAnalyticsRes, timelineRes, kpiRes] = await Promise.all([
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
        }),
        axios.post(`/kpi-data/${cacheKey}`, filters)
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
      setKpiData(kpiRes.data as KPIData);
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [cacheKey, selectedTrain, globalFilters, rowLimit]);

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

    const chartData = Object.entries(data)
      .sort(([,a], [,b]) => b - a) // Sort by value descending
      .map(([key, value]) => ({
        name: key,
        value: Number(value)
      }));

    if (type === 'pie') {
      let processedData = chartData;

      // Special handling for Time Analysis
      if (title.includes('Time Analysis')) {
        // Sort by value descending and take top 11, sum the rest as 'Others'
        const sortedData = [...chartData].sort((a, b) => b.value - a.value);
        const top11 = sortedData.slice(0, 11);
        const othersSum = sortedData.slice(11).reduce((sum, item) => sum + item.value, 0);

        processedData = [...top11];
        if (othersSum > 0) {
          processedData.push({
              name: 'Others',
              value: othersSum
            });
        }
      }

      return (
        <Card title={title} style={{ height: '400px' }}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={processedData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent! * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {processedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name, props) => [value, props.payload.fullName || name]} />
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
            <Tooltip formatter={(value, name, props) => [value, props.payload.fullName || name]} />
            <Bar dataKey="value" fill="#1890ff" label={{ position: 'top' }} />
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

  const handleDownload = async () => {
    try {
      const filters = getFilters();
      const response = await axios.post(`/export-data/${cacheKey}?format=pdf`, filters, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data as BlobPart], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'alarm_chain_incidents_report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF report:', error);
    }
  };

  return (
    <div>
      <GlobalFilters
        cacheKey={cacheKey}
        onFiltersChange={setGlobalFilters}
        onDownload={handleDownload}
      />

      {/* KPI Cards */}
      <div style={{ marginBottom: 24 }}>
        <KPICards
          totalIncidents={kpiData.total_incidents}
          percentile={kpiData.percentile}
          dailyAverage={kpiData.daily_avg}
          monthlyTrend={kpiData.monthly_trend}
          loading={loading}
          timeframeMode={globalFilters.timeframe}
          thirdCardData={kpiData.monthly_trend}
          thirdCardTitle={
            globalFilters.timeframe === 'all' ? 'Daily Trend (30 days)' :
            globalFilters.timeframe === 'month' ? 'Daily Trend (Month)' :
            'Daily Trend (Custom)'
          }
        />
      </div>

      <Row style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Card>
            <Row align="middle" justify="space-between">
              <Col>
                <Title level={4}>Display Controls</Title>
              </Col>
              <Col>
                <Space>
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
          <Col xs={24} lg={12}>
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
          <Col xs={24} lg={12}>
            {renderChart(
              trainIncidents.reduce((acc, train) => {
                acc[train.train_no] = train.incident_count;
                return acc;
              }, {} as Record<string, number>),
              'Top 25 Affected Trains'
            )}
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
            {renderChart(trainAnalytics.coaches, selectedTrain ? `${selectedTrain} - Coaches` : 'Coaches')}
          </Col>
          <Col xs={24} lg={12}>
            {renderChart(trainAnalytics.reasons, selectedTrain ? `${selectedTrain} - Reasons` : 'Reasons')}
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} lg={12}>
            {renderChart(trainAnalytics.time_analysis, selectedTrain ? `${selectedTrain} - Time Analysis` : 'Time Analysis', 'pie')}
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