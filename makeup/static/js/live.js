var map;
var marker;
var userLat;
var userLng;
var geocoder;
var infoWindow;
var isGeolocationAvailable = false; // Flag to check if geolocation is available

// Default location coordinates (for fallback)
const defaultLat = 0.3476; // Latitude for Kampala
const defaultLng = 32.5825; // Longitude for Kampala

function initMap() {
  // Initialize the geocoder
  geocoder = new google.maps.Geocoder();

  // Use default coordinates if geolocation is unavailable
  const lat = isGeolocationAvailable ? userLat : defaultLat;
  const lng = isGeolocationAvailable ? userLng : defaultLng;

  console.log("Initializing map with coordinates: Lat:", lat, "Lng:", lng);

  const mapOptions = {
    center: { lat: lat, lng: lng },
    zoom: 15,
  };
  map = new google.maps.Map(document.getElementById("map"), mapOptions);

  // Initialize InfoWindow
  infoWindow = new google.maps.InfoWindow();

  // If the current user is live, show their marker (only in the "Go Live" mode)
  if (window.userData && window.userData.is_live) {
    createUserMarker(lat, lng, window.userData.gender);
  }

  // Handle live markers for other users (in the "See Live People" mode)
  if (window.liveUsersData && !window.userData.is_live) {  // Ensure current user isn't live in this mode
    window.liveUsersData.forEach(function(user) {
      createLiveUserMarker(user);
    });
  }
}

// Function to create marker for the current user
function createUserMarker(lat, lng, gender) {
  const markerColor = gender.toLowerCase() === "female" ? "#DB4437" : "#1717A7";

  const svgMarker = {
    path: "M12 2C6.48 2 2 6.48 2 12c0 5.25 10 16 10 16s10-10.75 10-16c0-5.52-4.48-10-10-10z",
    fillColor: markerColor,
    fillOpacity: 1,
    strokeWeight: 0,
    scale: 1.8, // Adjust size if needed
    anchor: new google.maps.Point(12, 24), // Set anchor point at the bottom of the pin
    labelOrigin: new google.maps.Point(12, 10), // Set the position for the label
  };

  marker = new google.maps.Marker({
    position: { lat: lat, lng: lng },
    map: map,
    icon: svgMarker,
    label: {
      text: gender.toLowerCase() === "female" ? "F" : "M", // Set label "M" for male or "F" for female
      color: "white",
      fontSize: "16px",
      fontWeight: "bold",
    },
  });

  geocodeLatLng(lat, lng);  // Show the info window for the current user's location
}

// Function to create markers for live users
function createLiveUserMarker(user) {
  const markerColor = user.gender.toLowerCase() === 'female' ? '#DB4437' : '#1717A7';

  const svgMarker = {
    path: "M12 2C6.48 2 2 6.48 2 12c0 5.25 10 16 10 16s10-10.75 10-16c0-5.52-4.48-10-10-10z",
    fillColor: markerColor,
    fillOpacity: 1,
    strokeWeight: 0,
    scale: 1.8,
    anchor: new google.maps.Point(12, 24),
    labelOrigin: new google.maps.Point(12, 10),
  };

  const liveMarker = new google.maps.Marker({
    position: { lat: user.lat, lng: user.lng },
    map: map,
    icon: svgMarker,
    label: {
      text: user.gender.toLowerCase() === 'female' ? 'F' : 'M',
      color: 'white',
      fontSize: '16px',
      fontWeight: 'bold',
    },
  });

  liveMarker.addListener("click", () => {
    const infoWindowContent = `
      <div>
        <p class="info-window-text"><strong>${user.gender.toLowerCase() === 'female' ? 'Female' : 'Male'}</strong></p>
        <p class="info-window-text">Address: ${user.address || 'N/A'}</p>
        <p class="info-window-text">Name: ${user.name || 'N/A'}</p>
        <p class="info-window-text">Bio: ${user.bio || 'N/A'}</p>
        <p class="info-window-text">Height: ${user.height || 'N/A'} cm</p>
        <p class="info-window-text">Weight: ${user.weight || 'N/A'} kg</p>
      </div>
    `;
    infoWindow.setContent(infoWindowContent);
    infoWindow.open(map, liveMarker);
  });
}


function handleGeolocation(position) {
  userLat = position.coords.latitude;
  userLng = position.coords.longitude;
  console.log("Current location: Lat:", userLat, "Lng:", userLng);

  isGeolocationAvailable = true; // Set the flag to true when geolocation is successful

  initMap(); // Initialize the map with current location
}

function handleError(error) {
  console.error("Error retrieving location: ", error);
  alert("Unable to retrieve your location. Using default location.");

  isGeolocationAvailable = false; // Set the flag to false if geolocation fails
  initMap(); // Initialize the map with default location
}

function updateMarkerPosition(lat, lng, gender) {
  if (marker) {
    const newPosition = { lat: lat, lng: lng };
    marker.setPosition(newPosition);
    map.setCenter(newPosition);

    // Update the marker label for gender
    marker.setLabel(gender);

    // Get the address of the new position
    geocodeLatLng(lat, lng);
  } else {
    console.error("Marker is not defined.");
  }
}

// Function to get the address using Geocoding API
function geocodeLatLng(lat, lng) {
  const latlng = { lat: lat, lng: lng };

  console.log("Geocoding coordinates: Lat:", lat, "Lng:", lng);

  geocoder.geocode({ location: latlng }, (results, status) => {
    if (status === "OK") {
      if (results[0]) {
        const address = results[0].formatted_address;
        console.log("Address for coordinates:", lat, lng, "is", address);

        // Log user data for debugging
        console.log("User data:", window.userData);

        // Check if userData is available and has a gender field
        const gender = window.userData && window.userData.gender ? window.userData.gender.toLowerCase() : "unknown";
        console.log("Gender value:", gender);

        // Determine gender label based on gender field
        const genderText = gender === "m" || gender === "male" ? "Male" : gender === "f" || gender === "female" ? "Female" : "Unknown";

        const infoWindowContent = `
          <div>
            <p class="info-window-text"><strong>${genderText}</strong></p>
            <p class="info-window-text">Address: ${address}</p>
            <p class="info-window-text">Name: ${window.userData ? window.userData.name : "N/A"}</p>
            <p class="info-window-text">Bio: ${window.userData ? window.userData.bio : "N/A"}</p>
            <p class="info-window-text">Height: ${window.userData ? window.userData.height + " cm" : "N/A"}</p>
            <p class="info-window-text">Weight: ${window.userData ? window.userData.weight + " kg" : "N/A"}</p>
          </div>
        `;

        // Use the single InfoWindow instance
        infoWindow.setContent(infoWindowContent);

        marker.addListener("mouseover", () => {
          infoWindow.open(map, marker);
        });

        marker.addListener("click", () => {
          infoWindow.open(map, marker);
        });
      } else {
        console.error("No results found.");
      }
    } else {
      console.error("Geocoder failed due to: " + status);
    }
  });
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
  initMap(); // Initialize map with default location if geolocation is not supported
}
