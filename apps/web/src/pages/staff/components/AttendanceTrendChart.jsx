import React from 'react';
import { Card } from './primitives';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

export function AttendanceTrendChart({ data }) {
  return (
    <Card title="Attendance Trend (12 weeks)" subtitle="Overall staff presence">
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{left:0,right:0,top:5,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="wk" hide={false} />
            <YAxis hide domain={[80,100]} />
            <Tooltip />
            <Line type="monotone" dataKey="percent" stroke="#2563eb" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
