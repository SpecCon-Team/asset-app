import React, { useState, useEffect } from 'react';
import {
  Package,
  Ticket,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  Activity,
  Settings,
  Eye,
  EyeOff,
  Move,
  X,
} from 'lucide-react';
import { getApiClient } from '@/features/assets/lib/apiClient';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface Widget {
  id: string;
  type: string;
  title: string;
  size: 'small' | 'medium' | 'large';
  visible: boolean;
  position: number;
  data?: any;
}

interface DashboardWidgetsProps {
  userId: string;
}

export default function DashboardWidgets({ userId }: DashboardWidgetsProps) {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWidgets();
  }, [userId]);

  const fetchWidgets = async () => {
    try {
      const apiClient = getApiClient();
      const response = await apiClient.get(`/dashboard/widgets/${userId}`);
      setWidgets(response.data.widgets || getDefaultWidgets());
    } catch (error) {
      console.error('Failed to fetch widgets:', error);
      setWidgets(getDefaultWidgets());
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultWidgets = (): Widget[] => [
    {
      id: '1',
      type: 'asset_stats',
      title: 'Asset Overview',
      size: 'medium',
      visible: true,
      position: 0,
    },
    {
      id: '2',
      type: 'ticket_stats',
      title: 'Ticket Statistics',
      size: 'medium',
      visible: true,
      position: 1,
    },
    {
      id: '3',
      type: 'recent_activity',
      title: 'Recent Activity',
      size: 'large',
      visible: true,
      position: 2,
    },
    {
      id: '4',
      type: 'asset_chart',
      title: 'Asset Distribution',
      size: 'medium',
      visible: true,
      position: 3,
    },
  ];

  const saveWidgetConfiguration = async (updatedWidgets: Widget[]) => {
    try {
      const apiClient = getApiClient();
      await apiClient.post(`/dashboard/widgets/${userId}`, {
        widgets: updatedWidgets,
      });
    } catch (error) {
      console.error('Failed to save widget configuration:', error);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedWidgets = items.map((widget, index) => ({
      ...widget,
      position: index,
    }));

    setWidgets(updatedWidgets);
    saveWidgetConfiguration(updatedWidgets);
  };

  const toggleWidgetVisibility = (widgetId: string) => {
    const updatedWidgets = widgets.map((widget) =>
      widget.id === widgetId ? { ...widget, visible: !widget.visible } : widget
    );
    setWidgets(updatedWidgets);
    saveWidgetConfiguration(updatedWidgets);
  };

  const renderWidgetContent = (widget: Widget) => {
    switch (widget.type) {
      case 'asset_stats':
        return <AssetStatsWidget />;
      case 'ticket_stats':
        return <TicketStatsWidget />;
      case 'recent_activity':
        return <RecentActivityWidget />;
      case 'asset_chart':
        return <AssetChartWidget />;
      default:
        return <div>Unknown widget type</div>;
    }
  };

  const getSizeClass = (size: string) => {
    switch (size) {
      case 'small':
        return 'col-span-1';
      case 'medium':
        return 'col-span-1 md:col-span-2';
      case 'large':
        return 'col-span-1 md:col-span-3';
      default:
        return 'col-span-1';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const visibleWidgets = widgets.filter((w) => w.visible);

  return (
    <div className="space-y-4">
      {/* Edit Mode Toggle */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <Settings className="w-4 h-4" />
          {isEditMode ? 'Done Editing' : 'Customize Dashboard'}
        </button>
      </div>

      {/* Widgets Grid */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="widgets" direction="horizontal">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              {widgets.map((widget, index) => (
                <Draggable
                  key={widget.id}
                  draggableId={widget.id}
                  index={index}
                  isDragDisabled={!isEditMode}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`${getSizeClass(widget.size)} ${
                        !widget.visible ? 'opacity-50' : ''
                      } ${snapshot.isDragging ? 'z-50' : ''}`}
                    >
                      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        {/* Widget Header */}
                        <div
                          {...(isEditMode ? provided.dragHandleProps : {})}
                          className={`flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 ${
                            isEditMode ? 'cursor-move bg-gray-50 dark:bg-gray-700/50' : ''
                          }`}
                        >
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            {isEditMode && <Move className="w-4 h-4 text-gray-400" />}
                            {widget.title}
                          </h3>
                          {isEditMode && (
                            <button
                              onClick={() => toggleWidgetVisibility(widget.id)}
                              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                              {widget.visible ? (
                                <Eye className="w-4 h-4" />
                              ) : (
                                <EyeOff className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>

                        {/* Widget Content */}
                        {widget.visible && (
                          <div className="p-4">{renderWidgetContent(widget)}</div>
                        )}
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}

// Individual Widget Components

function AssetStatsWidget() {
  const [stats, setStats] = useState({ total: 0, available: 0, in_use: 0, maintenance: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const apiClient = getApiClient();
      const response = await apiClient.get('/assets/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch asset stats:', error);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <StatCard icon={Package} label="Total Assets" value={stats.total} color="blue" />
      <StatCard icon={CheckCircle} label="Available" value={stats.available} color="green" />
      <StatCard icon={Activity} label="In Use" value={stats.in_use} color="orange" />
      <StatCard icon={AlertTriangle} label="Maintenance" value={stats.maintenance} color="red" />
    </div>
  );
}

function TicketStatsWidget() {
  const [stats, setStats] = useState({ open: 0, in_progress: 0, resolved: 0, closed: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const apiClient = getApiClient();
      const response = await apiClient.get('/tickets/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch ticket stats:', error);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <StatCard icon={Ticket} label="Open" value={stats.open} color="blue" />
      <StatCard icon={Clock} label="In Progress" value={stats.in_progress} color="yellow" />
      <StatCard icon={CheckCircle} label="Resolved" value={stats.resolved} color="green" />
      <StatCard icon={X} label="Closed" value={stats.closed} color="gray" />
    </div>
  );
}

function RecentActivityWidget() {
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const apiClient = getApiClient();
      const response = await apiClient.get('/activity/recent', { params: { limit: 5 } });
      setActivities(response.data.activities || []);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    }
  };

  return (
    <div className="space-y-3">
      {activities.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          No recent activity
        </p>
      ) : (
        activities.map((activity, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
          >
            <Activity className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 dark:text-white">{activity.description}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {activity.timestamp}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function AssetChartWidget() {
  const data = {
    labels: ['Available', 'In Use', 'Maintenance', 'Retired'],
    datasets: [
      {
        data: [45, 30, 15, 10],
        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="h-48">
      <Doughnut
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
            },
          },
        }}
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
}) {
  const colorClasses = {
    blue: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
    green: 'text-green-500 bg-green-50 dark:bg-green-900/20',
    orange: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
    red: 'text-red-500 bg-red-50 dark:bg-red-900/20',
    yellow: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
    gray: 'text-gray-500 bg-gray-50 dark:bg-gray-700/20',
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </div>
  );
}
