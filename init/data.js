const sampleListings = [
  {
    title: "Seaside Cottage near El Matador",
    description:
      "A bright two-bedroom cottage tucked above the Malibu coast, with a small deck for sunset dinners, a well-equipped kitchen, and a quiet path down toward El Matador Beach. Best for couples, small families, and slow coastal weekends.",
    image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=1200&q=80",
    ],
    price: 18500,
    location: "Malibu",
    country: "United States",
  },
  {
    title: "Brick Loft in SoHo",
    description:
      "Stay in a converted warehouse loft with tall windows, exposed brick, a queen bed alcove, and a compact work corner. Cafes, galleries, subway lines, and late-night food are all within a few minutes on foot.",
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
    ],
    price: 14200,
    location: "New York City",
    country: "United States",
  },
  {
    title: "Aspen Cabin with Mountain Views",
    description:
      "A warm timber cabin set among pine trees with a fireplace, mudroom for ski gear, and wide mountain views from the living room. Downtown Aspen is close enough for dinner, but the house stays peaceful at night.",
    image: "https://images.unsplash.com/photo-1518732714860-b62714ce0c59?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1518732714860-b62714ce0c59?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1200&q=80",
    ],
    price: 16800,
    location: "Aspen",
    country: "United States",
  },
  {
    title: "Restored Farmhouse outside Florence",
    description:
      "A stone farmhouse surrounded by olive trees and vineyards, with terracotta floors, a shaded breakfast terrace, and easy day trips into Florence. The stay feels rural without being isolated.",
    image: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1499002238440-d264edd596ec?auto=format&fit=crop&w=1200&q=80",
    ],
    price: 21400,
    location: "Florence",
    country: "Italy",
  },
  {
    title: "Rainforest Treehouse Studio",
    description:
      "A compact cedar studio raised into the trees with a covered balcony, skylight over the bed, and a kitchenette for simple meals. It is a good base for waterfall hikes, reading, and unplugged weekends.",
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    ],
    price: 9200,
    location: "Portland",
    country: "United States",
  },
  {
    title: "Beach Condo on Playa Delfines",
    description:
      "A breezy apartment with balcony seating, blackout curtains, reliable Wi-Fi, and beach access nearby. Restaurants and the hotel zone are close, while the building itself stays calm and residential.",
    image: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80",
    ],
    price: 13200,
    location: "Cancun",
    country: "Mexico",
  },
  {
    title: "Lake Tahoe A-Frame",
    description:
      "A classic A-frame cabin with a wood stove, board games, canoe storage, and a forested trail that leads toward the lake. It works well for ski trips in winter and quiet lake days in summer.",
    image: "https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1470770903676-69b98201ea1c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80",
    ],
    price: 11800,
    location: "Lake Tahoe",
    country: "United States",
  },
  {
    title: "Hollywood Hills Guest Suite",
    description:
      "A private guest suite with city views, a separate entrance, kitchenette, fast internet, and parking for one car. The location is convenient for studios, hiking trails, and evenings in West Hollywood.",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    ],
    price: 17600,
    location: "Los Angeles",
    country: "United States",
  },
  {
    title: "Verbier Chalet near Medran Lift",
    description:
      "A polished alpine chalet with boot warmers, mountain-facing windows, a deep sofa, and a dining table made for long dinners after skiing. The Medran lift and village shops are a short walk away.",
    image: "https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1517320964276-a002fa203177?auto=format&fit=crop&w=1200&q=80",
    ],
    price: 28600,
    location: "Verbier",
    country: "Switzerland",
  },
  {
    title: "Serengeti Tented Safari Camp",
    description:
      "A comfortable canvas tent with a proper bed, ensuite bathroom, solar lighting, and a shared dining area overlooking the plains. Guided drives can be arranged locally during migration season.",
    image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1200&q=80",
    ],
    price: 32400,
    location: "Serengeti National Park",
    country: "Tanzania",
  },
  {
    title: "Jaipur Haveli Room with Courtyard",
    description:
      "A heritage-style room in a restored haveli with carved details, a shared courtyard, breakfast on request, and quick access to the old city bazaars. It is simple, atmospheric, and walkable.",
    image: "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80",
    ],
    price: 4800,
    location: "Jaipur",
    country: "India",
  },
  {
    title: "Goa Villa near Assagao Cafes",
    description:
      "A relaxed villa with two bedrooms, a shaded veranda, pool access, and scooter parking. It is close to Assagao cafes and Anjuna beaches without sitting directly in the busiest nightlife area.",
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    ],
    price: 7600,
    location: "Goa",
    country: "India",
  },
  {
    title: "Kerala Backwater Houseboat",
    description:
      "A private houseboat drifting through quiet Alleppey canals with a shaded deck, simple ensuite bedroom, fresh local meals, and wide views of coconut palms and village life along the water.",
    image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80",
    ],
    price: 8900,
    location: "Alleppey",
    country: "India",
  },
  {
    title: "Rishikesh Riverside Yoga Retreat",
    description:
      "A peaceful room near the Ganga with a shared yoga deck, mountain air, vegetarian breakfast, and easy access to cafes, suspension bridges, rafting points, and evening aarti by the river.",
    image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80",
    ],
    price: 5200,
    location: "Rishikesh",
    country: "India",
  },
  {
    title: "Udaipur Lakeview Heritage Suite",
    description:
      "A character-filled suite with arched windows, carved furniture, and a terrace looking toward the lake. City Palace, boat rides, rooftop restaurants, and old-city lanes are all close by.",
    image: "https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=80",
    ],
    price: 6900,
    location: "Udaipur",
    country: "India",
  },
  {
    title: "Manali Pinewood Cabin",
    description:
      "A cozy pine cabin above town with a balcony, heater, compact kitchen, and sweeping valley views. It is built for slow mornings, work-from-hills weeks, and easy drives to nearby trails.",
    image: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1518732714860-b62714ce0c59?auto=format&fit=crop&w=1200&q=80",
    ],
    price: 6100,
    location: "Manali",
    country: "India",
  },
  {
    title: "Tokyo Micro Apartment in Shibuya",
    description:
      "A clever compact apartment with a foldaway desk, efficient kitchenette, washer, and quick train access. It is ideal for solo travelers who want a practical base near Shibuya energy.",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
    ],
    price: 9800,
    location: "Tokyo",
    country: "Japan",
  },
  {
    title: "Bali Rice Terrace Villa",
    description:
      "A calm villa near Ubud with a plunge pool, open-air lounge, breakfast patio, and green rice terrace views. It works well for couples, creative breaks, and relaxed scooter days.",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    ],
    price: 12600,
    location: "Ubud",
    country: "Indonesia",
  },
  {
    title: "Paris Attic Studio near Montmartre",
    description:
      "A bright top-floor studio with sloped ceilings, a tiny writing desk, kitchenette, and neighborhood bakery downstairs. Montmartre streets, metro stops, and small wine bars are nearby.",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
    ],
    price: 15400,
    location: "Paris",
    country: "France",
  },
  {
    title: "Cape Town Ocean View Apartment",
    description:
      "A modern apartment with a balcony facing the Atlantic, secure parking, fast Wi-Fi, and easy access to Sea Point walks, beaches, cafes, and day trips toward Table Mountain.",
    image: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80",
    ],
    price: 11200,
    location: "Cape Town",
    country: "South Africa",
  },
];

module.exports = { data: sampleListings };
