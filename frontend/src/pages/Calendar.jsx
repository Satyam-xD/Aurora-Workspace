import React, { useState, useMemo } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Calendar as CalendarIcon, Plus, Filter } from 'lucide-react';
import PageLoader from '../components/PageLoader';
import { useCalendar } from '../hooks/useCalendar/useCalendar';
import { useTeamManagement } from '../hooks/useTeamManagement/useTeamManagement';
import EventModal from '../components/Calendar/EventModal';
import CalendarSidebar from '../components/Calendar/CalendarSidebar';
import CustomToolbar from '../components/Calendar/CustomToolbar';

// Setup the localizer for react-big-calendar
const localizer = momentLocalizer(moment);

const CalendarPage = () => {
    const { events, loading, createEvent, updateEvent, deleteEvent } = useCalendar();
    const { currentTeam } = useTeamManagement();
    const [showModal, setShowModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [activeFilters, setActiveFilters] = useState([]);

    const handleSelectSlot = ({ start, end }) => {
        setSelectedEvent({
            start: start,
            end: end,
            allDay: false
        });
        setShowModal(true);
    };

    const handleSelectEvent = (event) => {
        setSelectedEvent(event);
        setShowModal(true);
    };

    const handleSave = async (eventData) => {
        let success;
        if (selectedEvent && selectedEvent._id) {
            success = await updateEvent(selectedEvent._id, eventData);
        } else {
            success = await createEvent(eventData, currentTeam?.id);
        }

        if (success) {
            setShowModal(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedEvent || !selectedEvent._id) return;
        if (!window.confirm('Are you sure you want to delete this event?')) return;

        const success = await deleteEvent(selectedEvent._id);
        if (success) {
            setShowModal(false);
        }
    };

    const eventStyleGetter = (event) => {
        const style = {
            backgroundColor: event.color || '#3b82f6',
            borderRadius: '6px',
            opacity: 0.9,
            color: 'white',
            border: '0px',
            display: 'block',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            fontWeight: '600'
        };
        return {
            style: style
        };
    };

    const filteredEvents = useMemo(() => {
        if (!events) return [];
        if (activeFilters.length === 0) return events;
        return events.filter(evt => activeFilters.includes(evt.color));
    }, [events, activeFilters]);

    if (loading) return <PageLoader />;

    return (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in pb-24 h-screen flex flex-col">

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shrink-0">
                <div>
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 flex items-center gap-3">
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-indigo-500/10 dark:shadow-none border border-gray-100 dark:border-gray-700">
                            <CalendarIcon className="text-indigo-600 dark:text-indigo-400" size={32} />
                        </div>
                        Calendar
                    </h1>
                    <p className="mt-2 text-lg text-gray-600 dark:text-gray-400 font-medium">Manage your schedule and events efficiently</p>
                </div>
                <button
                    onClick={() => {
                        handleSelectSlot({
                            start: new Date(),
                            end: new Date(new Date().setHours(new Date().getHours() + 1))
                        });
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 group"
                >
                    <Plus size={22} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-300" />
                    New Event
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">

                {/* Sidebar */}
                <div className="lg:col-span-1 h-full overflow-hidden hidden lg:block">
                    <CalendarSidebar
                        events={events}
                        onSelectEvent={handleSelectEvent}
                        activeFilters={activeFilters}
                        onFilterChange={setActiveFilters}
                    />
                </div>

                {/* Calendar */}
                <div className="lg:col-span-3 h-full flex flex-col bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 dark:border-gray-700 relative">
                    <BigCalendar
                        localizer={localizer}
                        events={filteredEvents}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
                        selectable
                        onSelectSlot={handleSelectSlot}
                        onSelectEvent={handleSelectEvent}
                        eventPropGetter={eventStyleGetter}
                        views={['month', 'week', 'day', 'agenda']}
                        components={{
                            toolbar: CustomToolbar
                        }}
                        className="text-gray-900 dark:text-gray-200 custom-calendar p-6"
                    />
                </div>
            </div>

            <EventModal
                show={showModal}
                onClose={() => setShowModal(false)}
                event={selectedEvent}
                onSave={handleSave}
                onDelete={selectedEvent && selectedEvent._id ? handleDelete : null}
            />

            {/* Custom CSS overrides for React Big Calendar Dark Mode */}
            <style>{`
                /* General Calendar Styles */
                .rbc-calendar {
                    font-family: inherit;
                    color: inherit;
                }
                
                /* Month View */
                .rbc-header {
                    padding: 16px 0;
                    font-weight: 700;
                    text-transform: uppercase;
                    font-size: 0.75rem;
                    letter-spacing: 0.05em;
                    color: #6b7280; /* gray-500 */
                    border-bottom: 2px solid #e5e7eb;
                }
                .dark .rbc-header {
                    color: #9ca3af; /* gray-400 */
                    border-bottom-color: #374151;
                }
                .rbc-month-view {
                    border: none;
                }
                .rbc-day-bg {
                    background-color: transparent;
                }
                .rbc-off-range-bg {
                    background-color: rgba(243, 244, 246, 0.4);
                }
                .dark .rbc-off-range-bg {
                    background-color: rgba(17, 24, 39, 0.4);
                }
                .rbc-day-bg + .rbc-day-bg {
                    border-left: 1px solid rgba(229, 231, 235, 0.5);
                }
                .dark .rbc-day-bg + .rbc-day-bg {
                    border-left-color: rgba(55, 65, 81, 0.5);
                }
                .rbc-month-row + .rbc-month-row {
                    border-top: 1px solid rgba(229, 231, 235, 0.5);
                }
                .dark .rbc-month-row + .rbc-month-row {
                    border-top-color: rgba(55, 65, 81, 0.5);
                }

                /* Dates */
                .rbc-date-cell {
                    padding: 8px;
                    font-weight: 600;
                    font-size: 0.9rem;
                    color: #374151;
                    transition: all 0.2s;
                }
                .dark .rbc-date-cell {
                    color: #d1d5db;
                }
                .rbc-today {
                    background-color: rgba(99, 102, 241, 0.1) !important; /* indigo-500/10 */
                }
                .rbc-now {
                    font-weight: 800;
                    color: #4f46e5;
                    font-size: 1.1rem;
                }
                .dark .rbc-now {
                    color: #818cf8;
                }

                /* Events */
                .rbc-event {
                    border: none;
                    border-radius: 6px;
                    padding: 2px 8px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                    transition: transform 0.1s ease, box-shadow 0.1s ease;
                }
                .rbc-event:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
                    z-index: 10;
                }
                .rbc-event-label {
                    display: none; /* simpler look */
                }

                /* Time View / Agenda */
                .rbc-time-view {
                    border: none;
                }
                .rbc-time-header-content {
                    border-left: 1px solid rgba(229, 231, 235, 0.5);
                }
                .dark .rbc-time-header-content {
                    border-left-color: rgba(55, 65, 81, 0.5);
                }
                .rbc-time-content {
                    border-top: 1px solid rgba(229, 231, 235, 0.5);
                }
                .dark .rbc-time-content {
                    border-top-color: rgba(55, 65, 81, 0.5);
                }
                .rbc-timeslot-group {
                    border-bottom: 1px solid rgba(243, 244, 246, 0.5);
                }
                .dark .rbc-timeslot-group {
                    border-bottom-color: rgba(55, 65, 81, 0.5);
                }
                .rbc-day-slot .rbc-time-slot {
                    border-top: 1px solid rgba(249, 250, 251, 0.5);
                }
                .dark .rbc-day-slot .rbc-time-slot {
                    border-top-color: rgba(55, 65, 81, 0.2);
                }
                .rbc-time-gutter .rbc-timeslot-group {
                    border-bottom: 1px solid rgba(229, 231, 235, 0.5);
                    font-size: 0.75rem;
                    color: #9ca3af;
                }
                .dark .rbc-time-gutter .rbc-timeslot-group {
                    border-bottom-color: rgba(55, 65, 81, 0.5);
                    color: #6b7280;
                }
                .rbc-current-time-indicator {
                    background-color: #ef4444; /* red-500 */
                    height: 2px;
                }
            `}</style>
        </div>
    );
};

export default CalendarPage;
