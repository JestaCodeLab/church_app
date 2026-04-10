import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

interface Transaction {
  _id: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
}

interface TransactionBarChartProps {
  transactions: Transaction[];
  currency: string;
  groupBy?: 'day' | 'week' | 'month'; // How to group transactions
  title?: string;
  height?: number;
  showLegend?: boolean;
  colors?: {
    completed?: string;
    pending?: string;
    failed?: string;
  };
}

const TransactionBarChart: React.FC<TransactionBarChartProps> = ({
  transactions,
  currency,
  groupBy = 'day',
  title = 'Transaction Amount by Day',
  height = 400,
  showLegend = true,
  colors = {
    completed: '#10b981',
    pending: '#f59e0b',
    failed: '#ef4444',
  },
}) => {
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return [];
    }

    // Group transactions by status and date
    const groupedData: Record<
      string,
      {
        date: string;
        completed: number;
        pending: number;
        failed: number;
      }
    > = {};

    transactions.forEach((tx) => {
      const date = new Date(tx.createdAt);
      let dateKey = '';

      switch (groupBy) {
        case 'day':
          dateKey = format(date, 'MMM dd');
          break;
        case 'week':
          dateKey = format(date, "w'W' MMM");
          break;
        case 'month':
          dateKey = format(date, 'MMMM yyyy');
          break;
      }

      if (!groupedData[dateKey]) {
        groupedData[dateKey] = {
          date: dateKey,
          completed: 0,
          pending: 0,
          failed: 0,
        };
      }

      const status = tx.status || 'completed';
      groupedData[dateKey][status] += tx.amount;
    });

    // Convert to array and sort by date
    return Object.values(groupedData).sort((a, b) => {
      const aDate = new Date(a.date);
      const bDate = new Date(b.date);
      return aDate.getTime() - bDate.getTime();
    });
  }, [transactions, groupBy]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 dark:bg-gray-800 text-white p-3 rounded-lg shadow-lg border border-gray-700">
          <p className="font-semibold">{payload[0].payload.date}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {currency} {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            className="dark:stroke-gray-700"
          />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            className="dark:stroke-gray-400"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#6b7280"
            className="dark:stroke-gray-400"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => {
              if (value === 0) return '0';
              if (value >= 1000000) {
                return `${(value / 1000000).toFixed(1)}M`;
              }
              if (value >= 1000) {
                return `${(value / 1000).toFixed(0)}K`;
              }
              return value.toLocaleString();
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="square"
            />
          )}
          <Bar
            dataKey="completed"
            name="Completed"
            fill={colors.completed}
            radius={[8, 8, 0, 0]}
          />
          <Bar
            dataKey="pending"
            name="Pending"
            fill={colors.pending}
            radius={[8, 8, 0, 0]}
          />
          <Bar
            dataKey="failed"
            name="Failed"
            fill={colors.failed}
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TransactionBarChart;
