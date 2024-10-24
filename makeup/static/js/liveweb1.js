var map;
var geocoder;
var infoWindow;
var liveUsersMarkers = []; // Array to store markers for live users
var isGeolocationAvailable = false; // Flag for geolocation availability



// Check if the current environment is production
var isProduction = window.location.hostname === "www.sixeveings.com";

// Set the WebSocket URL based on the environment
var socketUrl = isProduction ?
    'wss://www.sixeveings.com/ws/live/' :
    'ws://' + window.location.host + '/ws/live/';
var socket = new WebSocket(socketUrl);


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
    if (window.liveUsersData && window.liveUsersData.length > 0) {
        window.liveUsersData.forEach(user => {
            console.log('Checking user:', user);
            if (user.latitude && user.longitude) {
                createLiveUserMarker(user);
            } else {
                console.error(`User ${user.name} has invalid coordinates: Lat: ${user.latitude}, Lng: ${user.longitude}`);
            }
        });
    } else {
        console.warn('No live users data available or it is empty.');
    }
}

// Function to create content for InfoWindow
function getInfoWindowContent(user, formattedAddress) {
    return `
      <div>
        <p class="info-window-text">
          <img src="${user.image_url || ''}" alt="Profile Image" style="width: 80px; height: 80px; border-radius:50%; object-fit: cover; border: 1px solid #ddd; cursor:pointer" onclick="openModal('${user.image_url || ''}')">
        </p>
        <p class="info-window-text"><strong>${user.gender.toLowerCase() === 'female' ? 'Female' : 'Male'}</strong></p>
        <p class="info-window-text">Address: ${formattedAddress || 'N/A'}</p>
        <p class="info-window-text">Name: ${user.name || 'N/A'}</p>
        <p class="info-window-text">Bio: ${user.bio || 'N/A'}</p>
        <p class="info-window-text">Height: ${user.height || 'N/A'} cm</p>
        <p class="info-window-text">Weight: ${user.weight || 'N/A'} kg</p>
         <button class="w3-btn w3-white w3-border w3-border-red w3-round-large"
                 id="likeButton"
                onclick="likeUser(${window.userData.id}, ${user.id}, '${user.name}')">
            Send a Like
        </button>
      </div>
    `;
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
        position: { lat: user.latitude, lng: user.longitude },
        map: map,
        icon: svgMarker,
        label: {
            text: user.gender.toLowerCase() === 'female' ? 'F' : 'M',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
        },
    });

    console.log(`Marker created for user: ${user.name} at Lat: ${user.latitude}, Lng: ${user.longitude}`);

    // Geocode the user's position to get the address
    geocodeLatLng(user.latitude, user.longitude, (formattedAddress) => {
        // Add event listener for mouseover to show info window
        liveMarker.addListener("mouseover", () => {
            const infoWindowContent = getInfoWindowContent(user, formattedAddress);
            console.log("Opening InfoWindow with content on hover:", infoWindowContent);
            infoWindow.setContent(infoWindowContent);
            infoWindow.open(map, liveMarker);
        });

        // Add event listener for click to also show info window
        liveMarker.addListener("click", () => {
            const infoWindowContent = getInfoWindowContent(user, formattedAddress);
            console.log("Opening InfoWindow with content on click:", infoWindowContent);
            infoWindow.setContent(infoWindowContent);
            infoWindow.open(map, liveMarker);
        });
    });

    // Store the marker in the liveUsersMarkers array
    liveUsersMarkers.push(liveMarker);
}

// Define geocodeLatLng function
function geocodeLatLng(lat, lng, callback) {
    const latlng = { lat: lat, lng: lng };

    geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === "OK") {
            if (results[0]) {
                const formattedAddress = results[0].formatted_address;
                callback(formattedAddress); // Call the callback with the address
            } else {
                console.log("No results found");
                callback(null); // Call with null if no address is found
            }
        } else {
            console.error("Geocoder failed due to:", status);
            callback(null); // Call with null if geocoding fails
        }
    });
}

// Function that opens the image modal when it is clicked
function openModal(imageSrc) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    modalImage.src = imageSrc;
    modal.style.display = 'flex';
}

// Function to close the image modal
function closeModal() {
    const modal = document.getElementById('imageModal');
    modal.style.display = 'none';
}

// Main function to handle the like action
function likeUser(likerId, likedUserId, likedUserName) {
    // Check if the user has a profile before sending the like
    checkUserProfile(likerId, likedUserId, likedUserName);
}

function checkUserProfile(likerId, likedUserId, likedUserName) {
    // Make sure likerHasProfile is defined
    $.post(likerHasProfile, // Adjust the URL based on your Django URL configuration
        {
            userId: likerId
        },
        function(data) {
            if (data.hasProfile) {
                const likeData = {
                    type: 'like',
                    likerId: likerId,
                    likedUserId: likedUserId,
                };

                // Send the like event through WebSocket
                socket.send(JSON.stringify(likeData));
                // Update UI immediately
                updateLikeUI(`You liked ${likedUserName}`);
            } else {
               alert(`You need to create a profile before liking ${likedUserName}.`);
                window.location.href = '/CreateProfile';
            }
        }
    ).fail(function() {
        alert("Error checking profile status. Please try again.");
    });
}

function updateLikeUI(message) {
    const notificationDiv = document.getElementById('notificationMessage');
    const messageDiv = document.getElementById('message');

    // Set the message
    messageDiv.textContent = message;

    // Show the notification
    notificationDiv.style.display = 'block';

    // Hide it after 3 seconds
    setTimeout(function() {
        notificationDiv.style.display = 'none';
    }, 2500);
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
        // Show the notification to the user (you may want to add a function for this)
        console.log(data.notification); // Log or display this notification appropriately
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


// Call initMap when the window has finished loading
window.onload = initMap;
