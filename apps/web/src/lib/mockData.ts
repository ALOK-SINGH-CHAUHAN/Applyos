// ─────────────────────────────────────────────
// Mock Data — AI Auto Job Bid Bot Dashboard
// ─────────────────────────────────────────────

export const kpiStats = [
  {
    id: 'resumes',
    label: 'Total Resumes',
    value: 256,
    delta: '+12 this week',
    deltaPositive: true,
    icon: 'file-text',
    chipBg: 'bg-chip-purple',
    chipText: 'text-chip-purple-text',
  },
  {
    id: 'jobs',
    label: 'Total Jobs',
    value: '1,532',
    delta: '+89 this week',
    deltaPositive: true,
    icon: 'briefcase',
    chipBg: 'bg-chip-blue',
    chipText: 'text-chip-blue-text',
  },
  {
    id: 'applications-today',
    label: 'Applications Today',
    value: 342,
    delta: '+42 today',
    deltaPositive: true,
    icon: 'send',
    chipBg: 'bg-chip-green',
    chipText: 'text-chip-green-text',
  },
  {
    id: 'success-rate',
    label: 'Success Rate',
    value: '78%',
    delta: '+8% vs last week',
    deltaPositive: true,
    icon: 'target',
    chipBg: 'bg-chip-orange',
    chipText: 'text-chip-orange-text',
  },
  {
    id: 'ai-match',
    label: 'AI Match Score (Avg)',
    value: '82%',
    delta: '+6% vs last week',
    deltaPositive: true,
    icon: 'cpu',
    chipBg: 'bg-chip-purple',
    chipText: 'text-chip-purple-text',
  },
  {
    id: 'interviews',
    label: 'Interviews',
    value: 47,
    delta: '+11 this week',
    deltaPositive: true,
    icon: 'users',
    chipBg: 'bg-chip-green',
    chipText: 'text-chip-green-text',
  },
];

export const applicationChartData = [
  { date: 'May 16', applications: 150, submitted: 90, interviews: 28, offers: 8 },
  { date: 'May 17', applications: 180, submitted: 110, interviews: 32, offers: 10 },
  { date: 'May 18', applications: 220, submitted: 140, interviews: 38, offers: 12 },
  { date: 'May 19', applications: 260, submitted: 170, interviews: 44, offers: 15 },
  { date: 'May 20', applications: 310, submitted: 200, interviews: 52, offers: 18 },
  { date: 'May 21', applications: 380, submitted: 250, interviews: 58, offers: 22 },
  { date: 'May 22', applications: 430, submitted: 290, interviews: 65, offers: 28 },
];

export const donutData = [
  { name: 'Submitted', value: 1203, pct: 52, color: '#6C5CE7' },
  { name: 'Pending', value: 721, pct: 31, color: '#F5A623' },
  { name: 'In Review', value: 254, pct: 11, color: '#3B82F6' },
  { name: 'Rejected', value: 132, pct: 6, color: '#EF4444' },
];

export const topPlatforms = [
  {
    id: 'upwork',
    name: 'Upwork',
    color: '#14A800',
    letter: 'U',
    applications: 1234,
    successRate: 82,
  },
  {
    id: 'indeed',
    name: 'Indeed',
    color: '#003A9B',
    letter: 'I',
    applications: 562,
    successRate: 75,
  },
  {
    id: 'guru',
    name: 'Guru',
    color: '#FF6B35',
    letter: 'G',
    applications: 254,
    successRate: 60,
  },
  {
    id: 'peoplephour',
    name: 'PeoplePerHour',
    color: '#E74C3C',
    letter: 'P',
    applications: 142,
    successRate: 76,
  },
  {
    id: 'dice',
    name: 'Dice',
    color: '#C0392B',
    letter: 'D',
    applications: 118,
    successRate: 72,
  },
];

export type ApplicationStatus = 'Submitted' | 'Pending' | 'In Review' | 'Rejected';

export const recentApplications = [
  {
    id: '1',
    jobTitle: 'Senior Frontend Developer',
    company: 'Acme Inc.',
    platform: 'Upwork',
    platformColor: '#14A800',
    status: 'Submitted' as ApplicationStatus,
    submittedAt: 'May 22, 2025 10:30 AM',
    matchScore: 92,
  },
  {
    id: '2',
    jobTitle: 'React Developer',
    company: 'Tech Solutions',
    platform: 'Indeed',
    platformColor: '#003A9B',
    status: 'Pending' as ApplicationStatus,
    submittedAt: 'May 22, 2025 09:15 AM',
    matchScore: 85,
  },
  {
    id: '3',
    jobTitle: 'Full Stack Engineer',
    company: 'Digital Agency',
    platform: 'Guru',
    platformColor: '#FF6B35',
    status: 'In Review' as ApplicationStatus,
    submittedAt: 'May 21, 2025 06:45 PM',
    matchScore: 88,
  },
  {
    id: '4',
    jobTitle: 'Frontend Engineer',
    company: 'StartupXYZ',
    platform: 'Upwork',
    platformColor: '#14A800',
    status: 'Rejected' as ApplicationStatus,
    submittedAt: 'May 21, 2025 02:20 PM',
    matchScore: 62,
  },
  {
    id: '5',
    jobTitle: 'JavaScript Developer',
    company: 'Innovate LLC',
    platform: 'Dice',
    platformColor: '#C0392B',
    status: 'Submitted' as ApplicationStatus,
    submittedAt: 'May 21, 2025 11:05 AM',
    matchScore: 90,
  },
  {
    id: '6',
    jobTitle: 'UI/UX Developer',
    company: 'Creative Soft',
    platform: 'PeoplePerHour',
    platformColor: '#E74C3C',
    status: 'Pending' as ApplicationStatus,
    submittedAt: 'May 20, 2025 08:50 PM',
    matchScore: 81,
  },
];

export type ActivityType = 'success' | 'info' | 'warning' | 'error';

export const activityFeed = [
  {
    id: '1',
    type: 'success' as ActivityType,
    title: 'Application submitted successfully',
    subtitle: 'Senior Frontend Developer at Acme Inc.',
    time: '10:30 AM',
  },
  {
    id: '2',
    type: 'info' as ActivityType,
    title: 'Resume uploaded',
    subtitle: 'John_Doe_FullStack_Resume.pdf',
    time: '09:45 AM',
  },
  {
    id: '3',
    type: 'info' as ActivityType,
    title: 'AI resume tailored',
    subtitle: 'Matched for React Developer at Tech Solutions',
    time: '09:30 AM',
  },
  {
    id: '4',
    type: 'info' as ActivityType,
    title: 'New job added',
    subtitle: 'Frontend Engineer at StartupXYZ',
    time: '08:10 AM',
  },
  {
    id: '5',
    type: 'error' as ActivityType,
    title: 'Application failed',
    subtitle: 'Network error on Dice platform',
    time: '08:56 AM',
  },
];

export const automationStatus = {
  isRunning: true,
  activeTasks: 23,
  successRate: '98.2%',
  avgResponseTime: '2.4s',
  nextRun: 'In 3m 15s',
};

export const systemUsage = [
  { label: 'CPU Usage', value: 45 },
  { label: 'Memory Usage', value: 62 },
  { label: 'Storage Usage', value: 38 },
];
