var map;
var userLat;
var userLng;
var geocoder;
var isGeolocationAvailable = false;
var liveUsersMarkers = []; // Array to store markers for live users
var userMarker; // Variable to hold the user's marker
var userMarkerCreated = false; // Flag to check if user marker is already created
var locationUpdateInterval; // To hold the interval ID for updating location

var socket = new WebSocket('ws://' + window.location.host + '/ws/live/');

// Default location coordinates (for fallback)
const defaultLat = 0.3476; // Latitude for Kampala
const defaultLng = 32.5825; // Longitude for Kampala

function initMap() {
    geocoder = new google.maps.Geocoder();
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
        startLocationUpdates(); // Start updating location
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

// Function to start updating user's location every few seconds
function startLocationUpdates() {
    locationUpdateInterval = setInterval(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                userLat = position.coords.latitude;
                userLng = position.coords.longitude;
                updateUserLocation(userLat, userLng); // Update user location on the server
                if (userMarker) {
                    userMarker.setPosition(new google.maps.LatLng(userLat, userLng)); // Update marker position
                }
            }, error => {
                console.error("Error getting geolocation:", error);
            }, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            });
        }
    }, 10000); // Update every 10 seconds
}

// Function to update user's location on the server
function updateUserLocation(lat, lng) {
    $.post(updateLocation, { // Replace with your Django view URL
        latitude: lat,
        longitude: lng,
        user_id: window.userData.id,
    }, function(response) {
        console.log('Location updated:', response);
    });
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

    userMarker = new google.maps.Marker({
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
                // Optionally do something with the address here
            } else {
                console.log("No results found");
            }
        } else {
            console.error("Geocoder failed due to:", status);
        }
    });
}

// Function to handle when the user stops being live
function handleUserLeaveLive() {
    if (window.userData && window.userData.is_live) {
        // Remove the marker and update user data
        if (userMarker) {
            userMarker.setMap(null);
        }
        window.userData.is_live = false;

        updateUserLiveStatus(false);
        clearInterval(locationUpdateInterval); // Stop updating location

        // Notify user they have left live
        showNotification("You are no longer live");
    }
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

// Update the user's live status on the server
function updateUserLiveStatus(isLive){
    $.post(stopLive, {
        is_live: isLive,
        user_id: window.userData.id
    }, function(data){
        console.log('Live status updated:', data);
    });
}
