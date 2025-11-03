#!/usr/bin/env python3
import json
import re
import time
from pathlib import Path
from datetime import datetime
import requests

START_DATE_ISO = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0).strftime("%Y-%m-%dT%H%%3A%M%%3A%S.000Z")

# US state abbreviations dictionary
US_STATES = [
    "AL", "AK", "AZ", "AR", 
    "CA", "CO", "CT", "DE",
    "FL", "GA", "HI", "ID", 
    "IL", "IN", "IA", "KS",
    "KY", "LA", "ME", "MD", 
    "MA", "MI", "MN", "MS",
    "MO", "MT", "NE", "NV",
    "NH", "NJ", "NM", "NY",
    "NC", "ND", "OH", "OK", 
    "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT",
    "VT", "VA", "WA", "WV",
    "WI", "WY", "DC"
]

# Event type mapping
evnt_type_map = {
    "CANVASS": "Canvass",
    "PHONE_BANK": "Phone Bank",
    "TEXT_BANK": "Text Bank",
    "MEETING": "Meeting",
    "COMMUNITY": "Community",
    "FUNDRAISER": "Fundraiser",
    "MEET_GREET": "Meet & Greet",
    "HOUSE_PARTY": "House Party",
    "VOTER_REG": "Voter Registration",
    "TRAINING": "Training",
    "FRIEND_TO_FRIEND_OUTREACH": "Friend to Friend Outreach",
    "DEBATE_WATCH_PARTY": "Debate Watch Party",
    "ADVOCACY_CALL": "Advocacy Call",
    "RALLY": "Rally",
    "TOWN_HALL": "Town Hall",
    "OFFICE_OPENING": "Office Opening",
    "DIRECT_ACTION": "Direct Action",
    "PETITION": "Petition",
    "SIGNATURE_GATHERING": "Signature Gathering",
    "LITERATURE_DROP": "Literature Drop",
    "VISIBILITY_EVENT": "Visibility Event",
    "OTHER": "Other",
    "VOLUNTEER_ORIENTATION": "Volunteer Orientation",
    "LETTER_WRITING": "Letter Writing",
    "POSTCARD_WRITING": "Postcard Writing",
    "POSTCARD_PARTY": "Postcard Party",
    "BARNSTORM": "Barnstorm",
    "SOLIDARITY_EVENT": "Solidarity Event",
    "COMMUNITY_CANVASS": "Community Canvass",
    "DRIVE_IN_RALLY": "Drive-in Rally",
    "WORKSHOP": "Workshop",
    "PHONE_BANK_PARTY": "Phone Bank Party",
    "FRIEND_BANK": "Friend Bank",
    "RELATIONAL_ORGANIZING": "Relational Organizing",
    "TABLING": "Tabling",
    "VOTER_PROTECTION": "Voter Protection",
    "RESOURCE_FAIR": "Resource Fair",
    "PANEL": "Panel",
    "DOOR_KNOCK": "Door Knock",
    "ELECTION_DAY": "Election Day",
    "CAMPAIGN_OFFICE": "Campaign Office",
    "VOTING_LOCATION": "Voting Location",
    "HEARING": "Hearing",
    "PERFORMANCE": "Performance",
    "FILM_SCREENING": "Film Screening",
    "SOCIAL": "Social",
    "INFORMATION_SESSION": "Information Session",
    "COMMUNITY_SERVICE": "Community Service",
    "CARPOOL": "Carpool",
    "VOTE_TRIPLING": "Vote Tripling",
    "BALLOT_CHASE": "Ballot Chase",
    "POLL_WORKER": "Poll Worker",
    "POLL_OBSERVER": "Poll Observer",
    "POLL_WATCHER": "Poll Watcher",
    "POLL_WORKER_RECRUITMENT": "Poll Worker Recruitment",
    "POLL_WORKER_TRAINING": "Poll Worker Training",
    "BALLOT_CURING": "Ballot Curing",
    "BALLOT_PROCESSING": "Ballot Processing",
    "BALLOT_DELIVERY": "Ballot Delivery",
    "RIDES_TO_POLLS": "Rides to Polls",
    "VOTER_ASSISTANCE": "Voter Assistance",
    "GOTV": "GOTV",
    "GOTV_CALL": "GOTV Call",
    "GOTV_TEXT": "GOTV Text",
    "GOTV_CANVASS": "GOTV Canvass",
    "GOTV_RELATIONAL": "GOTV Relational",
    "GOTV_LITERATURE_DROP": "GOTV Literature Drop",
    "GOTV_POSTCARD": "GOTV Postcard",
    "GOTV_LETTER": "GOTV Letter",
    "GOTV_PHONEBANK": "GOTV Phonebank",
    "GOTV_TEXTBANK": "GOTV Textbank",
    "GOTV_FRIEND_BANK": "GOTV Friend Bank",
    "GOTV_FRIEND_TO_FRIEND": "GOTV Friend to Friend",
    "GOTV_DOOR_KNOCK": "GOTV Door Knock",
    "GOTV_VISIBILITY": "GOTV Visibility",
    "GOTV_RALLY": "GOTV Rally",
    "GOTV_TABLING": "GOTV Tabling",
    "GOTV_OTHER": "GOTV Other",
}


