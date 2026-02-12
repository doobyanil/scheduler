class SchedulingAlgorithm {
  constructor(course, disruptions) {
    this.course = course;
    this.disruptions = disruptions;
    this.unavailableDates = new Set(disruptions.map(d => d.disruption_date));
  }

  generateReschedulingOptions() {
    const strategies = this.generateStrategies();
    const refinedStrategies = this.beamSearch(strategies);
    const scoredStrategies = refinedStrategies.map(strategy => this.scoreStrategy(strategy));
    
    return scoredStrategies.sort((a, b) => b.score - a.score).slice(0, 3);
  }

  generateStrategies() {
    const strategies = [];

    strategies.push(this.createExtendSemesterStrategy());
    strategies.push(this.createCompressContentStrategy());
    strategies.push(this.createRedistributeStrategy());

    return strategies;
  }

  createExtendSemesterStrategy() {
    return {
      name: 'Extend Semester',
      description: 'Extend the semester by adding makeup days at the end',
      topics: this.course.topics.map(topic => ({
        ...topic,
        sessions: topic.sessions.map(session => {
          if (this.unavailableDates.has(session.scheduled_date)) {
            return {
              ...session,
              scheduled_date: this.findNextAvailableDate(session.scheduled_date)
            };
          }
          return session;
        })
      })),
      assignments: this.cascadeAssignments(this.course.topics, this.course.assignments)
    };
  }

  createCompressContentStrategy() {
    return {
      name: 'Compress Content',
      description: 'Combine topics to fit within the original semester',
      topics: this.course.topics.map(topic => ({
        ...topic,
        sessions: topic.sessions.filter(session => !this.unavailableDates.has(session.scheduled_date))
      })),
      assignments: this.cascadeAssignments(this.course.topics, this.course.assignments)
    };
  }

  createRedistributeStrategy() {
    return {
      name: 'Redistribute',
      description: 'Redistribute topics to available days throughout the semester',
      topics: this.course.topics.map(topic => ({
        ...topic,
        sessions: topic.sessions.map(session => {
          if (this.unavailableDates.has(session.scheduled_date)) {
            return {
              ...session,
              scheduled_date: this.findAlternativeDate(session.scheduled_date)
            };
          }
          return session;
        })
      })),
      assignments: this.cascadeAssignments(this.course.topics, this.course.assignments)
    };
  }

  cascadeAssignments(topics, assignments) {
    return assignments.map(assignment => {
      const latestTopicDate = this.getLatestTopicDate(assignment.required_topics, topics);
      if (latestTopicDate) {
        const newDueDate = new Date(latestTopicDate);
        newDueDate.setDate(newDueDate.getDate() + assignment.min_prep_days);
        return {
          ...assignment,
          due_date: newDueDate
        };
      }
      return assignment;
    });
  }

  getLatestTopicDate(requiredTopicIds, topics) {
    let latestDate = null;
    
    requiredTopicIds.forEach(topicId => {
      const topic = topics.find(t => t.id === topicId);
      if (topic) {
        topic.sessions.forEach(session => {
          const sessionDate = new Date(session.scheduled_date);
          if (!latestDate || sessionDate > latestDate) {
            latestDate = sessionDate;
          }
        });
      }
    });
    
    return latestDate;
  }

  findNextAvailableDate(date) {
    const nextDate = new Date(date);
    
    do {
      nextDate.setDate(nextDate.getDate() + 1);
    } while (this.unavailableDates.has(nextDate.toISOString().split('T')[0]) || !this.isValidClassDay(nextDate));

    return nextDate.toISOString().split('T')[0];
  }

  findAlternativeDate(date) {
    const alternativeDate = new Date(date);
    
    for (let i = 1; i <= 7; i++) {
      alternativeDate.setDate(date.getDate() + i);
      if (!this.unavailableDates.has(alternativeDate.toISOString().split('T')[0]) && this.isValidClassDay(alternativeDate)) {
        return alternativeDate.toISOString().split('T')[0];
      }
    }
    
    return this.findNextAvailableDate(date);
  }

  isValidClassDay(date) {
    const dayOfWeek = date.getDay();
    const courseDays = this.course.meeting_times.map(mt => {
      const days = {
        'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
        'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 0
      };
      return days[mt.day_of_week];
    });
    
    return courseDays.includes(dayOfWeek);
  }

  beamSearch(strategies, beamWidth = 5, iterations = 3) {
    let beam = strategies;
    
    for (let i = 0; i < iterations; i++) {
      const candidates = [];
      
      beam.forEach(strategy => {
        const variations = this.generateVariations(strategy);
        candidates.push(...variations);
      });
      
      candidates.sort((a, b) => this.calculateScore(b) - this.calculateScore(a));
      beam = candidates.slice(0, beamWidth);
    }
    
    return beam;
  }

  generateVariations(strategy) {
    return [strategy];
  }

  scoreStrategy(strategy) {
    const score = this.calculateScore(strategy);
    const pros = this.generatePros(strategy);
    const cons = this.generateCons(strategy);
    
    return {
      strategy,
      score,
      pros,
      cons
    };
  }

  calculateScore(strategy) {
    let score = 100;

    score -= this.calculateWorkloadVariance(strategy) * 0.3;
    score -= this.countDependencyViolations(strategy) * 5;
    score += this.evaluateAssignmentSpacing(strategy) * 0.2;
    score -= this.countChanges(strategy) * 1.5;
    score -= this.checkPolicyViolations(strategy) * 10;

    return Math.max(0, Math.min(100, score));
  }

  calculateWorkloadVariance(strategy) {
    const weeklyWorkload = {};
    
    strategy.assignments.forEach(assignment => {
      const week = this.getWeekNumber(new Date(assignment.due_date));
      weeklyWorkload[week] = (weeklyWorkload[week] || 0) + assignment.weight;
    });

    const workloads = Object.values(weeklyWorkload);
    const mean = workloads.reduce((a, b) => a + b, 0) / workloads.length;
    const variance = workloads.reduce((sum, w) => sum + Math.pow(w - mean, 2), 0) / workloads.length;
    
    return variance;
  }

  countDependencyViolations(strategy) {
    let violations = 0;
    
    strategy.assignments.forEach(assignment => {
      const latestTopicDate = this.getLatestTopicDate(assignment.required_topics, strategy.topics);
      const assignmentDate = new Date(assignment.due_date);
      
      if (latestTopicDate && assignmentDate <= latestTopicDate) {
        violations++;
      }
    });
    
    strategy.topics.forEach(topic => {
      if (topic.prerequisites) {
        topic.prerequisites.forEach(prereqId => {
          const prereqTopic = strategy.topics.find(t => t.id === prereqId);
          if (prereqTopic) {
            const topicStartDate = new Date(topic.sessions[0].scheduled_date);
            const prereqEndDate = new Date(prereqTopic.sessions[prereqTopic.sessions.length - 1].scheduled_date);
            
            if (topicStartDate <= prereqEndDate) {
              violations++;
            }
          }
        });
      }
    });
    
    return violations;
  }

  evaluateAssignmentSpacing(strategy) {
    let spacingScore = 0;
    
    const sortedAssignments = [...strategy.assignments].sort((a, b) => 
      new Date(a.due_date) - new Date(b.due_date)
    );
    
    for (let i = 1; i < sortedAssignments.length; i++) {
      const prevDate = new Date(sortedAssignments[i - 1].due_date);
      const currDate = new Date(sortedAssignments[i].due_date);
      const daysBetween = Math.ceil((currDate - prevDate) / (1000 * 60 * 60 * 24));
      
      if (daysBetween >= 7) {
        spacingScore += 2;
      } else if (daysBetween >= 3) {
        spacingScore += 1;
      }
    }
    
    return spacingScore;
  }

  countChanges(strategy) {
    let changes = 0;
    
    strategy.topics.forEach(topic => {
      const originalTopic = this.course.topics.find(t => t.id === topic.id);
      if (originalTopic) {
        topic.sessions.forEach(session => {
          const originalSession = originalTopic.sessions.find(s => s.session_number === session.session_number);
          if (originalSession && originalSession.scheduled_date !== session.scheduled_date) {
            changes++;
          }
        });
      }
    });
    
    strategy.assignments.forEach(assignment => {
      const originalAssignment = this.course.assignments.find(a => a.id === assignment.id);
      if (originalAssignment && originalAssignment.due_date !== assignment.due_date) {
        changes++;
      }
    });
    
    return changes;
  }

  checkPolicyViolations(strategy) {
    let violations = 0;
    
    const semesterStart = new Date(this.course.start_date);
    const semesterEnd = new Date(this.course.end_date);
    const firstWeekEnd = new Date(semesterStart);
    firstWeekEnd.setDate(semesterStart.getDate() + 7);
    const lastWeekStart = new Date(semesterEnd);
    lastWeekStart.setDate(semesterEnd.getDate() - 7);
    
    strategy.assignments.forEach(assignment => {
      const dueDate = new Date(assignment.due_date);
      
      if (assignment.type === 'exam') {
        if (dueDate >= semesterStart && dueDate <= firstWeekEnd) {
          violations++;
        }
        
        if (dueDate >= lastWeekStart && dueDate <= semesterEnd && !this.isFinalsWeek(dueDate)) {
          violations++;
        }
      }
      
      if (dueDate < semesterStart || dueDate > semesterEnd) {
        violations++;
      }
    });
    
    strategy.topics.forEach(topic => {
      topic.sessions.forEach(session => {
        const sessionDate = new Date(session.scheduled_date);
        if (sessionDate < semesterStart || sessionDate > semesterEnd) {
          violations++;
        }
      });
    });
    
    return violations;
  }

  isFinalsWeek(date) {
    if (!this.course.finals_week_start) return false;
    
    const finalsStart = new Date(this.course.finals_week_start);
    const finalsEnd = new Date(finalsStart);
    finalsEnd.setDate(finalsStart.getDate() + 7);
    
    return date >= finalsStart && date <= finalsEnd;
  }

  getWeekNumber(d) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  }

  generatePros(strategy) {
    const pros = [];
    
    if (strategy.name === 'Extend Semester') {
      pros.push('Maintains original content structure');
      pros.push('Minimizes impact on assignment spacing');
      pros.push('Students have extra time to prepare');
    } else if (strategy.name === 'Compress Content') {
      pros.push('Finishes on original semester end date');
      pros.push('No makeup classes required');
      pros.push('Students know the end date in advance');
    } else if (strategy.name === 'Redistribute') {
      pros.push('Balanced workload distribution');
      pros.push('Minimizes overall disruption');
      pros.push('Fits within original semester dates');
    }
    
    if (strategy.assignments.every(assignment => {
      const latestTopicDate = this.getLatestTopicDate(assignment.required_topics, strategy.topics);
      return latestTopicDate && new Date(assignment.due_date) > new Date(latestTopicDate);
    })) {
      pros.push('All assignments have proper prep time');
    }
    
    return pros;
  }

  generateCons(strategy) {
    const cons = [];
    
    if (strategy.name === 'Extend Semester') {
      cons.push('Delays end of semester');
      cons.push('May conflict with finals week');
      cons.push('Students may have schedule conflicts');
    } else if (strategy.name === 'Compress Content') {
      cons.push('Topics may be rushed');
      cons.push('Less review time before exams');
      cons.push('Potential content gaps');
    } else if (strategy.name === 'Redistribute') {
      cons.push('Topics may be out of order');
      cons.push('Uneven workload distribution');
      cons.push('Increased stress for students');
    }
    
    if (strategy.assignments.some(assignment => {
      const latestTopicDate = this.getLatestTopicDate(assignment.required_topics, strategy.topics);
      return latestTopicDate && new Date(assignment.due_date) <= new Date(latestTopicDate);
    })) {
      cons.push('Some assignments lack proper prep time');
    }
    
    return cons;
  }
}

module.exports = SchedulingAlgorithm;
