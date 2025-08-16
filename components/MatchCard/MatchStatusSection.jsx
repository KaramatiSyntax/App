'use client';

import { Calendar, Clock } from 'lucide-react';
import { format, isToday, isYesterday, isTomorrow } from 'date-fns';
import { MatchStatus } from './UpcomingMatchTimer';

const formatDate = (date) => {
  const d = new Date(date);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  if (isTomorrow(d)) return 'Tomorrow';
  return format(d, 'MMM dd, yyyy');
};

const formatTime = (date) => format(new Date(date), 'hh:mm a');

const MatchStatusSection = ({ status, time, matchFormat }) => (
  <div className="flex items-center justify-between p-4 text-white text-sm">
    <MatchStatus status={status} Time={time} />
    <div className="flex flex-col items-end">
      <div className="flex items-center gap-1">
        <Calendar className="w-4 h-4" />
        <span>{formatDate(time)}</span>
      </div>
      <div className="flex items-center gap-1">
        <Clock className="w-4 h-4" />
        <span>{formatTime(time)}</span>
      </div>
      {matchFormat && (
        <div className="mt-1 px-2 py-0.5 bg-white/20 rounded text-xs">{matchFormat}</div>
      )}
    </div>
  </div>
);

export default MatchStatusSection;
