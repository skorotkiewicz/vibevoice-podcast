# 🎙️ Podcast Maker

Create multi-voice podcasts with AI text-to-speech. Add segments, assign different voices to each, preview in real-time, and export as audio.

## Features

- **Multi-segment editing** — Add unlimited text segments
- **Per-segment voices** — Assign different voices to each segment
- **Audio pre-generation** — Generate audio clips before playback for consistency
- **Audio caching** — Generated clips are cached for instant replay
- **Real-time preview** — Play individual segments or the entire podcast
- **Audio export** — Download your podcast as a single WAV file
- **Project management** — Export/Import podcasts as JSON

---
## Demo

![alt text](example/screenshot.png "Screenshot")

[example/podcast-1765734509668.wav](example/podcast-1765734509668.wav)


## Prerequisites

### 1. Clone VibeVoice

```bash
git clone https://github.com/microsoft/VibeVoice
cd VibeVoice
```

### 2. Start the API Server

Copy the server script to your VibeVoice directory:

```bash
cp example/server.py /path/to/VibeVoice/demo/server.py
```

Run the server:

```bash
cd /path/to/VibeVoice
python demo/server.py --model microsoft/VibeVoice-Realtime-0.5B --device cuda --port 8880
```

The server will start at `http://localhost:8880`.

---

## Running the Frontend

```bash
# Install dependencies
bun install   # or npm install

# Start development server
bun dev       # or npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Usage

### Creating a Podcast

1. **Add segments** — Click "Add Segment" to create new text entries
2. **Write content** — Enter text for each segment
3. **Select voices** — Choose a voice from the dropdown for each segment
4. **Generate audio** — Click "Generate" on each segment to create the audio clip
5. **Preview** — Click "Play" on individual segments or "Play Podcast" for all

### Generating Audio

Each segment has a **Generate** / **Regenerate** button:

- **Generate** — Creates the audio clip for that segment (amber button)
- **Regenerate** — Re-creates the audio if you want a different take
- **Generate All** — Generates all missing audio clips at once
- **Ready** — Green indicator shows the segment has cached audio

> **Tip**: Pre-generating audio ensures consistent playback. Each time you generate, the audio is cached and will play the same way every time — no more "I feel lucky" randomness!

### Playback

- If a segment has cached audio, it plays instantly
- If not cached, it will generate first, then play
- The cache is invalidated when you change text or voice

### Exporting

- **JSON** — Save your project with "Export JSON" to continue editing later
- **Audio** — Click "Download Audio" to export the complete podcast
  - Uses cached audio where available (fast!)
  - Generates missing segments automatically

### Importing

Click "Import" and select a previously saved JSON file to restore your project.

---

## Example Podcasts

Check the `example/` folder for sample podcast JSON files you can import.

---

## Configuration

The frontend connects to the API at `http://localhost:8880/api`. To change this, edit the `API_BASE` constant in `src/App.tsx`.

---

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: FastAPI + VibeVoice TTS
- **Audio**: REST API synthesis with client-side caching

---

## License

MIT
