const generateDummyReviews = (vehicleId) => {
    const reviewCount = Math.floor(Math.random() * 5) + 1; // 1 to 5 reviews per vehicle
    const reviews = [];
  
    for (let i = 0; i < reviewCount; i++) {
      reviews.push({
        vehicle: vehicleId,
        rating: Math.floor(Math.random() * 5) + 1,
        title: `Review ${i + 1}`,
        content: `This is a dummy review for the vehicle. It's review number ${i + 1}.`,
        reviewerName: `Reviewer ${i + 1}`,
        createdAt: new Date()
      });
    }
  
    return reviews;
  };
  
  module.exports = { generateDummyReviews };