import React, { useState, useEffect } from 'react';
import { Plus, Bell, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import type { Announcement, Employee } from '../types';

export function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal',
    posted_by: '',
    expires_at: ''
  });

  useEffect(() => {
    fetchAnnouncements();
    fetchEmployees();
  }, []);

  async function fetchAnnouncements() {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAnnouncements(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setLoading(false);
    }
  }

  async function fetchEmployees() {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('employment_status', 'active');
      
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (selectedAnnouncement) {
        const { error } = await supabase
          .from('announcements')
          .update(formData)
          .eq('id', selectedAnnouncement.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('announcements')
          .insert([formData]);
        if (error) throw error;
      }
      
      setIsModalOpen(false);
      setSelectedAnnouncement(null);
      resetForm();
      fetchAnnouncements();
    } catch (error) {
      console.error('Error saving announcement:', error);
    }
  }

  async function handleDelete(id: string) {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        const { error } = await supabase
          .from('announcements')
          .delete()
          .eq('id', id);
        if (error) throw error;
        fetchAnnouncements();
      } catch (error) {
        console.error('Error deleting announcement:', error);
      }
    }
  }

  function resetForm() {
    setFormData({
      title: '',
      content: '',
      priority: 'normal',
      posted_by: '',
      expires_at: ''
    });
  }

  function getEmployeeName(employeeId: string) {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown Employee';
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Announcements</h1>
          <p className="mt-2 text-sm text-gray-700">
            Post and manage important announcements for all employees.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => {
              resetForm();
              setSelectedAnnouncement(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Announcement
          </button>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className={`bg-white px-4 py-5 sm:px-6 ${
                    announcement.priority === 'urgent'
                      ? 'border-l-4 border-red-500'
                      : announcement.priority === 'important'
                      ? 'border-l-4 border-yellow-500'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Bell className={`h-5 w-5 ${
                        announcement.priority === 'urgent'
                          ? 'text-red-500'
                          : announcement.priority === 'important'
                          ? 'text-yellow-500'
                          : 'text-gray-400'
                      }`} />
                      <h3 className="text-lg font-medium leading-6 text-gray-900">
                        {announcement.title}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => {
                          setSelectedAnnouncement(announcement);
                          setFormData({
                            title: announcement.title,
                            content: announcement.content,
                            priority: announcement.priority || 'normal',
                            posted_by: announcement.posted_by || '',
                            expires_at: announcement.expires_at || ''
                          });
                          setIsModalOpen(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(announcement.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 max-w-xl text-sm text-gray-500">
                    <p>{announcement.content}</p>
                  </div>
                  <div className="mt-3 text-sm">
                    <span className="text-gray-500">
                      Posted by {getEmployeeName(announcement.posted_by || '')}
                      {announcement.expires_at && (
                        <> · Expires {format(new Date(announcement.expires_at), 'MMM d, yyyy')}</>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                      Content
                    </label>
                    <textarea
                      id="content"
                      rows={4}
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                      Priority
                    </label>
                    <select
                      id="priority"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="normal">Normal</option>
                      <option value="important">Important</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="posted_by" className="block text-sm font-medium text-gray-700">
                      Posted By
                    </label>
                    <select
                      id="posted_by"
                      value={formData.posted_by}
                      onChange={(e) => setFormData({ ...formData, posted_by: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    >
                      <option value="">Select Employee</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.first_name} {employee.last_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="expires_at" className="block text-sm font-medium text-gray-700">
                      Expiration Date
                    </label>
                    <input
                      type="date"
                      id="expires_at"
                      value={formData.expires_at}
                      onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
                  <button
                    type="submit"
                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:text-sm"
                  >
                    {selectedAnnouncement ? 'Update' : 'Post'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}