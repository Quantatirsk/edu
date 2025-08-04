import type { Teacher, Student, DetailedReview, ScoreRecord, Appointment } from '../types';

export const mockTeachers: Teacher[] = [
  {
    id: '1',
    name: '张慧敏',
    email: 'zhang@example.com',
    phone: '13800138001',
    role: 'teacher',
    avatar: 'https://ui-avatars.com/api/?name=张慧敏&background=007AFF&color=fff',
    subject: ['数学'],
    experience: 8,
    rating: 4.8,
    reviews: 120,
    price: 200,
    location: {
      address: '北京市朝阳区建国门外大街',
      lat: 39.9087,
      lng: 116.4384,
      district: '朝阳区'
    },
    detailedRatings: {
      teaching: 4.9,
      patience: 4.8,
      communication: 4.7,
      effectiveness: 4.8
    },
    availability: ['周一下午', '周三下午', '周六全天', '周日上午'],
    certifications: ['高级数学教师资格证', '北京市优秀教师', '数学竞赛金牌教练'],
    teachingStyle: '注重基础巩固，善于启发思维',
    description: '8年初高中数学教学经验，擅长代数和几何教学，帮助300多名学生提高数学成绩平均20分以上。教学风格亲和，善于发现学生问题并制定个性化学习方案。'
  },
  {
    id: '2',
    name: '李雅文',
    email: 'li@example.com',
    phone: '13800138002',
    role: 'teacher',
    avatar: 'https://ui-avatars.com/api/?name=李雅文&background=4CAF50&color=fff',
    subject: ['英语'],
    experience: 6,
    rating: 4.7,
    reviews: 98,
    price: 180,
    location: {
      address: '北京市海淀区中关村大街',
      lat: 39.9888,
      lng: 116.3058,
      district: '海淀区'
    },
    detailedRatings: {
      teaching: 4.7,
      patience: 4.8,
      communication: 4.9,
      effectiveness: 4.6
    },
    availability: ['周二下午', '周四下午', '周六下午', '周日全天'],
    certifications: ['英语专业八级', '雅思8.5分', '教师资格证'],
    teachingStyle: '情景教学，注重口语和听力',
    description: '英语专业硕士，6年一对一教学经验，专注于中高考英语和口语提升。学生平均提分25分，多名学生考入重点高中和大学。'
  },
  {
    id: '3',
    name: '王建国',
    email: 'wang@example.com',
    phone: '13800138003',
    role: 'teacher',
    avatar: 'https://ui-avatars.com/api/?name=王建国&background=FF9800&color=fff',
    subject: ['物理'],
    experience: 10,
    rating: 4.9,
    reviews: 150,
    price: 220,
    location: {
      address: '北京市西城区德胜门内大街',
      lat: 39.9388,
      lng: 116.3883,
      district: '西城区'
    },
    detailedRatings: {
      teaching: 4.9,
      patience: 4.8,
      communication: 4.7,
      effectiveness: 4.9
    },
    availability: ['周一晚上', '周三晚上', '周五晚上', '周六全天'],
    certifications: ['物理学博士', '高级教师', '物理竞赛国家级教练'],
    teachingStyle: '理论结合实践，注重实验演示',
    description: '物理学博士，10年教学经验，专业指导高中物理和竞赛。独创的"三步解题法"帮助学生快速掌握物理思维，学生物理成绩平均提升30分。'
  },
  {
    id: '4',
    name: '陈思雨',
    email: 'chen@example.com',
    phone: '13800138004',
    role: 'teacher',
    avatar: 'https://ui-avatars.com/api/?name=陈思雨&background=9C27B0&color=fff',
    subject: ['化学'],
    experience: 7,
    rating: 4.6,
    reviews: 85,
    price: 190,
    location: {
      address: '北京市东城区东四十条',
      lat: 39.9338,
      lng: 116.4238,
      district: '东城区'
    },
    detailedRatings: {
      teaching: 4.6,
      patience: 4.7,
      communication: 4.5,
      effectiveness: 4.7
    },
    availability: ['周二晚上', '周四晚上', '周六下午', '周日下午'],
    certifications: ['化学教师资格证', '实验室安全培训师', '化学竞赛优秀教练'],
    teachingStyle: '实验导入，知识点精讲',
    description: '化学专业硕士，7年高中化学教学经验。擅长有机化学和无机化学教学，通过生动的实验帮助学生理解抽象概念，提分效果显著。'
  }
];

