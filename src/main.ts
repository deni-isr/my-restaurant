import type { Restaurant, User } from './interfaces';
import { api } from './api';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// --- State Variables ---
let restaurants: Restaurant[] = [];
let favorites: string[] = JSON.parse(localStorage.getItem('favorites') || '[]');
let currentUser: User | null = JSON.parse(localStorage.getItem('user') || 'null');
let map: mapboxgl.Map | null = null;
let isLoginMode = true;

// DOM Elements
const homeSection = document.getElementById('home-section') as HTMLElement;
const profileSection = document.getElementById('profile-section') as HTMLElement;
const loginModal = document.getElementById('login-modal') as HTMLDialogElement;
const menuModal = document.getElementById('menu-modal') as HTMLDialogElement;

// --- Helper Functions ---

const checkAuth = () => {
    currentUser = JSON.parse(localStorage.getItem('user') || 'null');
    const navLogin = document.getElementById('nav-login');
    const navLogout = document.getElementById('nav-logout');
    const navProfile = document.getElementById('nav-profile');

    if (currentUser) {
        navLogin?.classList.add('hidden');
        navLogout?.classList.remove('hidden');
        navProfile?.classList.remove('hidden');
        updateProfileUI();
    } else {
        navLogin?.classList.remove('hidden');
        navLogout?.classList.add('hidden');
        navProfile?.classList.add('hidden');
    }
};

const toggleFavorite = (id: string) => {
    if (favorites.includes(id)) {
        favorites = favorites.filter(fav => fav !== id);
    } else {
        favorites.push(id);
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderList(restaurants);
};

// --- Map Logic ---

const initMap = async () => {
    mapboxgl.accessToken = 'pk.eyJ1IjoiaWxra2FtdGsiLCJhIjoiY20xZzNvMmJ5MXI4YzJrcXpjMWkzYnZlYSJ9.niDiGDLgFfvA2DMqxbB1QQ';

    map = new mapboxgl.Map({
        container: 'map-container',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [24.93, 60.17], // Helsinki coordinates
        zoom: 12,
    });

    restaurants.forEach((restaurant) => {
        new mapboxgl.Marker()
            .setLngLat(restaurant.location.coordinates)
            .setPopup(
                new mapboxgl.Popup().setHTML(
                    `<h3>${restaurant.name}</h3><p>${restaurant.address}</p>`
                )
            )
            .addTo(map!);
    });
};

// --- UI Rendering ---

const renderList = (items: Restaurant[]) => {
    const grid = document.querySelector('.restaurant-grid') as HTMLElement;
    grid.innerHTML = '';

    items.forEach((restaurant) => {
        const div = document.createElement('div');
        div.classList.add('restaurant-card');

        const isFav = favorites.includes(restaurant._id);
        const starClass = isFav ? 'active' : '';

        div.innerHTML = `
            <button class="fav-btn ${starClass}" data-id="${restaurant._id}">★</button>
            <h3>${restaurant.name}</h3>
            <p>📍 ${restaurant.address}, ${restaurant.city}</p>
            <p>🏢 ${restaurant.company}</p>
            <button class="btn-menu">🍽️ View Menu</button>
        `;

        // Favorite Button Logic
        div.querySelector('.fav-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(restaurant._id);
        });

        // Menu Button Logic
        div.querySelector('.btn-menu')?.addEventListener('click', () => {
            openMenuModal(restaurant);
        });

        grid.appendChild(div);
    });
};

const openMenuModal = async (restaurant: Restaurant) => {
    const menuTitle = document.querySelector('#menu-modal h2') as HTMLElement;
    const menuContent = document.querySelector('#menu-content') as HTMLElement;

    menuTitle.innerText = restaurant.name;
    menuContent.innerHTML = '<p>Loading menu...</p>';
    
    menuModal.showModal();

    try {
        const dailyMenu = await api.getDailyMenu(restaurant._id, 'fi');
        renderMenu(dailyMenu.courses);
    } catch (error) {
        menuContent.innerHTML = '<p>No menu available for today.</p>';
    }
};

