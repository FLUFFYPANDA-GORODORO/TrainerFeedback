import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Star, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  MessageSquare,
  Download,
  Calendar,
  User,
  Building2
} from 'lucide-react';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];

const SessionAnalytics = ({ session, onBack }) => {
  const handleExport = async () => {
    if (!session?.compiledStats) return;
    
    const stats = session.compiledStats;
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Gryphon Academy';

    // Summary Sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'Field', key: 'field', width: 25 },
      { header: 'Value', key: 'value', width: 40 }
    ];
    summarySheet.addRows([
      { field: 'Session Topic', value: session.topic },
      { field: 'College', value: session.collegeName },
      { field: 'Trainer', value: session.assignedTrainer?.name || 'N/A' },
      { field: 'Total Responses', value: stats.totalResponses },
      { field: 'Average Rating', value: stats.avgRating },
    ]);

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `analytics_${session.topic.replace(/[^a-z0-9]/gi, '_')}.xlsx`);
    toast.success('Report exported');
  };

  if (!session?.compiledStats) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No analytics data available for this session.</p>
        <Button variant="outline" className="mt-4" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sessions
        </Button>
      </div>
    );
  }

  const stats = session.compiledStats;
  
  // Prepare chart data
  const ratingData = Object.entries(stats.ratingDistribution || {}).map(([rating, count]) => ({
    name: `${rating} Star`,
    value: count,
    rating: parseInt(rating)
  }));

  // Prepare radar chart data from category averages
  const categoryLabels = {
    knowledge: 'Knowledge',
    communication: 'Communication',
    engagement: 'Engagement',
    content: 'Content',
    delivery: 'Delivery',
    overall: 'Overall'
  };
  
  const radarData = Object.entries(stats.categoryAverages || {}).map(([key, value]) => ({
    category: categoryLabels[key] || key,
    score: value,
    fullMark: 5
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{session.topic}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1"><Building2 className="h-4 w-4" /> {session.collegeName}</span>
              <span className="flex items-center gap-1"><User className="h-4 w-4" /> {session.assignedTrainer?.name}</span>
              <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {session.sessionDate}</span>
            </div>
          </div>
        </div>
        <Button onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" /> Export Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalResponses}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgRating.toFixed(2)}</div>
            <div className="flex items-center gap-1 mt-1">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className={`h-3 w-3 ${i <= Math.round(stats.avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Top Rating</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.topRating.toFixed(2)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lowest Rating</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.leastRating.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
            <CardDescription>Number of responses per rating level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ratingData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis allowDecimals={false} className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {ratingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.rating - 1]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Rating Breakdown</CardTitle>
            <CardDescription>Percentage distribution of ratings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ratingData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {ratingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.rating - 1]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comments Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Comments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Top Comments
            </CardTitle>
            <CardDescription>From highest rated responses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(stats.topComments || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No comments available</p>
            ) : (
              stats.topComments.map((c, i) => (
                <div key={i} className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
                  <p className="text-sm">{c.text}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs text-muted-foreground">{c.avgRating.toFixed(1)}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Average Comments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              Average Comments
            </CardTitle>
            <CardDescription>From mid-rated responses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(stats.avgComments || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No comments available</p>
            ) : (
              stats.avgComments.map((c, i) => (
                <div key={i} className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
                  <p className="text-sm">{c.text}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs text-muted-foreground">{c.avgRating.toFixed(1)}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Least Rated Comments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              Improvement Areas
            </CardTitle>
            <CardDescription>From lowest rated responses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(stats.leastRatedComments || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No comments available</p>
            ) : (
              stats.leastRatedComments.map((c, i) => (
                <div key={i} className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900">
                  <p className="text-sm">{c.text}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs text-muted-foreground">{c.avgRating.toFixed(1)}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Radar Chart - Category Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Category Performance</CardTitle>
          <CardDescription>Average scores across different evaluation categories (spider/radar chart)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis 
                    dataKey="category" 
                    tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 5]} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    tickCount={6}
                  />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.4}
                    strokeWidth={2}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => [value.toFixed(2), 'Score']}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No category data available. Assign categories to rating questions in templates.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionAnalytics;
