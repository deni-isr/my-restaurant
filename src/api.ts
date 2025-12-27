import type { LoginResponse, User, Restaurant, DailyMenu, WeeklyMenu } from './interfaces';

const API_URL = 'https://media1.edu.metropolia.fi/restaurant/api/v1';

const getToken = () => localStorage.getItem('token');

const fetchAPI = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error ${response.status}`);
  }
  return response.json();
};

export const api = {
  getRestaurants: () => fetchAPI<Restaurant[]>('/restaurants'),
  
  getDailyMenu: (id: string, lang = 'fi') => 
    fetchAPI<DailyMenu>(`/restaurants/daily/${id}/${lang}`),
    
  getWeeklyMenu: (id: string, lang = 'fi') => 
    fetchAPI<WeeklyMenu>(`/restaurants/weekly/${id}/${lang}`),

  register: (user: Partial<User> & { password: string }) => 
    fetchAPI<{message: string}>('/users', {
      method: 'POST',
      body: JSON.stringify(user)
    }),

  login: (creds: { username: string; password: string }) => 
    fetchAPI<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(creds)
    }),

  updateUser: (data: Partial<User> & { password?: string }) => 
    fetchAPI<User>('/users', {
      method: 'PUT',
      body: JSON.stringify(data)
    })
};