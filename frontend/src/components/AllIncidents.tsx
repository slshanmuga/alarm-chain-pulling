import React, { useState, useEffect } from 'react';
import { Card, Table, Row, Col, Pagination, Spin, Typography } from 'antd';
import axios from 'axios';
import GlobalFilters, { GlobalFilterState } from './GlobalFilters';
import NavigationRail from './NavigationRail';
import { TableResponse } from '../types/api';

const { Title } = Typography;

interface AllIncidentsProps {
  cacheKey: string;
}

interface IncidentRecord {
  [key: string]: any;
}


const AllIncidents: React.FC<AllIncidentsProps> = ({ cacheKey }) => {
  const [loading, setLoading] = useState(false);
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0
  });
  
  const [globalFilters, setGlobalFilters] = useState<GlobalFilterState>({
    timeframe: 'all',
    dateRange: null,
    selectedMonth: null,
    rpfPosts: [],
    trainNumbers: []
  });

  useEffect(() => {
    if (cacheKey) {
      loadIncidents();
    }
  }, [cacheKey, globalFilters, pagination.current, pagination.pageSize]);

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

  const loadIncidents = async () => {
    if (!cacheKey) return;
    
    setLoading(true);
    try {
      const filters = buildFilters();
      
      const response = await axios.post(`/table/${cacheKey}`, {
        filters,
        page: pagination.current,
        page_size: pagination.pageSize
      });

      const data = response.data as TableResponse;
      setIncidents(data.data || []);
      setPagination(prev => ({
        ...prev,
        total: data.total
      }));
    } catch (error) {
      console.error('Failed to load incidents:', error);
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
        link.setAttribute('download', 'alarm_chain_incidents.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        const dataStr = JSON.stringify(response.data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'alarm_chain_incidents.json');
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (error) {
      console.error('Failed to download data:', error);
    }
  };

  const handleTableChange = (page: number, pageSize: number) => {
    setPagination(prev => ({
      ...prev,
      current: page,
      pageSize
    }));
  };

  const columns = incidents.length > 0 ? Object.keys(incidents[0]).map(key => ({
    title: key.replace(/_/g, ' ').toUpperCase(),
    dataIndex: key,
    key: key,
    width: key === 'date' ? 120 : key.length > 10 ? 150 : 100,
    ellipsis: true,
    sorter: true,
    render: (text: any) => {
      if (text === null || text === undefined) return '-';
      return String(text);
    }
  })) : [];

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
              <Title level={4} style={{ margin: 0 }}>
                All Incidents ({pagination.total} total)
              </Title>
            </Col>
          </Row>

          <Spin spinning={loading}>
            <Table
              columns={columns}
              dataSource={incidents}
              rowKey={(record, index) => `incident-${index}`}
              pagination={false}
              scroll={{ x: 1200, y: 500 }}
              size="small"
            />

            {pagination.total > 0 && (
              <div style={{ marginTop: 16, textAlign: 'right' }}>
                <Pagination
                  current={pagination.current}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  showSizeChanger
                  showQuickJumper
                  showTotal={(total, range) =>
                    `${range[0]}-${range[1]} of ${total} incidents`
                  }
                  onChange={handleTableChange}
                  onShowSizeChange={handleTableChange}
                />
              </div>
            )}
          </Spin>
        </Card>
      </div>
    </div>
  );
};

export default AllIncidents;