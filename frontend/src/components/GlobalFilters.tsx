import React, { useState, useEffect, useCallback } from 'react';
import { Card, DatePicker, Select, Space, Button, Row, Col, Typography, Radio } from 'antd';
import { DownloadOutlined, FilterOutlined } from '@ant-design/icons';
import { Dayjs } from 'dayjs';
import axios from 'axios';
import { FilterOptions } from '../types/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text } = Typography;

interface GlobalFiltersProps {
  cacheKey: string;
  onFiltersChange: (filters: GlobalFilterState) => void;
  onDownload: () => void;
}

export interface GlobalFilterState {
  timeframe: 'all' | 'month' | 'custom';
  dateRange: [Dayjs | null, Dayjs | null] | null;
  selectedMonth: number | null;
  rpfPosts: string[];
  trainNumbers: string[];
}


const GlobalFilters: React.FC<GlobalFiltersProps> = ({ 
  cacheKey, 
  onFiltersChange,
  onDownload 
}) => {
  const [timeframe, setTimeframe] = useState<'all' | 'month' | 'custom'>('all');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [selectedRpfPosts, setSelectedRpfPosts] = useState<string[]>([]);
  const [selectedTrainNumbers, setSelectedTrainNumbers] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    rpf_posts: [],
    train_numbers: []
  });
  const [filteredTrainNumbers, setFilteredTrainNumbers] = useState<Array<{ value: string; incident_count: number }>>([]);
  const [filteredRpfPosts, setFilteredRpfPosts] = useState<Array<{ value: string; incident_count: number }>>([]);

  const loadFilterOptions = useCallback(async () => {
    try {
      const response = await axios.get(`/filter-options/${cacheKey}`);
      const options = response.data as FilterOptions;
      console.log('Raw API response:', response.data);
      console.log('Processed options:', options);
      console.log('RPF Posts count:', options.rpf_posts?.length || 0);
      console.log('Train Numbers count:', options.train_numbers?.length || 0);
      
      // Data comes pre-sorted by incident count from backend
      setFilterOptions({
        rpf_posts: options.rpf_posts || [],
        train_numbers: options.train_numbers || []
      });
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  }, [cacheKey]);

  const updateFilteredOptions = useCallback(() => {
    // Options come pre-sorted by incident count from backend, just pass them through
    setFilteredTrainNumbers(filterOptions.train_numbers);
    setFilteredRpfPosts(filterOptions.rpf_posts);
  }, [filterOptions.train_numbers, filterOptions.rpf_posts]);

  useEffect(() => {
    if (cacheKey) {
      loadFilterOptions();
    }
  }, [cacheKey, loadFilterOptions]);

  useEffect(() => {
    onFiltersChange({
      timeframe,
      dateRange,
      selectedMonth,
      rpfPosts: selectedRpfPosts,
      trainNumbers: selectedTrainNumbers
    });
  }, [timeframe, dateRange, selectedMonth, selectedRpfPosts, selectedTrainNumbers, onFiltersChange]);

  useEffect(() => {
    updateFilteredOptions();
  }, [updateFilteredOptions]);

  useEffect(() => {
    if (timeframe === 'month' && selectedMonth) {
      const now = dayjs();
      const year = now.year();
      const startOfMonth = dayjs(`${year}-${selectedMonth.toString().padStart(2, '0')}-01`);
      const endOfMonth = startOfMonth.endOf('month');
      setDateRange([startOfMonth, endOfMonth]);
    }
  }, [selectedMonth, timeframe]);

  const handleRpfPostChange = (values: string[]) => {
    setSelectedRpfPosts(values);
    // Clear train selection when RPF post changes to update the train list
    if (values.length !== selectedRpfPosts.length) {
      setSelectedTrainNumbers([]);
    }
  };

  const handleTrainNumberChange = (values: string[]) => {
    setSelectedTrainNumbers(values);
    // Clear RPF post selection when train changes to update the RPF post list
    if (values.length !== selectedTrainNumbers.length) {
      setSelectedRpfPosts([]);
    }
  };

  const handleTimeframeChange = (value: 'all' | 'month' | 'custom') => {
    setTimeframe(value);
    if (value === 'month') {
      if (selectedMonth) {
        const now = dayjs();
        const year = now.year();
        const startOfMonth = dayjs(`${year}-${selectedMonth.toString().padStart(2, '0')}-01`);
        const endOfMonth = startOfMonth.endOf('month');
        setDateRange([startOfMonth, endOfMonth]);
      } else {
        // Default to current month if no month selected
        const now = dayjs();
        setDateRange([now.startOf('month'), now.endOf('month')]);
      }
    } else if (value === 'all') {
      setDateRange(null);
      setSelectedMonth(null);
    } else if (value === 'custom') {
      setSelectedMonth(null);
    }
    // For custom, keep the current dateRange
  };

  const clearAllFilters = () => {
    setTimeframe('all');
    setDateRange(null);
    setSelectedMonth(null);
    setSelectedRpfPosts([]);
    setSelectedTrainNumbers([]);
  };

  return (
    <Card 
      style={{ marginBottom: 16 }}
      bodyStyle={{ padding: '16px 24px' }}
    >
      <Row justify="space-between" align="middle" gutter={[16, 8]}>
        <Col flex="auto">
          <Space wrap size="middle">
            <Space direction="vertical" size={2}>
              <Text strong style={{ fontSize: '12px' }}>TIMEFRAME</Text>
              <div>
                <Radio.Group
                  value={timeframe}
                  onChange={(e) => handleTimeframeChange(e.target.value)}
                  style={{ marginBottom: timeframe === 'custom' || timeframe === 'month' ? 8 : 0 }}
                >
                  <Radio.Button value="all">All</Radio.Button>
                  <Radio.Button value="month">Month</Radio.Button>
                  <Radio.Button value="custom">Custom</Radio.Button>
                </Radio.Group>
                {timeframe === 'month' && (
                  <Select
                    value={selectedMonth}
                    onChange={setSelectedMonth}
                    placeholder="Select Month"
                    style={{ width: 120, marginTop: 4 }}
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <Option key={i + 1} value={i + 1}>
                        {new Date(0, i).toLocaleString('en', { month: 'short' })}
                      </Option>
                    ))}
                  </Select>
                )}
                {timeframe === 'custom' && (
                  <RangePicker
                    value={dateRange}
                    onChange={setDateRange}
                    format="YYYY-MM-DD"
                    style={{ width: 240, marginTop: 4 }}
                    placeholder={['Start Date', 'End Date']}
                  />
                )}
              </div>
            </Space>
            
            <Space direction="vertical" size={2}>
              <Text strong style={{ fontSize: '12px' }}>RPF POST</Text>
              <Select
                mode="multiple"
                value={selectedRpfPosts}
                onChange={handleRpfPostChange}
                placeholder="Select RPF Posts"
                style={{ width: 200 }}
                maxTagCount="responsive"
                showSearch
                optionFilterProp="children"
              >
                {filteredRpfPosts.map(item => (
                  <Option key={item.value} value={item.value}>
                    {item.value} ({item.incident_count})
                  </Option>
                ))}
              </Select>
            </Space>

            <Space direction="vertical" size={2}>
              <Text strong style={{ fontSize: '12px' }}>TRAIN</Text>
              <Select
                mode="multiple"
                value={selectedTrainNumbers}
                onChange={handleTrainNumberChange}
                placeholder="Select Trains"
                style={{ width: 200 }}
                maxTagCount="responsive"
                showSearch
                optionFilterProp="children"
              >
                {filteredTrainNumbers.map(item => (
                  <Option key={item.value} value={item.value}>
                    {item.value} ({item.incident_count})
                  </Option>
                ))}
              </Select>
            </Space>

            <Button
              icon={<FilterOutlined />}
              onClick={clearAllFilters}
              style={{ marginTop: 18 }}
            >
              Clear Filters
            </Button>
          </Space>
        </Col>

        <Col>
          <Space>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={onDownload}
            >
              Export PDF Report
            </Button>
          </Space>
        </Col>
      </Row>
    </Card>
  );
};

export default GlobalFilters;