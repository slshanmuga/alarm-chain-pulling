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
  Cell,
  LabelList,
  Legend
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
  const [noDataForMonth, setNoDataForMonth] = useState(false);
  const [globalFilters, setGlobalFilters] = useState<GlobalFilterState>({
    timeframe: 'all',
    dateRange: null,
    selectedMonth: null,
    rpfPosts: [],
    trainNumbers: []
  });
  
  const [kpiData, setKpiData] = useState<KPIData>({
    total_incidents: 0,
    daily_avg: 0,
    monthly_trend: [],
    daily_trend: []
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

      const kpiResponse = kpiRes.data as KPIData;
      setKpiData(kpiResponse);
      const analyticsResponse = analyticsRes.data as AnalyticsData;
      console.log('Analytics response:', analyticsResponse);
      setAnalyticsData(analyticsResponse);
      setDayAnalysisData(dayAnalysisRes.data as DayAnalysisData);
      const timelineResponse = timelineRes.data as TimelineData;
      setTimelineData(timelineResponse.timeline || []);
      
      // Check if there's no data for the selected month
      if (globalFilters.timeframe === 'month' && kpiResponse.total_incidents === 0) {
        setNoDataForMonth(true);
      } else {
        setNoDataForMonth(false);
      }
      
      // Process train list data for top trains chart - maintain order from backend (highest to lowest)
      const trainListResponse = trainListRes.data as { trains: Array<{train_no: string, incident_count: number}> };
      const trainsData: Record<string, number> = {};
      trainListResponse.trains.forEach(train => {
        trainsData[train.train_no] = train.incident_count;
      });
      setTopTrainsData(trainsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [cacheKey, selectedTrain, buildFilters]);

  const getTrendDirection = (trendData: number[]): string => {
    if (!trendData || trendData.length < 2) return 'Stable';
    
    const firstHalf = trendData.slice(0, Math.floor(trendData.length / 2));
    const secondHalf = trendData.slice(Math.floor(trendData.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    if (secondAvg > firstAvg * 1.1) return 'Increasing';
    if (secondAvg < firstAvg * 0.9) return 'Decreasing';
    return 'Stable';
  };

  const getThirdCardTitle = (): string => {
    switch (globalFilters.timeframe) {
      case 'all':
        return 'Daily Trend (Last 30 Days)';
      case 'month':
        return 'Daily Trend (Selected Month)';
      case 'custom':
        return 'Daily Trend (Custom Period)';
      default:
        return 'Daily Trend';
    }
  };

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

  const handleTrainClick = (trainNo: string) => {
    // If clicking the same train that's already selected, deselect it
    if (selectedTrain === trainNo) {
      setGlobalFilters(prev => ({
        ...prev,
        trainNumbers: []
      }));
    } else {
      // Select the new train
      setGlobalFilters(prev => ({
        ...prev,
        trainNumbers: [trainNo]
      }));
    }
  };

  const renderChart = (data: Record<string, number>, title: string, type: 'bar' | 'pie' | 'horizontal-bar' = 'bar') => {
    console.log(`Rendering ${title} chart with data:`, data, 'type:', type);
    
    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
      console.log(`No valid data for ${title} chart`);
      return (
        <Card title={title} style={{ height: '400px' }}>
          <div style={{ textAlign: 'center', padding: '100px 0', color: '#999' }}>
            No data available
          </div>
        </Card>
      );
    }

    let chartData = Object.entries(data).map(([key, value]) => ({
      name: key.length > 15 ? key.substring(0, 12) + '...' : key,
      value: Number(value),
      fullName: key
    }));

    // Sort data by value (highest to lowest) for proper display
    chartData = chartData.sort((a, b) => b.value - a.value);

    if (type === 'pie') {
      // For Time Analysis, ensure "Others" is at the end if present
      let pieData = chartData.slice(0, 12);
      if (title.includes('Time Analysis')) {
        const othersIndex = pieData.findIndex(item => item.fullName === 'Others');
        if (othersIndex !== -1) {
          const othersItem = pieData.splice(othersIndex, 1)[0];
          pieData.push(othersItem);
        }
      }

      const RADIAN = Math.PI / 180;
      const renderSmartLabel = (props: any) => {
        const { cx, cy, midAngle, outerRadius, name, value, percent } = props;
        if (percent < 0.035) return null; // hide labels < 3.5%
        const r = outerRadius + 14; // place outside
        const x = cx + r * Math.cos(-midAngle * RADIAN);
        const y = cy + r * Math.sin(-midAngle * RADIAN);
        const anchor = x > cx ? 'start' : 'end';
        return (
          <text x={x} y={y} fill="#333" fontSize={12} textAnchor={anchor} dominantBaseline="central">
            {`${name} ${value} (${(percent * 100).toFixed(0)}%)`}
          </text>
        );
      };

      return (
        <Card title={title} style={{ height: '400px' }}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="45%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={1}
                minAngle={2}
                dataKey="value"
                labelLine={false}
                label={renderSmartLabel}
                startAngle={90}
                endAngle={450}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend layout="vertical" verticalAlign="middle" align="right" />
              <Tooltip formatter={(value, name, props) => [value, props?.payload?.fullName || name]} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      );
    }

    if (type === 'horizontal-bar') {
  return (
    <Card title={title} style={{ height: '400px' }}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData.slice(0, 10)}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" domain={[0, 'dataMax']} allowDecimals={false} />
          <YAxis
            dataKey="fullName"
            type="category"
            width={150}
            interval={0}
            tick={{ fontSize: 11, textAnchor: 'end' }}
            tickFormatter={(value: string) => {
              if (value.length > 20) {
                const words = value.split(' ');
                if (words.length > 1) {
                  const mid = Math.ceil(words.length / 2);
                  return `${words.slice(0, mid).join(' ')}\n${words.slice(mid).join(' ')}`;
                }
                return value.substring(0, 18) + '...';
              }
              return value;
            }}
          />
          <Tooltip
            formatter={(value, name, props) => [value as number, props?.payload?.fullName || name]}
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
          />
          <Bar dataKey="value" fill="#1890ff" maxBarSize={20}>
            <LabelList dataKey="value" position="right" style={{ fontSize: '12px', fill: '#666' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}


    const isTopTrainsChart = title.includes('Train Incident Overview');
    
    return (
      <Card title={title} style={{ height: '400px' }}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData.slice(0, title.includes('Train Incident Overview') ? 25 : 10)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip 
              formatter={(value, name, props) => [value, props.payload.fullName]}
              content={({ active, payload }) => {
                if (active && payload && payload[0] && isTopTrainsChart) {
                  const trainNo = payload[0].payload.fullName;
                  const isSelected = selectedTrain && trainNo === selectedTrain;
                  return (
                    <div style={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #ccc', 
                      padding: '8px',
                      borderRadius: '4px'
                    }}>
                      <p>{`Train: ${trainNo}`}</p>
                      <p>{`Incidents: ${payload[0].value}`}</p>
                      {isSelected ? (
                        <p style={{ color: '#52c41a', fontSize: '12px', margin: 0 }}>
                          Currently selected - Click to deselect
                        </p>
                      ) : (
                        <p style={{ color: '#1890ff', fontSize: '12px', margin: 0 }}>
                          Click to filter by this train
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar 
              dataKey="value" 
              fill={isTopTrainsChart ? "#1890ff" : "#1890ff"} 
              style={{ cursor: isTopTrainsChart ? 'pointer' : 'default' }}
              onClick={isTopTrainsChart ? (data: any) => handleTrainClick(data.payload?.fullName) : undefined}
              shape={isTopTrainsChart ? (props: any) => {
                const isSelected = selectedTrain && props.payload?.fullName === selectedTrain;
                return (
                  <rect
                    {...props}
                    fill={isSelected ? "#52c41a" : "#1890ff"}
                    stroke={isSelected ? "#389e0d" : "none"}
                    strokeWidth={isSelected ? 2 : 0}
                  />
                );
              } : undefined}
            >
              <LabelList dataKey="value" position="top" style={{ fontSize: '12px' }} />
            </Bar>
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
            <Area type="monotone" dataKey="count" stroke="#1890ff" fill="#1890ff" fillOpacity={0.6}>
              <LabelList dataKey="count" position="top" style={{ fontSize: '12px' }} />
            </Area>
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
          {/* No Data Message for Month mode */}
          {noDataForMonth && globalFilters.timeframe === 'month' ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '100px 0', 
              fontSize: '18px',
              color: '#999',
              backgroundColor: 'white',
              borderRadius: '8px',
              margin: '24px 0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              No data available for the selected month
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div style={{ marginBottom: 24 }}>
                <KPICards
                  totalIncidents={kpiData.total_incidents}
                  percentile={kpiData.percentile}
                  dailyAverage={kpiData.daily_avg}
                  monthlyTrend={kpiData.monthly_trend}
                  loading={loading}
                  timeframeMode={globalFilters.timeframe}
                  thirdCardData={kpiData.daily_trend}
                  thirdCardTitle={`${getThirdCardTitle()} - ${getTrendDirection(kpiData.daily_trend)}`}
                />
              </div>

          {/* Top 25 Trains Chart - Always visible for easy navigation */}
          {Object.keys(topTrainsData).length > 0 && (
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={24}>
                {renderChart(topTrainsData, selectedTrain ? `Train Incident Overview (${selectedTrain} Selected)` : 'Train Incident Overview', 'bar')}
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

          {/* Second Row: Coaches + Day Analysis */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={24} lg={12}>
              {renderChart(
                analyticsData.coaches, 
                selectedTrain ? `${selectedTrain} - Coach Categories` : 'Coaches'
              )}
            </Col>
            <Col xs={24} lg={12}>
              {renderChart(dayAnalysisData.day_analysis, 'Day Analysis')}
            </Col>
          </Row>

          {/* Third Row: Time Analysis + Mid Sections */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={24} lg={12}>
              {renderChart(
                analyticsData.time_analysis, 
                selectedTrain ? `${selectedTrain} - Time Slots` : 'Time Analysis',
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

          {/* Fourth Row: Reasons */}
          <Row gutter={16}>
            <Col span={24}>
              {renderChart(
                analyticsData.reasons || {}, 
                selectedTrain ? `${selectedTrain} - Top Reasons` : 'Reasons',
                'horizontal-bar'
              )}
            </Col>
          </Row>
          </>
          )}
        </Spin>
      </div>
    </div>
  );
};

export default NewDashboard;