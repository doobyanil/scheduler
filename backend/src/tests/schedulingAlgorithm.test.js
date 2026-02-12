const SchedulingAlgorithm = require('../services/schedulingAlgorithm');

describe('Scheduling Algorithm', () => {
  const mockCourse = {
    id: '1',
    title: 'Test Course',
    start_date: '2024-01-15',
    end_date: '2024-05-15',
    finals_week_start: '2024-05-10',
    meeting_times: [
      { day_of_week: 'Monday', start_time: '09:00', end_time: '10:30' },
      { day_of_week: 'Wednesday', start_time: '09:00', end_time: '10:30' },
      { day_of_week: 'Friday', start_time: '09:00', end_time: '10:30' }
    ],
    topics: [
      {
        id: 'topic1',
        title: 'Introduction',
        sessions: [
          { id: 'sess1', session_number: 1, scheduled_date: '2024-01-15' },
          { id: 'sess2', session_number: 2, scheduled_date: '2024-01-17' }
        ]
      },
      {
        id: 'topic2',
        title: 'Advanced Topics',
        sessions: [
          { id: 'sess3', session_number: 1, scheduled_date: '2024-01-22' },
          { id: 'sess4', session_number: 2, scheduled_date: '2024-01-24' }
        ]
      }
    ],
    assignments: [
      {
        id: 'ass1',
        title: 'Homework 1',
        type: 'homework',
        due_date: '2024-01-24',
        weight: 10,
        min_prep_days: 7,
        required_topics: ['topic1']
      },
      {
        id: 'ass2',
        title: 'Midterm Exam',
        type: 'exam',
        due_date: '2024-03-01',
        weight: 30,
        min_prep_days: 14,
        required_topics: ['topic1', 'topic2']
      }
    ]
  };

  const mockDisruption = {
    id: 'disrupt1',
    disruption_date: '2024-01-15',
    reason: 'Snow Day',
    course_id: '1'
  };

  describe('Initialization', () => {
    it('should initialize with course and disruptions', () => {
      const algorithm = new SchedulingAlgorithm(mockCourse, [mockDisruption]);
      
      expect(algorithm.course).toEqual(mockCourse);
      expect(algorithm.disruptions).toEqual([mockDisruption]);
      expect(algorithm.unavailableDates).toEqual(new Set(['2024-01-15']));
    });
  });

  describe('Strategy Generation', () => {
    it('should generate rescheduling options', () => {
      const algorithm = new SchedulingAlgorithm(mockCourse, [mockDisruption]);
      const options = algorithm.generateReschedulingOptions();
      
      expect(options).toBeInstanceOf(Array);
      expect(options.length).toBeGreaterThan(0);
      
      options.forEach(option => {
        expect(option.strategy).toBeDefined();
        expect(option.score).toBeDefined();
        expect(option.pros).toBeInstanceOf(Array);
        expect(option.cons).toBeInstanceOf(Array);
      });
    });

    it('should generate valid strategies with score between 0-100', () => {
      const algorithm = new SchedulingAlgorithm(mockCourse, [mockDisruption]);
      const options = algorithm.generateReschedulingOptions();
      
      options.forEach(option => {
        expect(option.score).toBeGreaterThanOrEqual(0);
        expect(option.score).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Workload Calculation', () => {
    it('should calculate weekly workload distribution', () => {
      const algorithm = new SchedulingAlgorithm(mockCourse, [mockDisruption]);
      const options = algorithm.generateReschedulingOptions();
      
      options.forEach(option => {
        const workloadVariance = algorithm.calculateWorkloadVariance(option.strategy);
        expect(workloadVariance).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Dependency Check', () => {
    it('should count dependency violations', () => {
      const algorithm = new SchedulingAlgorithm(mockCourse, [mockDisruption]);
      const options = algorithm.generateReschedulingOptions();
      
      options.forEach(option => {
        const violations = algorithm.countDependencyViolations(option.strategy);
        expect(violations).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Assignment Spacing', () => {
    it('should evaluate assignment spacing', () => {
      const algorithm = new SchedulingAlgorithm(mockCourse, [mockDisruption]);
      const options = algorithm.generateReschedulingOptions();
      
      options.forEach(option => {
        const spacingScore = algorithm.evaluateAssignmentSpacing(option.strategy);
        expect(spacingScore).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Policy Compliance', () => {
    it('should check policy violations', () => {
      const algorithm = new SchedulingAlgorithm(mockCourse, [mockDisruption]);
      const options = algorithm.generateReschedulingOptions();
      
      options.forEach(option => {
        const violations = algorithm.checkPolicyViolations(option.strategy);
        expect(violations).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Beam Search', () => {
    it('should refine strategies with beam search', () => {
      const algorithm = new SchedulingAlgorithm(mockCourse, [mockDisruption]);
      const strategies = algorithm.generateStrategies();
      
      expect(strategies).toBeInstanceOf(Array);
      expect(strategies.length).toBeGreaterThan(0);
      
      const refined = algorithm.beamSearch(strategies);
      expect(refined).toBeInstanceOf(Array);
      expect(refined.length).toBeGreaterThan(0);
    });
  });
});
