import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import axios from 'axios'
import { Calendar, AlertCircle, Check, X, Download, Send } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

const ReschedulingWizard = () => {
  const { id } = useParams()
  const [step, setStep] = useState(1)
  const [selectedStrategy, setSelectedStrategy] = useState(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)

  const { data: courseData, isLoading: courseLoading } = useQuery(
    ['course', id],
    async () => {
      const response = await axios.get(`/api/courses/${id}`)
      return response.data.course
    }
  )

  const { data: rescheduleOptions, isLoading: optionsLoading } = useQuery(
    ['reschedule-options'],
    async () => {
      if (step < 2) return null
      const response = await axios.post(`/api/disruptions/${courseData.disruptions[0].id}/reschedule-options`)
      return response.data.options
    },
    {
      enabled: step >= 2 && courseData?.disruptions?.length > 0
    }
  )

  const handleStrategySelect = (strategy) => {
    setSelectedStrategy(strategy)
  }

  const handleApplySchedule = async () => {
    if (!selectedStrategy) return

    try {
      await axios.post(`/api/disruptions/${courseData.disruptions[0].id}/apply-schedule`, {
        strategy_name: selectedStrategy.name
      })
      setStep(4)
    } catch (error) {
      console.error('Apply schedule error:', error)
    }
  }

  const handleSendNotification = async () => {
    try {
      await axios.post(`/api/courses/${id}/notify`, {
        disruption_reason: courseData.disruptions[0].reason,
        affected_items: selectedStrategy.preview.assignments.slice(0, 3)
      })
      setEmailOpen(false)
    } catch (error) {
      console.error('Send notification error:', error)
    }
  }

  const steps = [
    { id: 1, name: 'Report Disruption' },
    { id: 2, name: 'Impact Analysis' },
    { id: 3, name: 'Choose Option' },
    { id: 4, name: 'Preview & Confirm' },
    { id: 5, name: 'Success' }
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
      <div className="flex items-center space-x-3">
        <h1 className="text-2xl font-bold text-gray-900">Rescheduling Wizard</h1>
        <div className="text-sm text-gray-500">
          {courseData?.title}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-6">
          {steps.map((stepInfo) => (
            <div key={stepInfo.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-medium ${
                stepInfo.id === step
                  ? 'bg-primary text-white'
                  : stepInfo.id < step
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {stepInfo.id}
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">{stepInfo.name}</span>
              {stepInfo.id < steps.length && (
                <div className={`w-12 h-1 ${
                  stepInfo.id < step ? 'bg-green-500' : 'bg-gray-200'
                } mx-2`}></div>
              )}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-3">
                <AlertCircle className="text-yellow-600" size={24} />
                <div>
                  <h3 className="font-medium text-yellow-900">Report Disruption</h3>
                  <p className="text-sm text-yellow-700">Your schedule will be analyzed for impacts</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Disruption Date
                </label>
                <input
                  type="date"
                  className="input-field"
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason
                </label>
                <select className="input-field">
                  <option>Snow Day</option>
                  <option>Holiday</option>
                  <option>Instructor Absence</option>
                  <option>Campus Closure</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                className="input-field"
                rows="3"
                placeholder="Additional information about the disruption..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                onClick={() => setStep(2)}
                className="btn-primary"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-900 mb-2">Impact Analysis</h3>
              <p className="text-sm text-blue-700">
                The following items will be affected by this disruption:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Affected Topics</h3>
                <div className="space-y-3">
                  {courseData?.topics?.slice(0, 3).map(topic => (
                    <div key={topic.id} className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                      <h4 className="font-medium text-yellow-900">{topic.title}</h4>
                      <p className="text-sm text-yellow-700">
                        {topic.sessions_needed} session{topic.sessions_needed > 1 ? 's' : ''} affected
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Affected Assignments</h3>
                <div className="space-y-3">
                  {courseData?.assignments?.slice(0, 3).map(assignment => (
                    <div key={assignment.id} className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                      <h4 className="font-medium text-yellow-900">{assignment.title}</h4>
                      <p className="text-sm text-yellow-700">
                        Due: {new Date(assignment.due_date).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-gray-200">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="btn-primary"
              >
                Generate Options
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-green-900 mb-2">Rescheduling Options</h3>
              <p className="text-sm text-green-700">
                Choose the option that best fits your needs. Each option has a score based on workload distribution, dependency preservation, and policy compliance.
              </p>
            </div>

            {optionsLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="space-y-4">
                {rescheduleOptions?.map((option, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedStrategy?.name === option.name
                        ? 'border-primary bg-blue-50'
                        : 'border-gray-200 hover:border-primary'
                    }`}
                    onClick={() => handleStrategySelect(option)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{option.name}</h3>
                        <p className="text-sm text-gray-600">{option.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {Math.round(option.score)}
                        </div>
                        <div className="text-xs text-gray-500">Score</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Pros</h4>
                        <ul className="space-y-1">
                          {option.pros.slice(0, 3).map((pro, i) => (
                            <li key={i} className="flex items-center text-sm text-gray-600">
                              <Check size={16} className="text-green-500 mr-2" />
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Cons</h4>
                        <ul className="space-y-1">
                          {option.cons.slice(0, 3).map((con, i) => (
                            <li key={i} className="flex items-center text-sm text-gray-600">
                              <X size={16} className="text-red-500 mr-2" />
                              {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {selectedStrategy?.name === option.name && (
                      <div className="flex justify-end space-x-2 pt-2 border-t border-gray-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setPreviewOpen(true)
                          }}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Preview Changes
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between pt-6 border-t border-gray-200">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleApplySchedule}
                disabled={!selectedStrategy}
                className="btn-primary disabled:opacity-50"
              >
                Apply Selected Option
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-green-900 mb-2">Schedule Applied Successfully!</h3>
              <p className="text-sm text-green-700">
                Your course schedule has been updated. You can now download the new schedule and notify students.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Download Options</h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                    <Download size={18} />
                    <span>Download PDF Schedule</span>
                  </button>
                  <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                    <Calendar size={18} />
                    <span>Download Calendar File</span>
                  </button>
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Student Notifications</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setEmailOpen(true)}
                    className="w-full flex items-center justify-center space-x-2 btn-primary"
                  >
                    <Send size={18} />
                    <span>Send Email Notification</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-6">
              <button
                onClick={() => window.location.href = `/courses/${id}`}
                className="btn-primary"
              >
                Return to Course
              </button>
            </div>
          </div>
        )}
      </div>

      {emailOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Email Notification</h3>
                <button
                  onClick={() => setEmailOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value="Schedule Update for CS-101"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Content
                  </label>
                  <textarea
                    className="input-field"
                    rows="10"
                    value={`Dear Students,

This is to inform you that there has been a schedule change for CS-101 due to ${courseData?.disruptions?.[0]?.reason}.

The following items have been affected:
• Homework 1 - 2024-02-15
• Quiz 1 - 2024-02-20

Please update your calendars accordingly.

Best regards,
Dr. John Doe`}
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setEmailOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendNotification}
                    className="btn-primary"
                  >
                    Send Notification
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewOpen && selectedStrategy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Schedule Preview: {selectedStrategy.name}
                </h3>
                <button
                  onClick={() => setPreviewOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Affected Topics</h4>
                  <div className="space-y-2">
                    {selectedStrategy.preview.topics.slice(0, 5).map((topic, index) => (
                      <div key={index} className="p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium text-gray-900">{topic.title}</h5>
                            <p className="text-sm text-gray-600">
                              {topic.sessions.length} session{topic.sessions.length > 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Affected Assignments</h4>
                  <div className="space-y-2">
                    {selectedStrategy.preview.assignments.slice(0, 5).map((assignment, index) => (
                      <div key={index} className="p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium text-gray-900">{assignment.title}</h5>
                            <p className="text-sm text-gray-600">
                              {assignment.type} • {assignment.weight}%
                            </p>
                          </div>
                          <div className="text-sm text-gray-500">
                            Due: {new Date(assignment.due_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReschedulingWizard
