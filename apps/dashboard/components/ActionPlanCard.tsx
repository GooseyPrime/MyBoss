import React from 'react';

interface ActionTask {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  order: number;
}

interface ActionPlan {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  category: string;
  assignee?: string | null;
  dueDate?: string | null;
  createdAt: string;
  tasks: ActionTask[];
}

interface ActionPlanCardProps {
  plan: ActionPlan;
}

export function ActionPlanCard({ plan }: ActionPlanCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-700 text-red-200';
      case 'medium': return 'bg-yellow-700 text-yellow-200';
      case 'low': return 'bg-green-700 text-green-200';
      default: return 'bg-gray-700 text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-700 text-green-200';
      case 'in_progress': return 'bg-blue-700 text-blue-200';
      case 'open': return 'bg-gray-700 text-gray-200';
      case 'cancelled': return 'bg-red-700 text-red-200';
      default: return 'bg-gray-700 text-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'security': return 'bg-purple-700 text-purple-200';
      case 'build': return 'bg-orange-700 text-orange-200';
      case 'dependency': return 'bg-cyan-700 text-cyan-200';
      case 'feature': return 'bg-indigo-700 text-indigo-200';
      default: return 'bg-gray-700 text-gray-200';
    }
  };

  const completedTasks = plan.tasks.filter(task => task.status === 'done').length;
  const totalTasks = plan.tasks.length;
  const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="rounded-xl bg-gradient-to-br from-gray-900 to-black border border-gray-700 shadow-lg p-6 mb-4">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-xl font-bold text-white">{plan.title}</h3>
        <div className="flex gap-2">
          <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(plan.priority)}`}>
            {plan.priority.toUpperCase()}
          </span>
          <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(plan.status)}`}>
            {plan.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {plan.description && (
        <p className="text-gray-300 text-sm mb-3">{plan.description}</p>
      )}

      <div className="flex items-center gap-4 mb-4 text-xs">
        <span className={`px-2 py-1 rounded ${getCategoryColor(plan.category)}`}>
          {plan.category.toUpperCase()}
        </span>
        {plan.assignee && (
          <span className="text-gray-400">Assigned: {plan.assignee}</span>
        )}
        {plan.dueDate && (
          <span className="text-gray-400">
            Due: {new Date(plan.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {totalTasks > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Progress</span>
            <span>{completedTasks}/{totalTasks} tasks completed</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Tasks List */}
      {plan.tasks.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-300">Tasks:</h4>
          {plan.tasks.map(task => (
            <div key={task.id} className="flex items-center gap-3 text-sm">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                task.status === 'done' ? 'bg-green-500' :
                task.status === 'in_progress' ? 'bg-blue-500' :
                'bg-gray-500'
              }`}></div>
              <span className={`${
                task.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-200'
              }`}>
                {task.title}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        Created: {new Date(plan.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
}