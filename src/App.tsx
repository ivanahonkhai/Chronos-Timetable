/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Calendar, Clock, Tag, ChevronLeft, ChevronRight, X, Check, Save, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Template, DAYS, DayOfWeek } from './types';
import { api } from './services/api';

const COLORS = [
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-violet-100 text-violet-700 border-violet-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-rose-100 text-rose-700 border-rose-200',
  'bg-indigo-100 text-indigo-700 border-indigo-200',
];

export default function App() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(new Date().getDay() as DayOfWeek);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [newActivity, setNewActivity] = useState({
    title: '',
    startTime: '09:00',
    endTime: '10:00',
    dayOfWeek: selectedDay,
    category: 'General',
    color: COLORS[0],
  });

  useEffect(() => {
    loadData();
    const timer = setInterval(() => setCurrentTime(new Date()), 30000); // Update every 30s
    return () => clearInterval(timer);
  }, []);

  const currentDayOfWeek = currentTime.getDay();
  const currentHHmm = `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`;

  const getActivityStatus = (activity: Activity) => {
    if (activity.dayOfWeek !== currentDayOfWeek) return 'future';
    
    if (currentHHmm > activity.endTime) return 'past';
    if (currentHHmm >= activity.startTime && currentHHmm <= activity.endTime) return 'now';
    return 'future';
  };

  const loadData = async () => {
    try {
      const [activitiesData, templatesData] = await Promise.all([
        api.getActivities(),
        api.getTemplates(),
      ]);
      setActivities(activitiesData);
      setTemplates(templatesData);
    } catch (error) {
      console.error('Failed to load data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addActivity(newActivity);
      await loadData();
      setIsModalOpen(false);
      setNewActivity({
        ...newActivity,
        title: '',
      });
    } catch (error) {
      console.error('Failed to add activity', error);
    }
  };

  const handleToggleComplete = async (id: number) => {
    try {
      await api.toggleActivity(id);
      setActivities(activities.map(a => a.id === id ? { ...a, completed: 1 - a.completed } : a));
    } catch (error) {
      console.error('Failed to toggle activity', error);
    }
  };

  const handleDeleteActivity = async (id: number) => {
    try {
      await api.deleteActivity(id);
      setActivities(activities.filter((a) => a.id !== id));
    } catch (error) {
      console.error('Failed to delete activity', error);
    }
  };

  const handleSaveAsTemplate = async (activity: Activity) => {
    try {
      await api.addTemplate({
        title: activity.title,
        category: activity.category,
        color: activity.color,
      });
      await loadData();
    } catch (error) {
      console.error('Failed to save template', error);
    }
  };

  const handleAddFromTemplate = (template: Template) => {
    setNewActivity({
      ...newActivity,
      title: template.title,
      category: template.category || 'General',
      color: template.color || COLORS[0],
      dayOfWeek: selectedDay,
    });
    setIsTemplatesOpen(false);
    setIsModalOpen(true);
  };

  const handleDeleteTemplate = async (id: number) => {
    try {
      await api.deleteTemplate(id);
      setTemplates(templates.filter(t => t.id !== id));
    } catch (error) {
      console.error('Failed to delete template', error);
    }
  };

  const filteredActivities = useMemo(() => {
    return activities
      .filter((a) => a.dayOfWeek === selectedDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [activities, selectedDay]);

  const nextDay = () => setSelectedDay(((selectedDay + 1) % 7) as DayOfWeek);
  const prevDay = () => setSelectedDay(((selectedDay - 1 + 7) % 7) as DayOfWeek);

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#1A1A1A] font-sans selection:bg-black selection:text-white">
      {/* Header */}
      <header className="max-w-5xl mx-auto pt-12 px-6 mb-12">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-7xl font-light tracking-tighter mb-2">Chronos</h1>
            <p className="text-sm uppercase tracking-widest text-black/40 font-semibold">Activity Timetable</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setIsTemplatesOpen(true)}
              className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full hover:bg-black/5 transition-all active:scale-95 shadow-sm border border-black/5"
            >
              <Bookmark size={20} />
              <span className="font-medium">Saved</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full hover:scale-105 transition-transform active:scale-95 shadow-lg"
            >
              <Plus size={20} />
              <span className="font-medium">Add Activity</span>
            </button>
          </div>
        </div>
      </header>

      {/* Day Selector */}
      <div className="max-w-5xl mx-auto px-6 mb-8">
        <div className="bg-white rounded-3xl p-2 shadow-sm border border-black/5 flex items-center justify-between">
          <button onClick={prevDay} className="p-3 hover:bg-black/5 rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {DAYS.map((day, index) => (
              <button
                key={day}
                onClick={() => setSelectedDay(index as DayOfWeek)}
                className={`px-6 py-3 rounded-2xl text-sm font-semibold transition-all ${
                  selectedDay === index
                    ? 'bg-black text-white shadow-md'
                    : 'hover:bg-black/5 text-black/60'
                }`}
              >
                {day.substring(0, 3)}
              </button>
            ))}
          </div>
          <button onClick={nextDay} className="p-3 hover:bg-black/5 rounded-full transition-colors">
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      {/* Timetable Content */}
      <main className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {loading ? (
              <div className="flex justify-center py-24">
                <div className="w-8 h-8 border-4 border-black/10 border-t-black rounded-full animate-spin" />
              </div>
            ) : filteredActivities.length > 0 ? (
                filteredActivities.map((activity) => {
                  const status = getActivityStatus(activity);
                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={activity.id}
                      className={`group relative bg-white rounded-3xl p-6 border transition-all flex items-center justify-between ${
                        activity.completed || status === 'past' ? 'opacity-40 grayscale-[0.6]' : ''
                      } ${
                        status === 'now' ? 'border-black ring-4 ring-black/5 shadow-xl scale-[1.02]' : 'border-black/5 shadow-sm hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-8">
                        <button
                          onClick={() => handleToggleComplete(activity.id)}
                          className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                            activity.completed 
                              ? 'bg-black border-black text-white' 
                              : 'border-black/10 hover:border-black text-transparent hover:text-black/20'
                          }`}
                        >
                          <Check size={20} />
                        </button>
                        <div className="flex flex-col items-center justify-center min-w-[80px] py-2 border-r border-black/5">
                          <span className="text-lg font-bold tracking-tight">{activity.startTime}</span>
                          <span className="text-xs text-black/40 font-bold uppercase">{activity.endTime}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${activity.color || COLORS[0]}`}>
                              {activity.category}
                            </span>
                            {status === 'now' && (
                              <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-black animate-pulse">
                                <span className="w-1.5 h-1.5 bg-black rounded-full" />
                                Now
                              </span>
                            )}
                            {status === 'past' && !activity.completed && (
                              <span className="text-[10px] font-bold uppercase tracking-widest text-black/20">
                                Ended
                              </span>
                            )}
                          </div>
                          <h3 className={`text-2xl font-medium tracking-tight ${activity.completed ? 'line-through text-black/40' : ''}`}>
                            {activity.title}
                          </h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => handleSaveAsTemplate(activity)}
                          title="Save as template"
                          className="p-3 text-black/40 hover:text-black hover:bg-black/5 rounded-full transition-all"
                        >
                          <Save size={20} />
                        </button>
                        <button
                          onClick={() => handleDeleteActivity(activity.id)}
                          className="p-3 text-rose-500 hover:bg-rose-50 rounded-full transition-all"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-32 bg-white rounded-[40px] border border-dashed border-black/10"
              >
                <Calendar className="mx-auto mb-4 text-black/20" size={48} />
                <h3 className="text-xl font-medium text-black/40">No activities scheduled for {DAYS[selectedDay]}</h3>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-4 text-black font-semibold hover:underline"
                >
                  Schedule your first activity
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Templates Modal */}
      <AnimatePresence>
        {isTemplatesOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTemplatesOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-bold tracking-tight">Saved Activities</h2>
                  <button onClick={() => setIsTemplatesOpen(false)} className="p-2 hover:bg-black/5 rounded-full">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
                  {templates.length > 0 ? (
                    templates.map((template) => (
                      <div
                        key={template.id}
                        className="group flex items-center justify-between p-4 bg-black/5 rounded-2xl hover:bg-black/10 transition-all cursor-pointer"
                        onClick={() => handleAddFromTemplate(template)}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${template.color?.split(' ')[0] || 'bg-blue-400'}`} />
                          <div>
                            <p className="font-semibold">{template.title}</p>
                            <p className="text-xs text-black/40 uppercase font-bold tracking-wider">{template.category}</p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplate(template.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-2 text-rose-500 hover:bg-rose-100 rounded-full transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-black/40">
                      <Bookmark size={32} className="mx-auto mb-2 opacity-20" />
                      <p>No saved activities yet.</p>
                      <p className="text-xs">Save an activity from your timetable to see it here.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Activity Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-bold tracking-tight">New Activity</h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-black/5 rounded-full">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleAddActivity} className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Activity Title</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g., Morning Run"
                      className="w-full px-6 py-4 bg-black/5 rounded-2xl border-none focus:ring-2 focus:ring-black outline-none transition-all text-lg"
                      value={newActivity.title}
                      onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Start Time</label>
                      <div className="relative">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" size={18} />
                        <input
                          required
                          type="time"
                          className="w-full pl-12 pr-6 py-4 bg-black/5 rounded-2xl border-none focus:ring-2 focus:ring-black outline-none transition-all"
                          value={newActivity.startTime}
                          onChange={(e) => setNewActivity({ ...newActivity, startTime: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">End Time</label>
                      <div className="relative">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" size={18} />
                        <input
                          required
                          type="time"
                          className="w-full pl-12 pr-6 py-4 bg-black/5 rounded-2xl border-none focus:ring-2 focus:ring-black outline-none transition-all"
                          value={newActivity.endTime}
                          onChange={(e) => setNewActivity({ ...newActivity, endTime: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Category</label>
                    <div className="relative">
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" size={18} />
                      <select
                        className="w-full pl-12 pr-6 py-4 bg-black/5 rounded-2xl border-none focus:ring-2 focus:ring-black outline-none transition-all appearance-none"
                        value={newActivity.category}
                        onChange={(e) => setNewActivity({ ...newActivity, category: e.target.value })}
                      >
                        <option>General</option>
                        <option>Work</option>
                        <option>Health</option>
                        <option>Social</option>
                        <option>Personal</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Color Label</label>
                    <div className="flex gap-3">
                      {COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setNewActivity({ ...newActivity, color })}
                          className={`w-10 h-10 rounded-full border-2 transition-all ${color.split(' ')[0]} ${
                            newActivity.color === color ? 'border-black scale-110 shadow-md' : 'border-transparent'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-black text-white py-5 rounded-3xl font-bold text-lg hover:scale-[1.02] transition-transform active:scale-95 shadow-xl mt-4"
                  >
                    Create Activity
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
