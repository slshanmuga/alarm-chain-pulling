import React from 'react';
import { Card, Row, Col, Statistic, Typography } from 'antd';
import { RiseOutlined, CalendarOutlined, BarChartOutlined } from '@ant-design/icons';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

const { Text } = Typography;

interface KPICardsProps {
  totalIncidents: number;
  percentile?: number;
  dailyAverage: number;
  monthlyTrend: number[];
  loading?: boolean;
  timeframeMode?: 'all' | 'month' | 'custom';
  thirdCardData?: number[];
  thirdCardTitle?: string;
}

const KPICards: React.FC<KPICardsProps> = ({
  totalIncidents,
  percentile,
  dailyAverage,
  monthlyTrend,
  loading = false,
  timeframeMode = 'all',
  thirdCardData,
  thirdCardTitle
}) => {
  const sparklineData = monthlyTrend.map((value, index) => ({
    index,
    value
  }));

  const formatPercentile = (value: number) => {
    return `${value.toFixed(1)}th percentile`;
  };

  return (
    <Row gutter={16}>
      <Col xs={24} sm={8}>
        <Card 
          loading={loading}
          style={{ 
            height: '120px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}
          bodyStyle={{ padding: '20px' }}
        >
          <Statistic
            title={
              <div>
                <BarChartOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                <span>Total Incidents</span>
                {percentile !== null && percentile !== undefined && (
                  <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                    {formatPercentile(percentile)}
                  </div>
                )}
              </div>
            }
            value={totalIncidents}
            valueStyle={{ 
              color: '#1890ff',
              fontSize: '28px',
              fontWeight: 'bold'
            }}
          />
        </Card>
      </Col>

      <Col xs={24} sm={8}>
        <Card 
          loading={loading}
          style={{ 
            height: '120px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}
          bodyStyle={{ padding: '20px' }}
        >
          <Statistic
            title={
              <div>
                <CalendarOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                <span>Daily Average</span>
              </div>
            }
            value={dailyAverage}
            precision={2}
            valueStyle={{ 
              color: '#52c41a',
              fontSize: '28px',
              fontWeight: 'bold'
            }}
            suffix="per day"
          />
        </Card>
      </Col>

      <Col xs={24} sm={8}>
        <Card
          loading={loading}
          style={{
            height: '120px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}
          bodyStyle={{ padding: '20px' }}
        >
          <Row>
            <Col span={12}>
              <div>
                <RiseOutlined style={{ marginRight: 8, color: '#fa8c16' }} />
                <Text strong style={{ 
                  fontSize: '14px',
                  display: 'block',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {thirdCardTitle || 'Monthly Trend'}
                </Text>
              </div>
            </Col>
            <Col span={12}>
              {(thirdCardData && thirdCardData.length > 1) || (sparklineData.length > 1 && !thirdCardData) ? (
                <div style={{ height: '60px', marginTop: '10px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={(thirdCardData || monthlyTrend).map((value, index) => ({ index, value }))}>
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#fa8c16"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 3, stroke: '#fa8c16', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : null}
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>
  );
};

export default KPICards;