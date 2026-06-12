import { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, FileText, Calendar as CalendarIcon, Filter } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Table from '../components/Table';
import './Reports.css';
import { API_URL } from '../config';

const REPORT_TYPES = [
  'Daily Enquiry Report',
  'Monthly Enquiry Report',
  'Course-wise Report',
  'Admission Report',
  'Follow-up Report'
];

const Reports = () => {
  const [reportType, setReportType] = useState('Daily Enquiry Report');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  
  const [enquiries, setEnquiries] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [enqRes, admRes, folRes] = await Promise.all([
        fetch(`${API_URL}/api/enquiries`),
        fetch(`${API_URL}/api/admissions`),
        fetch(`${API_URL}/api/follow-ups`)
      ]);

      if (enqRes.ok) setEnquiries(await enqRes.json());
      if (admRes.ok) setAdmissions(await admRes.json());
      if (folRes.ok) setFollowUps(await folRes.json());
    } catch (error) {
      console.error('Error fetching data for reports:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate Report Data
  const { columns, data, title } = useMemo(() => {
    let cols = [];
    let reportData = [];
    let reportTitle = reportType;

    if (reportType === 'Daily Enquiry Report') {
      reportTitle = `Daily Enquiries - ${dateFilter}`;
      cols = [
        { header: 'ID', accessor: 'id' },
        { header: 'Name', accessor: 'name' },
        { header: 'Mobile', accessor: 'phone' },
        { header: 'Course', accessor: 'course' },
        { header: 'Status', accessor: 'status' }
      ];
      reportData = enquiries
        .filter(e => (e.createdAt || '').startsWith(dateFilter))
        .map(e => ({
          id: `ENQ${String(e.id).padStart(3, '0')}`,
          name: e.studentName,
          phone: e.mobileNumber,
          course: e.courseInterested,
          status: e.status || 'New'
        }));
    } 
    else if (reportType === 'Monthly Enquiry Report') {
      const [year, month] = monthFilter.split('-');
      const monthName = new Date(year, parseInt(month) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
      reportTitle = `Monthly Enquiries - ${monthName}`;
      
      cols = [
        { header: 'Date', accessor: 'date' },
        { header: 'ID', accessor: 'id' },
        { header: 'Name', accessor: 'name' },
        { header: 'Course', accessor: 'course' },
        { header: 'Status', accessor: 'status' }
      ];
      reportData = enquiries
        .filter(e => (e.createdAt || '').startsWith(monthFilter))
        .map(e => ({
          date: e.createdAt ? new Date(e.createdAt).toLocaleDateString() : '-',
          id: `ENQ${String(e.id).padStart(3, '0')}`,
          name: e.studentName,
          course: e.courseInterested,
          status: e.status || 'New'
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    else if (reportType === 'Course-wise Report') {
      reportTitle = `Course-wise Enquiry Summary`;
      cols = [
        { header: 'Course Name', accessor: 'course' },
        { header: 'Total Enquiries', accessor: 'total' },
        { header: 'Converted (Admissions)', accessor: 'converted' },
        { header: 'Conversion %', accessor: 'rate' }
      ];
      
      const courseStats = {};
      enquiries.forEach(e => {
        const c = e.courseInterested || 'Unknown';
        if (!courseStats[c]) courseStats[c] = { total: 0, converted: 0 };
        courseStats[c].total++;
        if (e.status === 'Admission Confirmed') courseStats[c].converted++;
      });

      reportData = Object.keys(courseStats).map(c => ({
        course: c,
        total: courseStats[c].total,
        converted: courseStats[c].converted,
        rate: courseStats[c].total > 0 ? ((courseStats[c].converted / courseStats[c].total) * 100).toFixed(1) + '%' : '0%'
      })).sort((a, b) => b.total - a.total);
    }
    else if (reportType === 'Admission Report') {
      reportTitle = `Admissions Report`;
      cols = [
        { header: 'Admission ID', accessor: 'id' },
        { header: 'Student Name', accessor: 'name' },
        { header: 'Course', accessor: 'course' },
        { header: 'Admission Date', accessor: 'date' },
        { header: 'Fees Collected', accessor: 'fees' },
        { header: 'Mode', accessor: 'mode' }
      ];
      reportData = admissions.map(a => ({
        id: `ADM${String(a.id).padStart(3, '0')}`,
        name: a.studentName,
        course: a.courseInterested,
        date: new Date(a.admissionDate).toLocaleDateString(),
        fees: `₹${a.fees}`,
        mode: a.mode
      }));
    }
    else if (reportType === 'Follow-up Report') {
      reportTitle = `Follow-up Actions Report`;
      cols = [
        { header: 'Student Name', accessor: 'name' },
        { header: 'Status', accessor: 'status' },
        { header: 'Next Follow-up', accessor: 'nextDate' },
        { header: 'Last Note', accessor: 'note' }
      ];
      
      // Get latest follow up per enquiry
      const latestMap = new Map();
      followUps.forEach(f => {
        if (!latestMap.has(f.enquiryId)) {
          latestMap.set(f.enquiryId, f);
        }
      });
      
      reportData = Array.from(latestMap.values()).map(f => ({
        name: f.studentName,
        status: f.status,
        nextDate: f.nextFollowUpDate ? new Date(f.nextFollowUpDate).toLocaleDateString() : '-',
        note: f.notes
      })).sort((a, b) => {
        if (!a.nextDate || a.nextDate === '-') return 1;
        if (!b.nextDate || b.nextDate === '-') return -1;
        return new Date(a.nextDate) - new Date(b.nextDate);
      });
    }

    return { columns: cols, data: reportData, title: reportTitle };
  }, [reportType, dateFilter, monthFilter, enquiries, admissions, followUps]);

  // Export to Excel
  const exportToExcel = () => {
    if (data.length === 0) return alert("No data to export!");
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, `${title.replace(/ /g, '_')}.xlsx`);
  };

  // Export to PDF
  const exportToPDF = () => {
    if (data.length === 0) return alert("No data to export!");
    
    const doc = new jsPDF();
    
    // Add Header
    doc.setFontSize(20);
    doc.setTextColor(30, 58, 138); // #1e3a8a
    doc.text("Smart Education Centre", 14, 22);
    
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // #0f172a
    doc.text(title, 14, 32);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // #64748b
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 40);

    // Prepare Table
    const tableColumn = columns.map(c => c.header);
    const tableRows = data.map(row => columns.map(c => row[c.accessor] || ''));

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }, // #4f46e5 primary
      styles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    doc.save(`${title.replace(/ /g, '_')}.pdf`);
  };

  return (
    <div className="page-container" style={{ padding: 0 }}>
      <div className="page-header">
        <h1 className="page-title">Reports & Analytics</h1>
        <p className="page-subtitle">Generate insights, export to Excel, and download PDFs.</p>
      </div>

      <div className="reports-layout">
        {/* Sidebar Filters */}
        <div className="reports-sidebar">
          <Card className="filter-card">
            <h3 className="filter-title"><Filter size={18} /> Report Settings</h3>
            
            <div className="filter-group">
              <Select 
                id="reportType"
                label="Select Report"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                options={REPORT_TYPES}
              />
            </div>

            {reportType === 'Daily Enquiry Report' && (
              <div className="filter-group">
                <Input 
                  id="dateFilter"
                  label="Select Date"
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>
            )}

            {reportType === 'Monthly Enquiry Report' && (
              <div className="filter-group">
                <Input 
                  id="monthFilter"
                  label="Select Month"
                  type="month"
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                />
              </div>
            )}

            <div className="export-actions">
              <Button 
                variant="secondary" 
                icon={<FileText size={18} />} 
                onClick={exportToExcel}
                style={{ width: '100%', justifyContent: 'center', marginBottom: '12px' }}
                disabled={data.length === 0}
              >
                Export Excel
              </Button>
              <Button 
                variant="primary" 
                icon={<Download size={18} />} 
                onClick={exportToPDF}
                style={{ width: '100%', justifyContent: 'center', backgroundColor: '#ef4444', borderColor: '#ef4444' }}
                disabled={data.length === 0}
              >
                Export PDF
              </Button>
            </div>
          </Card>
        </div>

        {/* Report Preview */}
        <div className="reports-content">
          <Card className="preview-card">
            <div className="preview-header">
              <h2>{title}</h2>
              <span className="record-count">{data.length} Records</span>
            </div>
            
            {loading ? (
              <div className="loading-state">Generating report data...</div>
            ) : data.length === 0 ? (
              <div className="empty-state">
                <FileText size={48} color="#cbd5e1" />
                <p>No data available for this report.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <Table columns={columns} data={data} />
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Reports;
