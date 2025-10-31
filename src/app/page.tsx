'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CalendarIcon, MessageSquare, BookOpen, FileText, Images, Book, Trophy, User, ChevronLeft, ChevronRight, Phone, Mail, Calculator, Users, Settings, LogOut } from 'lucide-react';
import { AuthModal } from '@/components/auth/auth-modal';
import { UserManagement } from '@/components/admin/user-management';
import { AuthProvider, useAuth } from '@/hooks/use-auth';

interface Event {
  title: string;
  type: 'school' | 'birthday' | 'deadline';
  date: string;
}

interface NewsItem {
  id: number;
  title: string;
  content: string;
  date: string;
}

interface FileItem {
  id: number;
  name: string;
  type: 'pdf' | 'docx' | 'zip' | 'xlsx';
  size: string;
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  date: string;
}

interface Contact {
  id: number;
  type: 'teacher' | 'student';
  fullName: string;
  phone: string;
  birthDate: string;
  photo?: string;
  role?: string;
}

function ClassWebsiteContent() {
  const [activeTab, setActiveTab] = useState('news');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date(2025, 5, 15));
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'year'>('year');
  const [today, setToday] = useState(new Date(2025, 5, 15));
  const [phone, setPhone] = useState('');
  const { user, login, register, logout, loading, hasPermission } = useAuth();

  useEffect(() => {
    const now = new Date();
    setCurrentDate(now);
    setToday(now);
  }, []);

  // Mock data for messages
  const [messages, setMessages] = useState<{ [key: string]: Array<{ text: string; sent: boolean }> }>({
    teacher: [
      { text: 'Привет! Как дела?', sent: false },
      { text: 'Все хорошо, спасибо!', sent: true },
    ],
    students: [
      { text: 'Кто сделал домашку по математике?', sent: false },
      { text: 'Я уже сдала!', sent: true },
    ],
  });

  // Helper function to get date string with day offset
  const getDateString = (baseDate: Date, day: number) => {
    const date = new Date(baseDate);
    date.setDate(day);
    return date.toISOString().split('T')[0];
  };

  // Mock data with dynamic dates
  const events: Event[] = [
    { title: 'Экскурсия в музей', type: 'school', date: getDateString(new Date(), 5) },
    { title: 'Олимпиада по математике', type: 'school', date: getDateString(new Date(), 10) },
    { title: 'Родительское собрание', type: 'school', date: getDateString(new Date(), 15) },
    { title: 'Родительское собрание', type: 'school', date: getDateString(new Date(), 20) },
    { title: 'День рождения Сидорова А.', type: 'birthday', date: getDateString(new Date(), 28) },
    { title: 'Срок сдачи проекта', type: 'deadline', date: getDateString(new Date(), 31) },
  ];

  // Helper function to format date for news
  const formatDateForNews = (date: Date) => {
    const day = date.getDate();
    const monthNames = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                       'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    return `${day} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  };

  const newsItems: NewsItem[] = [
    {
      id: 1,
      title: 'Родительское собрание',
      content: 'Собрание состоится 20 января в 18:00 в кабинете 215. Обсудим итоги полугодия и планы на второе полугодие.',
      date: formatDateForNews(new Date()),
    },
    {
      id: 2,
      title: 'Олимпиада по математике',
      content: 'Поздравляем победителей школьной олимпиады! Иванов Иван занял 1 место, Петрова Мария - 2 место.',
      date: formatDateForNews(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
    },
    {
      id: 3,
      title: 'Экскурсия в музей',
      content: 'Список участников и сбор в 9:00 у школы. Не забудьте взять с собой бутерброды и воду!',
      date: formatDateForNews(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)),
    },
  ];

  const knowledgeItems = [
    { id: 1, title: 'Математика', icon: Calculator, count: 12 },
    { id: 2, title: 'Русский язык', icon: FileText, count: 8 },
    { id: 3, title: 'Литература', icon: BookOpen, count: 15 },
    { id: 4, title: 'История', icon: Book, count: 10 },
  ];

  const fileItems: FileItem[] = [
    { id: 1, name: 'Расписание.pdf', type: 'pdf', size: '245 KB' },
    { id: 2, name: 'Методичка_математика.docx', type: 'docx', size: '1.2 MB' },
    { id: 3, name: 'Фото_экскурсии.zip', type: 'zip', size: '15.4 MB' },
    { id: 4, name: 'Список_участников.xlsx', type: 'xlsx', size: '89 KB' },
  ];

  const galleryItems = [
    'Экскурсия в музей',
    'Новогодний праздник',
    'Учебный проект',
    'Спортивные соревнования',
    'Классный час',
    'Выставка работ',
  ];

  const achievements: Achievement[] = [
    {
      id: 1,
      title: 'Олимпиада по математике',
      description: '2 место в районе',
      date: formatDateForNews(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
    },
    {
      id: 2,
      title: 'Спортивные соревнования',
      description: 'Победители в эстафете',
      date: formatDateForNews(new Date(Date.now() - 35 * 24 * 60 * 60 * 1000)),
    },
  ];

  const contacts: Contact[] = [
    {
      id: 1,
      type: 'teacher',
      fullName: 'Петрова Елена Ивановна',
      phone: '+7 (912) 345-67-89',
      birthDate: '15.03.1985',
      role: 'Классный руководитель',
    },
    {
      id: 2,
      type: 'student',
      fullName: 'Иванов Иван Алексеевич',
      phone: '+7 (912) 234-56-78',
      birthDate: '12.05.2013',
    },
    {
      id: 3,
      type: 'student',
      fullName: 'Петрова Мария Сергеевна',
      phone: '+7 (912) 345-67-89',
      birthDate: '28.01.2013',
    },
    {
      id: 4,
      type: 'student',
      fullName: 'Сидоров Артем Дмитриевич',
      phone: '+7 (912) 456-78-90',
      birthDate: '15.07.2013',
    },
    {
      id: 5,
      type: 'student',
      fullName: 'Козлова Анна Владимировна',
      phone: '+7 (912) 567-89-01',
      birthDate: '03.09.2013',
    },
    {
      id: 6,
      type: 'student',
      fullName: 'Смирнов Максим Игоревич',
      phone: '+7 (912) 678-90-12',
      birthDate: '22.11.2013',
    },
  ];

  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateString);
  };

  const formatPhone = (value: string) => {
    let digits = value.replace(/\D/g, '');
    if (digits.startsWith('8')) digits = '7' + digits.substring(1);
    if (!digits.startsWith('7')) digits = '7' + digits;
    
    let formatted = '+7 ';
    if (digits.length > 1) formatted += digits.substring(1, 4);
    if (digits.length > 4) formatted += ' ' + digits.substring(4, 7);
    if (digits.length > 7) formatted += '-' + digits.substring(7, 9);
    if (digits.length > 9) formatted += '-' + digits.substring(9, 11);
    
    return formatted.substring(0, 18);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const sendMessage = (chatType: string, text: string) => {
    if (text.trim()) {
      setMessages(prev => ({
        ...prev,
        [chatType]: [...(prev[chatType] || []), { text, sent: true }],
      }));
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'birthday': return 'bg-pink-500';
      case 'deadline': return 'bg-red-500';
      default: return 'bg-amber-500';
    }
  };

  const renderMiniCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay() || 7;
    
    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                       'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{monthNames[month]} {year}</CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground mb-2">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
              <div key={day}>{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startDay - 1 }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const date = new Date(year, month, day);
              const dayEvents = getEventsForDate(date);
              const isToday = date.toDateString() === today.toDateString();
              
              return (
                <button
                  key={day}
                  onClick={() => {
                    setActiveTab('calendar');
                    setCalendarView('month');
                  }}
                  className={`
                    aspect-square rounded-md text-sm font-medium transition-all
                    ${isToday ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
                    ${dayEvents.length > 0 && !isToday ? getEventColor(dayEvents[0].type) + ' text-white' : ''}
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded bg-amber-500" />
              <span>Мероприятия</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded bg-pink-500" />
              <span>Дни рождения</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span>Дедлайны</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderFullCalendar = () => {
    if (calendarView === 'year') {
      return renderYearCalendar();
    } else if (calendarView === 'month') {
      return renderMonthCalendar();
    } else {
      return renderWeekCalendar();
    }
  };

  const renderYearCalendar = () => {
    const year = currentDate.getFullYear();
    const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
                       'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, monthIndex) => {
          const firstDay = new Date(year, monthIndex, 1);
          const lastDay = new Date(year, monthIndex + 1, 0);
          const daysInMonth = lastDay.getDate();
          const startDay = firstDay.getDay() || 7;
          
          return (
            <Card key={monthIndex} className="p-3">
              <h3 className="font-semibold text-center mb-2">{monthNames[monthIndex]}</h3>
              <div className="grid grid-cols-7 gap-1 text-xs">
                {Array.from({ length: startDay - 1 }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, dayIndex) => {
                  const day = dayIndex + 1;
                  const date = new Date(year, monthIndex, day);
                  const dayEvents = getEventsForDate(date);
                  const isToday = date.toDateString() === today.toDateString();
                  
                  return (
                    <button
                      key={day}
                      className={`
                        aspect-square rounded text-xs transition-all
                        ${isToday ? 'bg-primary text-primary-foreground font-bold' : 'hover:bg-muted'}
                        ${dayEvents.length > 0 && !isToday ? getEventColor(dayEvents[0].type) + ' text-white' : ''}
                      `}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderMonthCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay() || 7;
    
    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                       'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    
    return (
      <div className="grid grid-cols-7 gap-1">
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
          <div key={day} className="p-2 text-center font-semibold text-muted-foreground bg-muted rounded">
            {day}
          </div>
        ))}
        {Array.from({ length: startDay - 1 }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[100px] p-2 border rounded" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const date = new Date(year, month, day);
          const dayEvents = getEventsForDate(date);
          const isToday = date.toDateString() === today.toDateString();
          
          return (
            <div
              key={day}
              className={`
                min-h-[100px] p-2 border rounded transition-all
                ${isToday ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'}
              `}
            >
              <div className="font-semibold mb-1">{day}</div>
              <div className="space-y-1">
                {dayEvents.map((event, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className={`text-xs w-full justify-start ${getEventColor(event.type)} text-white`}
                  >
                    {event.title}
                  </Badge>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const day = currentDate.getDate();
    const currentDayOfWeek = currentDate.getDay() || 7;
    const weekStart = new Date(year, month, day - currentDayOfWeek + 1);
    
    const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const monthNames = ['Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня',
                       'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря'];
    
    // Временные слоты с шагом в 2 часа
    const timeSlots = ['8:00', '10:00', '12:00', '14:00', '16:00', '18:00'];
    
    // Функция для получения событий для конкретного временного слота
    const getEventsForTimeSlot = (date: Date, timeSlotIndex: number) => {
      const dayEvents = getEventsForDate(date);
      // Для демо распределяем события по временным слотам
      if (dayEvents.length === 0) return [];
      
      return dayEvents.filter((_, index) => {
        // Распределяем события по слотам: первое событие в слот 1, второе в слот 3 и т.д.
        const eventSlotIndex = Math.floor(index / 2);
        return eventSlotIndex === timeSlotIndex;
      });
    };
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-8 gap-1">
          <div className="p-2" />
          {weekdays.map((weekday, index) => {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + index);
            const dayEvents = getEventsForDate(date);
            const isToday = date.toDateString() === today.toDateString();
            
            return (
              <div
                key={weekday}
                className={`
                  p-2 text-center rounded border
                  ${isToday ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50'}
                `}
              >
                <div className="font-semibold">{weekday}</div>
                <div className="text-sm">{date.getDate()} {monthNames[date.getMonth()]}</div>
              </div>
            );
          })}
        </div>
        
        <div className="grid grid-cols-8 gap-1">
          <div className="space-y-2">
            {timeSlots.map(time => (
              <div key={time} className="text-sm text-muted-foreground p-2 text-right border-r pr-3">
                {time}
              </div>
            ))}
          </div>
          {Array.from({ length: 7 }).map((_, dayIndex) => {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + dayIndex);
            
            return (
              <div key={dayIndex} className="space-y-1">
                {timeSlots.map((_, timeIndex) => {
                  const slotEvents = getEventsForTimeSlot(date, timeIndex);
                  
                  return (
                    <div key={timeIndex} className="min-h-[60px] border rounded p-1 relative overflow-hidden">
                      {slotEvents.map((event, eventIndex) => (
                        <div
                          key={eventIndex}
                          className={`
                            text-xs p-1 rounded mb-1 truncate block
                            ${getEventColor(event.type)} text-white
                          `}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 font-bold text-xl">5Б</div>
              <h1 className="text-xl sm:text-2xl font-bold">Классный сайт 5 "Б"</h1>
            </div>
            <div className="flex items-center gap-3">
              {loading ? (
                <div className="text-sm">Загрузка...</div>
              ) : user ? (
                <>
                  <div className="text-sm">
                    <div className="font-medium">{user.fullName}</div>
                    <div className="text-xs opacity-75">{user.role}</div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={logout}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsAuthModalOpen(true)}>
                  Войти
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white shadow-sm sticky top-16 z-40">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto py-2 gap-1 scrollbar-hide">
            <Button
              variant={activeTab === 'news' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('news')}
              className="flex-shrink-0 flex flex-col items-center gap-1 h-auto py-2 px-3"
            >
              <CalendarIcon className="h-4 w-4" />
              <span className="text-xs">Новости</span>
            </Button>
            <Button
              variant={activeTab === 'calendar' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('calendar')}
              className="flex-shrink-0 flex flex-col items-center gap-1 h-auto py-2 px-3"
            >
              <CalendarIcon className="h-4 w-4" />
              <span className="text-xs">Календарь</span>
            </Button>
            <Button
              variant={activeTab === 'class' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('class')}
              className="flex-shrink-0 flex flex-col items-center gap-1 h-auto py-2 px-3"
            >
              <Users className="h-4 w-4" />
              <span className="text-xs">Мой класс</span>
            </Button>
            <Button
              variant={activeTab === 'chat' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('chat')}
              className="flex-shrink-0 flex flex-col items-center gap-1 h-auto py-2 px-3"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="text-xs">Чаты</span>
            </Button>
            <Button
              variant={activeTab === 'knowledge' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('knowledge')}
              className="flex-shrink-0 flex flex-col items-center gap-1 h-auto py-2 px-3"
            >
              <BookOpen className="h-4 w-4" />
              <span className="text-xs">База знаний</span>
            </Button>
            <Button
              variant={activeTab === 'files' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('files')}
              className="flex-shrink-0 flex flex-col items-center gap-1 h-auto py-2 px-3"
            >
              <FileText className="h-4 w-4" />
              <span className="text-xs">Файлы</span>
            </Button>
            <Button
              variant={activeTab === 'gallery' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('gallery')}
              className="flex-shrink-0 flex flex-col items-center gap-1 h-auto py-2 px-3"
            >
              <Images className="h-4 w-4" />
              <span className="text-xs">Галерея</span>
            </Button>
            <Button
              variant={activeTab === 'diary' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('diary')}
              className="flex-shrink-0 flex flex-col items-center gap-1 h-auto py-2 px-3"
            >
              <Book className="h-4 w-4" />
              <span className="text-xs">Дневник</span>
            </Button>
            <Button
              variant={activeTab === 'achievements' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('achievements')}
              className="flex-shrink-0 flex flex-col items-center gap-1 h-auto py-2 px-3"
            >
              <Trophy className="h-4 w-4" />
              <span className="text-xs">Достижения</span>
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="news" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <CalendarIcon className="h-6 w-6 text-indigo-600" />
                  Новости и события
                </h2>
                <div className="space-y-4">
                  {newsItems.map((item) => (
                    <Card key={item.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle>{item.title}</CardTitle>
                          <Badge variant="secondary">{item.date}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{item.content}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              <div>
                {renderMiniCalendar()}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Календарь событий</h2>
              <div className="flex gap-2">
                <Button
                  variant={calendarView === 'year' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCalendarView('year')}
                >
                  Год
                </Button>
                <Button
                  variant={calendarView === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCalendarView('month')}
                >
                  Месяц
                </Button>
                <Button
                  variant={calendarView === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCalendarView('week')}
                >
                  Неделя
                </Button>
              </div>
            </div>
            {renderFullCalendar()}
          </TabsContent>

          <TabsContent value="class" className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6 text-indigo-600" />
              Мой класс
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contacts.map((contact) => (
                <Card key={contact.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {contact.fullName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{contact.fullName}</CardTitle>
                        {contact.role && (
                          <Badge variant="secondary" className="text-xs">
                            {contact.role}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{contact.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span>{contact.birthDate}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="chat" className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-indigo-600" />
              Чаты
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.entries({
                teacher: 'Учитель',
                students: 'Ученики'
              }).map(([key, title]) => (
                <Card key={key}>
                  <CardHeader>
                    <CardTitle>{title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="h-64 overflow-y-auto space-y-2 border rounded p-3">
                        {messages[key]?.map((msg, index) => (
                          <div
                            key={index}
                            className={`flex ${msg.sent ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs px-3 py-2 rounded-lg ${
                                msg.sent
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {msg.text}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Введите сообщение..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              sendMessage(key, (e.target as HTMLInputElement).value);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }}
                        />
                        <Button
                          onClick={() => {
                            const input = document.querySelector(`input[placeholder="Введите сообщение..."]`) as HTMLInputElement;
                            if (input) {
                              sendMessage(key, input.value);
                              input.value = '';
                            }
                          }}
                        >
                          Отправить
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="knowledge" className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-indigo-600" />
              База знаний
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {knowledgeItems.map((item) => (
                <Card key={item.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <item.icon className="h-12 w-12 mx-auto mb-4 text-indigo-600" />
                    <h3 className="font-semibold mb-2">{item.title}</h3>
                    <Badge variant="secondary">{item.count} материалов</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="files" className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-indigo-600" />
              Файлы
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fileItems.map((file) => (
                <Card key={file.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{file.name}</h3>
                        <p className="text-sm text-muted-foreground">{file.size}</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        Скачать
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="gallery" className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Images className="h-6 w-6 text-indigo-600" />
              Галерея
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {galleryItems.map((item, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow overflow-hidden">
                  <div className="h-48 bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                    <Images className="h-16 w-16 text-white" />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-center">{item}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="diary" className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Book className="h-6 w-6 text-indigo-600" />
              Дневник
            </h2>
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  <Book className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Дневник находится в разработке</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="h-6 w-6 text-indigo-600" />
              Достижения
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {achievements.map((achievement) => (
                <Card key={achievement.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                        <Trophy className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle>{achievement.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{achievement.date}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{achievement.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {user && hasPermission('ADMIN') && (
            <TabsContent value="admin" className="space-y-6">
              <UserManagement />
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}

export default function ClassWebsite() {
  return (
    <AuthProvider>
      <ClassWebsiteContent />
    </AuthProvider>
  );
}