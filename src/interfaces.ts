export interface Restaurant {
  _id: string;
  companyId: number;
  name: string;
  address: string;
  postalCode: string;
  city: string;
  phone: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
  company: string;
}

export interface Course {
  name: string;
  price: string;
  diets: string;
}

export interface DailyMenu {
  courses: Course[];
}

export interface WeeklyMenu {
  days: {
    date: string;
    courses: Course[];
  }[];
}

export interface User {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  favouriteRestaurant?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  message?: string;
}