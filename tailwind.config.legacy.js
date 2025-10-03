/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./dist/**/*.{html,js}"],
    darkMode: ['class'],
    theme: {
      extend: {
        colors: {
          background: '#fefeff',
          foreground: '#333333',
          card: '#ffffff',
          "card-foreground": '#333333',
          popover: '#ffffff',
          "popover-foreground": '#333333',
          primary: '#1445e2',
          "primary-foreground": '#f9f9f9',
          secondary: '#0598f6',
          "secondary-foreground": '#f9f9f9',
          muted: '#f0f0ff',
          "muted-foreground": '#7a7a99',
          accent: '#b76b2c',
          "accent-foreground": '#ffffff',
          destructive: '#e74c3c',
          "destructive-foreground": '#fff2f2',
          border: '#e0e0f0',
          input: '#e0e0f0',
          ring: '#333333',
          chart: {
            1: '#c96d3f',
            2: '#47c1a9',
            3: '#4297e7',
            4: '#8a64d1',
            5: '#df5d8f',
          },
          base: {
            100: '#fefeff',
            200: '#f0f0ff',
            300: '#e3e3ff',
            content: '#333333',
          },
          
          neutral: '#6b6b8d',
          "neutral-content": '#fefeff',
          info: '#5bbef0',
          "info-content": '#f6faff',
          success: '#63d182',
          "success-content": '#f0fff5',
          warning: '#f6d365',
          "warning-content": '#fff9e3',
          error: '#e74c3c',
          "error-content": '#fff2f2',
          
          sidebar: '#fbfbff',
          "sidebar-foreground": '#252525',
          "sidebar-primary": '#252525',
          "sidebar-primary-foreground": '#fbfbff',
          "sidebar-accent": '#f0f0ff',
          "sidebar-accent-foreground": '#252525',
          "sidebar-border": '#e8e8e8',
          "sidebar-ring": '#737373',
        },
  
        borderRadius: {
          sm: 'calc(0.625rem - 4px)',
          md: 'calc(0.625rem - 2px)',
          lg: '0.625rem',
          xl: 'calc(0.625rem + 4px)',
        },
  
        height: {
             ...Array.from({ length: 1000 }, (_, i) => i + 1).reduce((acc, val) => {
            acc[val] = `${val * 0.25}rem`;
            return acc;
          }, {}),
        },
        width: {
             ...Array.from({ length: 1000 }, (_, i) => i + 1).reduce((acc, val) => {
            acc[val] = `${val * 0.25}rem`;
            return acc;
          }, {}),
        },
        padding: {
          ...Array.from({ length: 1000 }, (_, i) => i + 1).reduce((acc, val) => {
            acc[val] = `${val * 0.25}rem`;
            return acc;
          }, {}),
        },
        margin: {
          ...Array.from({ length: 1000 }, (_, i) => i + 1).reduce((acc, val) => {
            acc[val] = `${val * 0.25}rem`;
            return acc;
          }, {}),
        },
        gap: {
             ...Array.from({ length: 1000 }, (_, i) => i + 1).reduce((acc, val) => {
            acc[val] = `${val * 0.25}rem`;
            return acc;
          }, {}),
        },
        zIndex: {
          ...Array.from({ length: 1000 }, (_, i) => i + 1).reduce((acc, val) => {
            acc[val] = `${val}`;
            return acc;
          }, {}),
        },
      },
    },
    plugins: [
      require('tailwindcss-animate'), // Remove this if you don't use it
      function({ addBase }) {
            addBase({
              'button': {
                backgroundColor: 'transparent',
                backgroundImage: 'none',
                padding: 0,
                border: 'none',
                outline: 'none',
                cursor: 'pointer',
              },
            });
          },
    ],
  };