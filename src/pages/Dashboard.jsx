import { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  GraduationCap, 
  PhoneCall, 
  TrendingUp,
  Calendar
} from 'lucide-react';
import { 
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import Card from '../components/Card';
import './Dashboard.css';
import { API_URL } from '../config';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const Dashboard = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [pendingFollowUpsCount, setPendingFollowUpsCount] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [enquiriesRes, followUpsRes, admissionsRes] = await Promise.all([
        fetch(`${API_URL}/api/enquiries`),
        fetch(`${API_URL}/api/follow-ups`),
        fetch(`${API_URL}/api/admissions`)
      ]);

      if (enquiriesRes.ok) {
        setEnquiries(await enquiriesRes.json());
      }
      if (admissionsRes.ok) {
        setAdmissions(await admissionsRes.json());
      }
      if (followUpsRes.ok) {
        const fData = await followUpsRes.json();
        setFollowUps(fData);
        
        // Calculate pending (missed + today)
        const todayStr = new Date().toISOString().split('T')[0];
        const latestFollowUpsMap = new Map();
        fData.forEach(item => {
          if (!latestFollowUpsMap.has(item.enquiryId)) {
            latestFollowUpsMap.set(item.enquiryId, item);
          }
        });
        
        let pending = 0;
        Array.from(latestFollowUpsMap.values()).forEach(item => {
          if (item.nextFollowUpDate && item.nextFollowUpDate <= todayStr && item.status !== 'Admission Confirmed' && item.status !== 'Not Interested') {
            pending++;
          }
        });
        setPendingFollowUpsCount(pending);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  // Derived Statistics
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Today's Enquiries
    const todaysEnquiries = enquiries.filter(e => {
      const eDate = new Date(e.createdAt).toISOString().split('T')[0];
      return eDate === todayStr;
    }).length;

    // Conversion Rate
    const conversionRate = enquiries.length > 0 
      ? ((admissions.length / enquiries.length) * 100).toFixed(1) 
      : 0;

    return {
      totalEnquiries: enquiries.length,
      todaysEnquiries,
      admissions: admissions.length,
      conversionRate
    };
  }, [enquiries, admissions]);

  // Chart Data
  const { monthlyData, courseData } = useMemo(() => {
    const monthMap = {};
    const courseMap = {};

    // Initialize last 6 months
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStr = d.toLocaleString('default', { month: 'short' });
      monthMap[monthStr] = { name: monthStr, enquiries: 0, admissions: 0 };
    }

    // Process Enquiries
    enquiries.forEach(e => {
      const d = new Date(e.createdAt);
      const monthStr = d.toLocaleString('default', { month: 'short' });
      if (monthMap[monthStr]) {
        monthMap[monthStr].enquiries++;
      }

      const course = e.courseInterested || 'Unknown';
      courseMap[course] = (courseMap[course] || 0) + 1;
    });

    // Process Admissions
    admissions.forEach(a => {
      const d = new Date(a.admissionDate);
      const monthStr = d.toLocaleString('default', { month: 'short' });
      if (monthMap[monthStr]) {
        monthMap[monthStr].admissions++;
      }
    });

    const mData = Object.values(monthMap);
    const cData = Object.keys(courseMap).map(key => ({
      name: key,
      value: courseMap[key]
    })).sort((a, b) => b.value - a.value);

    return { monthlyData: mData, courseData: cData };
  }, [enquiries, admissions]);

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1 className="page-title">Dashboard Overview</h1>
        <p className="page-subtitle">Welcome back, here's what's happening today.</p>
      </div>

      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <Card className="metric-card">
          <div className="metric-icon-wrapper" style={{ backgroundColor: '#e0e7ff', color: '#4f46e5' }}>
            <Users size={24} />
          </div>
          <div className="metric-info">
            <p className="metric-label">Total Enquiries</p>
            <h3 className="metric-value">{stats.totalEnquiries}</h3>
          </div>
        </Card>
        
        <Card className="metric-card">
          <div className="metric-icon-wrapper" style={{ backgroundColor: '#ccfbf1', color: '#0d9488' }}>
            <Calendar size={24} />
          </div>
          <div className="metric-info">
            <p className="metric-label">Today's Enquiries</p>
            <h3 className="metric-value">{stats.todaysEnquiries}</h3>
          </div>
        </Card>

        <Card className="metric-card">
          <div className="metric-icon-wrapper" style={{ backgroundColor: '#d1fae5', color: '#059669' }}>
            <GraduationCap size={24} />
          </div>
          <div className="metric-info">
            <p className="metric-label">Admissions</p>
            <h3 className="metric-value">{stats.admissions}</h3>
          </div>
        </Card>
        
        <Card className="metric-card">
          <div className="metric-icon-wrapper" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
            <PhoneCall size={24} />
          </div>
          <div className="metric-info">
            <p className="metric-label">Pending Follow-ups</p>
            <h3 className="metric-value">{pendingFollowUpsCount}</h3>
          </div>
        </Card>
        
        <Card className="metric-card">
          <div className="metric-icon-wrapper" style={{ backgroundColor: '#f3e8ff', color: '#9333ea' }}>
            <TrendingUp size={24} />
          </div>
          <div className="metric-info">
            <p className="metric-label">Conversion Rate</p>
            <h3 className="metric-value">{stats.conversionRate}%</h3>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
        
        <Card title="Monthly Enquiries" className="chart-card">
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dx={-10} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="enquiries" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Enquiries" maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Course-wise Enquiries" className="chart-card">
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={courseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {courseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Admission Trend" className="chart-card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <AreaChart data={monthlyData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorAdmissions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dx={-10} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="admissions" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAdmissions)" name="Admissions" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

      </div>
    </div>
  );
};

export default Dashboard;
