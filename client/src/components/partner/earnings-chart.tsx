import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Order } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";

interface EarningsChartProps {
  orders: Order[];
}

export default function EarningsChart({ orders }: EarningsChartProps) {
  // Generate earnings data for the last 7 days
  const generateEarningsData = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);
      
      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt || new Date());
        return orderDate >= dayStart && 
               orderDate < dayEnd && 
               order.status === "delivered";
      });
      
      const earnings = dayOrders.reduce((sum, order) => sum + (order.deliveryFee || 50), 0);
      
      data.push({
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        earnings: earnings,
        deliveries: dayOrders.length
      });
    }
    
    return data;
  };

  const data = generateEarningsData();
  const totalWeekEarnings = data.reduce((sum, day) => sum + day.earnings, 0);
  const totalWeekDeliveries = data.reduce((sum, day) => sum + day.deliveries, 0);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Weekly Earnings</span>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalWeekEarnings)}
            </div>
            <div className="text-sm text-gray-500">
              {totalWeekDeliveries} deliveries this week
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="day" 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `₹${value}`}
            />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === "earnings") {
                  return [formatCurrency(value), "Earnings"];
                }
                return [value, name];
              }}
              labelFormatter={(label, payload) => {
                const item = payload?.[0]?.payload;
                return item ? `${label}, ${item.date}` : label;
              }}
            />
            <Line 
              type="monotone" 
              dataKey="earnings" 
              stroke="#10b981" 
              strokeWidth={3}
              dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Average/Day</p>
            <p className="font-semibold">{formatCurrency(totalWeekEarnings / 7)}</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Best Day</p>
            <p className="font-semibold">
              {formatCurrency(Math.max(...data.map(d => d.earnings)))}
            </p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Avg Per Delivery</p>
            <p className="font-semibold">
              {totalWeekDeliveries > 0 ? formatCurrency(totalWeekEarnings / totalWeekDeliveries) : formatCurrency(0)}
            </p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Growth</p>
            <p className="font-semibold text-green-600">+12%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}