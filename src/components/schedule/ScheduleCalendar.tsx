'use client';

import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ScheduleEntry {
  id: string;
  date: string;
  user_id: string;
  user_name: string;
  user_crm: string;
  user_phone: string;
  shift_id: string;
  shift_name: string;
  shift_code: string;
  shift_color: string;
  shift_start: string;
  shift_end: string;
}

interface ScheduleCalendarProps {
  entries: ScheduleEntry[];
  shifts: Array<{ id: string; name: string; code: string; color: string }>;
  currentUserId: string;
  month: number;
  year: number;
  isPublished: boolean;
  isRT: boolean;
  onMonthChange?: (month: number, year: number) => void;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function ScheduleCalendar({
  entries,
  shifts,
  currentUserId,
  month,
  year,
  isPublished,
  isRT,
  onMonthChange,
}: ScheduleCalendarProps) {
  const [tooltipEntry, setTooltipEntry] = useState<string | null>(null);

  const currentDate = new Date(year, month - 1, 1);

  const days = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const allDays = eachDayOfInterval({ start, end });

    // Padding início (dias do mês anterior)
    const startPadding = getDay(start);
    const paddedDays = Array(startPadding).fill(null).concat(allDays);

    // Agrupar em semanas
    const weeks: (Date | null)[][] = [];
    for (let i = 0; i < paddedDays.length; i += 7) {
      const week = paddedDays.slice(i, i + 7);
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }
    return weeks;
  }, [year, month]);

  // Indexar entradas por data
  const entriesByDate = useMemo(() => {
    const map = new Map<string, ScheduleEntry[]>();
    for (const entry of entries) {
      const dateKey = entry.date;
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(entry);
    }
    return map;
  }, [entries]);

  // Agrupar por turno dentro de cada dia
  const entriesByDateAndShift = useMemo(() => {
    const result = new Map<string, Map<string, ScheduleEntry[]>>();
    for (const [date, dayEntries] of entriesByDate) {
      const shiftMap = new Map<string, ScheduleEntry[]>();
      for (const entry of dayEntries) {
        if (!shiftMap.has(entry.shift_id)) shiftMap.set(entry.shift_id, []);
        shiftMap.get(entry.shift_id)!.push(entry);
      }
      result.set(date, shiftMap);
    }
    return result;
  }, [entriesByDate]);

  const handlePrev = () => {
    const prev = subMonths(currentDate, 1);
    onMonthChange?.(prev.getMonth() + 1, prev.getFullYear());
  };

  const handleNext = () => {
    const next = addMonths(currentDate, 1);
    onMonthChange?.(next.getMonth() + 1, next.getFullYear());
  };

  return (
    <TooltipProvider>
      <div>
        {/* Header do calendário */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={handlePrev}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-lg font-semibold capitalize">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </h2>
            <Button variant="outline" size="icon" onClick={handleNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-4">
            {/* Legenda de turnos */}
            <div className="hidden md:flex items-center gap-3">
              {shifts.map((shift) => (
                <div key={shift.id} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: shift.color }} />
                  <span className="text-xs text-muted-foreground font-medium">{shift.code} - {shift.name}</span>
                </div>
              ))}
            </div>

            {/* Status de publicação */}
            <div className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium',
              isPublished
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
            )}>
              {isPublished ? '✓ Publicada' : 'Rascunho'}
            </div>
          </div>
        </div>

        {/* Legenda mobile */}
        <div className="flex flex-wrap gap-2 mb-4 md:hidden">
          {shifts.map((shift) => (
            <div key={shift.id} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: shift.color }} />
              <span className="text-xs text-muted-foreground">{shift.code}</span>
            </div>
          ))}
        </div>

        {/* Cabeçalho dos dias da semana */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((day) => (
            <div key={day} className={cn(
              'py-2 text-center text-xs font-semibold text-muted-foreground',
              (day === 'Dom' || day === 'Sáb') && 'text-red-500/70 dark:text-red-400/70'
            )}>
              {day}
            </div>
          ))}
        </div>

        {/* Grade do calendário */}
        <div className="border border-border rounded-lg overflow-hidden">
          {days.map((week, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7 divide-x divide-border border-b border-border last:border-b-0">
              {week.map((day, dayIdx) => {
                if (!day) {
                  return <div key={dayIdx} className="bg-muted/30 min-h-[120px] p-1" />;
                }

                const dateKey = format(day, 'yyyy-MM-dd');
                const dayEntries = entriesByDateAndShift.get(dateKey);
                const isWeekend = dayIdx === 0 || dayIdx === 6;
                const today = isToday(day);

                return (
                  <div
                    key={dayIdx}
                    className={cn(
                      'min-h-[120px] p-1 relative',
                      today && 'bg-primary/5 dark:bg-primary/10',
                      isWeekend && !today && 'bg-muted/20',
                      'hover:bg-accent/50 transition-colors'
                    )}
                  >
                    {/* Número do dia */}
                    <div className={cn(
                      'text-xs font-medium mb-1.5 w-6 h-6 flex items-center justify-center rounded-full',
                      today
                        ? 'bg-primary text-primary-foreground'
                        : isWeekend
                          ? 'text-red-500 dark:text-red-400'
                          : 'text-foreground'
                    )}>
                      {format(day, 'd')}
                    </div>

                    {/* Entradas agrupadas por turno */}
                    {dayEntries && (
                      <div className="space-y-0.5">
                        {shifts.map((shift) => {
                          const shiftEntries = dayEntries.get(shift.id);
                          if (!shiftEntries?.length) return null;

                          return (
                            <div key={shift.id}>
                              {shiftEntries.map((entry) => {
                                const isMe = entry.user_id === currentUserId;
                                return (
                                  <Tooltip key={entry.id}>
                                    <TooltipTrigger asChild>
                                      <div
                                        className={cn(
                                          'flex items-center gap-0.5 truncate text-white text-[11px] font-medium leading-tight rounded px-1 py-0.5 mb-0.5',
                                          isMe && 'ring-2 ring-white dark:ring-gray-700 ring-offset-1'
                                        )}
                                        style={{ backgroundColor: shift.color }}
                                      >
                                        <span className="font-bold mr-1">{shift.code}</span>
                                        <span className="truncate">{entry.user_name.split(' ').slice(0,2).join(' ')}</span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs max-w-[200px]">
                                      <div className="space-y-0.5">
                                        <p className="font-semibold">{entry.user_name}</p>
                                        <p className="text-muted-foreground">CRM: {entry.user_crm}</p>
                                        <p className="text-muted-foreground">Tel: {entry.user_phone}</p>
                                        <p className="text-muted-foreground">
                                          {shift.name}: {entry.shift_start} – {entry.shift_end}
                                        </p>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legenda do usuário */}
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="w-3 h-3" />
          <span>Seus plantões aparecem com borda branca destacada. Passe o mouse sobre um nome para ver detalhes.</span>
        </div>
      </div>
    </TooltipProvider>
  );
}
