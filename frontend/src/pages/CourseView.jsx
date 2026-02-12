import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import axios from 'axios'
import { Plus, Calendar, BookOpen, FileText, Download, Share, AlertCircle, Edit, Trash2, X } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import CalendarComponent from '../components/Calendar'

const CourseView = () => {
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState('calendar')
  const [showAddTopic, setShowAddTopic] = useState(false)
  const [showAddAssignment, setShowAddAssignment] = useState(false)
  const [newTopic, setNewTopic] = useState({ title: '', description: '', sessions_needed: 1 })
  const [newAssignment, setNewAssignment] = useState({ title: '', type: 'homework', due_date: '', weight: 10, min_prep_days: 7 })
  const queryClient = useQueryClient()

  const { data: courseData, isLoading: courseLoading } = useQuery(
    ['course', id],
    async () => {
      const response = await axios.get(`/api/courses/${id}`)
      return response.data.course
    }
  )

  // Add topic mutation
  const addTopicMutation = useMutation(
    async (topic) => {
      const response = await axios.post(`/api/courses/${id}/topics`, {
        ...topic,
        order_index: courseData?.topics?.length || 0
      })
      return response.data
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['course', id])
        setShowAddTopic(false)
        setNewTopic({ title: '', description: '', sessions_needed: 1 })
      }
    }
  )

  // Add assignment mutation
  const addAssignmentMutation = useMutation(
    async (assignment) => {
      const response = await axios.post(`/api/courses/${id}/assignments`, assignment)
      return response.data
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['course', id])
        setShowAddAssignment(false)
        setNewAssignment({ title: '', type: 'homework', due_date: '', weight: 10, min_prep_days: 7 })
      }
    }
  )

  // Delete topic mutation
  const deleteTopicMutation = useMutation(
    async (topicId) => {
      await axios.delete(`/api/topics/${topicId}`)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['course', id])
      }
    }
  )

  // Delete assignment mutation
  const deleteAssignmentMutation = useMutation(
    async (assignmentId) => {
      await axios.delete(`/api/assignments/${assignmentId}`)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['course', id])
      }
    }
  )

  const tabs = [
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'topics', label: 'Topics', icon: BookOpen },
    { id: 'assignments', label: 'Assignments', icon: FileText },
    { id: 'history', label: 'Schedule History', icon: Download }
  ]

  if (courseLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{courseData?.title}</h1>
            <p className="text-gray-600">{courseData?.course_code} • {courseData?.semester}</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="p-2 rounded-lg hover:bg-gray-100">
              <Share size={20} />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100">
              <Download size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex space-x-8 border-b border-gray-200">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {activeTab === 'calendar' && (
        <div className="space-y-4">
          <CalendarComponent
            topics={(courseData?.topics || []).map(t => ({ ...t, course_id: courseData.id }))}
            assignments={(courseData?.assignments || []).map(a => ({ ...a, course_id: courseData.id }))}
            meetingTimes={(courseData?.meeting_times || []).map(m => ({ ...m, course_id: courseData.id }))}
            startDate={courseData?.start_date}
            endDate={courseData?.end_date}
            courseColors={{ [courseData?.id]: courseData?.color || '#2563EB' }}
          />
        </div>
      )}

      {activeTab === 'topics' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Course Topics</h2>
            <button 
              onClick={() => setShowAddTopic(true)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Plus size={18} />
              <span>Add Topic</span>
            </button>
          </div>

          {/* Add Topic Form */}
          {showAddTopic && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Add New Topic</h3>
                <button onClick={() => setShowAddTopic(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="label">Topic Title</label>
                  <input
                    type="text"
                    value={newTopic.title}
                    onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                    className="input-field"
                    placeholder="Enter topic title"
                  />
                </div>
                <div>
                  <label className="label">Description</label>
                  <textarea
                    value={newTopic.description}
                    onChange={(e) => setNewTopic({ ...newTopic, description: e.target.value })}
                    className="input-field"
                    placeholder="Enter topic description"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="label">Sessions Needed</label>
                  <input
                    type="number"
                    value={newTopic.sessions_needed}
                    onChange={(e) => setNewTopic({ ...newTopic, sessions_needed: parseInt(e.target.value) || 1 })}
                    className="input-field"
                    min={1}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowAddTopic(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => addTopicMutation.mutate(newTopic)}
                    disabled={!newTopic.title || addTopicMutation.isLoading}
                    className="btn-primary px-4 py-2 disabled:opacity-50"
                  >
                    {addTopicMutation.isLoading ? 'Adding...' : 'Add Topic'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {courseData?.topics?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BookOpen size={48} className="mx-auto mb-2 opacity-50" />
                <p>No topics added yet</p>
                <button 
                  onClick={() => setShowAddTopic(true)}
                  className="text-primary font-medium hover:underline mt-2"
                >
                  Add your first topic
                </button>
              </div>
            ) : (
              courseData?.topics?.map((topic, index) => (
                <div
                  key={topic.id}
                  className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{topic.title}</h3>
                        {topic.description && (
                          <p className="text-sm text-gray-600 mt-1">{topic.description}</p>
                        )}
                        <p className="text-sm text-gray-500 mt-1">
                          {topic.sessions_needed} session{topic.sessions_needed > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteTopicMutation.mutate(topic.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'assignments' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Assignments</h2>
            <button 
              onClick={() => setShowAddAssignment(true)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Plus size={18} />
              <span>Add Assignment</span>
            </button>
          </div>

          {/* Add Assignment Form */}
          {showAddAssignment && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Add New Assignment</h3>
                <button onClick={() => setShowAddAssignment(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Assignment Title</label>
                    <input
                      type="text"
                      value={newAssignment.title}
                      onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                      className="input-field"
                      placeholder="Enter assignment title"
                    />
                  </div>
                  <div>
                    <label className="label">Type</label>
                    <select
                      value={newAssignment.type}
                      onChange={(e) => setNewAssignment({ ...newAssignment, type: e.target.value })}
                      className="input-field"
                    >
                      <option value="homework">Homework</option>
                      <option value="exam">Exam</option>
                      <option value="project">Project</option>
                      <option value="quiz">Quiz</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="label">Due Date</label>
                    <input
                      type="date"
                      value={newAssignment.due_date}
                      onChange={(e) => setNewAssignment({ ...newAssignment, due_date: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">Weight (%)</label>
                    <input
                      type="number"
                      value={newAssignment.weight}
                      onChange={(e) => setNewAssignment({ ...newAssignment, weight: parseInt(e.target.value) || 10 })}
                      className="input-field"
                      min={0}
                      max={100}
                    />
                  </div>
                  <div>
                    <label className="label">Min Prep Days</label>
                    <input
                      type="number"
                      value={newAssignment.min_prep_days}
                      onChange={(e) => setNewAssignment({ ...newAssignment, min_prep_days: parseInt(e.target.value) || 7 })}
                      className="input-field"
                      min={0}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowAddAssignment(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => addAssignmentMutation.mutate(newAssignment)}
                    disabled={!newAssignment.title || !newAssignment.due_date || addAssignmentMutation.isLoading}
                    className="btn-primary px-4 py-2 disabled:opacity-50"
                  >
                    {addAssignmentMutation.isLoading ? 'Adding...' : 'Add Assignment'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {courseData?.assignments?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText size={48} className="mx-auto mb-2 opacity-50" />
                <p>No assignments added yet</p>
                <button 
                  onClick={() => setShowAddAssignment(true)}
                  className="text-primary font-medium hover:underline mt-2"
                >
                  Add your first assignment
                </button>
              </div>
            ) : (
              courseData?.assignments?.map(assignment => (
                <div
                  key={assignment.id}
                  className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                        assignment.type === 'exam' ? 'bg-red-100 text-red-700' :
                        assignment.type === 'project' ? 'bg-purple-100 text-purple-700' :
                        assignment.type === 'quiz' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {assignment.type.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{assignment.title}</h3>
                        <p className="text-sm text-gray-600">
                          {assignment.type} • {assignment.weight}% of grade
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Due: {new Date(assignment.due_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteAssignmentMutation.mutate(assignment.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Schedule History</h2>
          <div className="space-y-4">
            {courseData?.disruptions?.map(disruption => (
              <div
                key={disruption.id}
                className="p-4 rounded-lg border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{disruption.reason}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(disruption.disruption_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {disruption.resolved ? 'Resolved' : 'Active'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {courseData?.disruptions?.some(d => !d.resolved) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <AlertCircle className="text-yellow-600" size={24} />
            <div>
              <h3 className="font-medium text-yellow-900">Active Schedule Disruptions</h3>
              <p className="text-sm text-yellow-700">Your schedule needs attention</p>
            </div>
          </div>
          <div className="flex justify-end">
            <button className="btn-warning">
              View Rescheduling Options
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CourseView
