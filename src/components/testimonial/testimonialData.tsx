type testimonialType = {
  id: number;
  user: {
    name: string;
    position: string;
    image: string;
  };
  review: string;
};

export const testimonialData: testimonialType[] = [
  {
    id: 1,
    user: {
      name: "Arjun Mehta",
      position: "Frontend Developer, Bengaluru",
      image: "/images/testimonial/user-1.png",
    },
    review:
      "I came from a tier-2 college and needed work I could actually show. The React track gave me three real projects, and I switched to a product company in Bengaluru within four months.",
  },
  {
    id: 2,
    user: {
      name: "Priya Nair",
      position: "Performance Marketer, Kochi",
      image: "/images/testimonial/user-2.png",
    },
    review:
      "The analytics course paid for itself in my first quarter. I now run campaigns for a D2C brand and can defend every number I report to the founders.",
  },
  {
    id: 3,
    user: {
      name: "Rohan Deshmukh",
      position: "UI/UX Designer, Pune",
      image: "/images/testimonial/user-3.png",
    },
    review:
      "I went from a total beginner to a portfolio that got me hired at a Pune studio. The design critiques were blunt in the best way — exactly what I needed.",
  },
  {
    id: 4,
    user: {
      name: "Ananya Iyer",
      position: "Data Analyst, Hyderabad",
      image: "/images/testimonial/user-4.png",
    },
    review:
      "Every concept is explained from first principles. The capstone used a genuinely messy dataset, which is what interviews actually test you on.",
  },
  {
    id: 5,
    user: {
      name: "Vikram Singh",
      position: "Product Manager, Gurugram",
      image: "/images/testimonial/user-5.png",
    },
    review:
      "Short, focused modules meant I could finish on my commute. The product analytics path changed how I frame roadmap calls with my engineering team.",
  },
];