SAVE_DIR = Path("events_json")
SAVE_DIR.mkdir(exist_ok=True, parents=True)

def fetch_html(url: str) -> str:
    headers = {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) Python requests scraper"
    }
    r = requests.get(url, headers=headers, timeout=30)
    r.raise_for_status()
    return r.text

def iso_to_unix(iso_str):
    if not iso_str:
        return None
    try:
      dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
      return int(dt.timestamp())
    except Exception:
      return None

def get_days_in_month(year, month):
    """Return the number of days in a given month and year."""
    if month == 12:
        next_month = datetime(year + 1, 1, 1)
    else:
        next_month = datetime(year, month + 1, 1)
    return (next_month - datetime(year, month, 1)).days

def check_if_all_month(times_list):
    """Check if times cover entire months and return appropriate summary."""
    if not times_list or len(times_list) < 28:  # Not enough days to possibly cover a month
        return None
        
    # Extract all dates from the times
    dates_by_month = {}  # Format: {"Month Year": set(dates)}
    
    for time_str in times_list:
        # Extract date from the time string (format: "YYYY-MM-DD HH:MM - HH:MM")
        date_part = time_str.split(' ')[0]
        
        # Extract month
        try:
            dt = datetime.fromisoformat(date_part)
            month_key = dt.strftime("%B %Y")  # Month name and year
            day = dt.day
            
            if month_key not in dates_by_month:
                dates_by_month[month_key] = set()
            
            dates_by_month[month_key].add(day)
        except ValueError:
            continue
    
    # Check which months are fully covered (or close enough)
    full_months = []
    partial_months = []
    
    for month_key, days in dates_by_month.items():
        try:
            dt = datetime.strptime(month_key, "%B %Y")
            days_in_month = get_days_in_month(dt.year, dt.month)
            
            # Check if all days in the month are covered
            if len(days) >= days_in_month * 0.9:  # 90% coverage is considered full
                full_months.append(month_key)
            else:
                # For partial months, find the date range
                sorted_days = sorted(list(days))
                if sorted_days:
                    start_day = sorted_days[0]
                    end_day = sorted_days[-1]
                    partial_months.append((month_key, start_day, end_day))
        except ValueError:
            continue
    
    # Prepare the result array
    result = []
    
    # Add full months
    if full_months:
        # Sort months chronologically
        try:
            full_months.sort(key=lambda x: datetime.strptime(x, "%B %Y"))
        except ValueError:
            pass
            
        for month in full_months:
            result.append(f"All month {month.split()[0].lower()} {month.split()[1]}")
    
    # Add partial months
    for month_info in partial_months:
        month_key, start_day, end_day = month_info
        month_parts = month_key.split()
        month_name = month_parts[0].lower()
        year = month_parts[1]
        
        if end_day - start_day + 1 >= 3:  # Only include if at least 3 days
            result.append(f"{month_name} {start_day}-{end_day} {year}")
    
    return result if result else None

