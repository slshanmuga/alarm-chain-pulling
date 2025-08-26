import React, { useState, useEffect } from 'react';
import { Card, Row, Col, List, Statistic, Spin, Typography } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import GlobalFilters, { GlobalFilterState } from './GlobalFilters';
import NavigationRail from './NavigationRail';
import { AnalyticsData } from '../types/api';

const { Title } = Typography;

interface TopSectionsProps {
  cacheKey: string;
}


const TopSections: React.FC<TopSectionsProps> = ({ cacheKey }) => {
  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    sections: {},
    coaches: {},
    reasons: {},
    time_analysis: {},
    mid_sections: {}
  });
  
  const [globalFilters, setGlobalFilters] = useState<GlobalFilterState>({
    timeframe: 'all',
    dateRange: null,
    rpfPosts: [],
    trainNumbers: []
  });

  useEffect(() => {
    if (cacheKey) {
      loadData();
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

  const loadData = async () => {
    if (!cacheKey) return;
    
    setLoading(true);
    try {
      const filters = buildFilters();
      
      const response = await axios.post(`/train-analytics/${cacheKey}`, filters, {
        params: { limit: 20 }
      });

      setAnalyticsData(response.data as AnalyticsData);
    } catch (error) {
      console.error('Failed to load sections data:', error);
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
        link.setAttribute('download', 'top_sections_data.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        const dataStr = JSON.stringify(response.data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'top_sections_data.json');
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (error) {
      console.error('Failed to download data:', error);
    }
  };

  const renderSectionsChart = () => {
    if (!analyticsData.sections || Object.keys(analyticsData.sections).length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '100px 0', color: '#999' }}>
          No sections data available
        </div>
      );
    }

    const chartData = Object.entries(analyticsData.sections)
      .slice(0, 15)
      .map(([key, value]) => ({
        name: key.length > 20 ? key.substring(0, 17) + '...' : key,
        value: Number(value),
        fullName: key
      }));

    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
          <YAxis />
          <Tooltip formatter={(value, name, props) => [value, props.payload.fullName]} />
          <Bar dataKey="value" fill="#1890ff" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderMidSectionsChart = () => {
    if (!analyticsData.mid_sections || Object.keys(analyticsData.mid_sections).length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '100px 0', color: '#999' }}>
          No mid sections data available
        </div>
      );
    }

    const chartData = Object.entries(analyticsData.mid_sections)
      .slice(0, 15)
      .map(([key, value]) => ({
        name: key.length > 15 ? key.substring(0, 12) + '...' : key,
        value: Number(value),
        fullName: key
      }));

    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
          <YAxis />
          <Tooltip formatter={(value, name, props) => [value, props.payload.fullName]} />
          <Bar dataKey="value" fill="#52c41a" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const getSectionsList = (data: Record<string, number>) => {
    return Object.entries(data)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([section, count], index) => ({
        rank: index + 1,
        section,
        count
      }));
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
          <Title level={3} style={{ marginBottom: 24 }}>
            <EnvironmentOutlined /> Top Affected Sections
          </Title>

          {/* Summary Stats */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={12} sm={8} md={6}>
              <Card>
                <Statistic
                  title="Total Affected Sections"
                  value={Object.keys(analyticsData.sections).length}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card>
                <Statistic
                  title="Total Mid Sections"
                  value={Object.keys(analyticsData.mid_sections).length}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card>
                <Statistic
                  title="Most Incidents"
                  value={Math.max(...Object.values(analyticsData.sections), 0)}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card>
                <Statistic
                  title="Total Incidents"
                  value={Object.values(analyticsData.sections).reduce((sum, count) => sum + count, 0)}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Charts */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={24}>
              <Card title="Station/Section Analysis" style={{ height: '500px' }}>
                {renderSectionsChart()}
              </Card>
            </Col>
          </Row>

          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={24}>
              <Card title="Mid Section Analysis" style={{ height: '500px' }}>
                {renderMidSectionsChart()}
              </Card>
            </Col>
          </Row>

          {/* Top Lists */}
          <Row gutter={16}>
            <Col xs={24} lg={12}>
              <Card title="Top 10 Station/Sections">
                <List
                  dataSource={getSectionsList(analyticsData.sections)}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <div style={{
                            width: 32,
                            height: 32,
                            backgroundColor: '#1890ff',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            fontWeight: 'bold'
                          }}>
                            {item.rank}
                          </div>
                        }
                        title={item.section}
                        description={`${item.count} incidents`}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Top 10 Mid Sections">
                <List
                  dataSource={getSectionsList(analyticsData.mid_sections)}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <div style={{
                            width: 32,
                            height: 32,
                            backgroundColor: '#52c41a',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            fontWeight: 'bold'
                          }}>
                            {item.rank}
                          </div>
                        }
                        title={item.section}
                        description={`${item.count} incidents`}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </Spin>
      </div>
    </div>
  );
};

export default TopSections;