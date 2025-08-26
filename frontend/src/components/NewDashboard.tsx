import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Spin } from 'antd';
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
import axios from 'axios';
import GlobalFilters, { GlobalFilterState } from './GlobalFilters';
import KPICards from './KPICards';
import NavigationRail from './NavigationRail';
import { KPIData, AnalyticsData, DayAnalysisData, TimelineData } from '../types/api';


interface NewDashboardProps {
  cacheKey: string;
}


const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#0000ff', '#ff00ff', '#00ffff'];

const NewDashboard: React.FC<NewDashboardProps> = ({ cacheKey }) => {
  const [loading, setLoading] = useState(false);
  const [globalFilters, setGlobalFilters] = useState<GlobalFilterState>({
    timeframe: 'all',
    dateRange: null,
    rpfPosts: [],
    trainNumbers: []
  });
  
  const [kpiData, setKpiData] = useState<KPIData>({
    total_incidents: 0,
    daily_avg: 0,
    monthly_trend: []
  });
  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    sections: {},
    coaches: {},
    reasons: {},
    time_analysis: {},
    mid_sections: {}
  });
  
  const [dayAnalysisData, setDayAnalysisData] = useState<DayAnalysisData>({
    day_analysis: {}
  });
  
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [topTrainsData, setTopTrainsData] = useState<Record<string, number>>({});
  const [selectedTrain, setSelectedTrain] = useState<string | null>(null);

  const buildFilters = useCallback(() => {
    const filters: any = {};
    
    if (globalFilters.dateRange) {
      filters.date_from = globalFilters.dateRange[0]?.format('YYYY-MM-DD');
      filters.date_to = globalFilters.dateRange[1]?.format('YYYY-MM-DD');
    }
    
    if (globalFilters.rpfPosts.length > 0) {
      filters.rpf_posts = globalFilters.rpfPosts;
    }
    
    if (globalFilters.trainNumbers.length > 0) {
      filters.train_numbers = globalFilters.trainNumbers;
      // If only one train is selected, set it as selected for detailed view
      if (globalFilters.trainNumbers.length === 1) {
        setSelectedTrain(globalFilters.trainNumbers[0]);
      } else {
        setSelectedTrain(null);
      }
    } else {
      setSelectedTrain(null);
    }
    
    // Handle timeframe filters
    if (globalFilters.timeframe === 'month' || globalFilters.timeframe === 'custom') {
      if (globalFilters.dateRange) {
        filters.date_from = globalFilters.dateRange[0]?.format('YYYY-MM-DD');
        filters.date_to = globalFilters.dateRange[1]?.format('YYYY-MM-DD');
      }
    }
    
    return filters;
  }, [globalFilters]);

  const loadAllData = useCallback(async () => {
    if (!cacheKey) return;
    
    setLoading(true);
    try {
      const filters = buildFilters();
      
      const [kpiRes, analyticsRes, dayAnalysisRes, timelineRes, trainListRes] = await Promise.all([
        axios.post(`/kpi-data/${cacheKey}`, filters),
        axios.post(`/train-analytics/${cacheKey}?train_no=${selectedTrain || ''}&limit=10`, filters),
        axios.post(`/day-analysis/${cacheKey}`, filters),
        axios.post(`/train-timeline/${cacheKey}?train_no=${selectedTrain || ''}&granularity=${selectedTrain ? 'weekly' : 'monthly'}`, filters),
        axios.post(`/train-list/${cacheKey}?limit=25`, filters)
      ]);

      setKpiData(kpiRes.data as KPIData);
      setAnalyticsData(analyticsRes.data as AnalyticsData);
      setDayAnalysisData(dayAnalysisRes.data as DayAnalysisData);
      const timelineResponse = timelineRes.data as TimelineData;
      setTimelineData(timelineResponse.timeline || []);
      
      // Process train list data for top trains chart
      const trainListResponse = trainListRes.data as { trains: Array<{train_no: string, incident_count: number}> };
      const trainsData = trainListResponse.trains.reduce((acc, train) => {
        acc[train.train_no] = train.incident_count;
        return acc;
      }, {} as Record<string, number>);
      setTopTrainsData(trainsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [cacheKey, selectedTrain, buildFilters]);

  useEffect(() => {
    if (cacheKey) {
      loadAllData();
    }
  }, [cacheKey, globalFilters, loadAllData]);

  const handleDownload = async (format: string) => {
    try {
      const filters = buildFilters();
      const response = await axios.post(`/export-data/${cacheKey}?format=${format}`, filters, {
        responseType: format === 'csv' ? 'blob' : 'json'
      });
      
      if (format === 'csv') {
        const blob = new Blob([response.data as string], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'alarm_chain_data.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        const dataStr = JSON.stringify(response.data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'alarm_chain_data.json');
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (error) {
      console.error('Failed to download data:', error);
    }
  };

  const renderChart = (data: Record<string, number>, title: string, type: 'bar' | 'pie' | 'horizontal-bar' = 'bar') => {
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
      name: key.length > 15 ? key.substring(0, 12) + '...' : key,
      value: Number(value),
      fullName: key
    }));

    if (type === 'pie') {
      return (
        <Card title={title} style={{ height: '400px' }}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.slice(0, 12)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent! * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.slice(0, 12).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name, props) => [value, props.payload.fullName]} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      );
    }

    if (type === 'horizontal-bar') {
      return (
        <Card title={title} style={{ height: '400px' }}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.slice(0, 10)} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip formatter={(value, name, props) => [value, props.payload.fullName]} />
              <Bar dataKey="value" fill="#1890ff" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      );
    }

    return (
      <Card title={title} style={{ height: '400px' }}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData.slice(0, title.includes('Top 25') ? 25 : 10)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip formatter={(value, name, props) => [value, props.payload.fullName]} />
            <Bar dataKey="value" fill="#1890ff" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    );
  };

  const renderTimelineChart = () => {
    if (!timelineData || timelineData.length === 0) {
      return (
        <Card 
          title={selectedTrain ? `${selectedTrain} - Weekly Incidents` : "Monthly Incidents Timeline"} 
          style={{ height: '400px' }}
        >
          <div style={{ textAlign: 'center', padding: '100px 0', color: '#999' }}>
            No timeline data available
          </div>
        </Card>
      );
    }

    return (
      <Card 
        title={selectedTrain ? `${selectedTrain} - Weekly Incidents` : "Monthly Incidents Timeline"} 
        style={{ height: '400px' }}
      >
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

        <Spin spinning={loading}>
          {/* KPI Cards */}
          <div style={{ marginBottom: 24 }}>
            <KPICards
              totalIncidents={kpiData.total_incidents}
              percentile={kpiData.percentile}
              dailyAverage={kpiData.daily_avg}
              monthlyTrend={kpiData.monthly_trend}
              loading={loading}
            />
          </div>

          {/* Top 25 Trains Chart - Only show when no specific train is selected */}
          {!selectedTrain && Object.keys(topTrainsData).length > 0 && (
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={24}>
                {renderChart(topTrainsData, 'Top 25 Affected Trains', 'bar')}
              </Col>
            </Row>
          )}

          {/* Main Charts Row */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={24} lg={12}>
              {renderTimelineChart()}
            </Col>
            <Col xs={24} lg={12}>
              {renderChart(
                analyticsData.sections, 
                selectedTrain ? `${selectedTrain} - Top Sections` : 'Top 10 Affected Sections'
              )}
            </Col>
          </Row>

          {/* Second Row: Coaches + Reasons */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={24} lg={12}>
              {renderChart(
                analyticsData.coaches, 
                selectedTrain ? `${selectedTrain} - Coach Categories` : 'Top 10 Coach Categories'
              )}
            </Col>
            <Col xs={24} lg={12}>
              {renderChart(
                analyticsData.reasons, 
                selectedTrain ? `${selectedTrain} - Top Reasons` : 'Top Affected Reasons',
                'horizontal-bar'
              )}
            </Col>
          </Row>

          {/* Third Row: Time Analysis + Mid Sections */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={24} lg={12}>
              {renderChart(
                analyticsData.time_analysis, 
                selectedTrain ? `${selectedTrain} - Time Slots` : 'Time Analysis (Max 12 slots)',
                'pie'
              )}
            </Col>
            <Col xs={24} lg={12}>
              {renderChart(
                analyticsData.mid_sections, 
                selectedTrain ? `${selectedTrain} - Mid Sections` : 'Mid Section Analysis'
              )}
            </Col>
          </Row>

          {/* Fourth Row: Day Analysis */}
          <Row gutter={16}>
            <Col span={24}>
              {renderChart(dayAnalysisData.day_analysis, 'Day Analysis')}
            </Col>
          </Row>
        </Spin>
      </div>
    </div>
  );
};

export default NewDashboard;