def simplify_event(event: dict) -> list:
    """Return a simplified event with times array."""
    event_times = event.get("times", [])
    base = {
        "id": event.get("id"),
        "name": event.get("name"),
        "accessibility_features": event.get("accessibility_features"),
        "city": event.get("city"),
        "country": event.get("country"),
        "description": event.get("description"),
        "is_virtual": event.get("is_virtual"),
        "state": event.get("state"),
        "event_type": evnt_type_map[event.get("event_type")],
        "timezone": event.get("timezone"),
        "zipcode": event.get("zipcode"),
        "organization_name": event.get("organization", {}).get("name"),
        "image_url": event.get("image_url"),
    }

    # Create a single event with times array
    e = base.copy()
    e["times"] = []
    
    if event_times:
        # Get current time for filtering past events
        current_time = datetime.now().replace(tzinfo=datetime.now().astimezone().tzinfo)
        
        # Calculate the cutoff date (2 years from now)
        two_years_future = current_time.replace(year=current_time.year + 2)
        
        # Collect all time pairs as strings (only future events within 2 years)
        time_strings = []
        multi_month_events = []
        
        for t in event_times:
            start = t.get("start")
            end = t.get("end")
            
            if start and end:
                # Convert ISO to readable format
                try:
                    # Ensure proper timezone handling
                    start_dt = datetime.fromisoformat(start.replace("Z", "+00:00"))
                    end_dt = datetime.fromisoformat(end.replace("Z", "+00:00"))
                    
                    # Skip if the end date is in the past
                    if end_dt < current_time:
                        continue
                    
                    # Use current time as start if original start is in the past
                    if start_dt < current_time:
                        start_dt = current_time
                    
                    
                    # Skip if the start date is more than 2 years in the future
                    if start_dt > two_years_future:
                        continue
                    
                    # Check if this event spans multiple months
                    start_month = (start_dt.year, start_dt.month)
                    end_month = (end_dt.year, end_dt.month)
                    
                    if start_month != end_month:
                        # This is a multi-month event - handle specially
                        multi_month_events.append((start_dt, end_dt))
                    else:
                        # Regular single-month event
                        time_str = f"{start_dt.strftime('%Y-%m-%d %H:%M')} - {end_dt.strftime('%H:%M')}"
                        time_strings.append(time_str)
                except Exception as e:
                    # Print the error for debugging
                    print(f"Error parsing dates: {e}")
                    print(f"Start: {start}, End: {end}")
                    # If parsing fails, include the event (better to include than exclude)
                    time_strings.append(f"{start} - {end}")
        
        # Process multi-month events
        if multi_month_events:
            # Clear existing time strings if we have multi-month events
            # This ensures we use the month-based format consistently
            time_strings = []
            
            for start_dt, end_dt in multi_month_events:
                # Generate entries for each month between start and end
                current = start_dt.replace(day=1)
                
                while current <= end_dt:
                    year = current.year
                    month = current.month
                    month_name = current.strftime("%b").lower()
                    days_in_month = get_days_in_month(year, month)
                    
                    # Skip if this month is more than 2 years in the future
                    month_start = datetime(year, month, 1, tzinfo=current.tzinfo)
                    if month_start > two_years_future:
                        break
                    
                    # Determine the start and end day for this month
                    if current.year == start_dt.year and current.month == start_dt.month:
                        # First month - start from the actual start day
                        start_day = start_dt.day
                        end_day = days_in_month
                    elif current.year == end_dt.year and current.month == end_dt.month:
                        # Last month - end at the actual end day
                        start_day = 1
                        end_day = end_dt.day
                    else:
                        # Middle month - full month
                        start_day = 1
                        end_day = days_in_month
                    
                    # Format the month entry
                    if start_day == 1 and end_day == days_in_month:
                        time_strings.append(f"All month {month_name} {year}")
                    else:
                        time_strings.append(f"{month_name} {start_day}-{end_day} {year}")
                    
                    # Move to next month
                    if current.month == 12:
                        current = current.replace(year=current.year + 1, month=1)
                    else:
                        current = current.replace(month=current.month + 1)
        
        # If we have time strings, use them directly
        if time_strings:
            e["times"] = time_strings
    
    return [e]


