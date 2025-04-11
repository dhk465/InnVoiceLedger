// src/pages/LedgerPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';

// --- react-big-calendar Imports ---
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';

// --- Context and API Imports ---
import { useLocale } from '../contexts/LocaleContext';
import { getLedgerEntries, getCustomers, generateInvoice } from '../services/apiService';

// --- Components & Styling ---
import AddLedgerEntryForm from '../components/AddLedgerEntryForm';
import styles from './LedgerPage.module.css';

// --- Formatting Utility (or define locally) ---
// import { formatDateTime } from '../utils/formatting';


// --- Localizer Setup (Inside Component) ---
function LedgerPage() {
  // --- Locale Context ---
  const { currentLocaleCode, currentDateFnsLocale } = useLocale();

  // --- Memoized Localizer ---
  const localizer = useMemo(() => dateFnsLocalizer({
      format,
      parse,
      startOfWeek,
      getDay,
      locales: { [currentLocaleCode]: currentDateFnsLocale },
  }), [currentLocaleCode, currentDateFnsLocale]);

  // --- Memoized Calendar Messages ---
  const messages = useMemo(() => {
      // Provides translated text for calendar UI elements
      switch (currentLocaleCode) {
          case 'cs-CZ':
              return {
                  allDay: 'Celý den', today: 'Dnes', previous: 'Předchozí', next: 'Další',
                  month: 'Měsíc', week: 'Týden', day: 'Den', agenda: 'Agenda',
                  date: 'Datum', time: 'Čas', event: 'Událost',
                  noEventsInRange: 'V tomto rozsahu nejsou žádné události.',
              };
          case 'ko-KR':
               return {
                  allDay: '하루 종일', today: '오늘', previous: '이전', next: '다음',
                  month: '월', week: '주', day: '일', agenda: '일정 목록',
                  date: '날짜', time: '시간', event: '이벤트',
                  noEventsInRange: '선택하신 기간에 해당하는 일정이 없습니다.',
              };
          case 'en-US':
          default:
               return {
                  allDay: 'All Day', today: 'Today', previous: 'Back', next: 'Next',
                  month: 'Month', week: 'Week', day: 'Day', agenda: 'Agenda',
                  date: 'Date', time: 'Time', event: 'Event',
                  noEventsInRange: 'There are no events in this range.',
              };
      }
  }, [currentLocaleCode]);


  // --- State Definitions ---
  const [entries, setEntries] = useState([]); // Raw ledger entries
  const [calendarEvents, setCalendarEvents] = useState([]); // Formatted for calendar
  const [isLoading, setIsLoading] = useState(true); // Loading entries state
  const [error, setError] = useState(null); // Error fetching entries
  const [isAddFormVisible, setIsAddFormVisible] = useState(false); // Toggle for AddLedgerEntryForm

  // Invoice Generation State
  const [customers, setCustomers] = useState([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true); // Loading customers for dropdown
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [startDate, setStartDate] = useState(''); // For invoice generation start date filter
  const [endDate, setEndDate] = useState(''); // For invoice generation end date filter
  const [targetCurrency, setTargetCurrency] = useState('EUR'); // Default or fetch from settings
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0]); // Invoice issue date
  const [isGenerating, setIsGenerating] = useState(false); // Invoice generation loading state
  const [generationError, setGenerationError] = useState(null); // Invoice generation error
  const [generationSuccess, setGenerationSuccess] = useState(null); // Invoice generation success message

  // Calendar View Control State
  const [currentDate, setCurrentDate] = useState(new Date()); // Calendar current date focus
  const [currentView, setCurrentView] = useState(Views.MONTH); // Calendar current view (Month, Week, etc.)

  // State to pass default date to Add form when clicking a slot
  const [defaultEntryDate, setDefaultEntryDate] = useState(null); // Date string (YYYY-MM-DDTHH:mm) or null


  // --- Data Fetching Logic ---
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsLoadingCustomers(true);
    setError(null); // Clear previous errors
    try {
      // Fetch ledger entries and customers concurrently
      const [entriesData, customerData] = await Promise.all([
        getLedgerEntries(), // TODO: Add filters based on state later if needed (e.g., for performance)
        getCustomers()
      ]);
      setEntries(entriesData || []); // Update entries state
      setCustomers(customerData || []); // Update customers state for dropdown

      // Transform ledger entries into the format react-big-calendar expects
      const events = (entriesData || []).map(entry => {
         const startDate = new Date(entry.startDate); // Parse start date
         // Use endDate if valid, otherwise use startDate (point-in-time)
         let endDate = entry.endDate ? new Date(entry.endDate) : startDate;
         if (isNaN(endDate.getTime())) { // Fallback if endDate is invalid
             endDate = startDate;
         }

         // Handle invalid start date - skip this entry
         if (isNaN(startDate.getTime())) {
             console.warn(`Invalid startDate found for ledger entry ${entry.id}: ${entry.startDate}`);
             return null;
         }

         // Determine allDay status - treating all as allDay simplifies Month/Week view
         const isAllDay = true;

         // Adjust end date for multi-day allDay events to render correctly in some views
         let adjustedEndDate = endDate;
         if (isAllDay && endDate > startDate) {
             // If end date time is midnight, add a small duration (e.g., 1 hour)
             // so react-big-calendar includes the end day visually in Month/Week views
             if (endDate.getHours() === 0 && endDate.getMinutes() === 0 && endDate.getSeconds() === 0) {
                 adjustedEndDate = new Date(endDate.getTime() + (60 * 60 * 1000)); // Add 1 hour
             }
         }

         return {
             id: entry.id, // Use ledger entry ID as event ID
             // Create a title for the event display
             title: `${entry.item?.name || '?'} (${entry.customer?.name || '?'}) Q:${entry.quantity}`,
             start: startDate, // Use parsed start date
             end: adjustedEndDate, // Use the potentially adjusted end date
             allDay: isAllDay, // Set allDay status
             resource: entry, // Attach the original ledger entry data for event handlers
         };
      }).filter(event => event !== null); // Filter out any nulls from invalid dates
      setCalendarEvents(events); // Update the state used by the Calendar component

    } catch (err) {
      console.error("Failed to fetch ledger data:", err);
      setError('Failed to load ledger data. Please try again later.');
    } finally {
      // Clear loading states
      setIsLoading(false);
      setIsLoadingCustomers(false);
    }
  }, []); // Empty dependency array means fetch once on mount (unless filters are added)

  // Fetch data when component mounts
  useEffect(() => {
    fetchData();
  }, [fetchData]); // Run when fetchData function reference changes


  // --- Event Handlers ---
  // Show Add Ledger Entry form (manual trigger)
  const handleAddEntryClick = () => {
      setDefaultEntryDate(null); // Ensure no pre-filled date
      setIsAddFormVisible(true);
  };
  // Close Add Ledger Entry form
  const handleCloseLedgerForm = () => {
      setIsAddFormVisible(false);
      setDefaultEntryDate(null); // Clear any pre-filled date when closing
  };

  // Callback from AddLedgerEntryForm on successful submission
  const handleAddEntrySuccess = (newEntry) => {
      console.log("Successfully added ledger entry for:", newEntry?.customer?.name);
      fetchData(); // Refetch all data to update calendar and list
      handleCloseLedgerForm(); // Close the form
  };

  // Handler for submitting the invoice generation form
  const handleGenerateInvoice = async (e) => {
      e.preventDefault(); // Prevent default form submission
      // Clear previous messages
      setGenerationError(null);
      setGenerationSuccess(null);

      // Validation
      if (!selectedCustomerId || !startDate || !endDate || !targetCurrency || !issueDate) {
          setGenerationError("Please select a customer, date range, issue date, and target currency.");
          return;
      }
      setIsGenerating(true); // Set loading state for button
      try {
          // Prepare data for API call
          const generationData = {
              customerId: selectedCustomerId,
              startDate,
              endDate,
              issueDate,
              targetCurrency,
              // dueDate and notes could be added from optional form fields here
          };
          const newInvoice = await generateInvoice(generationData); // Call API service
          setGenerationSuccess(`Invoice ${newInvoice.invoiceNumber} generated successfully! Check the Invoices page.`);
          fetchData(); // Refetch ledger entries to update their 'billed' status
          // Optionally reset form fields after successful generation
          // setSelectedCustomerId(''); setStartDate(''); setEndDate(''); setIssueDate(new Date().toISOString().split('T')[0]);
      } catch(err) {
          console.error("Invoice generation failed:", err);
          // Display error message from backend response if available
          setGenerationError(err.response?.data?.message || "Failed to generate invoice.");
      } finally {
          setIsGenerating(false); // Reset loading state for button
      }
  };

  // --- Calendar Interaction Handlers ---
  // When clicking an existing event on the calendar
  const handleSelectEvent = useCallback((event) => {
    console.log('Selected Event (Raw):', event);
    console.log('Selected Ledger Entry (Resource):', event.resource);
    // Example: Show alert with details (replace with modal later)
    alert(`Selected: ${event.title}\nDate: ${event.start.toLocaleDateString(currentLocaleCode)}\nStatus: ${event.resource.billingStatus}\nNotes: ${event.resource.notes || 'None'}`);
    // TODO: Open an edit modal? Or navigate to a detail view?
  }, [currentLocaleCode]); // Dependency: locale code for alert formatting

  // When clicking or dragging on an empty slot in the calendar
  const handleSelectSlot = useCallback(({ start, action }) => {
     console.log('Selected Slot:', { start, action });
     // If user clicks a date (or drags a single day), open form pre-filled
     if (action === 'click' || action === 'select') {
        // Format the start date appropriately for datetime-local input (YYYY-MM-DDTHH:mm)
        const year = start.getFullYear();
        const month = (start.getMonth() + 1).toString().padStart(2, '0');
        const day = start.getDate().toString().padStart(2, '0');
        // Default time to 09:00 when clicking a date slot
        const formattedDate = `${year}-${month}-${day}T09:00`;
        setDefaultEntryDate(formattedDate); // Set the default date state for the form
        setIsAddFormVisible(true);          // Open the form
     }
  }, []); // No external dependencies needed here

  // --- Handlers for Calendar Navigation/View Changes ---
  // Called when user clicks Today, Back, Next buttons
  const handleNavigate = useCallback((newDate) => setCurrentDate(newDate), []);
  // Called when user clicks Month, Week, Day, Agenda view buttons
  const handleView = useCallback((newView) => setCurrentView(newView), []);


  // --- Helper Functions ---
  // Can be moved to utils/formatting.js
  const formatDateTime = useCallback((dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
       if (isNaN(date.getTime())) throw new Error("Invalid Date");
      // Use currentLocaleCode for formatting
      return date.toLocaleString(currentLocaleCode, { dateStyle: 'short', timeStyle: 'short' });
    } catch (e) {
        console.warn(`Could not format datetime string "${dateString}" with locale ${currentLocaleCode}:`, e);
        return dateString; // Fallback
    }
  }, [currentLocaleCode]); // Recalculate if locale changes


  // --- Render Logic ---
  // Display loading message while fetching initial data
  if (isLoading) {
    return <div className={styles.loadingMessage}>Loading ledger entries...</div>;
  }

  // Display error message if fetching failed
  if (error) {
    return <div className={styles.errorMesssage}>Error: {error}</div>;
  }

  // Main Page Render
  return (
    <div className={styles.pageContainer}>
      {/* Header Section */}
      <div className={styles.header}>
        <h2>Ledger Calendar</h2>
        <p>Visual overview of customer activity.</p>
      </div>

      {/* --- Invoice Generation Section --- */}
      <div className={styles.invoiceGenSection}>
        <h4>Generate Invoice</h4>
        {/* Show loading message while customers dropdown populates */}
        {isLoadingCustomers ? <p className={styles.loadingMessage}>Loading customers...</p> : (
            <form onSubmit={handleGenerateInvoice}>
                <div className={styles.genFormGrid}>
                    {/* Customer Select */}
                    <div className={styles.formGroup}>
                        <label htmlFor="genInvCustomer" className={styles.formLabel}>Customer:*</label>
                        <select id="genInvCustomer" value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)} required className={styles.formSelect}>
                            <option value="" disabled>Select Customer</option>
                            {/* Map through loaded customers */}
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.companyName ? `(${c.companyName})` : ''}</option>)}
                        </select>
                    </div>
                    {/* Start Date Input */}
                    <div className={styles.formGroup}>
                        <label htmlFor="genInvStart" className={styles.formLabel}>Start Date:*</label>
                        <input id="genInvStart" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className={styles.formInput} />
                    </div>
                    {/* End Date Input */}
                     <div className={styles.formGroup}>
                        <label htmlFor="genInvEnd" className={styles.formLabel}>End Date:*</label>
                        <input id="genInvEnd" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required className={styles.formInput} />
                    </div>
                    {/* Issue Date Input */}
                     <div className={styles.formGroup}>
                        <label htmlFor="genInvIssue" className={styles.formLabel}>Issue Date:*</label>
                        <input id="genInvIssue" type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} required className={styles.formInput} />
                    </div>
                    {/* Target Currency Input */}
                     <div className={styles.formGroup}>
                        <label htmlFor="genInvCurrency" className={styles.formLabel}>Target Currency:*</label>
                         <input id="genInvCurrency" type="text" value={targetCurrency} onChange={e => setTargetCurrency(e.target.value.toUpperCase())} required maxLength="3" placeholder="e.g. EUR" className={styles.formInputShort}/>
                    </div>
                    {/* Generate Button */}
                     <div className={styles.formGroup}>
                        <label className={styles.formLabel}> </label> {/* Spacer label for alignment */}
                        <button type="submit" disabled={isGenerating} className={styles.generateButton}>
                            {isGenerating ? 'Generating...' : 'Generate'}
                        </button>
                     </div>
                </div>
                 {/* Generation Status Messages */}
                 {generationError && <p className={styles.genErrorMessage}>{generationError}</p>}
                 {generationSuccess && <p className={styles.genSuccessMessage}>{generationSuccess}</p>}
            </form>
        )}
      </div>
      {/* --- END INVOICE GEN SECTION --- */}


      {/* Add Ledger Entry Button / Form Section */}
      {!isAddFormVisible ? (
        <button className={styles.addEntryButton} onClick={handleAddEntryClick}>
          + Add Ledger Entry
        </button>
      ) : (
         // Pass the default date state to the form
        <AddLedgerEntryForm
            onAddEntrySuccess={handleAddEntrySuccess}
            onClose={handleCloseLedgerForm}
            defaultDate={defaultEntryDate} // Pass state holding the pre-filled date
         />
      )}


      {/* --- react-big-calendar Component --- */}
      <div className={styles.calendarContainer}>
          <Calendar
              // Core properties
              localizer={localizer}         // Date handling based on locale
              events={calendarEvents}       // Data to display
              messages={messages}           // Translated UI text
              culture={currentLocaleCode}   // Current locale identifier
              startAccessor="start"         // Field name for event start
              endAccessor="end"             // Field name for event end
              style={{ height: 600 }}       // MUST set height for calendar to render

              // View control
              views={['month', 'week', 'day', 'agenda']} // Available views
              date={currentDate}          // Controlled current date
              view={currentView}          // Controlled current view
              onNavigate={handleNavigate} // Callback for date navigation
              onView={handleView}         // Callback for view change

              // Interactivity
              selectable                    // Allow clicking/dragging empty slots
              onSelectEvent={handleSelectEvent} // Callback for clicking an event
              onSelectSlot={handleSelectSlot}   // Callback for selecting empty slots

              // Optional customization: Style events based on data
              // eventPropGetter={
              //     (event, start, end, isSelected) => {
              //         let newStyle = { backgroundColor: "#eee", color: '#333', borderRadius: "3px", border: "none" };
              //          if (event.resource?.billingStatus === 'billed') { newStyle.backgroundColor = "#d1e7dd"; newStyle.color = '#0f5132'; }
              //          else if (event.resource?.billingStatus === 'paid') { newStyle.backgroundColor = "#cfe2ff"; newStyle.color = '#0a58ca'; }
              //          return { style: newStyle };
              //     }
              // }
          />
      </div>
    </div>
  );
}

export default LedgerPage;