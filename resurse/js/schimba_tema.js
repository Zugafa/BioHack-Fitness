// Gestionare completa tema (dark/light/neon): aplicare timpurie + toggle UI

(function initThemeEarly() {
    const themes = ['dark', 'light', 'neon'];
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme && themes.includes(savedTheme)
        ? savedTheme
        : (prefersDark ? 'dark' : 'light');

    const htmlElement = document.documentElement;
    themes.forEach(t => htmlElement.classList.remove(t + '-theme'));
    htmlElement.setAttribute('data-theme', initialTheme);
    if (initialTheme !== 'dark') {
        htmlElement.classList.add(initialTheme + '-theme');
    }

    localStorage.setItem('theme', initialTheme);
})();

document.addEventListener('DOMContentLoaded', function () {
    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;

    const themes = ['dark', 'light', 'neon'];
    const themeIcons = {
        dark: { icon: 'fa-sun', title: 'Schimba la modul zi' },
        light: { icon: 'fa-star', title: 'Schimba la modul neon' },
        neon: { icon: 'fa-moon', title: 'Schimba la modul noapte' }
    };

    function getCurrentTheme() {
        const theme = localStorage.getItem('theme');
        return themes.includes(theme) ? theme : 'dark';
    }

    function applyTheme(theme) {
        themes.forEach(t => htmlElement.classList.remove(t + '-theme'));
        htmlElement.setAttribute('data-theme', theme);
        if (theme !== 'dark') {
            htmlElement.classList.add(theme + '-theme');
        }

        localStorage.setItem('theme', theme);

        if (themeToggle) {
            const iconData = themeIcons[theme];
            themeToggle.innerHTML = '<div id="cerc-tema"></div><i class="fas ' + iconData.icon + '"></i>';
            themeToggle.title = iconData.title;
        }
    }

    applyTheme(getCurrentTheme());

    if (themeToggle) {
        themeToggle.addEventListener('click', function (e) {
            e.preventDefault();
            const currentTheme = getCurrentTheme();
            const currentIndex = themes.indexOf(currentTheme);
            const nextTheme = themes[(currentIndex + 1) % themes.length];
            applyTheme(nextTheme);
        });
    }
});
