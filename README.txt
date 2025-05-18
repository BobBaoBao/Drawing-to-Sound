# Doodle to Sound Web App

This is a simple web application that allows you to draw on a canvas and then convert your drawing into sound.

## Features

*   Draw with different colors.
*   Adjust brush size.
*   Convert your drawing into a sequence of sounds where:
    *   **Y-coordinate** (height on canvas) determines the **pitch**.
    *   **Color** determines the **timbre** (waveform type).
    *   **X-coordinate** (position from left to right) determines the **timing**.
*   Clear the canvas.

## How it Works

*   **Drawing:** Uses the HTML Canvas API to capture user drawings. Each stroke's points (or segments) are stored.
*   **Sound Generation:** Utilizes the Web Audio API.
    *   When "Turn Drawing Into Sound" is clicked, the application iterates through the stored drawn points, sorted by their X-coordinate.
    *   For each point:
        *   An `OscillatorNode` is created.
        *   Its frequency is mapped from the point's Y-coordinate (higher Y = lower on canvas = lower pitch, but we invert this so higher on canvas = higher pitch).
        *   Its waveform type (`sine`, `square`, `sawtooth`, `triangle`) is selected based on the point's color.
        *   The sound is scheduled to play at a time proportional to the point's X-coordinate.
        *   Brush size subtly affects the volume of the note.

## How to Use

1.  **Clone the repository (or download the files):**
    ```bash
    git clone https://github.com/YOUR_USERNAME/doodle-to-sound.git
    cd doodle-to-sound
    ```
2.  **Open `index.html`:**
    Open the `index.html` file in your web browser.

3.  **Drawing:**
    *   Select a color from the color palette at the top. The active color will have a highlighted border.
    *   Adjust the brush size using the slider.
    *   Click and drag (or tap and drag on touch devices) on the white canvas area to draw.

4.  **Generate Sound:**
    *   Once you're happy with your drawing, click the "Turn Drawing Into Sound" button.
    *   Listen to your creation!

5.  **Clear:**
    *   Click the "Clear Drawing" button to erase the canvas and start over.

## Deployment on Vercel

This project consists of static HTML, CSS, and JavaScript files, making it very easy to deploy on Vercel.

1.  **Push to GitHub:**
    *   Make sure your project is a Git repository and pushed to GitHub.
    *   If you haven't initialized a Git repository:
        ```bash
        git init
        git add .
        git commit -m "Initial commit"
        # Create a new repository on GitHub (e.g., named 'doodle-to-sound')
        git remote add origin https://github.com/YOUR_USERNAME/doodle-to-sound.git
        git branch -M main
        git push -u origin main
        ```

2.  **Deploy with Vercel:**
    *   Go to [vercel.com](https://vercel.com/) and sign up or log in (you can use your GitHub account).
    *   Click on "Add New..." -> "Project".
    *   Import your Git Repository (select the GitHub repository you just pushed/created).
    *   Vercel will automatically detect it as a static site. No special build commands or output directory settings are usually needed for a simple HTML/CSS/JS project.
        *   Framework Preset: `Other` (or it might auto-detect correctly)
        *   Build Command: (Leave empty or ensure it doesn't try to run a complex build)
        *   Output Directory: (Leave empty, or specify `.` if needed, Vercel is usually smart about this for static sites)
    *   Click "Deploy".
    *   Vercel will build and deploy your site, providing you with a URL.

## To Create a Downloadable ZIP

You can manually create a ZIP file containing `index.html`, `style.css`, `script.js`, and `README.md`.

Alternatively, if you host this on GitHub, users can download the code directly from GitHub:
1.  Go to your GitHub repository page (e.g., `https://github.com/YOUR_USERNAME/doodle-to-sound`).
2.  Click the green "Code" button.
3.  Select "Download ZIP".

This ZIP file will contain all the project files.