# 🎬 SceneFlow Studio (Seedance 2.5 Cinema Edition)

Welcome to your customized, offline-capable **SceneFlow Studio** workstation.

---

## 🚀 1. Quick Launch

To run your studio locally anytime, open PowerShell or Terminal and run:

```powershell
cd D:\sceneflow
npm run dev
```

Open your browser at **`http://localhost:3000`**.

---

## 📁 2. Playing Local Disk Videos (.mp4, .mov, .webm)

Unlike the online version (which required uploading to YouTube), your local build plays video files **directly from your hard drive**:

1. In the **Media Preview** header, make sure **Local** is selected (it is the default).
2. Click **"Choose Video..."** or simply **drag & drop** any video file directly onto the video player screen.
3. The video plays instantly with hardware acceleration, sub-frame timecode accuracy, and 100% offline privacy.

---

## 🤖 3. How to Use Me (Your AI) Instead of Gemini Studio API

Whenever you generate a clip in **Seedance 2.5** and want to sync it with your script:

### Step 1: Send Me Your Script & Timing
Just paste your screenplay/prompt and your video details into our chat:
> *"Here is my Seedance 2.5 script for Scene 1, and the clip is 22 seconds long. Character speaks between 0:03 and 0:08, camera orbits at 0:12, explosion at 0:18..."*
> (Or provide the script and video file path / descriptions)

### Step 2: I Generate the Exact JSON for You
I will parse the verbatim script lines and generate the schema-compliant cues file. I can even write it directly into:
```
D:\sceneflow\projects\scene_01.json
```

### Step 3: 1-Click Load into SceneFlow
In your SceneFlow browser window:
- Click **File -> Open Project...** and choose your `.json` from `D:\sceneflow\projects\`, **OR**
- Click **File -> Sync Cues (JSON)...** (`Shift+E`), paste the cues, and click **Apply Cues**!

---

## 🎞️ 4. Seedance 2.5 Directives Built into Your Studio

Open the **Source Script Editor** (`Shift+S`) to use the built-in Seedance tags:

- `[[STAGING]]`: Master container for 5-part scene blocking.
- `[[CAMERA_SETUP]]`: 3D coordinates, lens millimeters, and movement velocity.
- `[[CONTINUITY]]`: State-in and State-out frame anchors.
- `[[LIGHTING]]`: Volumetric haze, Kelvin color temperatures, key/fill ratios.
- `[<BRIEF>]`: Direct multi-camera execution block.

---

## ✂️ 5. Exporting to DaVinci Resolve & Premiere Pro

Once your cues are synchronized in SceneFlow, click **File** in the top menu bar:

- **Subtitles (.SRT)**: Exports a standard subtitle track with character names and cues. Drag and drop directly onto your video editor timeline.
- **DaVinci Markers (.CSV)**: Generates a color-coded marker list with in/out timestamps and descriptions for DaVinci Resolve.
- **EDL Locators (.EDL)**: CMX 3600 edit decision list for Premiere Pro and Avid.

---

## 🐙 6. Your Git Repository

Your repository is initialized at:
`D:\sceneflow` on the `main` branch.

To connect your own GitHub account:
```powershell
cd D:\sceneflow
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
git push -u origin main
```
