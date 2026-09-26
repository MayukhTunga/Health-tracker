"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";
import { useRouter, useSearchParams } from "next/navigation";

export function WeeklyCalendar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlDate = searchParams.get("date");
  
  const [selectedDate, setSelectedDate] = useState(() => {
    if (urlDate) {
      const d = new Date(urlDate);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  });

  useEffect(() => {
    if (urlDate) {
      const d = new Date(urlDate);
      if (!isNaN(d.getTime())) setSelectedDate(d);
    } else {
      setSelectedDate(new Date());
    }
  }, [urlDate]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    // Use local time for YYYY-MM-DD
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    router.push(`/?date=${yyyy}-${mm}-${dd}`);
  };

  const handleWeekShift = (daysToShift: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + daysToShift);
    handleDateSelect(newDate);
  };
  
  // Simple mock to generate days around the selected date
  const generateDays = (centerDate: Date) => {
    const days = [];
    for (let i = -3; i <= 3; i++) {
      const d = new Date(centerDate);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const days = generateDays(selectedDate);
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="w-full bg-card border-y border-border/50 py-3 shadow-sm">
      <div className="flex items-center justify-between px-4 mb-3">
        <h3 className="font-bold text-foreground capitalize">
          {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => handleWeekShift(-7)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => handleWeekShift(7)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex justify-between px-2">
        {days.map((date, i) => {
          const isSelected = date.toDateString() === selectedDate.toDateString();
          const isToday = date.toDateString() === new Date().toDateString();
          
          return (
            <div 
              key={i} 
              onClick={() => handleDateSelect(date)}
              className={`flex flex-col items-center justify-center w-10 h-14 rounded-2xl cursor-pointer transition-all ${
                isSelected 
                  ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(34,197,94,0.4)]" 
                  : "hover:bg-muted/50 text-muted-foreground"
              }`}
            >
              <span className={`text-[10px] font-bold uppercase mb-1 ${isSelected ? "text-primary-foreground/80" : ""}`}>
                {weekdays[date.getDay()]}
              </span>
              <span className={`text-sm font-black ${isToday && !isSelected ? "text-primary" : ""}`}>
                {date.getDate()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
