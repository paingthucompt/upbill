import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, TrendingUp, Users, FileText } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from "recharts";

interface AnalyticsData {
  totalIncome: number;
  totalPayout: number;
  totalCommission: number;
  totalTransactions: number;
  totalSubscriptionPayments: number;
  paymentCount: number;
}

interface MonthlyData {
  month: string;
  income: number;
  payout: number;
  commission: number;
  transactionCount: number;
}

const AnalyticsTab = ({ isAdmin = false }: { isAdmin?: boolean }) => {
  const { toast } = useToast();

  // Fetch dashboard analytics
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['analyticsDashboard'],
    queryFn: async () => {
      const endpoint = isAdmin ? '/api/analytics/admin' : '/api/analytics/dashboard';
      const response = await fetchWithAuth(endpoint);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      
      return response.json();
    },
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch monthly data for charts
  const { data: monthlyData } = useQuery({
    queryKey: ['monthlyAnalytics'],
    queryFn: async () => {
      const response = await fetchWithAuth('/api/analytics/monthly');
      
      if (!response.ok) {
        throw new Error('Failed to fetch monthly analytics');
      }
      
      return response.json();
    },
    enabled: !isAdmin, // Only fetch for regular users
    retry: 3,
    staleTime: 5 * 60 * 1000,
  });

  // Handle errors
  if (error) {
    toast({
      title: "Error",
      description: "Failed to load analytics data",
      variant: "destructive",
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-lg text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) return null;

  const chartConfig = {
    income: {
      label: "Income",
      color: "hsl(var(--primary))",
    },
    payout: {
      label: "Payout",
      color: "hsl(var(--accent))",
    },
    commission: {
      label: "Commission",
      color: "hsl(var(--destructive))",
    },
  };

  if (isAdmin) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalUsers || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.activeSubscribers || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(analytics.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Income</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ฿{(analytics.totalSystemIncome || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">{analytics.totalSystemTransactions || 0} transactions</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Admin Overview</CardTitle>
            <CardDescription>System-wide statistics and metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="text-sm font-medium">Active Users</p>
                  <p className="text-xs text-muted-foreground">Users with transactions</p>
                </div>
                <div className="text-2xl font-bold">{analytics.activeUsers || 0}</div>
              </div>
              
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="text-sm font-medium">Total Payments</p>
                  <p className="text-xs text-muted-foreground">Completed subscription payments</p>
                </div>
                <div className="text-2xl font-bold">{analytics.totalPayments || 0}</div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">System Commission</p>
                  <p className="text-xs text-muted-foreground">Total commission earned</p>
                </div>
                <div className="text-2xl font-bold">
                  ฿{(analytics.totalSystemCommission || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User analytics
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ฿{(analytics.totalIncome || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payout</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ฿{(analytics.totalPayout || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission Paid</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ฿{(analytics.totalCommission || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalTransactions || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscription Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(analytics.totalSubscriptionPayments || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">{analytics.paymentCount || 0} payments</p>
          </CardContent>
        </Card>
      </div>

      {monthlyData && monthlyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
            <CardDescription>Your transaction and payout history</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="payout" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Line type="monotone" dataKey="commission" stroke="hsl(var(--destructive))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsTab;