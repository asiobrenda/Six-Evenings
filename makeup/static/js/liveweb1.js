var map;
var marker;
var userLat;
var userLng;
var geocoder;
var infoWindow;
var isGeolocationAvailable = false;
var liveUsersMarkers = []; // Array to store markers for live users
var userMarkerCreated = false; // Flag to check if user marker is already created


var socket = new WebSocket('ws://' + window.location.host + '/ws/live/');



// Default location coordinates (for fallback)
const defaultLat = 0.3476; // Latitude for Kampala
const defaultLng = 32.5825; // Longitude for Kampala

function initMap() {
  geocoder = new google.maps.Geocoder();
  infoWindow = new google.maps.InfoWindow(); // Initialize only once

  const lat = isGeolocationAvailable ? userLat : defaultLat;
  const lng = isGeolocationAvailable ? userLng : defaultLng;

  console.log("Initializing map with coordinates: Lat:", lat, "Lng:", lng);

  const mapOptions = {
    center: { lat: lat, lng: lng },
    zoom: 15,
  };
  map = new google.maps.Map(document.getElementById("map"), mapOptions);

  // If the current user goes live
  if (window.userData && window.userData.is_live) {
    createUserMarker(lat, lng, window.userData.gender);
  }

  // Show markers for other live users
  if (window.liveUsersData && !window.userData.is_live) {
    window.liveUsersData.forEach(user => {
      if (userHasProfile(user.id)) {
        createLiveUserMarker(user);
      }
    });
  }

  showLiveNotification();
}

// Function to show the live notification
function showLiveNotification() {
  const notification = document.getElementById('liveNotification');
  notification.style.display = 'block'; // Show the notification

  // Automatically hide after 2 seconds (2000 milliseconds)
  setTimeout(() => {
    notification.style.display = 'none'; // Hide the notification
  }, 2000);
}

// Function to create marker for the current user
function createUserMarker(lat, lng, gender) {
  if (lat === defaultLat && lng === defaultLng) return; // Do not create a marker for default location

  const markerColor = gender.toLowerCase() === "female" ? "#DB4437" : "#1717A7";

  const svgMarker = {
    path: "M12 2C6.48 2 2 6.48 2 12c0 5.25 10 16 10 16s10-10.75 10-16c0-5.52-4.48-10-10-10z",
    fillColor: markerColor,
    fillOpacity: 1,
    strokeWeight: 0,
    scale: 1.8,
    anchor: new google.maps.Point(12, 24),
    labelOrigin: new google.maps.Point(12, 10),
  };

  marker = new google.maps.Marker({
    position: { lat: lat, lng: lng },
    map: map,
    icon: svgMarker,
    label: {
      text: gender.toLowerCase() === "female" ? "F" : "M",
      color: "white",
      fontSize: "16px",
      fontWeight: "bold",
    },
  });

  marker.addListener("mouseover", () => {
    console.log("Mouseover event triggered");
    infoWindow.open(map, marker);
  });

  // Reverse geocoding to get address and update InfoWindow
  geocodeLatLng(lat, lng);
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

  liveUsersMarkers.push(liveMarker);  // Save the marker in the array

  // Function to create content for InfoWindow
  function getInfoWindowContent(user) {
    return `
      <div>
        <p class="info-window-text"><strong>${user.gender.toLowerCase() === 'female' ? 'Female' : 'Male'}</strong></p>
        <p class="info-window-text">Address: ${user.address || 'N/A'}</p>
        <p class="info-window-text">Name: ${user.name || 'N/A'}</p>
        <p class="info-window-text">Bio: ${user.bio || 'N/A'}</p>
        <p class="info-window-text">Height: ${user.height || 'N/A'} cm</p>
        <p class="info-window-text">Weight: ${user.weight || 'N/A'} kg</p>
      </div>
    `;
  }

  // Event listener for click
  liveMarker.addListener("click", () => {
    const infoWindowContent = getInfoWindowContent(user);
    console.log("Opening InfoWindow with content:", infoWindowContent);
    infoWindow.setContent(infoWindowContent);
    infoWindow.open(map, liveMarker);
  });

  // Event listener for hover (mouseover)
  liveMarker.addListener("mouseover", () => {
    const infoWindowContent = getInfoWindowContent(user);
    console.log("Opening InfoWindow with content on hover:", infoWindowContent);
    infoWindow.setContent(infoWindowContent);
    infoWindow.open(map, liveMarker);
  });
}

// Function to update the live users' markers
function updateLiveMarkers(liveUsersData) {
  // First, remove any old markers
  liveUsersMarkers.forEach(marker => marker.setMap(null));
  liveUsersMarkers = [];

  // Debugging: Check the new live users data
  console.log('Updating live markers with data:', liveUsersData);

  // Now add markers for the new live users
  liveUsersData.forEach(user => {
    if (userHasProfile(user.id)) {
      createLiveUserMarker(user);
    }
  });
}

// Geolocation API to retrieve GPS coordinates
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    position => {
      userLat = position.coords.latitude;
      userLng = position.coords.longitude;
      isGeolocationAvailable = true;
      initMap();
    },
    error => {
      console.error("Error getting geolocation:", error);
      initMap();  // Initialize map with default location if geolocation fails
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  );
} else {
  alert("Geolocation is not supported by this browser.");
  initMap();  // Initialize map with default location if geolocation is not supported
}

// Handling new live users coming in through WebSocket
socket.onmessage = function(event) {
  const liveUsersData = JSON.parse(event.data);
  updateLiveMarkers(liveUsersData);  // Update the markers when live users data is received
};

// Define geocodeLatLng function if you need reverse geocoding
function geocodeLatLng(lat, lng) {
  if (lat === defaultLat && lng === defaultLng) return; // Skip geocoding for default location

  const latlng = { lat: lat, lng: lng };

  geocoder.geocode({ location: latlng }, (results, status) => {
    if (status === "OK") {
      if (results[0]) {
        const formattedAddress = results[0].formatted_address;
        const gender = window.userData && window.userData.gender ? window.userData.gender.toLowerCase() : "unknown";
        const genderText = gender === "m" || gender === "male" ? "Male" : gender === "f" || gender === "female" ? "Female" : "Unknown";

        const infoWindowContent = `
          <div>
              <p class="info-window-text">
              <img src="${window.userData && window.userData.image ? window.userData.image : ''}" alt="Profile Image" style="width: 80px; height: 80px; border-radius:50%; object-fit: cover; border: 1px solid #ddd; cursor:pointer" onclick="openModal('${window.userData && window.userData.image ? window.userData.image : ''}')">
            </p>
            <p class="info-window-text"><strong>${genderText}</strong></p>
            <p class="info-window-text">Address: ${formattedAddress}</p>
            <p class="info-window-text">Name: ${window.userData ? window.userData.name : "N/A"}</p>
            <p class="info-window-text">Bio: ${window.userData ? window.userData.bio : "N/A"}</p>
            <p class="info-window-text">Height: ${window.userData ? window.userData.height + " cm" : "N/A"}</p>
            <p class="info-window-text">Weight: ${window.userData ? window.userData.weight + " kg" : "N/A"}</p>
            <button class="w3-btn w3-white w3-border w3-border-red w3-round-large"
                    id="likeButton"
                    onclick="likeUser('${window.userData ? 'true' : 'false'}', window.currentUserId, '${window.userData ? window.userData.id : ''}')">
                Send a Like
            </button>

          </div>
        `;

        infoWindow.setContent(infoWindowContent);
      } else {
        console.log("No results found");
      }
    } else {
      console.error("Geocoder failed due to:", status);
    }
  });
}


// Function to show the notification
function showNotification(message) {
  const notification = document.getElementById('noLongerLiveNotification');
  notification.textContent = message; // Set the message text
  notification.style.display = 'block'; // Show the notification

  // Automatically hide after 3 seconds (3000 milliseconds)
  setTimeout(() => {
    notification.style.display = 'none'; // Hide the notification
  }, 3000);
}

// Function to handle when the user stops being live
function handleUserLeaveLive() {
  if (window.userData && window.userData.is_live) {
    // Remove the marker and update user data
    marker.setMap(null);
    window.userData.is_live = false;

    // Notify user they have left live
    showNotification("You are no longer live!");
  }
}

//Function that opens the image modal when it is clicked
function openModal(imageSrc) {
        const modal = document.getElementById('imageModal');
        const modalImage = document.getElementById('modalImage');
        modalImage.src = imageSrc;
        modal.style.display = 'flex';
    }

//Function to close the image modal
function closeModal() {
        const modal = document.getElementById('imageModal');
        modal.style.display = 'none';
}


// Function to send like
function likeUser(hasProfile, likerId, likedUserId) {
    if (hasProfile === 'true' || hasProfile === true) {
        if (!likerId || !likedUserId) {
            alert("Liker or Liked User ID is missing!");
            return;
        }

        // Construct the like message payload
        const likeData = {
            type: 'like',
            likerId: likerId,
            likedUserId: likedUserId,
        };

        // Send the like event through WebSocket
        socket.send(JSON.stringify(likeData));
        alert("You have liked this user!");
    } else {
        alert("You need to create a profile before liking a user.");
        window.location.href = '/CreateProfile';
    }
}

// Handle incoming WebSocket messages
socket.onmessage = function(event) {
    const data = JSON.parse(event.data);

    // Update the notification badge if notification_count is present
    if (data.notification_count !== undefined) {
        updateNotificationBadge(data.notification_count);
    }

    // Display the notification message
    if (data.notification !== undefined) {
        alert(data.notification);
    }
};

// Function to update the notification badge
function updateNotificationBadge(count) {
    const badge = document.getElementById('notification-badge');
    badge.textContent = count;

    if (count > 0) {
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
}