export const mockStudents: Student[] = [
  {
    id: '101',
    name: '小明',
    email: 'xiaoming@example.com',
    phone: '13900139001',
    role: 'student',
    avatar: 'https://ui-avatars.com/api/?name=小明&background=2196F3&color=fff',
    grade: '高二',
    location: {
      address: '北京市朝阳区望京',
      lat: 39.9888,
      lng: 116.4648,
      district: '朝阳区'
    },
    targetScore: 130,
    weakSubjects: ['数学', '物理'],
    studyGoals: ['提高数学成绩', '物理竞赛准备']
  },
  {
    id: '102',
    name: '小红',
    email: 'xiaohong@example.com',
    phone: '13900139002',
    role: 'student',
    avatar: 'https://ui-avatars.com/api/?name=小红&background=E91E63&color=fff',
    grade: '初三',
    location: {
      address: '北京市海淀区五道口',
      lat: 39.9958,
      lng: 116.3289,
      district: '海淀区'
    },
    targetScore: 115,
    weakSubjects: ['英语'],
    studyGoals: ['中考英语冲刺', '口语提升']
  }
];

export const mockDetailedReviews: DetailedReview[] = [
  {
    id: 'r1',
    appointmentId: 'a1',
    studentId: '101',
    teacherId: '1',
    ratings: {
      overall: 5,
      teaching: 5,
      patience: 5,
      communication: 4,
      effectiveness: 5
    },
    comment: '张老师讲解非常清晰，特别是在二次函数这个难点上，用了很多生动的例子帮我理解。每次课后都会给我布置针对性的练习题，我的数学成绩有了明显提升。',
    date: '2023-06-16',
    isRecommended: true,
    tags: ['讲解清晰', '有耐心', '方法独特']
  },
  {
    id: 'r2',
    appointmentId: 'a2',
    studentId: '101',
    teacherId: '2',
    ratings: {
      overall: 4,
      teaching: 4,
      patience: 5,
      communication: 5,
      effectiveness: 4
    },
    comment: '李老师的英语课很有趣，口语练习很多，但希望能在语法讲解上更详细一些。整体来说收获很大，口语水平有了提升。',
    date: '2023-06-19',
    isRecommended: true,
    tags: ['口语练习多', '很有耐心', '课堂有趣']
  }
];

export const mockScoreRecords: ScoreRecord[] = [
  {
    id: 's1',
    studentId: '101',
    teacherId: '1',
    subject: '数学',
    testType: '月考',
    beforeScore: 75,
    afterScore: 88,
    maxScore: 150,
    date: '2023-06-16',
    lessonCount: 8,
    notes: '代数基础有了明显提升，几何证明还需加强'
  },
  {
    id: 's2',
    studentId: '101',
    teacherId: '1',
    subject: '数学',
    testType: '期中考试',
    beforeScore: 88,
    afterScore: 108,
    maxScore: 150,
    date: '2023-07-20',
    lessonCount: 16,
    notes: '各模块成绩均衡提升，已达到目标分数线'
  },
  {
    id: 's3',
    studentId: '101',
    teacherId: '2',
    subject: '英语',
    testType: '单元测试',
    beforeScore: 80,
    afterScore: 85,
    maxScore: 120,
    date: '2023-06-19',
    lessonCount: 4,
    notes: '听力和口语有进步，阅读理解待提升'
  },
  {
    id: 's4',
    studentId: '102',
    teacherId: '3',
    subject: '物理',
    testType: '模拟考试',
    beforeScore: 70,
    afterScore: 82,
    maxScore: 100,
    date: '2023-06-20',
    lessonCount: 6,
    notes: '力学基础扎实，电学部分需要加强练习'
  }
];

export const mockAppointments: Appointment[] = [
  {
    id: 'a1',
    studentId: '101',
    teacherId: '1',
    subject: '数学',
    date: '2023-06-16',
    time: '14:00',
    status: 'completed',
    price: 200,
    notes: '复习二次函数',
    lessonType: 'single'
  },
  {
    id: 'a2',
    studentId: '101',
    teacherId: '2',
    subject: '英语',
    date: '2023-06-19',
    time: '15:30',
    status: 'completed',
    price: 180,
    notes: '口语练习',
    lessonType: 'single'
  }
];