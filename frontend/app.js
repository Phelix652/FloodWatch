// Create the map
const map = L.map("map").setView([16.8409, 96.1735], 7);


// Add map tiles
L.tileLayer(
    "https://tile.openstreetmap.de/{z}/{x}/{y}.png",
    {
        attribution: '&copy; OpenStreetMap contributors'
    }
).addTo(map);

// ========================================
// SELECT LOCATION FROM MAP
// ========================================

map.on("click", function (event) {

    const latitude = event.latlng.lat;
    const longitude = event.latlng.lng;


    // Put coordinates into hidden form fields
    document.getElementById("latitude").value =
        latitude;

    document.getElementById("longitude").value =
        longitude;


    // Show selected coordinates
    document.getElementById("selectedLocation").innerHTML = `
        📍 Selected Location<br>
        Latitude: ${latitude.toFixed(6)}<br>
        Longitude: ${longitude.toFixed(6)}
    `;


    // Show the report form
    document.getElementById("reportForm").style.display =
        "block";

});

// Report form
const reportButton = document.getElementById("reportButton");
const reportForm = document.getElementById("reportForm");


// Show the form
reportButton.addEventListener("click", function () {

    document.getElementById("location").value = "";
    document.getElementById("latitude").value = "";
    document.getElementById("longitude").value = "";
    document.getElementById("severity").value = "Low";
    document.getElementById("waterLevel").value = "";
    document.getElementById("description").value = "";

    reportForm.style.display = "block";

    reportForm.scrollIntoView({
        behavior: "smooth"
    });

});


// Submit report
const submitReport = document.getElementById("submitReport");

submitReport.addEventListener("click", async function () {

    const location =
        document.getElementById("location").value;

    const latitude =
        parseFloat(document.getElementById("latitude").value);

    const longitude =
        parseFloat(document.getElementById("longitude").value);

    const severity =
        document.getElementById("severity").value;

    const waterLevel =
        parseFloat(document.getElementById("waterLevel").value);

    const description =
        document.getElementById("description").value;


    // Check coordinates
    if (
        isNaN(latitude) ||
        isNaN(longitude) ||
        isNaN(waterLevel)
    ) {

        alert("Please enter valid numbers.");

        return;
    }


    // Create the report
    const report = {

        location: location,

        latitude: latitude,

        longitude: longitude,

        severity: severity,

        water_level: waterLevel,

        description: description
    };


    // Send report to backend
    try {

        const response = await fetch(
            "http://127.0.0.1:8000/reports",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(report)
            }
        );


        const data = await response.json();


        console.log("Backend response:", data);


        // Add marker to map
        L.marker([latitude, longitude])
            .addTo(map)
            .bindPopup(`
                <b>🌧️ Flood Report</b><br><br>

                <b>Location:</b> ${location}<br>

                <b>Severity:</b> ${severity}<br>

                <b>Water Level:</b> ${waterLevel} m<br><br>

                ${description}
            `)
            .openPopup();


        alert("Flood report sent to backend!");

        reportForm.style.display = "none";


    } catch (error) {

        console.error(error);

        alert("Could not connect to FloodWatch backend.");

    }

});

// ========================================
// LOAD SAVED REPORTS FROM DATABASE
// ========================================

async function loadReports() {
    try {
        const response = await fetch(
            "http://127.0.0.1:8000/reports"
        );

        const data = await response.json();

        console.log("Saved reports:", data);

        data.reports.forEach(function (report) {

            // Choose marker color
            let markerColor = "gold";

            if (report.severity === "High") {
                markerColor = "red";
            } 
            else if (report.severity === "Medium") {
                markerColor = "orange";
            }

            // Create colored circle marker
            const marker = L.circleMarker(
                [report.latitude, report.longitude],
                {
                    radius: 9,
                    color: markerColor,
                    fillColor: markerColor,
                    fillOpacity: 0.8,
                    weight: 2
                }
            );

            marker
                .addTo(map)
                .bindPopup(`
                    <b>🌧️ Flood Report</b><br><br>

                    <b>Location:</b> ${report.location}<br>

                    <b>Severity:</b> ${report.severity}<br>

                    <b>Water Level:</b> ${report.water_level} m<br><br>

                    ${report.description}
                `);
        });

    } catch (error) {

        console.error(
            "Could not load saved reports:",
            error
        );
    }
}

loadReports();

async function loadStats() {

    try {

        const response = await fetch(
            "http://127.0.0.1:8000/stats"
        );

        const data = await response.json();

        document.getElementById("totalReports").textContent =
            data.total;

        document.getElementById("highReports").textContent =
            data.high;

        document.getElementById("mediumReports").textContent =
            data.medium;

        document.getElementById("lowReports").textContent =
            data.low;

    } catch (error) {

        console.error(
            "Could not load statistics:",
            error
        );
    }
}

loadStats();


// Load reports when page opens
loadReports();