def extract_embedded_data(html: str) -> dict:
    marker = "window.__MLZ_EMBEDDED_DATA__"
    assign = marker + " ="
    start = html.find(assign)
    if start == -1:
        raise ValueError("Could not find window.__MLZ_EMBEDDED_DATA__ assignment in the page.")
    brace_start = html.find("{", start)
    if brace_start == -1:
        raise ValueError("Could not find JSON object start after the assignment.")

    i = brace_start
    depth = 0
    in_string = False
    escape = False

    while i < len(html):
        ch = html[i]
        if in_string:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == '"':
                in_string = False
        else:
            if ch == '"':
                in_string = True
            elif ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    json_text = html[brace_start:i+1]
                    break
        i += 1
    else:
        raise ValueError("Unbalanced braces while parsing embedded JSON.")

    try:
        data = json.loads(json_text)
    except json.JSONDecodeError as e:
        context = json_text[max(0, e.pos-40):e.pos+40]
        raise ValueError(f"JSON parsing failed at pos {e.pos}: {e.msg}\nContext: {context}") from e
    return data

def slugify(text: str, max_len: int = 60) -> str:
    if not text:
        return "event"
    text = text.lower()
    text = re.sub(r"['’]", "", text)
    text = re.sub(r"[^a-z0-9-_]+", "-", text)
    text = re.sub(r"-{2,}", "-", text).strip("-")
    return text[:max_len].strip("-") or "event"

def save_event_json(evt: dict):
    eid = evt.get("id")
    name = evt.get("name") or "event"
    slug = slugify(name)
    filename = SAVE_DIR / f"{slug}-{eid}.json"
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(evt, f, ensure_ascii=False, indent=2)
    return filename


def fetch_all_pages(url_template, description=""):
    """Fetch all pages of events using the given URL template until no more events are found."""
    page = 1
    events_found = []
    
    while True:
        url = url_template.format(page=page)
        try:
            print(f"Fetching {description} - page {page}: {url}")
            html = fetch_html(url)
            data = extract_embedded_data(html)
            events = data.get("data", {}).get("events", [])
            
            if not events:
                print(f"No more events found for {description} after page {page-1}")
                break
                
            for e in events:
                events_found.extend(simplify_event(e))
                
            print(f"{description} - Page {page}: {len(events)} base events, total {len(events_found)} expanded.")
            page += 1
            time.sleep(0.5)
        except Exception as ex:
            print(f"{description} - Page {page} error: {ex}")
            break
            
    return events_found


all_events = []

# 1. Fetch all events (original functionality)
all_url = "https://www.mobilize.us/?show_all_events=true&page={page}&per_page=100&start_date=" + START_DATE_ISO
all_events.extend(fetch_all_pages(all_url, "All events"))

# 2. Fetch events by state
for state_code in US_STATES:
    state_url = f"https://www.mobilize.us/?country=US&state={state_code}&page={{page}}&per_page=100&start_date=" + START_DATE_ISO
    state_events = fetch_all_pages(state_url, f"State: {state_code}")
    all_events.extend(state_events)

# 3. Fetch virtual events
virtual_url = "https://www.mobilize.us/?is_virtual=true&page={page}&per_page=100&start_date=" + START_DATE_ISO
virtual_events = fetch_all_pages(virtual_url, "Virtual events")
all_events.extend(virtual_events)

# Remove duplicates based on event ID only
unique_events = {}
for event in all_events:
    key = event.get("id")
    unique_events[key] = event

all_events = list(unique_events.values())
print(f"\nTotal unique events after deduplication: {len(all_events)}")

# Save all events
for evt in all_events:
    save_event_json(evt)

print(f"\nSaved {len(all_events)} total time-expanded event JSONs to: {SAVE_DIR.resolve()}")
