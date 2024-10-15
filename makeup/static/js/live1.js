// Initialize variables
var map;
var marker;
var userLat;
var userLng;
var isGeolocationAvailable = false; // Flag to check if geolocation is available

// Default location coordinates (for fallback)
const defaultLat = 0.3476; // Latitude for Kampala
const defaultLng = 32.5825; // Longitude for Kampala

// Function to initialize the map
function initMap(lat, lng) {
  // Create the map if it doesn't already exist
  if (!map) {
    map = L.map('map').setView([lat, lng], 15); // Set initial view to user's location or default
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
  } else {
    // If the map already exists, just set the new view
    map.setView([lat, lng], 15);
  }

  // Determine gender and set marker color accordingly
  let markerColor = "#1717A7"; // Default to blue for male
  if (window.userData && window.userData.gender) {
    const gender = window.userData.gender.toLowerCase();
    if (gender === "female" || gender === "f") {
      markerColor = "#DB4437"; // Use red for female
    }
  }

  // Create a custom marker with dynamic color
  if (!marker) {
    marker = L.circleMarker([lat, lng], {
      color: markerColor,
      fillColor: markerColor,
      fillOpacity: 1,
      radius: 10 // Adjust size if needed
    }).addTo(map);
  } else {
    marker.setLatLng([lat, lng])
          .setStyle({
            color: markerColor,
            fillColor: markerColor
          });
  }

  // Set the marker's label
  const genderLabel = window.userData && window.userData.gender ? (window.userData.gender.toLowerCase() === "female" ? "F" : "M") : "M";
  marker.bindTooltip(genderLabel, { permanent: true, direction: 'top', className: 'marker-label' }).openTooltip();

  // Use reverse geocoding to get the address
  reverseGeocodeLatLng(lat, lng);
}

// Function to reverse geocode using Nominatim (OpenStreetMap)
function reverseGeocodeLatLng(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      const address = data.display_name;
      console.log("Address: ", address);

      // Update marker popup with the address
      const genderText = window.userData && window.userData.gender ? (window.userData.gender.toLowerCase() === "female" ? "Female" : "Male") : "Unknown";
      const infoWindowContent = `
        <div>
          <p><strong>${genderText}</strong></p>
          <p>Address: ${address}</p>
          <p>Name: ${window.userData ? window.userData.name : "N/A"}</p>
          <p>Bio: ${window.userData ? window.userData.bio : "N/A"}</p>
          <p>Height: ${window.userData ? window.userData.height + " cm" : "N/A"}</p>
          <p>Weight: ${window.userData ? window.userData.weight + " kg" : "N/A"}</p>
        </div>
      `;

      marker.bindPopup(infoWindowContent).openPopup();
    })
    .catch(error => {
      console.error("Error fetching address: ", error);
    });
}

// Function to handle geolocation
function handleGeolocation(position) {
  userLat = position.coords.latitude;
  userLng = position.coords.longitude;
  console.log("Current location: Lat:", userLat, "Lng:", userLng);

  isGeolocationAvailable = true; // Set the flag to true when geolocation is successful

  initMap(userLat, userLng); // Initialize the map with current location
}

// Fallback in case of geolocation error
function handleError(error) {
  console.error("Error retrieving location: ", error);
  alert("Unable to retrieve your location. Using default location.");

  isGeolocationAvailable = false; // Set the flag to false if geolocation fails
  initMap(defaultLat, defaultLng); // Initialize the map with default location
}

// Geolocation API to retrieve GPS coordinates
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(handleGeolocation, handleError, {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
  });
} else {
  alert("Geolocation is not supported by this browser.");
  initMap(defaultLat, defaultLng);
}
