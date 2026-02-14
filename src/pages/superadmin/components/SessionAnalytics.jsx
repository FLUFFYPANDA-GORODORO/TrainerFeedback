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
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const SessionAnalytics = ({ session, onBack }) => {
  const handleExport = async () => {
    if (!session?.compiledStats) return;
    
    try {
      toast.loading('Exporting report...');
      const stats = session.compiledStats;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Gryphon Academy';

      // [NEW] Fetch detailed responses
      const { getResponses } = await import('@/services/superadmin/responseService');
      const responses = await getResponses(session.id);

      // --- SHEET 1: RESPONSES ---
      const responsesSheet = workbook.addWorksheet('Responses');
      const questions = session.questions || [];
      const columns = [
        { header: 'Response ID', key: 'id', width: 20 },
        { header: 'Submitted At', key: 'submittedAt', width: 20 },
        { header: 'Device ID', key: 'deviceId', width: 20 },
        ...questions.map((q, i) => ({ 
            header: `Q${i+1}: ${q.text || q.question}`, 
            key: `q_${q.id}`, 
            width: 30 
        }))
      ];
      responsesSheet.columns = columns;

      const rows = responses.map(resp => {
        const row = {
          id: resp.id,
          submittedAt: resp.submittedAt?.toDate ? resp.submittedAt.toDate().toLocaleString() : new Date(resp.submittedAt).toLocaleString(),
          deviceId: resp.deviceId
        };
        if (resp.answers) {
            resp.answers.forEach(ans => {
                row[`q_${ans.questionId}`] = ans.value;
            });
        }
        return row;
      });
      responsesSheet.addRows(rows);
      responsesSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      responsesSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };

      // --- SHEET 2: SUMMARY ---
      const summarySheet = workbook.addWorksheet('Summary Stats');
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
      summarySheet.getRow(1).font = { bold: true };
      summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
      summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

      // --- SHEET 3: COMMENTS ---
      const commentsSheet = workbook.addWorksheet('Comments');
      commentsSheet.columns = [
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Comment', key: 'comment', width: 60 },
        { header: 'Avg Rating', key: 'avgRating', width: 15 }
      ];
      (stats.topComments || []).forEach(c => {
        commentsSheet.addRow({ category: 'Top Rated', comment: c.text, avgRating: c.avgRating });
      });
      (stats.avgComments || []).forEach(c => {
        commentsSheet.addRow({ category: 'Average', comment: c.text, avgRating: c.avgRating });
      });
      (stats.leastRatedComments || []).forEach(c => {
        commentsSheet.addRow({ category: 'Least Rated', comment: c.text, avgRating: c.avgRating });
      });
      commentsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      commentsSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `analytics_${session.topic.replace(/[^a-z0-9]/gi, '_')}.xlsx`);
      
      toast.dismiss();
      toast.success('Report exported');
    } catch (error) {
      console.error("Export failed:", error);
      toast.dismiss();
      toast.error("Export failed");
    }
  };

  if (!session?.compiledStats) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No analytics data available for this session.</p>
        <Button variant="outline" size="lg" className="mt-4 gap-2" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" /> Back to Sessions
        </Button>
      </div>
    );
  }

  const stats = session.compiledStats;
  
  // Prepare chart data - all ratings for bar chart (including zeros)
  const ratingDataAll = Object.entries(stats.ratingDistribution || {})
    .map(([rating, count]) => ({
      name: `${rating} Star`,
      value: count,
      rating: parseInt(rating)
    }));
  
  // Filtered data for pie chart (exclude zeros)
  const ratingDataFiltered = ratingDataAll.filter(item => item.value > 0);

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
          <Button variant="outline" size="lg" onClick={onBack} className="gap-2 px-4 py-2">
            <ArrowLeft className="h-5 w-5" />
            Back
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
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalResponses}</div>
            <p className="text-xs text-muted-foreground mt-1">Student submissions</p>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.avgRating.toFixed(2)}</div>
            <div className="flex items-center gap-1 mt-1">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className={`h-3 w-3 ${i <= Math.round(stats.avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
              ))}
              <span className="text-xs text-muted-foreground ml-1">out of 5.0</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Top Rating</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.topRating.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Highest score</p>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lowest Rating</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.leastRating.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Needs improvement</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section - Reordered: Rating Distribution, Category Performance, Rating Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Rating Distribution Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
            <CardDescription>Number of responses per rating level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ratingDataAll}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis allowDecimals={false} className="text-xs" />
                  <Tooltip 
                    cursor={false}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                    formatter={(value) => [value, 'Responses']}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 2. Category Performance Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Category Performance</CardTitle>
            <CardDescription>Average scores across evaluation categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis 
                      dataKey="category" 
                      tick={{ fill: 'hsl(var(--foreground))', fontSize: 10 }}
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 5]} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
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
                      formatter={(value) => [parseFloat(value).toFixed(2), 'Score']}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  No category data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 3. Rating Breakdown Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Rating Breakdown</CardTitle>
            <CardDescription>Percentage distribution of ratings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ratingDataFiltered}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {ratingDataFiltered.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={`hsl(var(--primary) / ${0.4 + (index * 0.15)})`}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comments Section - Clean with no backgrounds */}
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
                <div key={i} className="p-3 rounded-lg border">
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
              <MessageSquare className="h-5 w-5 text-primary" />
              Average Comments
            </CardTitle>
            <CardDescription>From mid-rated responses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(stats.avgComments || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No comments available</p>
            ) : (
              stats.avgComments.map((c, i) => (
                <div key={i} className="p-3 rounded-lg border">
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
                <div key={i} className="p-3 rounded-lg border">
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
    </div>
  );
};

export default SessionAnalytics;
