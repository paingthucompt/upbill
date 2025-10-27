import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Users, TrendingUp, Calendar } from "lucide-react";
import { fetchWithAuth } from "@/lib/auth";

interface SubscriptionStats {
  totalActiveSubscriptions: number;
  totalSubscriptionRevenue: number;
  averageSubscriptionLength: number;
  monthlyRecurringRevenue: number;
  expiringThisMonth: number;
}

const SubscriptionAnalytics = () => {
  const { toast } = useToast();

  // Fetch admin analytics data
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['adminAnalytics'],
    queryFn: async () => {
      const response = await fetchWithAuth('/api/analytics/admin');
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (error) {
    toast({
      title: "Error",
      description: "Failed to load analytics data",
      variant: "destructive",
    });
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Subscription Analytics</h2>
        <p className="text-sm text-muted-foreground">Overview of subscription revenue and metrics</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalActiveSubscriptions || 0}</div>
            <p className="text-xs text-muted-foreground">Currently active users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats?.totalSubscriptionRevenue || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">All-time subscription revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats?.monthlyRecurringRevenue || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Estimated MRR</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.expiringThisMonth || 0}</div>
            <p className="text-xs text-muted-foreground">Subscriptions ending soon</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscription Insights</CardTitle>
          <CardDescription>Key metrics about your subscription business</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <p className="text-sm font-medium">Average Subscription Length</p>
                <p className="text-xs text-muted-foreground">Average days per subscription</p>
              </div>
              <div className="text-2xl font-bold">{Math.round(stats?.averageSubscriptionLength || 0)} days</div>
            </div>
            
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <p className="text-sm font-medium">Revenue Per Active User</p>
                <p className="text-xs text-muted-foreground">Average monthly value</p>
              </div>
              <div className="text-2xl font-bold">
                ${(stats?.totalActiveSubscriptions || 0) > 0 
                  ? ((stats?.monthlyRecurringRevenue || 0) / (stats?.totalActiveSubscriptions || 1)).toFixed(2) 
                  : '0.00'}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Renewal Rate</p>
                <p className="text-xs text-muted-foreground">Active vs expiring ratio</p>
              </div>
              <div className="text-2xl font-bold">
                {(stats?.totalActiveSubscriptions || 0) > 0
                  ? ((1 - (stats?.expiringThisMonth || 0) / (stats?.totalActiveSubscriptions || 1)) * 100).toFixed(1)
                  : '0'}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionAnalytics;