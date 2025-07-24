import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import './Feedback.css';

export default function Feedback({ user }) {
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setIsSubmitting(true);
    setSubmitStatus(null);

    const { error } = await supabase
      .from('feedback')
      .insert([{ content: feedback, user_name: user.name }]);

    if (error) {
      setSubmitStatus('error');
    } else {
      setSubmitStatus('success');
      setFeedback('');
    }

    setIsSubmitting(false);
    setTimeout(() => setSubmitStatus(null), 3000);
  };

  return (
    <div className="feedback-container">
      <form onSubmit={handleSubmit} className="feedback-form">
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Dein Feedback, Wünsche oder ein Bug-Report..."
          rows="4"
          required
        />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Wird gesendet...' : 'Feedback absenden'}
        </button>
      </form>
      {submitStatus === 'success' && 
        <p className="feedback-status success">Danke für dein Feedback!</p>
      }
      {submitStatus === 'error' && 
        <p className="feedback-status error">Fehler beim Senden. Bitte versuche es erneut.</p>
      }
    </div>
  );
}
