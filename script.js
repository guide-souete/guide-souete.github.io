document.addEventListener("DOMContentLoaded", function () {
  const arrondissementSelect = document.getElementById("arrondissement");
  const priceRangeSelect = document.getElementById("priceRange");
  let restaurants = [];
  let homepageRestaurants = [];

  // Fetch and parse the best_all_homepage.csv for default homepage listings
  fetch("best_all_homepage.csv")
    .then((response) => response.text())
    .then((csvText) => {
      Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        complete: function (results) {
          homepageRestaurants = results.data;
          updateListings(4); // Update listings with homepage data on initial load
        },
      });
    });

  // Fetch and parse the main restaurants.csv for dropdown filtering
  fetch("corrected_restaurants.csv")
    .then((response) => response.text())
    .then((csvText) => {
      Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        complete: function (results) {
          restaurants = results.data;
        },
      });
    });

  // Event listeners for dropdown changes
  arrondissementSelect.addEventListener("change", function () {
    updateListings(); // Calls updateListings with the default NbRestaurantsDisplay value
  });

  priceRangeSelect.addEventListener("change", function () {
    updateListings(); // Calls updateListings with the default NbRestaurantsDisplay value
  });

  // Function to convert price level integer to price range string
  function priceLevelToString(priceLevel) {
    const priceMapping = { 1: "$", 2: "$$", 3: "$$$", 4: "$$$$" };
    return priceMapping[priceLevel] || "N/A";
  }

  // Function to convert rating float to stars
  function ratingToStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? "★" : "";
    return (
      "★".repeat(fullStars) +
      halfStar +
      "☆".repeat(5 - fullStars - halfStar.length)
    );
  }

  // Function to update restaurant listings based on selections
  function updateListings(NbRestaurantsDisplay = 8) {
    const arrondissement = arrondissementSelect.value;
    const priceRange = priceRangeSelect.value;
    const useHomepageData = !arrondissement && !priceRange;
    const dataset = useHomepageData ? homepageRestaurants : restaurants;

    let filteredRestaurants = dataset.filter((restaurant) => {
      const hasRequiredProperties =
        restaurant.Arrondissement &&
        "Price" in restaurant &&
        "Rating" in restaurant &&
        "Score" in restaurant &&
        "NumberReviews" in restaurant &&
        "GoogleMapsPlaceID" in restaurant;
      if (!hasRequiredProperties) return false;

      if (!useHomepageData) {
        const arrondissementMatch =
          !arrondissement || restaurant.Arrondissement.includes(arrondissement);
        const priceRangeMatch =
          !priceRange || priceLevelToString(restaurant.Price) === priceRange;
        return arrondissementMatch && priceRangeMatch;
      }
      return true;
    });

    // Sort by Score in descending order and slice to get top 10 restaurants
    filteredRestaurants = filteredRestaurants
      .sort((a, b) => b.Score - a.Score)
      .slice(0, NbRestaurantsDisplay);

    const listings = document.getElementById("restaurants");
    listings.innerHTML = ""; // Clear current listings

    // Populate listings with filtered data
    filteredRestaurants.forEach((restaurant) => {
      const googleMapsUrl = `https://www.google.com/maps/place/?q=place_id:${restaurant.GoogleMapsPlaceID}`;
      const div = document.createElement("div");
      div.className = "restaurant";
      div.innerHTML = `
      <img src="${
        restaurant.ImageURL
      }" alt="Restaurant Image" onerror="this.onerror=null; this.src='https://a.storyblok.com/f/123939/2240x1260/ceebc9c756/emplacement-restaurant.png'">
              <h2>${restaurant.Name}</h2>
              <p>Address: ${restaurant.Address || "N/A"}</p>
              <p>${restaurant.Arrondissement} Arrondissement</p>
              <p>Rating: ${ratingToStars(
                restaurant.Rating
              )} (${restaurant.Rating.toFixed(1)}) from ${
        restaurant.NumberReviews
      } reviews</p>
              <p>Price Range: ${priceLevelToString(restaurant.Price)}</p>
              <a href="${googleMapsUrl}" target="_blank">View on Map</a>
          `;
      listings.appendChild(div);
    });
  }
});
