import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import axios from 'axios'
import { BookOpen, Calendar, Clock, Plus, Save, Upload } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import ColorPicker from '../components/ColorPicker'

const CourseCreate = () => {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    defaultValues: {
      title: '',
      course_code: '',
      semester: '',
      start_date: '',
      end_date: '',
      finals_week_start: '',
      color: '#2563EB',
      meeting_times: [{ day_of_week: 'Monday', start_time: '09:00', end_time: '10:30' }],
      topics: [],
      assignments: []
    }
  })

  const meetingTimes = watch('meeting_times')
  const topics = watch('topics')
  const assignments = watch('assignments')

  const handleAddMeetingTime = () => {
    setValue('meeting_times', [...meetingTimes, {
      day_of_week: 'Monday',
      start_time: '09:00',
      end_time: '10:30'
    }])
  }

  const handleRemoveMeetingTime = (index) => {
    setValue('meeting_times', meetingTimes.filter((_, i) => i !== index))
  }

  const handleAddTopic = () => {
    setValue('topics', [...topics, {
      title: '',
      description: '',
      sessions_needed: 1,
      order_index: topics.length
    }])
  }

  const handleRemoveTopic = (index) => {
    setValue('topics', topics.filter((_, i) => i !== index))
  }

  const handleAddAssignment = () => {
    setValue('assignments', [...assignments, {
      title: '',
      type: 'homework',
      due_date: '',
      weight: 10,
      min_prep_days: 7,
      required_topics: []
    }])
  }

  const handleRemoveAssignment = (index) => {
    setValue('assignments', assignments.filter((_, i) => i !== index))
  }

  const handleTopicChange = (index, field, value) => {
    const updatedTopics = [...topics]
    updatedTopics[index][field] = value
    setValue('topics', updatedTopics)
  }

  const handleAssignmentChange = (index, field, value) => {
    const updatedAssignments = [...assignments]
    updatedAssignments[index][field] = value
    setValue('assignments', updatedAssignments)
  }

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const response = await axios.post('/api/courses', data)
      navigate(`/courses/${response.data.course.id}`)
    } catch (error) {
      console.error('Create course error:', error)
      setSubmitError(error.response?.data?.error || 'Failed to create course. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const steps = [
    { id: 1, name: 'Basic Info', icon: BookOpen },
    { id: 2, name: 'Meeting Times', icon: Clock },
    { id: 3, name: 'Topics', icon: BookOpen },
    { id: 4, name: 'Assignments', icon: Calendar },
    { id: 5, name: 'Review', icon: Save }
  ]

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Create New Course</h1>
        <button
          type="button"
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          className="btn-primary px-6 py-3 font-medium shadow-md flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={18} />
          <span>{isSubmitting ? 'Saving...' : 'Save Course'}</span>
        </button>
      </div>
      
      <p className="text-gray-600 text-sm">
        Fill in the course details below. You can save at any time or complete all steps for a detailed course setup.
      </p>

      {submitError && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <p className="text-red-700 font-medium">{submitError}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6 overflow-x-auto">
          {steps.map((stepInfo) => (
            <div key={stepInfo.id} className="flex items-center flex-shrink-0">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-medium ${
                stepInfo.id === step
                  ? 'bg-primary text-white'
                  : stepInfo.id < step
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {stepInfo.id}
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700 hidden sm:inline">{stepInfo.name}</span>
              {stepInfo.id < steps.length && (
                <div className={`w-8 h-1 ${
                  stepInfo.id < step ? 'bg-green-500' : 'bg-gray-200'
                } mx-2`}></div>
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {step === 1 && (
            <div className="space-y-6 bg-gray-50 p-6 rounded-xl">
              <div>
                <label className="label">
                  Course Title *
                </label>
                <input
                  type="text"
                  {...register('title', { required: 'Course title is required' })}
                  className="input-field"
                  placeholder="Enter course title"
                />
                {errors.title && (
                  <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="label">
                  Course Code
                </label>
                <input
                  type="text"
                  {...register('course_code')}
                  className="input-field"
                  placeholder="e.g., CS-101"
                />
              </div>

              <div>
                <ColorPicker
                  value={watch('color')}
                  onChange={(color) => setValue('color', color)}
                  label="Course Color"
                />
              </div>

              <div>
                <label className="label">
                  Semester *
                </label>
                <select
                  {...register('semester', { required: 'Semester is required' })}
                  className="input-field"
                >
                  <option value="">Select semester</option>
                  <option value="Fall 2024">Fall 2024</option>
                  <option value="Spring 2025">Spring 2025</option>
                  <option value="Summer 2025">Summer 2025</option>
                </select>
                {errors.semester && (
                  <p className="text-red-600 text-sm mt-1">{errors.semester.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    {...register('start_date', { required: 'Start date is required' })}
                    className="input-field"
                  />
                  {errors.start_date && (
                    <p className="text-red-600 text-sm mt-1">{errors.start_date.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">
                    End Date *
                  </label>
                  <input
                    type="date"
                    {...register('end_date', { required: 'End date is required' })}
                    className="input-field"
                  />
                  {errors.end_date && (
                    <p className="text-red-600 text-sm mt-1">{errors.end_date.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="label">
                  Finals Week Start
                </label>
                <input
                  type="date"
                  {...register('finals_week_start')}
                  className="input-field"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 bg-gray-50 p-6 rounded-xl">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Meeting Times</h3>
                  <button
                  type="button"
                  onClick={handleAddMeetingTime}
                  className="btn-secondary flex items-center space-x-2 px-4 py-2 font-medium shadow-sm"
                >
                  <Plus size={18} />
                  <span>Add Meeting Time</span>
                </button>
                </div>

                {meetingTimes.map((time, index) => (
                  <div key={index} className="p-4 rounded-lg border border-gray-200 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="label">
                          Day of Week
                        </label>
                        <select
                          value={time.day_of_week}
                          onChange={(e) => {
                            const updated = [...meetingTimes]
                            updated[index].day_of_week = e.target.value
                            setValue('meeting_times', updated)
                          }}
                          className="input-field"
                        >
                          <option value="Monday">Monday</option>
                          <option value="Tuesday">Tuesday</option>
                          <option value="Wednesday">Wednesday</option>
                          <option value="Thursday">Thursday</option>
                          <option value="Friday">Friday</option>
                        </select>
                      </div>

                      <div>
                        <label className="label">
                          Start Time
                        </label>
                        <input
                          type="time"
                          value={time.start_time}
                          onChange={(e) => {
                            const updated = [...meetingTimes]
                            updated[index].start_time = e.target.value
                            setValue('meeting_times', updated)
                          }}
                          className="input-field"
                        />
                      </div>

                      <div>
                        <label className="label">
                          End Time
                        </label>
                        <input
                          type="time"
                          value={time.end_time}
                          onChange={(e) => {
                            const updated = [...meetingTimes]
                            updated[index].end_time = e.target.value
                            setValue('meeting_times', updated)
                          }}
                          className="input-field"
                        />
                      </div>
                    </div>

                    {meetingTimes.length > 1 && (
                      <button
                  type="button"
                  onClick={() => handleRemoveMeetingTime(index)}
                  className="text-red-600 text-sm mt-2 font-medium hover:text-red-800 underline"
                >
                  Remove
                </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 bg-gray-50 p-6 rounded-xl">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Course Topics</h3>
                  <button
                  type="button"
                  onClick={handleAddTopic}
                  className="btn-secondary flex items-center space-x-2 px-4 py-2 font-medium shadow-sm"
                >
                  <Plus size={18} />
                  <span>Add Topic</span>
                </button>
                </div>

                {topics.map((topic, index) => (
                  <div key={index} className="p-4 rounded-lg border border-gray-200 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="label">
                          Topic Title
                        </label>
                        <input
                          type="text"
                          value={topic.title}
                          onChange={(e) => handleTopicChange(index, 'title', e.target.value)}
                          className="input-field"
                          placeholder="Enter topic title"
                        />
                      </div>

                      <div>
                        <label className="label">
                          Sessions
                        </label>
                        <input
                          type="number"
                          value={topic.sessions_needed}
                          onChange={(e) => handleTopicChange(index, 'sessions_needed', parseInt(e.target.value))}
                          className="input-field"
                          min="1"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="label">
                        Description
                      </label>
                      <textarea
                        value={topic.description}
                        onChange={(e) => handleTopicChange(index, 'description', e.target.value)}
                        className="input-field"
                        placeholder="Enter topic description"
                        rows="2"
                      />
                    </div>

                    {topics.length > 1 && (
                      <button
                    type="button"
                    onClick={() => handleRemoveTopic(index)}
                    className="text-red-600 text-sm mt-2 font-medium hover:text-red-800 underline"
                  >
                    Remove
                  </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 bg-gray-50 p-6 rounded-xl">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Assignments</h3>
                  <button
                  type="button"
                  onClick={handleAddAssignment}
                  className="btn-secondary flex items-center space-x-2 px-4 py-2 font-medium shadow-sm"
                >
                  <Plus size={18} />
                  <span>Add Assignment</span>
                </button>
                </div>

                {assignments.map((assignment, index) => (
                  <div key={index} className="p-4 rounded-lg border border-gray-200 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-2">
                        <label className="label">
                          Assignment Title
                        </label>
                        <input
                          type="text"
                          value={assignment.title}
                          onChange={(e) => handleAssignmentChange(index, 'title', e.target.value)}
                          className="input-field"
                          placeholder="Enter assignment title"
                        />
                      </div>

                      <div>
                        <label className="label">
                          Type
                        </label>
                        <select
                          value={assignment.type}
                          onChange={(e) => handleAssignmentChange(index, 'type', e.target.value)}
                          className="input-field"
                        >
                          <option value="homework">Homework</option>
                          <option value="exam">Exam</option>
                          <option value="project">Project</option>
                          <option value="quiz">Quiz</option>
                        </select>
                      </div>

                      <div>
                        <label className="label">
                          Weight (%)
                        </label>
                        <input
                          type="number"
                          value={assignment.weight}
                          onChange={(e) => handleAssignmentChange(index, 'weight', parseInt(e.target.value))}
                          className="input-field"
                          min="0"
                          max="100"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="label">
                          Due Date
                        </label>
                        <input
                          type="date"
                          value={assignment.due_date}
                          onChange={(e) => handleAssignmentChange(index, 'due_date', e.target.value)}
                          className="input-field"
                        />
                      </div>

                      <div>
                        <label className="label">
                          Min Prep Days
                        </label>
                        <input
                          type="number"
                          value={assignment.min_prep_days}
                          onChange={(e) => handleAssignmentChange(index, 'min_prep_days', parseInt(e.target.value))}
                          className="input-field"
                          min="0"
                        />
                      </div>
                    </div>

                    {assignments.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAssignment(index)}
                        className="text-red-600 text-sm mt-2 font-medium hover:text-red-800 underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6 bg-gray-50 p-6 rounded-xl">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6 shadow-sm">
                <h3 className="text-xl font-bold text-blue-900 mb-4">Course Summary</h3>
                <p className="text-sm text-blue-700 mb-1">
                  <strong>Title:</strong> {watch('title')}
                </p>
                <p className="text-sm text-blue-700 mb-1">
                  <strong>Code:</strong> {watch('course_code')}
                </p>
                <p className="text-sm text-blue-700 mb-1">
                  <strong>Semester:</strong> {watch('semester')}
                </p>
                <p className="text-sm text-blue-700">
                  <strong>Dates:</strong> {watch('start_date')} to {watch('end_date')}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Meeting Times ({meetingTimes.length})
                </h3>
                <div className="space-y-2">
                  {meetingTimes.map((time, index) => (
                    <p key={index} className="text-sm text-gray-700">
                      {time.day_of_week} • {time.start_time} - {time.end_time}
                    </p>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Topics ({topics.length})
                </h3>
                <div className="space-y-2">
                  {topics.map((topic, index) => (
                    <p key={index} className="text-sm text-gray-700">
                      • {topic.title} ({topic.sessions_needed} sessions)
                    </p>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Assignments ({assignments.length})
                </h3>
                <div className="space-y-2">
                  {assignments.map((assignment, index) => (
                    <p key={index} className="text-sm text-gray-700">
                      • {assignment.title} ({assignment.type}) - {assignment.weight}%
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-6 border-t border-gray-200 sticky bottom-0 bg-white py-4 -mx-6 px-6 rounded-b-lg">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium shadow-sm"
              >
                Previous
              </button>
            )}

            {step < 5 ? (
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Skip to Review
                </button>
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="btn-primary px-6 py-3 font-medium shadow-md"
                >
                  Next
                </button>
              </div>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary px-6 py-3 font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create Course'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default CourseCreate
