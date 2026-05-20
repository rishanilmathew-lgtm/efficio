import  { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Play,
  Pause,
  RotateCcw,
  Timer,
  Clock3,
  Coffee,
  BookOpen,
  Moon,
  Sun,
  Save,
  Trash2,
  History,
  BarChart3,
  CalendarDays,
  Flame,
  Plus,
  FolderKanban,
  X,
} from "lucide-react";

type SubjectColor = "blue" | "green" | "pink" | "yellow" | "purple" | "orange";

type Subject = {
  id: string;
  name: string;
  color: SubjectColor;
  weeklyGoalHours: number;
};

type Project = {
  id: string;
  name: string;
  subjectId: string;
};

type SessionLog = {
  id: number;
  title: string;
  notes: string;
  duration: number;
  type: "study" | "break";
  completedAt: string;
  color: SubjectColor;
  subjectId: string;
  projectId?: string;
};

type ColorOption = {
  name: string;
  value: SubjectColor;
  dot: string;
  darkCard: string;
  lightCard: string;
  darkPicker: string;
  lightPicker: string;
};

type SubjectStat = Subject & {
  totalMinutes: number;
  weekMinutes: number;
  progressPercent: number;
};

const colorOptions: ColorOption[] = [
  {
    name: "Blue",
    value: "blue",
    dot: "bg-sky-400",
    darkCard: "bg-sky-500/15 border-sky-400/35",
    lightCard: "bg-sky-100 border-sky-300",
    darkPicker: "bg-sky-500/20 border-sky-400/50",
    lightPicker: "bg-sky-100 border-sky-300",
  },
  {
    name: "Green",
    value: "green",
    dot: "bg-emerald-400",
    darkCard: "bg-emerald-500/15 border-emerald-400/35",
    lightCard: "bg-emerald-100 border-emerald-300",
    darkPicker: "bg-emerald-500/20 border-emerald-400/50",
    lightPicker: "bg-emerald-100 border-emerald-300",
  },
  {
    name: "Pink",
    value: "pink",
    dot: "bg-pink-400",
    darkCard: "bg-pink-500/15 border-pink-400/35",
    lightCard: "bg-pink-100 border-pink-300",
    darkPicker: "bg-pink-500/20 border-pink-400/50",
    lightPicker: "bg-pink-100 border-pink-300",
  },
  {
    name: "Yellow",
    value: "yellow",
    dot: "bg-amber-400",
    darkCard: "bg-amber-500/15 border-amber-400/35",
    lightCard: "bg-amber-100 border-amber-300",
    darkPicker: "bg-amber-500/20 border-amber-400/50",
    lightPicker: "bg-amber-100 border-amber-300",
  },
  {
    name: "Purple",
    value: "purple",
    dot: "bg-violet-400",
    darkCard: "bg-violet-500/15 border-violet-400/35",
    lightCard: "bg-violet-100 border-violet-300",
    darkPicker: "bg-violet-500/20 border-violet-400/50",
    lightPicker: "bg-violet-100 border-violet-300",
  },
  {
    name: "Orange",
    value: "orange",
    dot: "bg-orange-400",
    darkCard: "bg-orange-500/15 border-orange-400/35",
    lightCard: "bg-orange-100 border-orange-300",
    darkPicker: "bg-orange-500/20 border-orange-400/50",
    lightPicker: "bg-orange-100 border-orange-300",
  },
];

const starterSubjects: Subject[] = [
  { id: "maths", name: "Maths", color: "blue", weeklyGoalHours: 6 },
  { id: "physics", name: "Physics", color: "green", weeklyGoalHours: 5 },
  { id: "english", name: "English", color: "purple", weeklyGoalHours: 4 },
];

function formatTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const hrs = Math.floor(safeSeconds / 3600);
  const mins = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;
  if (hrs > 0) return [hrs, mins, secs].map((v) => String(v).padStart(2, "0")).join(":");
  return [mins, secs].map((v) => String(v).padStart(2, "0")).join(":");
}

function formatHours(minutes: number) {
  return `${(minutes / 60).toFixed(1)}h`;
}

