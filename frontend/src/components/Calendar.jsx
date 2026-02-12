import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, BookOpen, FileText, Clock } from 'lucide-react'

const Calendar = ({ 
  courses = [], 
  topics = [], 
  assignments = [], 
  meetingTimes = [],
  startDate = null,
  endDate = null,
  onDateClick = null,
  selectedDate = null,
  courseColors = {} // Map of courseId to color
}) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState('month') // 'month' or 'week'

  // Get days in month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDayOfMonth = new Date(year, month, 1).getDay()
    return { daysInMonth, firstDayOfMonth }
  }

  // Navigate months
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Get events for a specific date
  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0]
    const events = []

    // Add assignments
    assignments.forEach(assignment => {
      const assignmentDate = new Date(assignment.due_date).toISOString().split('T')[0]
      if (assignmentDate === dateStr) {
        const courseColor = assignment.course_id ? (courseColors[assignment.course_id] || '#DC2626') : '#DC2626'
        events.push({
          type: 'assignment',
          title: assignment.title,
          data: assignment,
          color: courseColor,
          bgColor: `${courseColor}20`,
          borderColor: courseColor
        })
      }
    })

    // Add topic sessions
    topics.forEach(topic => {
      topic.sessions?.forEach(session => {
        const sessionDate = new Date(session.scheduled_date).toISOString().split('T')[0]
        if (sessionDate === dateStr) {
          const courseColor = topic.course_id ? (courseColors[topic.course_id] || '#2563EB') : '#2563EB'
          events.push({
            type: 'topic',
            title: topic.title,
            session: session.session_number,
            data: topic,
            color: courseColor,
            bgColor: `${courseColor}20`,
            borderColor: courseColor
          })
        }
      })
    })

    // Add meeting times for the day of week
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayOfWeek = dayNames[date.getDay()]
    
    meetingTimes.forEach(meeting => {
      if (meeting.day_of_week === dayOfWeek) {
        const courseColor = meeting.course_id ? (courseColors[meeting.course_id] || '#16A34A') : '#16A34A'
        events.push({
          type: 'meeting',
          title: 'Class Meeting',
          time: `${meeting.start_time} - ${meeting.end_time}`,
          data: meeting,
          color: courseColor,
          bgColor: `${courseColor}20`,
          borderColor: courseColor
        })
      }
    })

    return events
  }

  // Check if date is within course dates
  const isDateInRange = (date) => {
    if (!startDate || !endDate) return true
    const checkDate = date.toISOString().split('T')[0]
    const start = new Date(startDate).toISOString().split('T')[0]
    const end = new Date(endDate).toISOString().split('T')[0]
    return checkDate >= start && checkDate <= end
  }

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const { daysInMonth, firstDayOfMonth } = getDaysInMonth(currentDate)
    const days = []
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ date: null, isCurrentMonth: false })
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.toDateString() === new Date().toDateString(),
        events: getEventsForDate(date),
        isInRange: isDateInRange(date)
      })
    }
    
    return days
  }, [currentDate, assignments, topics, meetingTimes, startDate, endDate])

  // Week view
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
    
    const days = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      days.push({
        date,
        isToday: date.toDateString() === new Date().toDateString(),
        events: getEventsForDate(date),
        isInRange: isDateInRange(date)
      })
    }
    return days
  }, [currentDate, assignments, topics, meetingTimes, startDate, endDate])

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex items-center space-x-1">
            <button
              onClick={previousMonth}
              className="p-1 rounded hover:bg-gray-100"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm font-medium text-primary hover:bg-primary/10 rounded"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-1 rounded hover:bg-gray-100"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setView('month')}
            className={`px-3 py-1 text-sm font-medium rounded ${
              view === 'month' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setView('week')}
            className={`px-3 py-1 text-sm font-medium rounded ${
              view === 'week' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Week
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center space-x-4 px-4 py-2 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded bg-green-200 border border-green-300"></div>
          <span className="text-xs text-gray-600">Class Meeting</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded bg-blue-200 border border-blue-300"></div>
          <span className="text-xs text-gray-600">Topic Session</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded bg-red-200 border border-red-300"></div>
          <span className="text-xs text-gray-600">Assignment Due</span>
        </div>
      </div>

      {/* Month View */}
      {view === 'month' && (
        <div className="grid grid-cols-7">
          {/* Day headers */}
          {dayNames.map(day => (
            <div
              key={day}
              className="p-2 text-center text-sm font-medium text-gray-500 border-b border-gray-200"
            >
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {calendarDays.map((day, index) => (
            <div
              key={index}
              onClick={() => day.date && onDateClick?.(day.date)}
              className={`min-h-24 p-1 border-b border-r border-gray-200 ${
                day.date ? 'cursor-pointer hover:bg-gray-50' : ''
              } ${day.isToday ? 'bg-primary/5' : ''} ${
                !day.isInRange && day.date ? 'bg-gray-100' : ''
              } ${selectedDate && day.date?.toDateString() === selectedDate.toDateString() ? 'ring-2 ring-primary' : ''}`}
            >
              {day.date && (
                <>
                  <div className={`text-sm font-medium mb-1 ${
                    day.isToday ? 'text-primary' : 'text-gray-900'
                  }`}>
                    {day.date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {day.events.slice(0, 3).map((event, eventIndex) => (
                      <div
                        key={eventIndex}
                        className="text-xs px-1 py-0.5 rounded truncate"
                        style={{ 
                          backgroundColor: event.bgColor,
                          color: event.color,
                          borderLeft: `3px solid ${event.borderColor}`
                        }}
                      >
                        {event.type === 'meeting' ? (
                          <span className="flex items-center">
                            <Clock size={10} className="mr-1" />
                            {event.time}
                          </span>
                        ) : (
                          event.title
                        )}
                      </div>
                    ))}
                    {day.events.length > 3 && (
                      <div className="text-xs text-gray-500 px-1">
                        +{day.events.length - 3} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Week View */}
      {view === 'week' && (
        <div className="grid grid-cols-7">
          {weekDays.map((day, index) => (
            <div
              key={index}
              onClick={() => onDateClick?.(day.date)}
              className={`min-h-48 p-2 border-r border-gray-200 cursor-pointer hover:bg-gray-50 ${
                day.isToday ? 'bg-primary/5' : ''
              } ${!day.isInRange ? 'bg-gray-100' : ''}`}
            >
              <div className="text-center mb-2">
                <div className="text-sm text-gray-500">{dayNames[index]}</div>
                <div className={`text-lg font-semibold ${
                  day.isToday ? 'text-primary' : 'text-gray-900'
                }`}>
                  {day.date.getDate()}
                </div>
              </div>
              <div className="space-y-1">
                {day.events.map((event, eventIndex) => (
                  <div
                    key={eventIndex}
                    className="text-xs p-2 rounded"
                    style={{ 
                      backgroundColor: event.bgColor,
                      color: event.color,
                      borderLeft: `3px solid ${event.borderColor}`
                    }}
                  >
                    <div className="font-medium truncate">{event.title}</div>
                    {event.type === 'meeting' && (
                      <div className="flex items-center mt-1">
                        <Clock size={10} className="mr-1" />
                        {event.time}
                      </div>
                    )}
                    {event.type === 'topic' && (
                      <div className="text-xs opacity-75">Session {event.session}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Calendar
