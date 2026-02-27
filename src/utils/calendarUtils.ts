/**
 * Utilitários para geração de eventos em calendários
 */

interface CalendarEvent {
    title: string;
    description: string;
    location: string;
    startDate: string; // ISO String
    endDate?: string;  // ISO String
}

/**
 * Formata data para o padrão do Google/Outlook (YYYYMMDDTHHMMSSZ)
 */
function formatToCalDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toISOString().replace(/-|:|\.\d\d\d/g, '');
}

/**
 * Gera link para o Google Calendar
 */
export function generateGoogleCalendarUrl(event: CalendarEvent): string {
    const start = formatToCalDate(event.startDate);
    const end = event.endDate ? formatToCalDate(event.endDate) : formatToCalDate(new Date(new Date(event.startDate).getTime() + 2 * 60 * 60 * 1000).toISOString()); // Default 2h duration

    const url = new URL('https://www.google.com/calendar/render');
    url.searchParams.append('action', 'TEMPLATE');
    url.searchParams.append('text', event.title);
    url.searchParams.append('details', event.description);
    url.searchParams.append('location', event.location);
    url.searchParams.append('dates', `${start}/${end}`);

    return url.toString();
}

/**
 * Gera link para o Outlook/Office 365
 */
export function generateOutlookCalendarUrl(event: CalendarEvent): string {
    const start = event.startDate;
    const end = event.endDate || new Date(new Date(event.startDate).getTime() + 2 * 60 * 60 * 1000).toISOString();

    const url = new URL('https://outlook.live.com/calendar/0/deeplink/compose');
    url.searchParams.append('path', '/calendar/action/compose');
    url.searchParams.append('rru', 'addevent');
    url.searchParams.append('subject', event.title);
    url.searchParams.append('body', event.description);
    url.searchParams.append('location', event.location);
    url.searchParams.append('startdt', start);
    url.searchParams.append('enddt', end);

    return url.toString();
}

/**
 * Gera e faz o download de um arquivo .ics (Universal)
 */
export function downloadIcs(event: CalendarEvent) {
    const start = formatToCalDate(event.startDate);
    const end = event.endDate ? formatToCalDate(event.endDate) : formatToCalDate(new Date(new Date(event.startDate).getTime() + 2 * 60 * 60 * 1000).toISOString());

    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PROID:-//Bus Manager//Excursao//PT',
        'BEGIN:VEVENT',
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
        `LOCATION:${event.location}`,
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${event.title.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
