import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { Plus, BookOpen, Calendar, Clock, AlertCircle } from 'lucide-react'
import axios from 'axios'
import LoadingSpinner from '../components/LoadingSpinner'
import CalendarComponent from '../components/Calendar'

const Dashboard = () => {
  const { data: coursesData, isLoading: coursesLoading } = useQuery(
    'courses',
    async () => {
      const response = await axios.get('/api/courses')
      return response.data.courses
    }
  )

  const upcomingAssignments = coursesData?.flatMap(course =>
    course.assignments.filter(assignment => {
      const dueDate = new Date(assignment.due_date)
      const today = new Date()
      const diffTime = dueDate - today
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays > 0 && diffDays <= 7
    }).map(assignment => ({ ...assignment, course_title: course.title }))
  ) || []

  const activeDisruptions = coursesData?.flatMap(course =>
    course.disruptions.filter(disruption => !disruption.resolved)
  ) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Manage your courses and schedule</p>
        </div>
        <Link
          to="/courses/create"
          className="btn-primary flex items-center space-x-2"
        >
          <Plus size={18} />
          <span>Create Course</span>
        </Link>
      </div>

      {coursesLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Courses</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {coursesData?.length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <BookOpen className="text-primary" size={24} />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Upcoming Assignments</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {upcomingAssignments.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Calendar className="text-secondary" size={24} />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Disruptions</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {activeDisruptions.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <AlertCircle className="text-warning" size={24} />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Topics</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {coursesData?.flatMap(c => c.topics?.length || 0).reduce((a, b) => a + b, 0) || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Clock className="text-primary" size={24} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">My Courses</h2>
              </div>
              {coursesData?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen size={48} className="mx-auto mb-2 opacity-50" />
                  <p>No courses created yet</p>
                  <Link
                    to="/courses/create"
                    className="text-primary font-medium hover:underline mt-2 inline-block"
                  >
                    Create your first course
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {coursesData?.map(course => (
                    <Link
                      key={course.id}
                      to={`/courses/${course.id}`}
                      className="block p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: course.color || '#2563EB' }}
                          />
                          <div>
                            <h3 className="font-medium text-gray-900">{course.title}</h3>
                            <p className="text-sm text-gray-600">{course.course_code}</p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {course.semester}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Upcoming Assignments</h2>
              </div>
              {upcomingAssignments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar size={48} className="mx-auto mb-2 opacity-50" />
                  <p>No upcoming assignments</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingAssignments.slice(0, 5).map(assignment => (
                    <div
                      key={assignment.id}
                      className="p-4 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{assignment.title}</h3>
                          <p className="text-sm text-gray-600">{assignment.course_title}</p>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(assignment.due_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {activeDisruptions.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center space-x-2">
                  <AlertCircle className="text-warning" size={20} />
                  <span>Active Disruptions</span>
                </h2>
              </div>
              <div className="space-y-4">
                {activeDisruptions.map(disruption => (
                  <div
                    key={disruption.id}
                    className="p-4 rounded-lg border border-yellow-200 bg-yellow-50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-yellow-900">{disruption.course_title}</h3>
                        <p className="text-sm text-yellow-700">{disruption.reason}</p>
                      </div>
                      <div className="text-sm text-yellow-600">
                        {new Date(disruption.disruption_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <Link
                        to={`/courses/${disruption.course_id}/reschedule`}
                        className="text-sm text-yellow-800 hover:text-yellow-900 font-medium"
                      >
                        View Options
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Calendar Overview */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Schedule Overview</h2>
              <Link
                to="/reschedule"
                className="text-primary text-sm font-medium hover:underline"
              >
                Quick Reschedule
              </Link>
            </div>
            <CalendarComponent
              courses={coursesData || []}
              topics={coursesData?.flatMap(c => (c.topics || []).map(t => ({ ...t, course_id: c.id, course_color: c.color }))) || []}
              assignments={coursesData?.flatMap(c => (c.assignments || []).map(a => ({ ...a, course_id: c.id, course_color: c.color }))) || []}
              meetingTimes={coursesData?.flatMap(c => (c.meeting_times || []).map(m => ({ ...m, course_id: c.id, course_color: c.color }))) || []}
              courseColors={coursesData?.reduce((acc, c) => ({ ...acc, [c.id]: c.color || '#2563EB' }), {}) || {}}
            />
          </div>
        </>
      )}
    </div>
  )
}

export default Dashboard