const renderMenu = (courses: any[]) => {
    const menuContent = document.querySelector('#menu-content') as HTMLElement;
    menuContent.innerHTML = '';

    if (!courses || courses.length === 0) {
        menuContent.innerHTML = '<p>No courses found.</p>';
        return;
    }

    const table = document.createElement('table');
    table.classList.add('menu-table');

    courses.forEach(course => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div><strong>${course.name}</strong></div>
                <div style="font-size: 0.85rem; color: #666;">${course.diets || ''}</div>
            </td>
            <td class="price">${course.price || ''}</td>
        `;
        table.appendChild(tr);
    });

    menuContent.appendChild(table);
};

// --- Profile Logic ---

const updateProfileUI = () => {
    if (!currentUser) return;
    
    const usernameEl = document.getElementById('profile-username') as HTMLElement;
    const emailInput = document.getElementById('profile-email') as HTMLInputElement;
    const avatarImg = document.getElementById('profile-avatar') as HTMLImageElement;

    usernameEl.innerText = currentUser.username;
    emailInput.value = currentUser.email;

    // Load avatar from localStorage
    const savedAvatar = localStorage.getItem('user-avatar');
    if (savedAvatar) {
        avatarImg.src = savedAvatar;
    }

    // Render favorite list text
    const favList = document.getElementById('favorites-ul') as HTMLElement;
    favList.innerHTML = '';
    const favRestaurants = restaurants.filter(r => favorites.includes(r._id));

    if (favRestaurants.length === 0) {
        favList.innerHTML = '<li>No favorites yet.</li>';
    } else {
        favRestaurants.forEach(r => {
            const li = document.createElement('li');
            li.textContent = r.name;
            favList.appendChild(li);
        });
    }
};

// --- Event Listeners ---

document.getElementById('nav-home')?.addEventListener('click', () => {
    homeSection.classList.remove('hidden');
    profileSection.classList.add('hidden');
    map?.resize();
});

document.getElementById('nav-profile')?.addEventListener('click', () => {
    homeSection.classList.add('hidden');
    profileSection.classList.remove('hidden');
    updateProfileUI();
});

document.getElementById('nav-login')?.addEventListener('click', () => {
    loginModal.showModal();
});

document.getElementById('nav-logout')?.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    checkAuth();
    homeSection.classList.remove('hidden');
    profileSection.classList.add('hidden');
    alert('You have logged out.');
});

document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
        loginModal.close();
        menuModal.close();
    });
});

const modalTitle = document.querySelector('#login-modal h2') as HTMLElement;
const modalBtn = document.querySelector('#login-form button') as HTMLElement;
const toggleText = document.querySelector('.toggle-auth') as HTMLElement;
const toggleLink = document.querySelector('#switch-to-register') as HTMLElement;

toggleLink?.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;

    if (isLoginMode) {
        modalTitle.innerText = 'Login';
        modalBtn.innerText = 'Login';
        toggleText.innerHTML = 'No account? <a href="#" id="switch-to-register">Register</a>';
    } else {
        modalTitle.innerText = 'Register';
        modalBtn.innerText = 'Create Account';
        toggleText.innerHTML = 'Already have an account? <a href="#" id="switch-to-register">Login</a>';
    }
    
    // Re-attach listener after innerHTML change
    document.getElementById('switch-to-register')?.addEventListener('click', (event) => {
        event.preventDefault();
        toggleLink.click(); 
    });
});

document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const usernameInput = document.getElementById('username') as HTMLInputElement;
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    
    const username = usernameInput.value;
    const password = passwordInput.value;
    
    try {
        if (isLoginMode) {
            // Login
            const response = await api.login({ username, password });
            localStorage.setItem('token', response.token);
            
            const userData = response.user || { username, email: `${username}@metropolia.fi`, _id: '1' };
            localStorage.setItem('user', JSON.stringify(userData));
            
            alert('Login successful!');
            loginModal.close();
            checkAuth();
        } else {
            // Register
            const email = `${username}@student.metropolia.fi`; 
            await api.register({ username, password, email });
            alert('Registration successful! Please login.');
            
            // Switch back to login mode
            isLoginMode = true;
            modalTitle.innerText = 'Login';
            modalBtn.innerText = 'Login';
        }
    } catch (err) {
        console.error(err);
        alert(`Error: ${(err as Error).message}`);
    }
});

document.getElementById('city-filter')?.addEventListener('input', (e) => {
    const term = (e.target as HTMLInputElement).value.toLowerCase();
    const filtered = restaurants.filter(r => r.city.toLowerCase().includes(term));
    renderList(filtered);
});

document.getElementById('reset-filter')?.addEventListener('click', () => {
    (document.getElementById('city-filter') as HTMLInputElement).value = '';
    renderList(restaurants);
});

document.getElementById('btn-upload-avatar')?.addEventListener('click', () => {
    document.getElementById('avatar-upload')?.click();
});

document.getElementById('avatar-upload')?.addEventListener('change', (event) => {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            (document.getElementById('profile-avatar') as HTMLImageElement).src = result;
            localStorage.setItem('user-avatar', result);
        };
        reader.readAsDataURL(input.files[0]);
    }
});

// --- Initialization ---

const init = async () => {
    checkAuth();
    try {
        restaurants = await api.getRestaurants();
        renderList(restaurants);
        await initMap();
    } catch (error) {
        console.error('Failed to initialize app:', error);
    }
};

init();