import { useState, useEffect } from 'react';
import { Sparkles, Calendar, TrendingUp, MessageSquare, History } from 'lucide-react';
import './AIAssistant.css';
import { API_URL } from '../config';

const AIAssistant = ({ enquiry }) => {
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFollowUps = async () => {
      try {
        const response = await fetch(`${API_URL}/api/enquiries/${enquiry.id}/follow-ups`);
        if (response.ok) {
          const data = await response.json();
          setFollowUps(data);
        }
      } catch (err) {
        console.error('Failed to fetch follow-ups for AI analysis', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFollowUps();
  }, [enquiry.id]);

  if (loading) {
    return (
      <div className="ai-assistant-card ai-loading">
        <Sparkles className="ai-pulse-icon" size={24} />
        <p>AI is analyzing enquiry data...</p>
      </div>
    );
  }

  // --- AI Logic (Heuristics) ---
  
  // 1. Admission Probability
  let probability = 30; // base probability
  if (enquiry.status === 'Interested') probability += 40;
  if (enquiry.status === 'Call Back') probability += 20;
  if (enquiry.status === 'Not Interested') probability = 5;
  if (enquiry.status === 'Admission Confirmed') probability = 100;
  
  // Adjust based on follow-ups (more engagement = higher prob)
  probability += Math.min(followUps.length * 5, 20);
  if (probability > 99 && enquiry.status !== 'Admission Confirmed') probability = 95;

  let probColor = '#eab308'; // yellow
  if (probability >= 70) probColor = '#22c55e'; // green
  if (probability < 30) probColor = '#ef4444'; // red

  // 2. Suggest Next Date
  const today = new Date();
  let suggestedDate = new Date(today);
  if (followUps.length === 0) {
    suggestedDate.setDate(today.getDate() + 1); // Tomorrow
  } else {
    suggestedDate.setDate(today.getDate() + 3); // 3 days later
  }

  // 3. Generate Follow-up Message
  const generatedMessage = `Hi ${enquiry.studentName}, hope you're doing well! I'm reaching out from Smart Education Centre. Are you still interested in joining our ${enquiry.courseInterested} batch? Let me know if you have any questions!`;

  // 4. Summarize History
  let summary = `Student inquired about ${enquiry.courseInterested} on ${new Date(enquiry.createdAt).toLocaleDateString()}. `;
  if (followUps.length === 0) {
    summary += "No follow-ups have been made yet. Reaching out soon is highly recommended.";
  } else {
    const latest = followUps[0]; // Assuming ordered DESC by createdAt
    summary += `There have been ${followUps.length} follow-up(s). The last interaction resulted in status: "${latest.status}" with note: "${latest.note}".`;
  }

  return (
    <div className="ai-assistant-card">
      <div className="ai-header">
        <Sparkles className="ai-icon" size={20} />
        <h3>AI Assistant Insights</h3>
      </div>
      
      <div className="ai-grid">
        <div className="ai-insight-box">
          <div className="ai-insight-header">
            <TrendingUp size={16} color={probColor} />
            <h4>Admission Probability</h4>
          </div>
          <div className="ai-prob-bar">
            <div className="ai-prob-fill" style={{ width: `${probability}%`, backgroundColor: probColor }}></div>
          </div>
          <p className="ai-prob-text" style={{ color: probColor }}>{probability}% Likelihood</p>
        </div>

        <div className="ai-insight-box">
          <div className="ai-insight-header">
            <Calendar size={16} className="text-blue" />
            <h4>Suggested Next Action</h4>
          </div>
          <p className="ai-text">Follow up on <strong>{suggestedDate.toLocaleDateString()}</strong></p>
        </div>
      </div>

      <div className="ai-insight-box full-width">
        <div className="ai-insight-header">
          <MessageSquare size={16} className="text-purple" />
          <h4>Auto-Generated Message</h4>
        </div>
        <div className="ai-message-preview">
          {generatedMessage}
        </div>
      </div>

      <div className="ai-insight-box full-width">
        <div className="ai-insight-header">
          <History size={16} className="text-orange" />
          <h4>History Summary</h4>
        </div>
        <p className="ai-text summary-text">{summary}</p>
      </div>
    </div>
  );
};

export default AIAssistant;
