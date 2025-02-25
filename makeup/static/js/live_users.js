var map;
var geocoder;
var infoWindow;
var liveUsersMarkers = []; // Array to store markers for live users
var isGeolocationAvailable = false; // Flag for geolocation availability


// Check if the current environment is production
var isProduction = window.location.hostname === "www.sixevenings.com";

// Set the WebSocket URL based on the environment
var socketUrl = isProduction ?
    'wss://www.sixevenings.com/ws/live/' :
    'ws://' + window.location.host + '/ws/live/';

// Create the WebSocket connection
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

    if (window.liveUsersData && Array.isArray(window.liveUsersData) && window.liveUsersData.length > 0) {
        window.liveUsersData.forEach(user => {
            if (user.latitude && user.longitude) {
                createLiveUserMarker(user);
            } else {
                console.error(`User ${user.name} has invalid coordinates.`);
            }
        });
    } else {
        console.warn("No live users data available.");
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
        <p class="info-window-text">Age: ${user.age || 'N/A'} years</p>
        <p class="info-window-text">Skin Tone: ${user.color || 'N/A'}</p>
        <p class="info-window-text">Bio: ${user.bio || 'N/A'}</p>
         <button class="w3-btn w3-white w3-border w3-border-red w3-round-large"
                 id="likeButton"
                onclick="likeUser(${window.userData.id}, ${user.id}, '${user.name}'); changeButtonStyle();">
            Send a Like
        </button>
      </div>
    `;
}

// Function to create markers for live users
function createLiveUserMarker(user) {
    const profilePicture = user.image_url && user.image_url.trim() !== "" ? user.image_url : "https://via.placeholder.com/70";

    // Create a circular image using Canvas
    const canvas = document.createElement("canvas");
    const size = 100; // Increase the marker size
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    // Create a Promise to load the image and draw it on the canvas
    const loadImage = new Promise((resolve, reject) => {
        const img = new Image();
        img.src = profilePicture;
        img.crossOrigin = "anonymous"; // Prevent CORS issues

        img.onload = () => {
            // Draw a circular shape
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();

            // Draw the image on the canvas
            ctx.drawImage(img, 0, 0, size, size);

            // Resolve the Promise with the canvas data URL
            resolve(canvas.toDataURL());
        };

        img.onerror = (error) => {
            reject(error); // Reject if image fails to load
        };
    });

    // Once the image is loaded, create the marker
    loadImage
        .then((dataUrl) => {
            // Adjust marker position if multiple markers are at the same location
            let position = { lat: user.latitude, lng: user.longitude };
            let offset = 0;
            liveUsersMarkers.forEach(marker => {
                const existingPosition = marker.getPosition();
                const distance = google.maps.geometry.spherical.computeDistanceBetween(existingPosition, position);

                if (distance < 10) { // If markers are too close, offset them
                    offset += 0.0013; // Small offset for each marker
                    position = { lat: user.latitude + offset, lng: user.longitude + offset };
                }
            });

            // Set the marker
            const liveMarker = new google.maps.Marker({
                position: position,  // Use adjusted position if necessary
                map: map,
                icon: {
                    url: dataUrl, // Use the data URL generated from the canvas
                    scaledSize: new google.maps.Size(60, 60), // Increase image size here
                    anchor: new google.maps.Point(25, 25), // Adjust center point for larger size
                },
            });

            console.log(`Marker created for ${user.name} with rounded image.`);

            // Show info window when marker is hovered or clicked
            geocodeLatLng(user.latitude, user.longitude, (formattedAddress) => {
                const infoWindowContent = getInfoWindowContent(user, formattedAddress);

                liveMarker.addListener("mouseover", () => {
                    infoWindow.setContent(infoWindowContent);
                    infoWindow.open(map, liveMarker);
                });

                liveMarker.addListener("click", () => {
                    infoWindow.setContent(infoWindowContent);
                    infoWindow.open(map, liveMarker);
                });
            });

            // Store marker
            liveUsersMarkers.push(liveMarker);
        })
        .catch((error) => {
            console.error("Error loading image:", error);
        });
}


//function createLiveUserMarker(user) {
//    // Ensure gender data is available and in lowercase
//    const userGender = user.gender ? user.gender.toLowerCase() : '';
//
//    // Set marker color based on gender
//    const markerColor = userGender === 'female' ? '#DB4437' : '#1717A7'; // Red for females, blue for males
//
//    // Define an SVG marker
//    const svgMarker = {
//        path: "M12 2C6.48 2 2 6.48 2 12c0 5.25 10 16 10 16s10-10.75 10-16c0-5.52-4.48-10-10-10z",
//        fillColor: markerColor,
//        fillOpacity: 1,
//        strokeWeight: 0,
//        scale: 1.8,
//        anchor: new google.maps.Point(12, 24),
//        labelOrigin: new google.maps.Point(12, 10),
//    };
//
//    // Create a marker position object
//    let position = { lat: user.latitude, lng: user.longitude };
//
//    // If there are already other markers at the same position, adjust the position slightly
//    let offset = 0;
//    liveUsersMarkers.forEach(marker => {
//        const existingPosition = marker.getPosition();
//        const distance = google.maps.geometry.spherical.computeDistanceBetween(existingPosition, position);
//
//        if (distance < 10) { // Check if the markers are within 10 meters of each other
//            offset += 0.0013; // Increase this value for more spacing
//            position = { lat: user.latitude + offset, lng: user.longitude + offset };
//        }
//    });
//
//    const liveMarker = new google.maps.Marker({
//        position: position,
//        map: map,
//        icon: svgMarker,
//        label: {
//            text: userGender === 'female' ? 'F' : 'M',
//            color: 'white',
//            fontSize: '14px',
//            fontWeight: 'bold',
//        },
//    });
//
//    console.log(`Marker created for ${user.name} at [Lat: ${position.lat}, Lng: ${position.lng}], Gender: ${userGender}`);
//
//    // Geocode user's coordinates to get an address
//    geocodeLatLng(user.latitude, user.longitude, (formattedAddress) => {
//        const infoWindowContent = getInfoWindowContent(user, formattedAddress);
//
//        // Show info window on hover
//        liveMarker.addListener("mouseover", () => {
//            infoWindow.setContent(infoWindowContent);
//            infoWindow.open(map, liveMarker);
//        });
//
//        // Show info window on click
//        liveMarker.addListener("click", () => {
//            infoWindow.setContent(infoWindowContent);
//            infoWindow.open(map, liveMarker);
//        });
//    });
//
//    // Store marker for potential future updates
//    liveUsersMarkers.push(liveMarker);
//}


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
    }, 2800);
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

function changeButtonStyle() {
    const button = document.getElementById('likeButton');
    button.style.setProperty('background-color', '#00aaff', 'important'); // Set to your chosen blue color
    button.style.setProperty('color', 'white', 'important'); // Set text color to white
    button.style.setProperty('font-weight', 'bold', 'important'); // Make the text bold
    button.style.setProperty('border-color', 'darkblue', 'important'); // Change border color if desired
    button.innerText = 'Like Sent'; // Change button text
}


// Call initMap when the window has finished loading
window.onload = initMap;
