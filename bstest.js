



const canvas = document.getElementById('constellation-lines');
const ctx = canvas.getContext('2d');
const starMap = document.querySelector('.star-map');
const infoBox = document.getElementById('phase-info');
window.addEventListener('load', () => {
    // Check if the device is a mobile device or tablet
    if (/Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent)) {
        // Check the orientation using window.orientation (older approach)
        const orientation = window.orientation !== undefined ? window.orientation : screen.orientation.angle;

        if (orientation === 0) {
            console.log('Portrait Mode');
            starMap.style.visibility = "hidden";
            scrambleText(infoBox, `Please rotate your screen.`);
        } else if (orientation === 90 || orientation === -90) {
            console.log('Landscape Mode');
            starMap.style.visibility = "visible";
        } else {
            console.log('Unknown Orientation');
        }

        window.screen.orientation.addEventListener("change", function(e) {
            const orientation = window.screen.orientation.angle; // Get the current orientation angle

            if (orientation === 0) {
                console.log('Portrait Mode');
                starMap.style.visibility = "hidden";
                scrambleText(infoBox, `Please rotate your screen.`);
            } else if (orientation === 90 || orientation === -90) {
                scrambleText(infoBox, `Thank you.`);
                setTimeout(() => location.reload(), 2000); // Fixed the timeout syntax
            } else {
                console.log('Unknown Orientation');
            }

            // This function will be called when the screen orientation changes.
            console.log("Orientation changed to:", window.screen.orientation.type);
        });
    } else {
        console.log('Not a mobile device, ignoring orientation change events.');
    }
});
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let phases = [];
const stars = [];
const starsByPhase = {};

// Fetch data from info.json
async function fetchPhasesData() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/CNCTD/DATA_DON/refs/heads/main/info.json');
        const data = await response.json();

        // Clear previous phases
        phases.length = 0;

        // Convert the JSON data into the phases array format
        Object.keys(data).forEach(phaseCategory => {
            const phaseData = data[phaseCategory];
            Object.keys(phaseData).forEach(phaseName => {
                const phase = phaseData[phaseName];
                phases.push({
                    name: phaseName,
                    category: phaseCategory,
                    secret: phase.secret || null,
                    creator: phase.creator || "Unknown", // Adding creator
                    info: phase.info || "No additional info", // Adding info
                    image: phase.image || null // Optional image URL
                });
            });
        });

        generateStars(); // Now that the phases are loaded, generate stars
        stars.forEach(({ star }) => randomizeStarAnimation(star));  // Apply random animations to the stars
        addStarEvents(); // Add event listeners to the stars
    } catch (error) {
        console.error('Error fetching phase data:', error);
    }
}


// Generate random stars and assign them to phases
function generateStars() {
    const margin = 50; // Margin from the edges of the screen

    for (const phase of phases) {
        const star = document.createElement('div');
        star.classList.add('star');

        // Ensure stars are within canvas bounds minus the margin
        const x = Math.random() * (canvas.width - margin * 2) + margin;
        const y = Math.random() * (canvas.height - margin * 2) + margin;
        star.style.left = `${x}px`;
        star.style.top = `${y}px`;
        const size = Math.random() * (12 - 4) + 4; // Random value between 4px and 8px
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        // Add phase data
        star.dataset.phase = phase.category;
        star.dataset.name = phase.name;

        // Append star to DOM and track it
        starMap.appendChild(star);
        stars.push({ star, x, y, phase });

        // Group stars by phase category
        if (!starsByPhase[phase.category]) {
            starsByPhase[phase.category] = [];
        }
        starsByPhase[phase.category].push(star);
    }
}




// Function to close the glassbox/modal and preserve infoBox visibility
function closeGlassBox() {
    const glassBox = document.querySelector('.post-container');
    const overlay = document.querySelector('.overlay');

    if (glassBox) {
            requestAnimationFrame(() => {
                glassBox.style.animation = 'flipOut 1.6s ease-out forwards';
                overlay.style.animation = 'flipOut 1.6s ease-out forwards';
            });
            setTimeout(function(){
                overlay.remove();
                glassBox.remove();
            }, 600);
            
        

        
    }
}

