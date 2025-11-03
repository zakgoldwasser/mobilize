"use client";

export default function FileCitation({ citation }) {
  if (!citation)
    return (
      <div className="w-[300px] min-w-[300px] h-[450px] shadow-md skeleton-card flex flex-col">
        <div className="w-full h-40 "></div>
        <div className="p-3 flex-grow flex flex-col content-container">
          <div className="w-7/8 h-4 mb-3 rounded-md"></div>
          <div className="w-full h-5 mb-2 rounded-md"></div>
          <div className="w-3/4 h-5 mb-5 rounded-md"></div>

          <div className="w-7/8 h-4 mb-2 rounded-md"></div>
          <div className="w-full h-[56px] mt-auto rounded-md"></div>
        </div>
      </div>
    );

  // Format the start date
  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(parseInt(timestamp) * 1000);

    // Get day of week abbreviated
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayOfWeek = days[date.getDay()];

    // Get month abbreviated
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = months[date.getMonth()];

    // Get date
    const day = date.getDate();

    // Get time in 12-hour format
    let hours = date.getHours();
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'

    return `${dayOfWeek}, ${month} ${day} @ ${hours}${ampm} MST`;
  };

  return (
    <div className="flex-shrink-0 mt-2 bg-white min-w-[300px] w-[300px] h-[450px] shadow-md flex flex-col">
      {citation.image_url && (
        <div className="flex-shrink-0">
          <img
            src={citation.image_url}
            alt={citation.name}
            className="w-full h-40 object-cover"
          />
        </div>
      )}

      <div className="p-3 flex-grow flex flex-col">
        <div className="mb-2 text-sm text-zinc-600 dark:text-zinc-300">
          {formatDate(citation.time_start)}
        </div>

        <h3 className="text-lg font-semibold mb-1">
          <a
            href={`https://www.mobilize.us/mobilize/event/${citation.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-black hover:underline leading-tight"
          >
            {citation.name}
          </a>
        </h3>

        <div className="text-sm text-zinc-700 dark:text-zinc-300 mb-1">
          Hosted by {citation.organization_name}
        </div>

        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          {citation.city}, {citation.state}
        </div>
        <a
          href={`https://www.mobilize.us/mobilize/event/${citation.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white font-bold w-full flex mt-auto items-center justify-between bg-[#2d28ff] hover:bg-[#5854ff] p-4 rounded-sm"
        >
          See details
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={3}
            stroke="currentColor"
            className="w-5 h-5 ml-2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            />
          </svg>
        </a>
      </div>
    </div>
  );
}
