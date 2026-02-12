import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { 
  Calendar, AlertCircle, Check, X, Clock, BookOpen, FileText, 
  ChevronDown, ChevronUp, Zap, RefreshCw, CheckCircle, XCircle,
  CalendarClock, ArrowRight, Settings, Filter
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

const ReschedulingDashboard = () => {
  const [selectedCourses, setSelectedCourses] = useState([])
  const [disruptionType, setDisruptionType] = useState('')
  const [disruptionDate, setDisruptionDate] = useState(new Date().toISOString().split('T')[0])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [quickAction, setQuickAction] = useState(null)
  const [step, setStep] = useState(1)
  const [previewData, setPreviewData] = useState(null)
  const queryClient = useQueryClient()

  // Fetch all courses with their data
  const { data: coursesData, isLoading: coursesLoading } = useQuery(
    'courses',
    async () => {
      const response = await axios.get('/api/courses')
      return response.data.courses
    }
  )

  // Quick action templates
  const quickActionTemplates = [
    {
      id: 'snow-day',
      name: 'Snow Day / Campus Closure',
      icon: '❄️',
      description: 'Cancel all classes for a specific day',
      impact: 'high',
      autoResolve: true
    },
    {
      id: 'instructor-absence',
      name: 'Instructor Absence',
      icon: '👤',
      description: 'Reschedule classes for one instructor',
      impact: 'medium',
      autoResolve: true
    },
    {
      id: 'holiday',
      name: 'Holiday / Break',
      icon: '🎉',
      description: 'Adjust schedule around a holiday',
      impact: 'low',
      autoResolve: true
    },
    {
      id: 'exam-conflict',
      name: 'Exam Conflict',
      icon: '📝',
      description: 'Reschedule conflicting exams',
      impact: 'medium',
      autoResolve: false
    },
    {
      id: 'makeup-class',
      name: 'Add Makeup Class',
      icon: '➕',
      description: 'Schedule additional class sessions',
      impact: 'low',
      autoResolve: false
    },
    {
      id: 'extend-semester',
      name: 'Extend Semester',
      icon: '📅',
      description: 'Push back all remaining dates',
      impact: 'high',
      autoResolve: true
    }
  ]

  // Toggle course selection
  const toggleCourse = (courseId) => {
    setSelectedCourses(prev => 
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    )
  }

  // Select all courses
  const selectAllCourses = () => {
    if (coursesData) {
      setSelectedCourses(coursesData.map(c => c.id))
    }
  }

  // Clear selection
  const clearSelection = () => {
    setSelectedCourses([])
  }

  // Get affected items count
  const getAffectedItemsCount = () => {
    const affectedCourses = coursesData?.filter(c => selectedCourses.includes(c.id)) || []
    let topics = 0
    let assignments = 0
    let sessions = 0
    
    affectedCourses.forEach(course => {
      topics += course.topics?.length || 0
      assignments += course.assignments?.length || 0
      course.topics?.forEach(topic => {
        sessions += topic.sessions?.length || 0
      })
    })
    
    return { courses: affectedCourses.length, topics, assignments, sessions }
  }

  // Generate preview
  const generatePreview = async () => {
    try {
      const response = await axios.post('/api/reschedule/preview', {
        course_ids: selectedCourses,
        disruption_type: quickAction,
        disruption_date: disruptionDate
      })
      setPreviewData(response.data)
      setStep(3)
    } catch (error) {
      console.error('Preview error:', error)
      // Generate mock preview for demo
      const affectedCourses = coursesData?.filter(c => selectedCourses.includes(c.id)) || []
      setPreviewData({
        summary: {
          totalChanges: affectedCourses.length * 5,
          coursesAffected: affectedCourses.length,
          topicsRescheduled: affectedCourses.reduce((sum, c) => sum + (c.topics?.length || 0), 0),
          assignmentsShifted: affectedCourses.reduce((sum, c) => sum + (c.assignments?.length || 0), 0)
        },
        strategies: [
          {
            id: 'compress',
            name: 'Compress Schedule',
            description: 'Fit remaining content into available time by reducing review sessions',
            score: 85,
            pros: ['Maintains all content', 'No extra class time needed'],
            cons: ['Less review time', 'Faster pace'],
            recommended: true
          },
          {
            id: 'extend',
            name: 'Extend Semester',
            description: 'Push back all dates by one week',
            score: 72,
            pros: ['Maintains pacing', 'More time for topics'],
            cons: ['Extends into break', 'May conflict with finals'],
            recommended: false
          },
          {
            id: 'skip',
            name: 'Skip Non-Essential Topics',
            description: 'Remove optional topics to catch up',
            score: 65,
            pros: ['Quick resolution', 'No date changes'],
            cons: ['Content removed', 'May affect learning'],
            recommended: false
          }
        ],
        changes: affectedCourses.flatMap(course => 
          (course.topics || []).slice(0, 3).map(topic => ({
            courseId: course.id,
            courseTitle: course.title,
            type: 'topic',
            title: topic.title,
            oldDate: topic.sessions?.[0]?.scheduled_date || 'TBD',
            newDate: 'TBD + 7 days',
            action: 'reschedule'
          }))
        )
      })
      setStep(3)
    }
  }

  // Apply rescheduling
  const applyRescheduling = useMutation(
    async (strategyId) => {
      const response = await axios.post('/api/reschedule/apply', {
        course_ids: selectedCourses,
        strategy: strategyId,
        disruption_type: quickAction,
        disruption_date: disruptionDate
      })
      return response.data
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('courses')
        setStep(4)
      }
    }
  )

  const affectedItems = getAffectedItemsCount()

  if (coursesLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rescheduling Dashboard</h1>
          <p className="text-gray-600">Manage schedule changes across all your courses</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/courses/create"
            className="btn-secondary flex items-center space-x-2"
          >
            <Calendar size={18} />
            <span>View Calendar</span>
          </Link>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          {[
            { id: 1, name: 'Select Disruption', icon: AlertCircle },
            { id: 2, name: 'Choose Courses', icon: BookOpen },
            { id: 3, name: 'Review & Apply', icon: CheckCircle },
            { id: 4, name: 'Complete', icon: Check }
          ].map((s, index) => (
            <div key={s.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-medium ${
                step >= s.id
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                <s.icon size={20} />
              </div>
              <span className={`ml-2 font-medium ${step >= s.id ? 'text-gray-900' : 'text-gray-500'}`}>
                {s.name}
              </span>
              {index < 3 && (
                <div className={`w-16 h-1 mx-4 ${step > s.id ? 'bg-primary' : 'bg-gray-200'}`}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Select Disruption Type */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">What type of disruption are you dealing with?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActionTemplates.map(template => (
                <button
                  key={template.id}
                  onClick={() => {
                    setQuickAction(template.id)
                    setStep(2)
                  }}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    quickAction === template.id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{template.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                      <div className="flex items-center mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          template.impact === 'high' ? 'bg-red-100 text-red-700' :
                          template.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {template.impact} impact
                        </span>
                        {template.autoResolve && (
                          <span className="text-xs text-primary ml-2 flex items-center">
                            <Zap size={12} className="mr-1" />
                            Auto-resolve
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Disruption */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full text-left"
            >
              <div>
                <h2 className="text-lg font-semibold">Custom Disruption</h2>
                <p className="text-sm text-gray-600">Define a custom disruption scenario</p>
              </div>
              {showAdvanced ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            
            {showAdvanced && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Disruption Date</label>
                    <input
                      type="date"
                      value={disruptionDate}
                      onChange={(e) => setDisruptionDate(e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">Duration (days)</label>
                    <input
                      type="number"
                      defaultValue={1}
                      min={1}
                      className="input-field"
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Description</label>
                  <textarea
                    className="input-field"
                    rows={3}
                    placeholder="Describe the disruption..."
                  />
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="btn-primary"
                >
                  Continue with Custom Disruption
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Choose Courses */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Summary Bar */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <AlertCircle className="text-blue-600" size={24} />
                <div>
                  <h3 className="font-medium text-blue-900">
                    {quickActionTemplates.find(t => t.id === quickAction)?.name || 'Custom Disruption'}
                  </h3>
                  <p className="text-sm text-blue-700">on {new Date(disruptionDate).toLocaleDateString()}</p>
                </div>
              </div>
              <button
                onClick={() => setStep(1)}
                className="text-blue-700 hover:text-blue-800 font-medium"
              >
                Change
              </button>
            </div>
          </div>

          {/* Course Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Select Affected Courses</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={selectAllCourses}
                  className="text-sm text-primary hover:underline"
                >
                  Select All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={clearSelection}
                  className="text-sm text-gray-600 hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {coursesData?.map(course => (
                <div
                  key={course.id}
                  onClick={() => toggleCourse(course.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedCourses.includes(course.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedCourses.includes(course.id)}
                        onChange={() => {}}
                        className="mt-1"
                      />
                      <div>
                        <h3 className="font-medium text-gray-900">{course.title}</h3>
                        <p className="text-sm text-gray-600">{course.course_code} • {course.semester}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center">
                            <BookOpen size={14} className="mr-1" />
                            {course.topics?.length || 0} topics
                          </span>
                          <span className="flex items-center">
                            <FileText size={14} className="mr-1" />
                            {course.assignments?.length || 0} assignments
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Affected Items Summary */}
            {selectedCourses.length > 0 && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Impact Summary</h3>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{affectedItems.courses}</div>
                    <div className="text-sm text-gray-600">Courses</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{affectedItems.topics}</div>
                    <div className="text-sm text-gray-600">Topics</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{affectedItems.assignments}</div>
                    <div className="text-sm text-gray-600">Assignments</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{affectedItems.sessions}</div>
                    <div className="text-sm text-gray-600">Sessions</div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={generatePreview}
                disabled={selectedCourses.length === 0}
                className="btn-primary disabled:opacity-50 flex items-center space-x-2"
              >
                <span>Generate Rescheduling Options</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Review & Apply */}
      {step === 3 && previewData && (
        <div className="space-y-6">
          {/* Strategy Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Choose a Rescheduling Strategy</h2>
            <div className="space-y-4">
              {previewData.strategies.map((strategy, index) => (
                <div
                  key={strategy.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    strategy.recommended
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => applyRescheduling.mutate(strategy.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900">{strategy.name}</h3>
                        {strategy.recommended && (
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{strategy.description}</p>
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 uppercase">Pros</h4>
                          <ul className="mt-1 space-y-1">
                            {strategy.pros.map((pro, i) => (
                              <li key={i} className="flex items-center text-sm text-gray-600">
                                <Check size={14} className="text-green-500 mr-2" />
                                {pro}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 uppercase">Cons</h4>
                          <ul className="mt-1 space-y-1">
                            {strategy.cons.map((con, i) => (
                              <li key={i} className="flex items-center text-sm text-gray-600">
                                <X size={14} className="text-red-500 mr-2" />
                                {con}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-3xl font-bold text-primary">{strategy.score}</div>
                      <div className="text-xs text-gray-500">Score</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Changes Preview */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Preview of Changes</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Old Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">New Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {previewData.changes.slice(0, 10).map((change, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm text-gray-900">{change.courseTitle}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{change.title}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          change.type === 'topic' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {change.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{change.oldDate}</td>
                      <td className="px-4 py-3 text-sm text-primary font-medium">{change.newDate}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                          {change.action}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {previewData.changes.length > 10 && (
              <p className="text-sm text-gray-500 mt-2 text-center">
                And {previewData.changes.length - 10} more changes...
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Complete */}
      {step === 4 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Rescheduling Complete!</h2>
          <p className="text-gray-600 mb-6">
            Your schedule has been successfully updated across {selectedCourses.length} course(s).
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              to="/dashboard"
              className="btn-primary"
            >
              Return to Dashboard
            </Link>
            <Link
              to="/schedule"
              className="btn-secondary flex items-center space-x-2"
            >
              <Calendar size={18} />
              <span>View Updated Schedule</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReschedulingDashboard
