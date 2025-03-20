document.addEventListener('DOMContentLoaded', function() {
    console.log('Script is running'); // Debugging: Confirm script execution

    const hostingPlansSection = document.getElementById('hosting-plans');
    if (!hostingPlansSection) {
        console.error('Error: #hosting-plans section not found in the DOM'); // Debugging: Check if section exists
        return;
    }

    fetch('./data.csv')
        .then(response => {
            console.log(response); // Check if the response is OK
            return response.text();
        })
        .then(csv => {
            console.log(csv); // Check the content of the CSV file

            // Use PapaParse to parse the CSV data
            const parsedData = Papa.parse(csv, {
                header: true, // Use the first row as headers
                skipEmptyLines: true // Skip empty lines
            });

            if (parsedData.errors.length > 0) {
                console.error('Error parsing CSV:', parsedData.errors);
                return;
            }

            const data = parsedData.data; // Parsed rows as objects
            console.log(data); // Debugging: Log the parsed data

            // Helper function to calculate ratings
            function calculateRating(planData) {
                const priceScore = 5 - Math.min(5, parseFloat(planData['Price'].replace(' EUR', '')) / 10); // Lower price = higher score
                const storageScore = Math.min(5, parseFloat(planData['Storage'].replace(' GB', '').replace(' TB', '')) / 100); // Normalize storage
                const bandwidthScore = planData['Bandwidth'] === 'Unlimited' ? 5 : Math.min(5, parseFloat(planData['Bandwidth'].replace(' GB', '').replace(' TB', '')) / 1000);
                const serviceStatusScore = parseFloat(planData['Service Status'].replace('% uptime', '')) / 100 * 5; // Normalize uptime
                const userReviewsScore = (parseFloat(planData['Trustpilot Rating']) + parseFloat(planData['Google Business Ratings']) + parseFloat(planData['HostAdvice Ratings'])) / 3;

                // Weighted average (excluding Other Features and Company Info)
                return (
                    priceScore * 0.25 +
                    storageScore * 0.2 +
                    bandwidthScore * 0.2 +
                    serviceStatusScore * 0.1 +
                    userReviewsScore * 0.25
                ).toFixed(1); // Round to 1 decimal place
            }

            let globalHighestRatedPlan = null;

            // Group packages by category
            const categories = {};
            data.forEach(planData => {
                const category = planData['Category'] || 'Uncategorized'; // Ensure category is defined
                if (!categories[category]) {
                    categories[category] = [];
                }
                planData['Rating'] = calculateRating(planData); // Add rating to plan data
                categories[category].push(planData);

                // Track the global highest-rated plan
                if (!globalHighestRatedPlan || parseFloat(planData['Rating']) > parseFloat(globalHighestRatedPlan['Rating'])) {
                    globalHighestRatedPlan = planData;
                }
            });

            // Define descriptions for each category
            const categoryDescriptions = {
                "Shared Hosting": "Affordable hosting for small websites and blogs.",
                "WordPress Hosting": "Optimized hosting for WordPress websites.",
                "VPS Servers": "Virtual private servers for more control and flexibility.",
                "Dedicated Server": "High-performance servers for large-scale projects.",
                "SSL Certificates": "Secure your website with SSL encryption.",
                "Domain Names": "Register and manage your domain names."
            };

            // Render categories and their packages
            for (const [category, plans] of Object.entries(categories)) {
                const categoryElement = document.createElement('div');
                categoryElement.classList.add('category');
                categoryElement.innerHTML = `
                    <h2>${category}</h2>
                    <p>${categoryDescriptions[category] || "Explore our hosting options."}</p> <!-- Add description -->
                `;
                hostingPlansSection.appendChild(categoryElement);

                let highestRatedPlan = null;
                let highestRatedElement = null;

                plans.forEach((planData, index) => {
                    const uniqueId = `${category}-${index}`; // Unique ID for each plan
                    const planElement = document.createElement('div');
                    planElement.classList.add('hosting-plan');
                    planElement.innerHTML = `
                        <div class="plan-summary">
                            <h3>${planData['Company Name']} - ${planData['Plan Name']}</h3>
                            <p class="price">Price: ${planData['Price']} - Rating: ${planData['Rating']} ★</p>
                            <button class="details-button" data-index="${uniqueId}">Detalii</button>
                        </div>
                        <div class="plan-details" id="details-${uniqueId}" style="display: none;">
                            <p><strong>Storage:</strong> ${planData['Storage']}</p>
                            <p><strong>Bandwidth:</strong> ${planData['Bandwidth']}</p>
                            <p><strong>Other Features:</strong> ${planData['Features'] || 'Not specified'}</p>
                            <p><strong>Service Status:</strong> ${planData['Service Status']}</p>
                            <p><strong>Company Info:</strong> ${planData['Company Info']}</p>
                            <p><strong>Trustpilot Rating:</strong> ${planData['Trustpilot Rating']}</p>
                            <p><strong>Google Business Ratings:</strong> ${planData['Google Business Ratings']}</p>
                            <p><strong>HostAdvice Ratings:</strong> ${planData['HostAdvice Ratings']}</p>
                            <p><strong>Contact:</strong> ${planData['Contact']}</p>
                        </div>
                    `;
                    categoryElement.appendChild(planElement);

                    // Track the highest-rated plan in the category
                    if (!highestRatedPlan || parseFloat(planData['Rating']) > parseFloat(highestRatedPlan['Rating'])) {
                        highestRatedPlan = planData;
                        highestRatedElement = planElement;
                    }

                    // Add event listener to expand card on click
                    planElement.addEventListener('click', function() {
                        const detailsElement = document.getElementById(`details-${uniqueId}`);
                        if (detailsElement) {
                            detailsElement.style.display = detailsElement.style.display === 'none' ? 'block' : 'none';
                        }
                    });

                    // Prevent event propagation for the "Detalii" button
                    const detailsButton = planElement.querySelector('.details-button');
                    detailsButton.addEventListener('click', function(event) {
                        event.stopPropagation();
                        showPopup(planData);
                    });
                });

                // Highlight the highest-rated plan in the category
                if (highestRatedElement) {
                    highestRatedElement.classList.add('highest-rated-card');

                    // Add badge for the category's highest-rated plan
                    const badge = document.createElement('div');
                    badge.classList.add('best-badge');
                    badge.textContent = `The Best ${category} Now`; // Include category name in badge text
                    highestRatedElement.style.position = 'relative'; // Ensure the badge is positioned correctly
                    highestRatedElement.appendChild(badge);
                }
            }

            console.log(hostingPlansSection.innerHTML); // Debugging: Log the final HTML content
        })
        .catch(error => {
            console.error('Error fetching or processing CSV:', error); // Debugging: Log fetch or processing errors
        });
});

function showPopup(planData) {
    const popup = document.getElementById('popup');
    const popupContent = document.getElementById('popup-content');
    if (popup && popupContent) {
        popupContent.innerHTML = `
            <h2>Detalii furnizor ${planData['Company Name']}</h2>
            <p><strong>Status servicii:</strong> ${planData['Service Status']}</p>
            <p><strong>Informații companie:</strong> ${planData['Company Info']}</p>
            <p><strong>Rating Trustpilot:</strong> ${planData['Trustpilot Rating']}</p>
            <p><strong>Google Business Ratings:</strong> ${planData['Google Business Ratings']}</p>
            <p><strong>HostAdvice Ratings:</strong> ${planData['HostAdvice Ratings']}</p>
            <p><strong>Contact:</strong> ${planData['Contact']}</p>
        `;
        popup.style.display = 'flex'; // Ensure popup is displayed
    }
}

document.getElementById('popup-close').addEventListener('click', function() {
    const popup = document.getElementById('popup');
    if (popup) {
        popup.style.display = 'none'; // Hide the popup
    }
});