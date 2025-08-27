import React, { useState, useEffect } from 'react';
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
  onDownload: (format: string) => void;
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
  const [filteredTrainNumbers, setFilteredTrainNumbers] = useState<string[]>([]);
  const [filteredRpfPosts, setFilteredRpfPosts] = useState<string[]>([]);

  useEffect(() => {
    if (cacheKey) {
      loadFilterOptions();
    }
  }, [cacheKey]);

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
  }, [selectedRpfPosts, selectedTrainNumbers, filterOptions]);

  useEffect(() => {
    if (timeframe === 'month' && selectedMonth) {
      const now = dayjs();
      const year = now.year();
      const startOfMonth = dayjs(`${year}-${selectedMonth.toString().padStart(2, '0')}-01`);
      const endOfMonth = startOfMonth.endOf('month');
      setDateRange([startOfMonth, endOfMonth]);
    }
  }, [selectedMonth, timeframe]);

  const loadFilterOptions = async () => {
    try {
      const response = await axios.get(`/filter-options/${cacheKey}`);
      const options = response.data as FilterOptions;
      setFilterOptions({
        rpf_posts: (options.rpf_posts || []).sort(),
        train_numbers: (options.train_numbers || []).sort()
      });
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  };

  const updateFilteredOptions = () => {
    // If RPF posts are selected, filter train numbers accordingly
    if (selectedRpfPosts.length > 0) {
      // In a real implementation, you would make an API call to get trains for selected RPF posts
      // For now, we show all available trains
      setFilteredTrainNumbers(filterOptions.train_numbers);
    } else {
      setFilteredTrainNumbers(filterOptions.train_numbers);
    }

    // If train numbers are selected, filter RPF posts accordingly  
    if (selectedTrainNumbers.length > 0) {
      // In a real implementation, you would make an API call to get RPF posts for selected trains
      // For now, we show all available RPF posts
      setFilteredRpfPosts(filterOptions.rpf_posts);
    } else {
      setFilteredRpfPosts(filterOptions.rpf_posts);
    }
  };

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
                {filteredRpfPosts.map(post => (
                  <Option key={post} value={post}>{post}</Option>
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
                {filteredTrainNumbers.map(train => (
                  <Option key={train} value={train}>{train}</Option>
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
              onClick={() => onDownload('csv')}
            >
              Download CSV
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => onDownload('json')}
            >
              Download JSON  
            </Button>
          </Space>
        </Col>
      </Row>
    </Card>
  );
};

export default GlobalFilters;