function getWeekKey(dateString: string) {
  const date = new Date(dateString);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

function formatWeekLabel(weekKey: string) {
  const start = new Date(`${weekKey}T00:00:00`);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
}

function getDayKey(dateString: string) {
  return new Date(dateString).toISOString().slice(0, 10);
}

function formatDayLabel(dayKey: string) {
  return new Date(`${dayKey}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function getLast14Days() {
  const days: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 13; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function getColorConfig(color: SubjectColor) {
  return colorOptions.find((option) => option.value === color) || colorOptions[0];
}

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function makeId(prefix: string, value: string) {
  return `${prefix}-${value.toLowerCase().trim().replace(/\s+/g, "-")}-${Date.now()}`;
}

export default function StudyTimerStopwatchApp() {
  const [mainTab, setMainTab] = useState("study");
  const [timerTab, setTimerTab] = useState("timer");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const [studyMinutes, setStudyMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [sessionsGoal, setSessionsGoal] = useState(4);

  const [mode, setMode] = useState<"study" | "break">("study");
  const [timeLeft, setTimeLeft] = useState(studyMinutes * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);

  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);

  const [sessionTitle, setSessionTitle] = useState("Maths revision");
  const [sessionNotes, setSessionNotes] = useState("Focus on algebra and past paper questions.");

  const [subjects, setSubjects] = useState<Subject[]>(starterSubjects);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(starterSubjects[0].id);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("none");
  const [savedSessions, setSavedSessions] = useState<SessionLog[]>([]);

  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectColor, setNewSubjectColor] = useState<SubjectColor>("blue");
  const [newSubjectGoal, setNewSubjectGoal] = useState(5);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectSubjectId, setNewProjectSubjectId] = useState<string>(starterSubjects[0].id);

  useEffect(() => {
    const storedSubjects = safeRead<Subject[]>("study-subjects", starterSubjects);
    const validSubjects = storedSubjects.length > 0 ? storedSubjects : starterSubjects;
    setSubjects(validSubjects);
    setSelectedSubjectId(validSubjects[0]?.id || "");
    setNewProjectSubjectId(validSubjects[0]?.id || "");
    setProjects(safeRead<Project[]>("study-projects", []));
    setSavedSessions(safeRead<SessionLog[]>("study-sessions-history", []));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("study-subjects", JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("study-projects", JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("study-sessions-history", JSON.stringify(savedSessions));
  }, [savedSessions]);

  const selectedSubject = useMemo(
    () => subjects.find((subject) => subject.id === selectedSubjectId) || null,
    [subjects, selectedSubjectId],
  );

  const filteredProjects = useMemo(
    () => projects.filter((project) => project.subjectId === selectedSubjectId),
    [projects, selectedSubjectId],
  );

  useEffect(() => {
    if (subjects.length === 0) {
      setSelectedSubjectId("");
      setSelectedProjectId("none");
      setNewProjectSubjectId("");
      return;
    }

    if (!subjects.some((subject) => subject.id === selectedSubjectId)) {
      setSelectedSubjectId(subjects[0].id);
      setSelectedProjectId("none");
    }

    if (!subjects.some((subject) => subject.id === newProjectSubjectId)) {
      setNewProjectSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId, newProjectSubjectId]);

  useEffect(() => {
    if (selectedProjectId === "none") return;
    const projectStillExists = projects.some(
      (project) => project.id === selectedProjectId && project.subjectId === selectedSubjectId,
    );
    if (!projectStillExists) setSelectedProjectId("none");
  }, [projects, selectedProjectId, selectedSubjectId]);

  useEffect(() => {
    if (!timerRunning) return;
    const interval = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (mode === "study" && selectedSubjectId) {
            setSavedSessions((prevLogs) => [
              {
                id: Date.now(),
                title: sessionTitle.trim() || `${selectedSubject?.name || "Study"} session`,
                notes: sessionNotes.trim() || "No notes added.",
                duration: studyMinutes * 60,
                type: "study",
                completedAt: new Date().toISOString(),
                color: selectedSubject?.color || "blue",
                subjectId: selectedSubjectId,
                projectId: selectedProjectId === "none" ? undefined : selectedProjectId,
              },
              ...prevLogs,
            ]);
            setCompletedSessions((count) => count + 1);
            setMode("break");
            return breakMinutes * 60;
          }
          setMode("study");
          return studyMinutes * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [
    timerRunning,
    mode,
    studyMinutes,
    breakMinutes,
    sessionTitle,
    sessionNotes,
    selectedSubject,
    selectedSubjectId,
    selectedProjectId,
  ]);

  useEffect(() => {
    if (timerRunning) return;
    setTimeLeft(mode === "study" ? studyMinutes * 60 : breakMinutes * 60);
  }, [studyMinutes, breakMinutes, mode, timerRunning]);

  useEffect(() => {
    if (!stopwatchRunning) return;
    const interval = window.setInterval(() => setStopwatchSeconds((prev) => prev + 1), 1000);
    return () => window.clearInterval(interval);
  }, [stopwatchRunning]);

  const totalDuration = mode === "study" ? studyMinutes * 60 : breakMinutes * 60;
  const progress = totalDuration > 0 ? ((totalDuration - timeLeft) / totalDuration) * 100 : 0;

  const motivationalText = useMemo(() => {
    if (completedSessions >= sessionsGoal) return "Daily goal completed.";
    if (timerRunning && mode === "study") return "Stay focused.";
    if (timerRunning && mode === "break") return "Take a proper break.";
    return "Ready when you are.";
  }, [completedSessions, sessionsGoal, timerRunning, mode]);

  const weeklyStats = useMemo(() => {
    const map = new Map<string, { minutes: number; sessions: number }>();
    savedSessions.forEach((session) => {
      if (session.type !== "study") return;
      const key = getWeekKey(session.completedAt);
      const current = map.get(key) || { minutes: 0, sessions: 0 };
      current.minutes += Math.floor(session.duration / 60);
      current.sessions += 1;
      map.set(key, current);
    });
    return Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([key, value]) => ({
        key,
        label: formatWeekLabel(key),
        minutes: value.minutes,
        sessions: value.sessions,
      }));
  }, [savedSessions]);

  const last14Days = useMemo(() => getLast14Days(), []);

  const dailyCalendar = useMemo(() => {
    const grouped = new Map<string, SessionLog[]>();
    last14Days.forEach((day) => grouped.set(day, []));
    savedSessions.forEach((session) => {
      if (session.type !== "study") return;
      const key = getDayKey(session.completedAt);
      if (!grouped.has(key)) return;
      grouped.set(key, [...(grouped.get(key) || []), session]);
    });
    return last14Days.map((day) => {
      const sessions = (grouped.get(day) || []).sort((a, b) => (a.completedAt < b.completedAt ? 1 : -1));
      const minutes = sessions.reduce((sum, session) => sum + Math.floor(session.duration / 60), 0);
      return { day, label: formatDayLabel(day), minutes, sessions };
    });
  }, [savedSessions, last14Days]);

  const currentWeekKey = useMemo(() => getWeekKey(new Date().toISOString()), []);

  const subjectStats = useMemo<SubjectStat[]>(() => {
    return subjects.map((subject) => {
      const sessions = savedSessions.filter(
        (session) => session.subjectId === subject.id && session.type === "study",
      );
      const totalMinutes = sessions.reduce((sum, session) => sum + Math.floor(session.duration / 60), 0);
      const weekMinutes = sessions
        .filter((session) => getWeekKey(session.completedAt) === currentWeekKey)
        .reduce((sum, session) => sum + Math.floor(session.duration / 60), 0);
      return {
        ...subject,
        totalMinutes,
        weekMinutes,
        progressPercent: Math.min((weekMinutes / (subject.weeklyGoalHours * 60)) * 100, 100),
      };
    });
  }, [subjects, savedSessions, currentWeekKey]);

  const streakDays = useMemo(() => {
    const studyDays = new Set(
      savedSessions
        .filter((session) => session.type === "study")
        .map((session) => getDayKey(session.completedAt)),
    );
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 365; i += 1) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);
      const key = day.toISOString().slice(0, 10);
      if (studyDays.has(key)) streak += 1;
      else break;
    }
    return streak;
  }, [savedSessions]);

  const maxWeekMinutes = Math.max(1, ...weeklyStats.map((week) => week.minutes));

  const handleTimerReset = () => {
    setTimerRunning(false);
    setMode("study");
    setTimeLeft(studyMinutes * 60);
    setCompletedSessions(0);
  };

  const saveCurrentSessionManually = () => {
    if (!selectedSubjectId) return;
    setSavedSessions((prevLogs) => [
      {
        id: Date.now(),
        title: sessionTitle.trim() || `${selectedSubject?.name || "Study"} session`,
        notes: sessionNotes.trim() || "No notes added.",
        duration: studyMinutes * 60,
        type: "study",
        completedAt: new Date().toISOString(),
        color: selectedSubject?.color || "blue",
        subjectId: selectedSubjectId,
        projectId: selectedProjectId === "none" ? undefined : selectedProjectId,
      },
      ...prevLogs,
    ]);
  };

  const addSubject = () => {
    const trimmedName = newSubjectName.trim();
    if (!trimmedName) return;
    const id = makeId("subject", trimmedName);
    const subject: Subject = {
      id,
      name: trimmedName,
      color: newSubjectColor,
      weeklyGoalHours: Math.max(1, newSubjectGoal),
    };
    setSubjects((prev) => [...prev, subject]);
    setSelectedSubjectId(id);
    setNewProjectSubjectId(id);
    setNewSubjectName("");
    setNewSubjectGoal(5);
    setNewSubjectColor("blue");
  };

  const addProject = () => {
    const trimmedName = newProjectName.trim();
    if (!trimmedName || !newProjectSubjectId) return;
    const project: Project = {
      id: makeId("project", trimmedName),
      name: trimmedName,
      subjectId: newProjectSubjectId,
    };
    setProjects((prev) => [...prev, project]);
    if (newProjectSubjectId === selectedSubjectId) setSelectedProjectId(project.id);
    setNewProjectName("");
  };

  const updateSubjectGoal = (subjectId: string, goal: number) => {
    setSubjects((prev) =>
      prev.map((subject) =>
        subject.id === subjectId ? { ...subject, weeklyGoalHours: Math.max(1, goal) } : subject,
      ),
    );
  };

  const deleteSubject = (subjectId: string, subjectName: string) => {
    if (!window.confirm(`Delete ${subjectName}? This will also delete its projects and saved sessions.`)) return;

    const remainingSubjects = subjects.filter((subject) => subject.id !== subjectId);
    setSubjects(remainingSubjects);
    setProjects((prev) => prev.filter((project) => project.subjectId !== subjectId));
    setSavedSessions((prev) => prev.filter((session) => session.subjectId !== subjectId));

    if (selectedSubjectId === subjectId) {
      setSelectedSubjectId(remainingSubjects[0]?.id || "");
      setSelectedProjectId("none");
    }

    if (newProjectSubjectId === subjectId) {
      setNewProjectSubjectId(remainingSubjects[0]?.id || "");
    }
  };

  const deleteProject = (projectId: string, projectName: string) => {
    if (!window.confirm(`Delete project ${projectName}?`)) return;
    setProjects((prev) => prev.filter((project) => project.id !== projectId));
    setSavedSessions((prev) =>
      prev.map((session) =>
        session.projectId === projectId ? { ...session, projectId: undefined } : session,
      ),
    );
    if (selectedProjectId === projectId) setSelectedProjectId("none");
  };

  const isDark = theme === "dark";
  const appBg = isDark ? "bg-neutral-800" : "bg-stone-100";
  const cardBg = isDark ? "bg-neutral-700" : "bg-stone-50";
  const panelBg = isDark ? "bg-neutral-900" : "bg-stone-100";
  const border = isDark ? "border-neutral-600" : "border-stone-300";
  const textMain = isDark ? "text-stone-100" : "text-neutral-700";
  const textSoft = isDark ? "text-stone-100" : "text-neutral-600";
  const textMuted = isDark ? "text-stone-200" : "text-neutral-500";
  const placeholderTone = isDark ? "placeholder:text-stone-300" : "placeholder:text-neutral-400";
  const primaryButton = isDark
    ? "bg-stone-100 text-neutral-800 hover:bg-stone-200"
    : "bg-neutral-700 text-white hover:bg-neutral-800";
  const secondaryButton = isDark
    ? "bg-neutral-600 text-stone-100 hover:bg-neutral-500"
    : "bg-stone-200 text-neutral-700 hover:bg-stone-300";
  const outlineButton = isDark
    ? "bg-transparent text-stone-100 hover:bg-neutral-800/40"
    : "bg-transparent text-neutral-700 hover:bg-stone-200/70";
  const pressable = "transition-all duration-150 active:scale-95 hover:scale-[1.01]";

  return (
    <div className={`min-h-screen ${appBg} ${textMain}`}>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge className={`mb-3 rounded-full px-3 py-1 text-sm ${isDark ? "bg-neutral-600 text-stone-100" : "bg-stone-200 text-neutral-700"}`}>
              Study Dashboard
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl text-inherit">
  Efficio : Study timer + planner
            </h1>
            <p className={`mt-3 max-w-2xl text-sm md:text-base ${textSoft}`}>
              Track subjects, projects, goals, study sessions, weekly hours, and calendar history.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))} className={`rounded-2xl px-5 py-5 ${pressable} ${primaryButton}`}>
              {isDark ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
              {isDark ? "Light mode" : "Dark mode"}
            </Button>
            <Button onClick={() => setMainTab("stats")} className={`rounded-2xl px-5 py-5 ${pressable} ${secondaryButton}`}>
              <CalendarDays className="mr-2 h-4 w-4" /> Open stats
            </Button>
          </div>
        </div>

        <Tabs value={mainTab} onValueChange={setMainTab} className="space-y-6">
          <TabsList className={`grid w-full grid-cols-3 rounded-2xl ${cardBg} ${border}`}>
            <TabsTrigger value="study" className={`rounded-xl ${pressable} ${isDark ? "text-stone-100" : "text-neutral-700"}`}>
              Study
            </TabsTrigger>
            <TabsTrigger value="subjects" className={`rounded-xl ${pressable} ${isDark ? "text-stone-100" : "text-neutral-700"}`}>
              Subjects
            </TabsTrigger>
            <TabsTrigger value="stats" className={`rounded-xl ${pressable} ${isDark ? "text-stone-100" : "text-neutral-700"}`}>
              Stats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="study" className="mt-0">
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-6">
                <Tabs value={timerTab} onValueChange={setTimerTab}>
                  <TabsList className={`grid w-full grid-cols-2 rounded-2xl ${cardBg} ${border}`}>
                    <TabsTrigger value="timer" className={`rounded-xl ${pressable} ${isDark ? "text-stone-100" : "text-neutral-700"}`}>
                      <Timer className="mr-2 h-4 w-4" /> Timer
                    </TabsTrigger>
                    <TabsTrigger value="stopwatch" className={`rounded-xl ${pressable} ${isDark ? "text-stone-100" : "text-neutral-700"}`}>
                      <Clock3 className="mr-2 h-4 w-4" /> Stopwatch
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="timer" className="mt-4">
                    <Card className={`rounded-[2rem] ${border} ${cardBg}`}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between text-xl text-inherit">
                          <span>Focus timer</span>
                          <Badge className={`rounded-full ${isDark ? "bg-neutral-600 text-stone-100" : "bg-stone-200 text-neutral-700"}`}>
                            {mode === "study" ? "Study block" : "Break block"}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={`mb-6 rounded-[2rem] border p-8 text-center ${border} ${panelBg}`}>
                          <p className={`mb-3 text-sm uppercase tracking-[0.3em] ${textSoft}`}>{motivationalText}</p>
                          <motion.div
                            key={`${mode}-${Math.floor(timeLeft / 60)}-${timeLeft % 60}`}
                            initial={{ opacity: 0.85, scale: 0.99 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-6xl font-semibold tracking-tight md:text-7xl text-inherit"
                          >
                            {formatTime(timeLeft)}
                          </motion.div>
                          <div className="mx-auto mt-6 max-w-xl">
                            <Progress value={progress} className="h-3 rounded-full" />
                          </div>
                        </div>

                        <div className="flex flex-wrap justify-center gap-3">
                          <Button onClick={() => setTimerRunning((prev) => !prev)} className={`rounded-2xl px-6 py-6 text-base ${pressable} ${primaryButton}`}>
                            {timerRunning ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                            {timerRunning ? "Pause" : "Start"}
                          </Button>
                          <Button onClick={handleTimerReset} className={`rounded-2xl px-6 py-6 text-base ${pressable} ${secondaryButton}`}>
                            <RotateCcw className="mr-2 h-4 w-4" /> Reset
                          </Button>
                          <Button
                            onClick={() => {
                              setTimerRunning(false);
                              if (mode === "study") {
                                setMode("break");
                                setTimeLeft(breakMinutes * 60);
                              } else {
                                setMode("study");
                                setTimeLeft(studyMinutes * 60);
                              }
                            }}
                            className={`rounded-2xl border px-6 py-6 text-base ${pressable} ${border} ${outlineButton}`}
                          >
                            {mode === "study" ? <Coffee className="mr-2 h-4 w-4" /> : <BookOpen className="mr-2 h-4 w-4" />}
                            Switch mode
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="stopwatch" className="mt-4">
                    <Card className={`rounded-[2rem] ${border} ${cardBg}`}>
                      <CardHeader>
                        <CardTitle className="text-xl text-inherit">Stopwatch</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={`mb-6 rounded-[2rem] border p-8 text-center ${border} ${panelBg}`}>
                          <p className={`mb-3 text-sm uppercase tracking-[0.3em] ${textSoft}`}>Track practice time</p>
                          <div className="text-6xl font-semibold tracking-tight md:text-7xl text-inherit">
                            {formatTime(stopwatchSeconds)}
                          </div>
                        </div>

                        <div className="mb-6 flex flex-wrap justify-center gap-3">
                          <Button onClick={() => setStopwatchRunning((prev) => !prev)} className={`rounded-2xl px-6 py-6 text-base ${pressable} ${primaryButton}`}>
                            {stopwatchRunning ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                            {stopwatchRunning ? "Pause" : "Start"}
                          </Button>
                          <Button
                            onClick={() => {
                              setStopwatchRunning(false);
                              setStopwatchSeconds(0);
                              setLaps([]);
                            }}
                            className={`rounded-2xl px-6 py-6 text-base ${pressable} ${secondaryButton}`}
                          >
                            <RotateCcw className="mr-2 h-4 w-4" /> Reset
                          </Button>
                          <Button onClick={() => setLaps((prev) => [stopwatchSeconds, ...prev])} className={`rounded-2xl border px-6 py-6 text-base ${pressable} ${border} ${outlineButton}`}>
                            Save lap
                          </Button>
                        </div>

                        <div className="space-y-3">
                          {laps.length === 0 ? (
                            <div className={`rounded-2xl border border-dashed p-4 text-sm ${border} ${textSoft}`}>
                              No laps saved yet.
                            </div>
                          ) : (
                            laps.map((lap, index) => (
                              <div key={`${lap}-${index}`} className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${border} ${panelBg}`}>
                                <span className={`text-sm ${textSoft}`}>Lap {laps.length - index}</span>
                                <span className="font-medium text-inherit">{formatTime(lap)}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                <Card className={`rounded-[2rem] ${border} ${cardBg}`}>
                  <CardHeader>
                    <CardTitle className="text-xl text-inherit">Current study setup</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className={`mb-2 block text-sm ${textSoft}`}>Subject</label>
                        <Select
                          value={selectedSubjectId || undefined}
                          onValueChange={(value) => {
                            setSelectedSubjectId(value);
                            setSelectedProjectId("none");
                          }}
                        >
                          <SelectTrigger className={`rounded-2xl border ${border} ${panelBg} ${textMain}`}>
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {subjects.map((subject) => (
                              <SelectItem key={subject.id} value={subject.id}>
                                {subject.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className={`mb-2 block text-sm ${textSoft}`}>Project</label>
                        <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                          <SelectTrigger className={`rounded-2xl border ${border} ${panelBg} ${textMain}`}>
                            <SelectValue placeholder="Select project" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No project</SelectItem>
                            {filteredProjects.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className={`mb-2 block text-sm ${textSoft}`}>Session title</label>
                      <Input
                        value={sessionTitle}
                        onChange={(e) => setSessionTitle(e.target.value)}
                        placeholder="What are you studying?"
                        className={`rounded-2xl border ${border} ${panelBg} ${textMain} ${placeholderTone}`}
                      />
                    </div>

                    <div>
                      <label className={`mb-2 block text-sm ${textSoft}`}>Study notes</label>
                      <Textarea
                        value={sessionNotes}
                        onChange={(e) => setSessionNotes(e.target.value)}
                        placeholder="Write what you want to cover in this session"
                        className={`min-h-[120px] rounded-2xl border ${border} ${panelBg} ${textMain} ${placeholderTone}`}
                      />
                    </div>

                    <div>
                      <div className={`mb-3 flex items-center justify-between text-sm ${textMain}`}>
                        <span>Study minutes</span>
                        <span className={textSoft}>{studyMinutes} min</span>
                      </div>
                      <Slider value={[studyMinutes]} min={10} max={180} step={5} onValueChange={(v) => setStudyMinutes(v[0])} />
                    </div>

                    <div>
                      <div className={`mb-3 flex items-center justify-between text-sm ${textMain}`}>
                        <span>Break minutes</span>
                        <span className={textSoft}>{breakMinutes} min</span>
                      </div>
                      <Slider value={[breakMinutes]} min={5} max={45} step={5} onValueChange={(v) => setBreakMinutes(v[0])} />
                    </div>

                    <div>
                      <div className={`mb-3 flex items-center justify-between text-sm ${textMain}`}>
                        <span>Daily session goal</span>
                        <span className={textSoft}>{sessionsGoal}</span>
                      </div>
                      <Slider value={[sessionsGoal]} min={1} max={12} step={1} onValueChange={(v) => setSessionsGoal(v[0])} />
                    </div>

                    <Button disabled={!selectedSubjectId} onClick={saveCurrentSessionManually} className={`w-full rounded-2xl py-6 text-base ${pressable} ${primaryButton}`}>
                      <Save className="mr-2 h-4 w-4" /> Save study session
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className={`rounded-[2rem] ${border} ${cardBg}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl text-inherit">
                      <Flame className="h-5 w-5" /> Study streak
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`rounded-2xl border p-4 ${border} ${panelBg}`}>
                      <p className={`text-sm ${textSoft}`}>Current streak</p>
                      <p className="mt-2 text-3xl font-semibold text-inherit">
                        {streakDays} day{streakDays === 1 ? "" : "s"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className={`rounded-[2rem] ${border} ${cardBg}`}>
                  <CardHeader>
                    <CardTitle className="text-xl text-inherit">This week by subject</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {subjectStats.map((subject) => {
                      const config = getColorConfig(subject.color);
                      return (
                        <div key={subject.id} className={`rounded-2xl border p-4 ${isDark ? config.darkCard : config.lightCard}`}>
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className={`h-3 w-3 rounded-full ${config.dot}`} />
                              <p className="font-medium text-inherit">{subject.name}</p>
                            </div>
                            <span className="text-sm text-inherit">
                              {formatHours(subject.weekMinutes)} / {subject.weeklyGoalHours}h
                            </span>
                          </div>
                          <Progress value={subject.progressPercent} className="h-2 rounded-full" />
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="subjects" className="mt-0">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className={`rounded-[2rem] ${border} ${cardBg}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl text-inherit">
                    <Plus className="h-5 w-5" /> Add subject
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <label className={`mb-2 block text-sm ${textSoft}`}>Subject name</label>
                    <Input
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                      placeholder="e.g. Chemistry"
                      className={`rounded-2xl border ${border} ${panelBg} ${textMain} ${placeholderTone}`}
                    />
                  </div>
                  <div>
                    <label className={`mb-2 block text-sm ${textSoft}`}>Weekly goal in hours</label>
                    <Input
                      type="number"
                      value={newSubjectGoal}
                      onChange={(e) => setNewSubjectGoal(Math.max(1, Number(e.target.value) || 1))}
                      className={`rounded-2xl border ${border} ${panelBg} ${textMain} ${placeholderTone}`}
                    />
                  </div>
                  <div>
                    <label className={`mb-2 block text-sm ${textSoft}`}>Colour</label>
                    <div className="grid grid-cols-3 gap-3">
                      {colorOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setNewSubjectColor(option.value)}
                          className={`rounded-2xl border px-4 py-3 text-sm font-medium ${pressable} ${isDark ? option.darkPicker : option.lightPicker} ${newSubjectColor === option.value ? "ring-2 ring-white/70" : ""}`}
                        >
                          <div className="flex items-center justify-center gap-2 text-inherit">
                            <span className={`h-3 w-3 rounded-full ${option.dot}`} />
                            <span>{option.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button onClick={addSubject} className={`w-full rounded-2xl py-6 text-base ${pressable} ${primaryButton}`}>
                    <Plus className="mr-2 h-4 w-4" /> Create subject
                  </Button>
                </CardContent>
              </Card>

              <Card className={`rounded-[2rem] ${border} ${cardBg}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl text-inherit">
                    <FolderKanban className="h-5 w-5" /> Add project
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <label className={`mb-2 block text-sm ${textSoft}`}>Project name</label>
                    <Input
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="e.g. Mechanics revision"
                      className={`rounded-2xl border ${border} ${panelBg} ${textMain} ${placeholderTone}`}
                    />
                  </div>
                  <div>
                    <label className={`mb-2 block text-sm ${textSoft}`}>Subject</label>
                    <Select value={newProjectSubjectId || undefined} onValueChange={setNewProjectSubjectId}>
                      <SelectTrigger className={`rounded-2xl border ${border} ${panelBg} ${textMain}`}>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button disabled={!newProjectSubjectId} onClick={addProject} className={`w-full rounded-2xl py-6 text-base ${pressable} ${primaryButton}`}>
                    <Plus className="mr-2 h-4 w-4" /> Create project
                  </Button>
                </CardContent>
              </Card>

              <Card className={`rounded-[2rem] ${border} ${cardBg} lg:col-span-2`}>
                <CardHeader>
                  <CardTitle className="text-xl text-inherit">Subjects and goals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {subjectStats.map((subject) => {
                    const config = getColorConfig(subject.color);
                    const subjectProjects = projects.filter((project) => project.subjectId === subject.id);
                    return (
                      <div key={subject.id} className={`group relative rounded-2xl border p-4 ${isDark ? config.darkCard : config.lightCard}`}>
                        <button
                          type="button"
                          onClick={() => deleteSubject(subject.id, subject.name)}
                          className="absolute right-3 top-3 rounded-full bg-red-500 p-1 text-white opacity-0 transition group-hover:opacity-100"
                          aria-label={`Delete ${subject.name}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>

                        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 pr-8">
                          <div className="flex items-center gap-2">
                            <span className={`h-3 w-3 rounded-full ${config.dot}`} />
                            <p className="font-medium text-inherit">{subject.name}</p>
                          </div>
                          <div className="text-sm text-inherit">Weekly goal: {subject.weeklyGoalHours}h</div>
                        </div>

                        <div className="mb-3 flex items-center gap-3">
                          <Input
                            type="number"
                            value={subject.weeklyGoalHours}
                            onChange={(e) => updateSubjectGoal(subject.id, Math.max(1, Number(e.target.value) || 1))}
                            className={`max-w-[140px] rounded-2xl border ${border} ${panelBg} ${textMain}`}
                          />
                          <span className={`text-sm ${textSoft}`}>hours per week</span>
                        </div>

                        <Progress value={subject.progressPercent} className="mb-3 h-2 rounded-full" />
                        <div className={`text-sm ${textSoft}`}>{formatHours(subject.weekMinutes)} this week • {formatHours(subject.totalMinutes)} total</div>

                        {subjectProjects.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {subjectProjects.map((project) => (
                              <div key={project.id} className={`group/project flex items-center justify-between rounded-xl border px-3 py-2 ${border} ${panelBg}`}>
                                <span className="text-sm text-inherit">{project.name}</span>
                                <button
                                  type="button"
                                  onClick={() => deleteProject(project.id, project.name)}
                                  className="rounded-full bg-red-500 p-1 text-white opacity-0 transition group-hover/project:opacity-100"
                                  aria-label={`Delete ${project.name}`}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="stats" className="mt-0">
            <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-6">
                <Card className={`rounded-[2rem] ${border} ${cardBg}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl text-inherit">
                      <BarChart3 className="h-5 w-5" /> Weekly hours
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {weeklyStats.length === 0 ? (
                      <div className={`rounded-2xl border border-dashed p-4 text-sm ${border} ${textSoft}`}>
                        No weekly data yet.
                      </div>
                    ) : (
                      weeklyStats.slice(0, 10).map((week) => (
                        <div key={week.key} className={`rounded-2xl border p-4 ${border} ${panelBg}`}>
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium text-inherit">{week.label}</p>
                              <p className={`text-xs ${textMuted}`}>{week.sessions} session{week.sessions === 1 ? "" : "s"}</p>
                            </div>
                            <span className="font-medium text-inherit">{formatHours(week.minutes)}</span>
                          </div>
                          <Progress value={(week.minutes / maxWeekMinutes) * 100} className="h-2 rounded-full" />
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card className={`rounded-[2rem] ${border} ${cardBg}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl text-inherit">
                      <Flame className="h-5 w-5" /> Streak and overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className={`rounded-2xl border p-4 ${border} ${panelBg}`}>
                      <p className={`text-sm ${textSoft}`}>Current streak</p>
                      <p className="mt-2 text-3xl font-semibold text-inherit">
                        {streakDays} day{streakDays === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className={`rounded-2xl border p-4 ${border} ${panelBg}`}>
                      <p className={`text-sm ${textSoft}`}>Subject weekly progress</p>
                      <div className="mt-3 space-y-3">
                        {subjectStats.map((subject) => {
                          const config = getColorConfig(subject.color);
                          return (
                            <div key={subject.id}>
                              <div className="mb-1 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <span className={`h-3 w-3 rounded-full ${config.dot}`} />
                                  <span className="text-sm text-inherit">{subject.name}</span>
                                </div>
                                <span className={`text-xs ${textMuted}`}>{formatHours(subject.weekMinutes)} / {subject.weeklyGoalHours}h</span>
                              </div>
                              <Progress value={subject.progressPercent} className="h-2 rounded-full" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className={`rounded-[2rem] ${border} ${cardBg}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl text-inherit">
                      <CalendarDays className="h-5 w-5" /> Calendar view
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {dailyCalendar.map((day) => (
                      <div key={day.day} className={`rounded-2xl border p-4 ${border} ${panelBg}`}>
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-inherit">{day.label}</p>
                            <p className={`text-xs ${textMuted}`}>{day.sessions.length} session{day.sessions.length === 1 ? "" : "s"}</p>
                          </div>
                          <span className="font-medium text-inherit">{formatHours(day.minutes)}</span>
                        </div>

                        {day.sessions.length === 0 ? (
                          <div className={`rounded-xl border border-dashed p-3 text-sm ${border} ${textSoft}`}>
                            No study logged.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {day.sessions.map((session) => {
                              const config = getColorConfig(session.color);
                              const subject = subjects.find((s) => s.id === session.subjectId);
                              const project = projects.find((p) => p.id === session.projectId);
                              return (
                                <div key={session.id} className={`rounded-xl border p-3 ${isDark ? config.darkCard : config.lightCard}`}>
                                  <div className="mb-1 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                      <span className={`h-3 w-3 rounded-full ${config.dot}`} />
                                      <p className="font-medium text-inherit">{session.title}</p>
                                    </div>
                                    <span className={`text-xs ${textMuted}`}>{Math.floor(session.duration / 60)} min</span>
                                  </div>
                                  <div className={`mb-1 text-sm ${textSoft}`}>
                                    {subject?.name || "Subject"}
                                    {project ? ` • ${project.name}` : ""}
                                  </div>
                                  <p className={`text-sm ${textSoft}`}>{session.notes}</p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className={`rounded-[2rem] ${border} ${cardBg}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl text-inherit">
                      <History className="h-5 w-5" /> All past sessions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {savedSessions.length === 0 ? (
                      <div className={`rounded-2xl border border-dashed p-4 text-sm ${border} ${textSoft}`}>
                        No study sessions saved yet.
                      </div>
                    ) : (
                      savedSessions.map((session) => {
                        const config = getColorConfig(session.color);
                        const subject = subjects.find((s) => s.id === session.subjectId);
                        const project = projects.find((p) => p.id === session.projectId);
                        return (
                          <div key={session.id} className={`rounded-2xl border p-4 ${isDark ? config.darkCard : config.lightCard}`}>
                            <div className="mb-2 flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={`h-3 w-3 rounded-full ${config.dot}`} />
                                  <p className="font-medium text-inherit">{session.title}</p>
                                </div>
                                <p className={`mt-1 text-xs ${textMuted}`}>{new Date(session.completedAt).toLocaleString()}</p>
                              </div>
                              <Button onClick={() => setSavedSessions((prev) => prev.filter((item) => item.id !== session.id))} className={`rounded-xl px-3 py-2 text-sm ${pressable} ${secondaryButton}`}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className={`mb-1 text-sm ${textSoft}`}>
                              {subject?.name || "Subject"}
                              {project ? ` • ${project.name}` : ""}
                            </p>
                            <p className={`mb-2 text-sm ${textSoft}`}>{session.notes}</p>
                            <div className={`flex items-center gap-2 text-xs ${textMuted}`}>
                              <span>{Math.floor(session.duration / 60)} min</span>
                              <span>•</span>
                              <span className="capitalize">{session.color}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
<footer className="text-center text-sm text-gray-400 mt-10 pb-4">
  Contact us: efficioweb@outlook.com
</footer>
    </div>
  );
}