// Create a glass box without affecting the infoBox visibility
function createGlassBox(phase) {
    // Find modal elements
    const modal = document.getElementById('glassBoxModal');
    const modalBody = modal.querySelector('.modal-body');

    // Update modal content dynamically
    modalBody.innerHTML = `
        <div class="d-flex flex-column flex-md-row">
            <div class="left-section flex-grow-1 pe-md-3">
                <p class="mb-2 text-dark lead">${phase.info}</p>
                <p class="signature text-dark">${phase.creator}</p>
            </div>
            <div class="right-section text-right">
                ${phase.image ? `<img src="${phase.image}" class="img-fluid rounded ragged stamp" alt="Phase image">` : ''}
                <img class="address" src="https://github.com/CNCTD/AIRDECO/blob/main/tmeyegrey-removebg-preview.png?raw=true" >
            </div>
        </div>
    `;

    // Show the modal using Bootstrap's modal API
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
}

// Get star position relative to canvas
function getStarCanvasPosition(star) {
    const rect = star.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    return {
        x: rect.left - canvasRect.left + rect.width / 2,
        y: rect.top - canvasRect.top + rect.height / 2,
    };
}

// Draw lines connecting stars in the same phase
function drawPhaseConnections(phaseStars) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;

    ctx.beginPath();
    phaseStars.forEach((star, index) => {
        const { x, y } = getStarCanvasPosition(star);
        index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
}

function scrambleText(element, newText) {
    const chars = "!@#$%^&*()_+~|}{[]\:;?><,./-=";
    let intervalId;
    let iteration = 0;

    const originalText = element.textContent;
    const textLength = Math.max(originalText.length, newText.length);

    function updateText() {
        let currentText = "";
        for (let i = 0; i < textLength; i++) {
            if (i < iteration) {
                currentText += newText.charAt(i) || "";
            } else {
                currentText += chars.charAt(Math.floor(Math.random() * chars.length));
            }
        }
        element.textContent = currentText;

        if (iteration >= textLength) {
            clearInterval(intervalId);
        } else {
            iteration++;
        }
    }

    intervalId = setInterval(updateText, 50); // Adjust speed here
}

// Add hover and click events to stars
// Add hover and click events to stars
// Add hover and click events to stars
function addStarEvents() {
    stars.forEach(({ star, phase }) => {
        star.addEventListener('mouseover', () => {
            const phaseStars = starsByPhase[phase.category];
            if (phaseStars && phaseStars.length > 1) {
                drawPhaseConnections(phaseStars);
            }
            scrambleText(infoBox, `Room: ${phase.name}`);
        });

        star.addEventListener('mouseout', () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        });

        star.addEventListener('click', () => {
            createGlassBox(phase); // Open modal with phase details
            console.log(phase);
        });
    });
}

// Randomize star animations
function randomizeStarAnimation(star) {
    const duration = (Math.random() * 3 + 2).toFixed(2);
    const delay = (Math.random() * 3).toFixed(2);
    const xOffset = (Math.random() * 10 - 5).toFixed(2);
    const yOffset = (Math.random() * 10 - 5).toFixed(2);

    star.style.animation = `
        drift ${duration}s ${delay}s infinite alternate ease-in-out,
        twinkle ${duration}s ${delay}s infinite ease-in-out
    `;
    star.style.setProperty('--random-x', `${xOffset}px`);
    star.style.setProperty('--random-y', `${yOffset}px`);
}

// Initialize the app
function init() {
    fetchPhasesData(); // Fetch phase data before generating stars and adding events

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const glassBoxModal = document.getElementById('glassBoxModal');
    const modalContent = glassBoxModal.querySelector('.modal-content');

    glassBoxModal.addEventListener('show.bs.modal', () => {
        modalContent.classList.remove('fade-out');
        modalContent.classList.add('flip-in');
    });

    glassBoxModal.addEventListener('hide.bs.modal', () => {
        modalContent.classList.remove('flip-in');
        modalContent.classList.add('fade-out');
    });

    glassBoxModal.addEventListener('hidden.bs.modal', () => {
        // Remove animation classes after hiding the modal
        modalContent.classList.remove('fade-out');
    });
});
let portrait = window.matchMedia("(orientation: portrait)");



// Start the application
init();
